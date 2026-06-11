import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Admin only — readonly role cannot delete
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tokenId } = await req.json()
    if (!tokenId) return NextResponse.json({ error: 'tokenId required' }, { status: 400 })

    // Delete in order: Report → Submission → Token (no cascade in schema)
    const submissions = await prisma.questionnaireSubmission.findMany({
      where: { tokenId },
      select: { id: true },
    })

    for (const sub of submissions) {
      await prisma.report.deleteMany({ where: { submissionId: sub.id } })
    }
    await prisma.questionnaireSubmission.deleteMany({ where: { tokenId } })
    await prisma.accessToken.delete({ where: { id: tokenId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/delete-token] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
