import { NextRequest, NextResponse } from 'next/server'
import { createToken, buildTokenUrl } from '@/lib/tokens'
import { sendAccessWebhook } from '@/lib/ghl'

export async function POST(req: NextRequest) {
  // Validate shared secret
  const secret = req.headers.get('x-ghl-secret')
  if (secret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { email, name, firstName, first_name, contact_email, contact_name } = body

    // Support multiple GHL field name conventions
    const userEmail = email || contact_email
    const userName = name || contact_name
    const userFirstName = firstName || first_name || userName?.split(' ')[0] || ''

    if (!userEmail) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const tokenRecord = await createToken(userEmail, userName, 'ghl')
    const tokenUrl = buildTokenUrl(tokenRecord.token)

    await sendAccessWebhook({
      email: userEmail,
      name: userName || userEmail,
      firstName: userFirstName,
      tokenUrl,
    })

    return NextResponse.json({ success: true, tokenUrl })
  } catch (err) {
    console.error('[GHL webhook] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
