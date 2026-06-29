import { NextRequest, NextResponse } from 'next/server'
import { createToken, buildTokenUrl } from '@/lib/tokens'
import { sendWebinarAccessWebhook } from '@/lib/ghl'

export async function POST(req: NextRequest) {
  if (process.env.WEBINAR_ACTIVE !== 'true') {
    return NextResponse.json({ error: 'Registration is currently closed' }, { status: 403 })
  }

  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
    }

    const tokenRecord = await createToken(email, undefined, 'webinar')
    const tokenUrl = buildTokenUrl(tokenRecord.token)

    await sendWebinarAccessWebhook({ email, tokenUrl })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[webinar] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
