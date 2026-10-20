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
    const search = req.nextUrl.searchParams.get('search') || ''
    const source = req.nextUrl.searchParams.get('source') || ''
    const page = Math.max(0, parseInt(req.nextUrl.searchParams.get('page') || '0', 10))
    const pageSize = 50

    const where = {
      ...(source ? { source } : {}),
      ...(search ? {
        OR: [
          { userEmail: { contains: search } },
          { userName: { contains: search } },
        ],
      } : {}),
    }

    const [tokens, total] = await Promise.all([
      prisma.accessToken.findMany({
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: page * pageSize,
        where,
        include: {
          submissions: {
            include: { report: true },
            orderBy: { submittedAt: 'desc' },
          },
        },
      }),
      prisma.accessToken.count({ where }),
    ])

    return NextResponse.json({ tokens, total, page, pageSize })
  } catch (err) {
    console.error('[admin/tokens] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
