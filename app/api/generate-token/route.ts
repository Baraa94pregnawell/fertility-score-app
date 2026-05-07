import { NextRequest, NextResponse } from 'next/server'
import { createToken, buildTokenUrl } from '@/lib/tokens'
import { sendAccessWebhook } from '@/lib/ghl'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, name } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const tokenRecord = await createToken(email, name, 'manual')
    const tokenUrl = buildTokenUrl(tokenRecord.token)
    const firstName = name?.split(' ')[0] || ''

    await sendAccessWebhook({
      email,
      name: name || email,
      firstName,
      tokenUrl,
    })

    return NextResponse.json({ success: true, token: tokenRecord.token, tokenUrl })
  } catch (err) {
    console.error('[generate-token] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
