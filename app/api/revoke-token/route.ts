import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tokenId } = await req.json()
    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId required' }, { status: 400 })
    }

    await prisma.accessToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[revoke-token] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
