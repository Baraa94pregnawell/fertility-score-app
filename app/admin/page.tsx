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

interface Stats {
  totalTokens: number
  totalUsed: number
  totalReports: number
  tokensBySource: Record<string, number>
  reportsBySource: Record<string, number>
  scoreDistribution: { label: string; count: number }[]
  scoreDistributionGhl: { label: string; count: number }[]
  scoreDistributionWebinar: { label: string; count: number }[]
}

const SOURCE_LABELS: Record<string, string> = {
  ghl: 'Purchased (GHL)',
  webinar: 'Challenge',
  manual: 'Manual',
}

const SOURCE_TABS = [
  { value: '', label: 'All' },
  { value: 'ghl', label: 'Purchased' },
  { value: 'webinar', label: 'Challenge' },
  { value: 'manual', label: 'Manual' },
]

const BAND_COLORS = ['#DC2626', '#D97706', '#CA8A04', '#65A30D', '#059669']

export default function AdminPage() {
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [role, setRole] = useState<'admin' | 'readonly'>('admin')
  const [tokens, setTokens] = useState<TokenRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [sourceFilter, setSourceFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genMessage, setGenMessage] = useState('')
  const [genError, setGenError] = useState('')
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const PAGE_SIZE = 50

  const fetchTokens = useCallback(async (adminSecret: string, q = '', src = '', p = 0) => {
    const params = new URLSearchParams({ search: q, source: src, page: String(p) })
    const res = await fetch(`/api/admin/tokens?${params}`, {
      headers: { 'x-admin-secret': adminSecret },
    })
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setTokens(data.tokens || [])
    setTotal(data.total || 0)
  }, [router])

  const fetchStats = useCallback(async (adminSecret: string) => {
    const res = await fetch('/api/admin/stats', { headers: { 'x-admin-secret': adminSecret } })
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => {
    const s = sessionStorage.getItem('admin_secret') || ''
    if (!s) { router.push('/admin/login'); return }
    setSecret(s)
    const r = sessionStorage.getItem('admin_role') as 'admin' | 'readonly' | null
    setRole(r || 'admin')
    setLoading(true)
    Promise.all([fetchTokens(s), fetchStats(s)]).finally(() => setLoading(false))
  }, [router, fetchTokens, fetchStats])

  useEffect(() => {
    if (!secret) return
    const t = setTimeout(() => {
      setPage(0)
      fetchTokens(secret, search, sourceFilter, 0)
    }, 300)
    return () => clearTimeout(t)
  }, [search, sourceFilter, secret, fetchTokens])

  const goToPage = (p: number) => {
    setPage(p)
    fetchTokens(secret, search, sourceFilter, p)
  }

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
      fetchTokens(secret, search, sourceFilter, page)
      fetchStats(secret)
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
    fetchTokens(secret, search, sourceFilter, page)
  }

  const deleteToken = async (tokenId: string) => {
    await fetch('/api/admin/delete-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ tokenId }),
    })
    setDeleteConfirm(null)
    fetchTokens(secret, search, sourceFilter, page)
    fetchStats(secret)
  }

  const getStatus = (t: TokenRecord) => {
    if (t.isRevoked) return { label: 'Revoked', color: '#DC2626', bg: '#FEE2E2' }
    if (t.usedAt) return { label: 'Used', color: '#D97706', bg: '#FEF3C7' }
    return { label: 'Active', color: '#059669', bg: '#D1FAE5' }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const S: Record<string, React.CSSProperties> = {
    page: { padding: '24px', maxWidth: '1100px', margin: '0 auto' },
    h1: { fontSize: '24px', fontWeight: 'bold', color: '#3D2870', marginBottom: '4px' },
    sub: { fontSize: '14px', color: '#6B7280', marginBottom: '24px' },
    card: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' },
    formH: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' },
    label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const, outline: 'none' },
    btn: { padding: '10px 20px', backgroundColor: '#3D2870', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, borderBottom: '1px solid #E5E7EB' },
    td: { padding: '12px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #F3F4F6' },
  }

  const maxSplitCount = stats
    ? Math.max(...stats.scoreDistributionGhl.map(b => b.count), ...stats.scoreDistributionWebinar.map(b => b.count), 1)
    : 1

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <h1 style={{ ...S.h1, marginBottom: 0 }}>Token Management</h1>
        {role === 'readonly' && (
          <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#EDE9FE', color: '#6D28D9' }}>View Only</span>
        )}
      </div>
      <p style={S.sub}>{role === 'readonly' ? 'View user reports and scores' : 'Generate and manage user access tokens'}</p>

      {/* ── Stats Dashboard ── */}
      {stats && (
        <div style={S.card}>
          <h2 style={{ ...S.formH, marginBottom: '20px' }}>Overview</h2>

          {/* KPI tiles — row 1: token counts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {[
              { label: 'Total Tokens', value: stats.totalTokens, color: '#3D2870' },
              { label: 'Accessed', value: stats.totalUsed, sub: `${Math.round(stats.totalUsed / Math.max(stats.totalTokens, 1) * 100)}% of total`, color: '#D97706' },
              { label: 'Reports Done', value: stats.totalReports, sub: `${Math.round(stats.totalReports / Math.max(stats.totalUsed, 1) * 100)}% of accessed`, color: '#059669' },
              { label: 'Purchased (GHL)', value: stats.tokensBySource['ghl'] || 0, color: '#0EA5E9' },
              { label: 'Challenge', value: stats.tokensBySource['webinar'] || 0, color: '#8B5CF6' },
              { label: 'Manual', value: stats.tokensBySource['manual'] || 0, color: '#6B7280' },
            ].map(tile => (
              <div key={tile.label} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: tile.color }}>{tile.value}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{tile.label}</div>
                {tile.sub && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{tile.sub}</div>}
              </div>
            ))}
          </div>

          {/* KPI tiles — row 2: reports by source */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'GHL Reports Done', value: stats.reportsBySource?.['ghl'] || 0, total: stats.tokensBySource['ghl'] || 0, color: '#0EA5E9' },
              { label: 'Challenge Reports Done', value: stats.reportsBySource?.['webinar'] || 0, total: stats.tokensBySource['webinar'] || 0, color: '#8B5CF6' },
              { label: 'Manual Reports Done', value: stats.reportsBySource?.['manual'] || 0, total: stats.tokensBySource['manual'] || 0, color: '#6B7280' },
            ].map(tile => (
              <div key={tile.label} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: tile.color }}>{tile.value}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{tile.label}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{Math.round(tile.value / Math.max(tile.total, 1) * 100)}% completion</div>
              </div>
            ))}
          </div>

          {/* Score distribution — split Purchased vs Challenge */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Score Distribution — Purchased vs Challenge ({stats.totalReports} reports)
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#0EA5E9' }} /> Purchased (GHL)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#8B5CF6' }} /> Challenge
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px' }}>
              {stats.scoreDistributionGhl.map((band, i) => {
                const webBand = stats.scoreDistributionWebinar[i]
                const ghlH = Math.round((band.count / maxSplitCount) * 80)
                const webH = Math.round((webBand.count / maxSplitCount) * 80)
                return (
                  <div key={band.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%' }}>
                      {/* GHL bar */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#374151', fontWeight: '600', marginBottom: '2px' }}>{band.count}</div>
                        <div style={{ width: '100%', backgroundColor: BAND_COLORS[i], borderRadius: '3px 3px 0 0', height: `${ghlH}px`, minHeight: band.count > 0 ? '4px' : '0', opacity: 0.85 }} />
                      </div>
                      {/* Challenge bar */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#374151', fontWeight: '600', marginBottom: '2px' }}>{webBand.count}</div>
                        <div style={{ width: '100%', backgroundColor: '#8B5CF6', borderRadius: '3px 3px 0 0', height: `${webH}px`, minHeight: webBand.count > 0 ? '4px' : '0', opacity: 0.7 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', textAlign: 'center' }}>{band.label}</div>
                  </div>
                )
              })}
            </div>
            {/* Score range color key */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' as const }}>
              {[
                { label: '<50 · Critical', color: '#DC2626' },
                { label: '50–59 · Low', color: '#D97706' },
                { label: '60–69 · Moderate', color: '#CA8A04' },
                { label: '70–79 · Good', color: '#65A30D' },
                { label: '80+ · Excellent', color: '#059669' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: s.color }} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Token form — admin only */}
      {role === 'admin' && <div style={S.card}>
        <h2 style={S.formH}>Generate New Access Token</h2>
        <form onSubmit={generateToken}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={S.label}>User Email Address</label>
              <input type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} style={S.input} required />
            </div>
            <div>
              <label style={S.label}>User Name (optional)</label>
              <input type="text" placeholder="e.g. Sara Ahmed" value={name} onChange={e => setName(e.target.value)} style={S.input} />
            </div>
          </div>
          <button type="submit" disabled={generating} style={{ ...S.btn, opacity: generating ? 0.7 : 1 }}>
            {generating ? 'Generating...' : 'Generate Token & Send Email'}
          </button>
          {genMessage && <div style={{ marginTop: '12px', color: '#059669', fontSize: '14px' }}>{genMessage}</div>}
          {genError && <div style={{ marginTop: '12px', color: '#DC2626', fontSize: '14px' }}>{genError}</div>}
        </form>
      </div>}

      {/* Token table */}
      <div style={S.card}>

        {/* Search + source tabs */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...S.input, maxWidth: '320px' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {SOURCE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setSourceFilter(tab.value)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: sourceFilter === tab.value ? '#3D2870' : 'white',
                  color: sourceFilter === tab.value ? 'white' : '#374151',
                  borderColor: sourceFilter === tab.value ? '#3D2870' : '#D1D5DB',
                }}
              >
                {tab.label}
                {stats && tab.value && (
                  <span style={{ marginRight: '4px', opacity: 0.75 }}>
                    {' '}({stats.tokensBySource[tab.value] || 0})
                  </span>
                )}
                {!tab.value && stats && (
                  <span style={{ marginRight: '4px', opacity: 0.75 }}>
                    {' '}({stats.totalTokens})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#6B7280' }}>Loading...</p>
        ) : tokens.length === 0 ? (
          <p style={{ color: '#6B7280' }}>No tokens found.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['#', 'Email', 'Name', 'Source', 'Created', 'Used', 'Status', 'Reports', 'Actions'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t, index) => {
                    const status = getStatus(t)
                    const reportCount = t.submissions.filter(s => s.report).length
                    const rowNum = page * PAGE_SIZE + index + 1
                    return (
                      <tr key={t.id}>
                        <td style={{ ...S.td, color: '#9CA3AF', fontWeight: '600', width: '40px' }}>{rowNum}</td>
                        <td style={S.td}>{t.userEmail}</td>
                        <td style={S.td}>{t.userName || '—'}</td>
                        <td style={S.td}>
                          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                            {SOURCE_LABELS[t.source] || t.source}
                          </span>
                        </td>
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
                            <div key={s.id} style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <a href={`/report/${s.report.slug}`} target="_blank" style={{ color: '#3D2870', textDecoration: 'underline', fontSize: '13px' }}>
                                  Score: {s.report.fertilityScore}
                                </a>
                                <a href={`/admin/report/${s.report.slug}`} target="_blank" style={{ padding: '2px 8px', backgroundColor: '#EDE9FE', color: '#6D28D9', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>
                                  Staff View
                                </a>
                              </div>
                              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                {new Date(s.submittedAt).toLocaleDateString('en-GB')} · {new Date(s.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : null)}
                          {reportCount === 0 && <span style={{ color: '#9CA3AF' }}>—</span>}
                        </td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' as const }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {role === 'admin' && !t.isRevoked && (
                              <button onClick={() => setRevokeConfirm(t.id)} style={{ padding: '4px 12px', backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                Revoke
                              </button>
                            )}
                            {role === 'admin' && (
                              <button onClick={() => setDeleteConfirm(t.id)} style={{ padding: '4px 12px', backgroundColor: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => goToPage(0)}
                    disabled={page === 0}
                    style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1, backgroundColor: 'white' }}
                  >«</button>
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0}
                    style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1, backgroundColor: 'white' }}
                  >‹ Prev</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i
                    return (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        style={{ padding: '6px 12px', border: '1px solid', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', backgroundColor: p === page ? '#3D2870' : 'white', color: p === page ? 'white' : '#374151', borderColor: p === page ? '#3D2870' : '#D1D5DB', fontWeight: p === page ? '600' : '400' }}
                      >{p + 1}</button>
                    )
                  })}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, backgroundColor: 'white' }}
                  >Next ›</button>
                  <button
                    onClick={() => goToPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                    style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, backgroundColor: 'white' }}
                  >»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Revoke dialog */}
      {revokeConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Revoke this token?</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>This user will no longer be able to access the questionnaire. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => revokeToken(revokeConfirm)} style={{ flex: 1, padding: '10px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Yes, Revoke</button>
              <button onClick={() => setRevokeConfirm(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Delete this contact?</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>This will permanently delete the token, all submissions, and all reports for this contact. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => deleteToken(deleteConfirm)} style={{ flex: 1, padding: '10px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Yes, Delete</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
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
