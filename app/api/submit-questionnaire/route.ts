import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/tokens'
import { calculateScore } from '@/lib/scoring'
import { generateReport } from '@/lib/gemini'
import { sendReportWebhook } from '@/lib/ghl'
import { buildReportUrl } from '@/lib/tokens'
import { prisma } from '@/lib/prisma'
import type { Answers } from '@/lib/scoring'

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
    const { finalScore, scoreCategory, scoreCategoryAr, scoreLevelText, sectionScores, triggeredSentences, bmi } = calculateScore(answers)

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

    // 6. Generate report narrative via Gemini
    let reportContent
    try {
      reportContent = await generateReport({
        score: finalScore,
        scoreCategory,
        scoreCategoryAr,
        scoreLevelText,
        triggeredSentences,
        sectionScores,
        answers,
        bmi,
      })
    } catch (err) {
      console.error('[submit-questionnaire] Gemini error:', err)
      // Fallback narrative if Gemini fails
      reportContent = {
        narrative: 'بناءً على إجاباتكِ، قمنا بتحليل وضعكِ الغذائي والصحي بدقة. نتائجكِ تُشير إلى مجالات مهمة تستحق الاهتمام. للحصول على خطة مخصصة، نُشجعكِ على حجز مكالمتكِ التقييمية مع فريق PregnaWell.',
      }
    }

    // 7. Build slug and save report
    const firstName = tokenRecord.userName?.split(' ')[0] || 'user'
    const slug = `${slugify(firstName)}-${generateId()}`

    // Merge triggered sentences into reportContent so they're stored alongside the narrative
    const finalReportContent = {
      ...reportContent,
      triggeredSentences,
    }

    const report = await prisma.report.create({
      data: {
        slug,
        submissionId: submission.id,
        userEmail: tokenRecord.userEmail,
        userName: tokenRecord.userName,
        fertilityScore: finalScore,
        scoreCategory,
        sectionScores: JSON.stringify(sectionScores),
        reportContent: JSON.stringify(finalReportContent),
      },
    })

    // 8. Fire-and-forget: notify GHL (triggers Email #2)
    const reportUrl = buildReportUrl(report.slug)
    const phone = (answers['qPhone'] as string) || undefined
    sendReportWebhook({
      email: tokenRecord.userEmail,
      firstName: firstName,
      phone,
      reportUrl,
      score: finalScore,
      scoreCategory,
    }).then(() => {
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
