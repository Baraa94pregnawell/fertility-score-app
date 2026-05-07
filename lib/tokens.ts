import { prisma } from './prisma'

export async function validateToken(token: string) {
  const record = await prisma.accessToken.findUnique({ where: { token } })
  if (!record) return { valid: false, reason: 'not_found' as const }
  if (record.isRevoked) return { valid: false, reason: 'revoked' as const }
  return { valid: true, record }
}

export async function createToken(email: string, name?: string, source = 'manual') {
  return prisma.accessToken.create({
    data: { userEmail: email, userName: name, source },
  })
}

export function buildTokenUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/access/${token}`
}

export function buildReportUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/report/${slug}`
}
