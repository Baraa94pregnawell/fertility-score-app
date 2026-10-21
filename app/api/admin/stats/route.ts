import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BANDS = [
  { label: 'Under 50', sub: 'Critical', min: 0, max: 49 },
  { label: '50 to 59', sub: 'Low', min: 50, max: 59 },
  { label: '60 to 69', sub: 'Moderate', min: 60, max: 69 },
  { label: '70 to 79', sub: 'Good', min: 70, max: 79 },
  { label: '80+', sub: 'Excellent', min: 80, max: 100 },
]

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  const isAdmin = secret === process.env.ADMIN_SECRET
  const isReadonly = secret === process.env.ADMIN_READONLY_SECRET
  if (!isAdmin && !isReadonly) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch every token with its submissions (desc) so we can find the latest report per person
    const allTokens = await prisma.accessToken.findMany({
      select: {
        source: true,
        usedAt: true,
        submissions: {
          select: {
            report: { select: { fertilityScore: true } },
            submittedAt: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    })

    type Agg = { total: number; completed: number; started: number; scores: number[] }
    const agg: Record<string, Agg> = {
      ghl: { total: 0, completed: 0, started: 0, scores: [] },
      webinar: { total: 0, completed: 0, started: 0, scores: [] },
      manual: { total: 0, completed: 0, started: 0, scores: [] },
    }

    for (const token of allTokens) {
      const src = token.source || 'ghl'
      if (!agg[src]) agg[src] = { total: 0, completed: 0, started: 0, scores: [] }
      agg[src].total++

      // Most recent submission that produced a report = this person's score
      const latestReport = token.submissions.find(s => s.report)?.report
      if (latestReport) {
        agg[src].completed++
        agg[src].scores.push(latestReport.fertilityScore)
      } else if (token.usedAt) {
        agg[src].started++ // opened but did not finish
      }
    }

    const avg = (scores: number[]) =>
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

    const scoreDist = (scores: number[]) =>
      BANDS.map(b => {
        const count = scores.filter(s => s >= b.min && s <= b.max).length
        return {
          label: b.label,
          sub: b.sub,
          count,
          pct: scores.length > 0 ? Math.round((count / scores.length) * 100) : 0,
        }
      })

    const fmt = (src: string) => ({
      total: agg[src]?.total ?? 0,
      completed: agg[src]?.completed ?? 0,
      started: agg[src]?.started ?? 0,
      avg: avg(agg[src]?.scores ?? []),
      ...(src !== 'manual' ? { scoreDistribution: scoreDist(agg[src]?.scores ?? []) } : {}),
    })

    return NextResponse.json({
      total: allTokens.length,
      bySource: {
        ghl: fmt('ghl'),
        webinar: fmt('webinar'),
        manual: fmt('manual'),
      },
    })
  } catch (err) {
    console.error('[admin/stats] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
