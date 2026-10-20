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
      totalReports,
      totalUsed,
      allScores,
    ] = await Promise.all([
      prisma.accessToken.count(),
      prisma.accessToken.groupBy({ by: ['source'], _count: { id: true } }),
      prisma.report.count(),
      prisma.accessToken.count({ where: { usedAt: { not: null } } }),
      prisma.report.findMany({ select: { fertilityScore: true } }),
    ])

    const bands = [
      { label: 'أقل من 50', min: 0, max: 49 },
      { label: '50–59', min: 50, max: 59 },
      { label: '60–69', min: 60, max: 69 },
      { label: '70–79', min: 70, max: 79 },
      { label: '80+', min: 80, max: 100 },
    ]

    const scoreDistribution = bands.map(b => ({
      label: b.label,
      count: allScores.filter(r => r.fertilityScore >= b.min && r.fertilityScore <= b.max).length,
    }))

    return NextResponse.json({
      totalTokens,
      totalUsed,
      totalReports,
      tokensBySource: Object.fromEntries(tokensBySource.map(r => [r.source, r._count.id])),
      scoreDistribution,
    })
  } catch (err) {
    console.error('[admin/stats] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
