import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const tokens = await prisma.accessToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      where: search
        ? {
            OR: [
              { userEmail: { contains: search } },
              { userName: { contains: search } },
            ],
          }
        : undefined,
      include: {
        submissions: {
          include: { report: true },
          orderBy: { submittedAt: 'desc' },
        },
      },
    })
    return NextResponse.json({ tokens })
  } catch (err) {
    console.error('[admin/tokens] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
