import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/tokens'
import { calculateScore } from '@/lib/scoring'
import { generateReport } from '@/lib/gemini'
import { sendReportWebhook, sendWebinarReportWebhook } from '@/lib/ghl'
import { buildReportUrl } from '@/lib/tokens'
import { prisma } from '@/lib/prisma'
import type { Answers, ScoreResult } from '@/lib/scoring'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'user'
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export async function POST(req: NextRequest) {
  try {
    const { token, answers } = await req.json() as { token: string; answers: Answers }

    if (!token || !answers) {
      return NextResponse.json({ error: 'token and answers required' }, { status: 400 })
    }

    // 1. Validate token
    const tokenResult = await validateToken(token)
    if (!tokenResult.valid || !tokenResult.record) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const tokenRecord = tokenResult.record

    // 2. Calculate score deterministically
    const scoreResult: ScoreResult = calculateScore(answers)
    const { finalScore, scoreCategory, scoreCategoryAr, scoreLevelText, triggeredSentences, bmi,
            tracks, topTrack, secondTrack, intersectionPoint, totalFactors, highImpactFactors,
            ageCategory, maritalStatus, medicalBoxItems, maleFactorVariant, tableIntroText } = scoreResult

    // 4. Save submission first
    const submission = await prisma.questionnaireSubmission.create({
      data: {
        tokenId: tokenRecord.id,
        answers: JSON.stringify(answers),
      },
    })

    // 5. Mark token as used
    await prisma.accessToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    })

    // 6. Generate Gemini narrative for staff view only
    let geminiNarrative = ''
    try {
      const geminiResult = await generateReport({
        score: finalScore,
        scoreCategory,
        scoreCategoryAr,
        scoreLevelText,
        triggeredSentences,
        sectionScores: {},
        answers,
        bmi,
      })
      geminiNarrative = geminiResult?.narrative ?? ''
    } catch (err) {
      console.error('[submit-questionnaire] Gemini error:', err)
    }

    // 7. Build slug and save report
    const firstName = tokenRecord.userName?.split(' ')[0] || ''
    const slug = `${slugify(firstName)}-${generateId()}`

    // reportContent stores all track data for user report + Gemini + sentences for staff
    const finalReportContent = {
      // New 5-track format marker
      trackScores: tracks,
      topTrack,
      secondTrack,
      intersectionPoint,
      totalFactors,
      highImpactFactors,
      ageCategory,
      maritalStatus,
      medicalBoxItems,
      maleFactorVariant,
      tableIntroText,
      // Staff-only fields
      triggeredSentences,
      geminiNarrative,
    }

    const report = await prisma.report.create({
      data: {
        slug,
        submissionId: submission.id,
        userEmail: tokenRecord.userEmail,
        userName: tokenRecord.userName,
        fertilityScore: finalScore,
        scoreCategory,
        sectionScores: JSON.stringify({}),
        reportContent: JSON.stringify(finalReportContent),
      },
    })

    // 8. Fire-and-forget: notify GHL (triggers Email #2)
    const reportUrl = buildReportUrl(report.slug)
    const phone = (answers['qPhone'] as string) || undefined
    const isWebinar = tokenRecord.source === 'webinar'
    const reportWebhookPromise = isWebinar
      ? sendWebinarReportWebhook({ email: tokenRecord.userEmail, reportUrl, score: finalScore, scoreCategory })
      : sendReportWebhook({
          email: tokenRecord.userEmail,
          ...(firstName && { firstName }),
          phone,
          reportUrl,
          score: finalScore,
          scoreCategory,
        })
    reportWebhookPromise.then(() => {
      prisma.report.update({
        where: { id: report.id },
        data: { ghlWebhookSentAt: new Date() },
      }).catch(console.error)
    }).catch(console.error)

    return NextResponse.json({ slug: report.slug })
  } catch (err) {
    console.error('[submit-questionnaire] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
