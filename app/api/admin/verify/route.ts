import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret === process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: true, role: 'admin' }, { status: 200 })
  }
  if (secret === process.env.ADMIN_READONLY_SECRET) {
    return NextResponse.json({ ok: true, role: 'readonly' }, { status: 200 })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
