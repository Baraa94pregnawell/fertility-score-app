import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  const isAdmin = secret === process.env.ADMIN_SECRET
  const isReadonly = secret === process.env.ADMIN_READONLY_SECRET
  if (!isAdmin && !isReadonly) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      totalTokens,
      tokensBySource,
      totalUsed,
      allReports,
    ] = await Promise.all([
      prisma.accessToken.count(),
      prisma.accessToken.groupBy({ by: ['source'], _count: { id: true } }),
      prisma.accessToken.count({ where: { usedAt: { not: null } } }),
      prisma.report.findMany({
        select: {
          fertilityScore: true,
          submission: { select: { token: { select: { source: true } } } },
        },
      }),
    ])

    const bands = [
      { label: '<50', min: 0, max: 49 },
      { label: '50–59', min: 50, max: 59 },
      { label: '60–69', min: 60, max: 69 },
      { label: '70–79', min: 70, max: 79 },
      { label: '80+', min: 80, max: 100 },
    ]

    const inBand = (r: { fertilityScore: number }, b: { min: number; max: number }) =>
      r.fertilityScore >= b.min && r.fertilityScore <= b.max

    const ghlReports = allReports.filter(r => r.submission?.token?.source === 'ghl')
    const webinarReports = allReports.filter(r => r.submission?.token?.source === 'webinar')

    const reportsBySource: Record<string, number> = {}
    for (const r of allReports) {
      const src = r.submission?.token?.source || 'unknown'
      reportsBySource[src] = (reportsBySource[src] || 0) + 1
    }

    return NextResponse.json({
      totalTokens,
      totalUsed,
      totalReports: allReports.length,
      tokensBySource: Object.fromEntries(tokensBySource.map(r => [r.source, r._count.id])),
      reportsBySource,
      scoreDistribution: bands.map(b => ({ label: b.label, count: allReports.filter(r => inBand(r, b)).length })),
      scoreDistributionGhl: bands.map(b => ({ label: b.label, count: ghlReports.filter(r => inBand(r, b)).length })),
      scoreDistributionWebinar: bands.map(b => ({ label: b.label, count: webinarReports.filter(r => inBand(r, b)).length })),
    })
  } catch (err) {
    console.error('[admin/stats] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
