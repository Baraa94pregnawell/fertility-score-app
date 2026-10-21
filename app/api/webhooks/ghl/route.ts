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

    // Log full payload temporarily so we can diagnose name issues in Railway logs
    console.log('[GHL webhook] raw body:', JSON.stringify(body))

    // GHL can send contact data at the top level (custom fields) AND/OR nested in a `contact` object (standard data)
    const c = body.contact || {}

    // Email: try custom field first, then nested contact object
    const userEmail = body.email || body.contact_email || c.email

    // Name: try every known GHL convention, then build from first+last
    const rawName =
      body.name ||           // custom field "name → Contact.Full Name"
      body.contact_name ||   // alternative key
      c.name ||              // nested contact.name
      c.fullName ||          // nested contact.fullName
      [c.firstName || body.firstName || body.first_name, c.lastName || body.lastName]
        .filter(Boolean).join(' ') ||
      ''

    const userName = rawName.trim() || undefined

    const userFirstName =
      body.firstName || body.first_name || c.firstName || userName?.split(' ')[0] || ''

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
