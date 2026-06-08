'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface TokenRecord {
  id: string
  token: string
  userEmail: string
  userName: string | null
  createdAt: string
  usedAt: string | null
  isRevoked: boolean
  source: string
  submissions: Array<{
    id: string
    submittedAt: string
    report: { slug: string; fertilityScore: number } | null
  }>
}

export default function AdminPage() {
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [tokens, setTokens] = useState<TokenRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genMessage, setGenMessage] = useState('')
  const [genError, setGenError] = useState('')
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)

  const fetchTokens = useCallback(async (adminSecret: string, q = '') => {
    const res = await fetch(`/api/admin/tokens?search=${encodeURIComponent(q)}`, {
      headers: { 'x-admin-secret': adminSecret },
    })
    if (res.status === 401) {
      router.push('/admin/login')
      return
    }
    const data = await res.json()
    setTokens(data.tokens || [])
  }, [router])

  useEffect(() => {
    const s = sessionStorage.getItem('admin_secret') || ''
    if (!s) { router.push('/admin/login'); return }
    setSecret(s)
    setLoading(true)
    fetchTokens(s).finally(() => setLoading(false))
  }, [router, fetchTokens])

  useEffect(() => {
    if (!secret) return
    const t = setTimeout(() => fetchTokens(secret, search), 300)
    return () => clearTimeout(t)
  }, [search, secret, fetchTokens])

  const generateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setGenMessage('')
    setGenError('')

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGenError('Please enter a valid email address.')
      setGenerating(false)
      return
    }

    const res = await fetch('/api/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ email, name }),
    })

    if (res.ok) {
      setGenMessage('Token created and access email sent successfully.')
      setEmail('')
      setName('')
      fetchTokens(secret, search)
    } else {
      setGenError('Failed to generate token. Please try again.')
    }
    setGenerating(false)
  }

  const revokeToken = async (tokenId: string) => {
    await fetch('/api/revoke-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ tokenId }),
    })
    setRevokeConfirm(null)
    fetchTokens(secret, search)
  }

  const getStatus = (t: TokenRecord) => {
    if (t.isRevoked) return { label: 'Revoked', color: '#DC2626', bg: '#FEE2E2' }
    if (t.usedAt) return { label: 'Used', color: '#D97706', bg: '#FEF3C7' }
    return { label: 'Active', color: '#059669', bg: '#D1FAE5' }
  }

  const S: Record<string, React.CSSProperties> = {
    page: { padding: '24px', maxWidth: '1100px', margin: '0 auto' },
    h1: { fontSize: '24px', fontWeight: 'bold', color: '#3D2870', marginBottom: '4px' },
    sub: { fontSize: '14px', color: '#6B7280', marginBottom: '32px' },
    card: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' },
    formH: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' },
    label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const, outline: 'none' },
    btn: { padding: '10px 20px', backgroundColor: '#3D2870', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, borderBottom: '1px solid #E5E7EB' },
    td: { padding: '12px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #F3F4F6' },
  }

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Token Management</h1>
      <p style={S.sub}>Generate and manage user access tokens</p>

      {/* Generate Token form */}
      <div style={S.card}>
        <h2 style={S.formH}>Generate New Access Token</h2>
        <form onSubmit={generateToken}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={S.label}>User Email Address</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={S.input}
                required
              />
            </div>
            <div>
              <label style={S.label}>User Name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Sara Ahmed"
                value={name}
                onChange={e => setName(e.target.value)}
                style={S.input}
              />
            </div>
          </div>
          <button type="submit" disabled={generating} style={{ ...S.btn, opacity: generating ? 0.7 : 1 }}>
            {generating ? 'Generating...' : 'Generate Token & Send Email'}
          </button>
          {genMessage && <div style={{ marginTop: '12px', color: '#059669', fontSize: '14px' }}>{genMessage}</div>}
          {genError && <div style={{ marginTop: '12px', color: '#DC2626', fontSize: '14px' }}>{genError}</div>}
        </form>
      </div>

      {/* Token table */}
      <div style={S.card}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, maxWidth: '320px' }}
          />
        </div>

        {loading ? (
          <p style={{ color: '#6B7280' }}>Loading...</p>
        ) : tokens.length === 0 ? (
          <p style={{ color: '#6B7280' }}>No tokens yet. Generate one above.</p>
        ) : (
          <div style={{ overflowX: 'auto' as const }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Email', 'Name', 'Created', 'Used', 'Status', 'Reports', 'Actions'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokens.map(t => {
                  const status = getStatus(t)
                  const reportCount = t.submissions.filter(s => s.report).length
                  return (
                    <tr key={t.id}>
                      <td style={S.td}>{t.userEmail}</td>
                      <td style={S.td}>{t.userName || '—'}</td>
                      <td style={S.td}>
                        <div>{new Date(t.createdAt).toLocaleDateString('en-GB')}</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{new Date(t.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={S.td}>
                        {t.usedAt ? (
                          <>
                            <div>{new Date(t.usedAt).toLocaleDateString('en-GB')}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{new Date(t.usedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td style={S.td}>
                        <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={S.td}>
                        {t.submissions.map(s => s.report ? (
                          <div key={s.id} style={{ marginBottom: '4px' }}>
                            <a href={`/report/${s.report.slug}`} target="_blank" style={{ color: '#3D2870', textDecoration: 'underline', fontSize: '13px' }}>
                              Score: {s.report.fertilityScore}
                            </a>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {new Date(s.submittedAt).toLocaleDateString('en-GB')} · {new Date(s.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : null)}
                        {reportCount === 0 && <span style={{ color: '#9CA3AF' }}>—</span>}
                      </td>
                      <td style={S.td}>
                        {!t.isRevoked && (
                          <button
                            onClick={() => setRevokeConfirm(t.id)}
                            style={{ padding: '4px 12px', backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke dialog */}
      {revokeConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Revoke this token?</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
              This user will no longer be able to access the questionnaire. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => revokeToken(revokeConfirm)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Yes, Revoke
              </button>
              <button
                onClick={() => setRevokeConfirm(null)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>
        PregnaWell Admin · Powered by PregnaWell
      </div>
    </div>
  )
}
