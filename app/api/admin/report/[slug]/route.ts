import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await prisma.report.findUnique({
    where: { slug: params.slug },
  })
  if (!report) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const reportContent = JSON.parse(report.reportContent)
  const sectionScores = JSON.parse(report.sectionScores || '{}')

  return NextResponse.json({
    slug: report.slug,
    userName: report.userName,
    userEmail: report.userEmail,
    fertilityScore: report.fertilityScore,
    scoreCategory: report.scoreCategory,
    createdAt: report.generatedAt,
    // Spread all stored fields — new format has trackScores, old format has sectionScores
    ...reportContent,
    sectionScores,
  })
}
