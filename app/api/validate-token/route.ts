import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/tokens'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ valid: false, reason: 'missing' }, { status: 400 })
  }

  const result = await validateToken(token)
  return NextResponse.json(result)
}
