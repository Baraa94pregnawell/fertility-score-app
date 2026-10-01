'use client'

import { useState, useEffect } from 'react'
import type { TrackKey, TrackResult, Box } from '@/lib/scoring'
import { TRACK_INFO } from '@/lib/scoring'

interface ReportData {
  slug: string
  userName: string | null
  userEmail: string | null
  fertilityScore: number
  scoreCategory: string
  createdAt: string
  trackScores?: Record<TrackKey, TrackResult>
  topTrack?: TrackKey | null
  secondTrack?: TrackKey | null
  intersectionPoint?: string
  totalFactors?: number
  highImpactFactors?: number
  ageCategory?: string
  maritalStatus?: string
  medicalBoxItems?: string[]
  maleFactorVariant?: string | null
  tableIntroText?: string
  triggeredSentences?: string[]
  geminiNarrative?: string
  sectionScores?: Record<string, { earned: number; max: number; pct: number }>
}

const TRACK_ORDER: TrackKey[] = ['aman', 'ayad', 'muatilat', 'iltihab', 'binaa']

function pctColor(p: number) {
  if (p >= 80) return '#059669'
  if (p >= 60) return '#65a30d'
  if (p >= 40) return '#d97706'
  return '#dc2626'
}

export default function AdminReportPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [secret, setSecret] = useState('')
  const [secretInput, setSecretInput] = useState('')
  const [data, setData] = useState<ReportData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_secret') || ''
    if (stored) {
      setSecret(stored)
      fetchReport(stored)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchReport(s: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/report/${slug}`, {
        headers: { 'x-admin-secret': s },
      })
      if (res.status === 401) { setError('كلمة المرور غلط'); setLoading(false); return }
      if (res.status === 404) { setError('التقرير غير موجود'); setLoading(false); return }
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(`خطأ: ${e instanceof Error ? e.message : 'unknown'}`)
    } finally {
      setLoading(false)
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    sessionStorage.setItem('admin_secret', secretInput)
    setSecret(secretInput)
    fetchReport(secretInput)
  }

  // Login screen
  if (!secret || (!data && !loading)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <div style={{ background: 'white', padding: 32, borderRadius: 12, width: 320, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Staff Report Access</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
              placeholder="Admin secret"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 8 }}>{error}</p>}
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              دخول
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>جاري التحميل...</div>
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#DC2626' }}>{error || 'تعذّر تحميل البيانات'}</p>
        <button onClick={() => { setSecret(''); setSecretInput(''); sessionStorage.removeItem('admin_secret') }}
          style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>تسجيل خروج</button>
      </div>
    )
  }

  const isNew = !!data.trackScores
  const scoreColor = data.fertilityScore >= 70 ? '#059669' : data.fertilityScore >= 50 ? '#d97706' : '#dc2626'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif', direction: 'rtl' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
            Staff View — {data.userName || 'Unknown'}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
            {data.userEmail} · {new Date(data.createdAt).toLocaleDateString('ar-SA')} · <code style={{ fontSize: 11 }}>{slug}</code>
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor }}>{data.fertilityScore}%</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{data.scoreCategory}</div>
        </div>
      </div>

      {isNew ? (
        <>
          {/* Track Scores */}
          <section style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>المسارات الخمسة</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: '#374151' }}>المسار</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: '#374151' }}>مكتسب / أقصى</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: '#374151' }}>%</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: '#374151' }}>العادات (boxes)</th>
                </tr>
              </thead>
              <tbody>
                {TRACK_ORDER.map(key => {
                  const track = data.trackScores![key]
                  if (!track) return null
                  const info = TRACK_INFO[key]
                  const color = pctColor(track.pct)
                  const isTop = key === data.topTrack
                  const isSecond = key === data.secondTrack
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: isTop ? '#FEF3C740' : 'transparent' }}>
                      <td style={{ padding: '8px 8px' }}>
                        <span style={{ fontWeight: 600 }}>{info.label}</span>
                        {isTop && <span style={{ fontSize: 11, marginRight: 6, backgroundColor: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 4 }}>Top</span>}
                        {isSecond && <span style={{ fontSize: 11, marginRight: 6, backgroundColor: '#EDE9FE', color: '#5B21B6', padding: '1px 6px', borderRadius: 4 }}>2nd</span>}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', fontFamily: 'monospace' }}>{track.earned} / {track.max}</td>
                      <td style={{ textAlign: 'center', padding: '8px', fontWeight: 700, color }}>{track.pct}%</td>
                      <td style={{ padding: '8px' }}>
                        {track.boxes.length === 0
                          ? <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>
                          : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {track.boxes.map((box: Box, i: number) => (
                                <span key={i} style={{ fontSize: 11, backgroundColor: '#FEF9C3', color: '#92400E', padding: '2px 6px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                                  {box.name} <span style={{ color: '#B45309' }}>(-{box.pointsLost})</span>
                                </span>
                              ))}
                            </div>
                          )
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 12, display: 'flex', gap: 24, fontSize: 13, color: '#6B7280' }}>
              <span>نقطة الالتقاء: <strong style={{ color: '#111827' }}>{data.intersectionPoint || '—'}</strong></span>
              <span>إجمالي العادات: <strong style={{ color: '#111827' }}>{data.totalFactors ?? '—'}</strong></span>
              <span>عالية الأثر: <strong style={{ color: '#111827' }}>{data.highImpactFactors ?? '—'}</strong></span>
              <span>الفئة العمرية: <strong style={{ color: '#111827' }}>{data.ageCategory ?? '—'}</strong></span>
              <span>الحالة: <strong style={{ color: '#111827' }}>{data.maritalStatus ?? '—'}</strong></span>
            </div>
          </section>

          {/* Medical box items */}
          {data.medicalBoxItems && data.medicalBoxItems.length > 0 && (
            <section style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#92400E' }}>الصندوق الطبي</h2>
              <ul style={{ margin: 0, paddingRight: 20 }}>
                {data.medicalBoxItems.map((item, i) => (
                  <li key={i} style={{ color: '#78350F', fontSize: 14, marginBottom: 6 }}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Clinical sentences */}
          {data.triggeredSentences && data.triggeredSentences.length > 0 && (
            <section style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>الجمل السريرية المفعّلة</h2>
              <ol style={{ margin: 0, paddingRight: 20 }}>
                {data.triggeredSentences.map((s, i) => (
                  <li key={i} style={{ marginBottom: 12, color: '#374151', lineHeight: 1.8, fontSize: 14, direction: 'rtl' }}>{s}</li>
                ))}
              </ol>
            </section>
          )}

          {/* Table intro text */}
          {data.tableIntroText && (
            <section style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#111827' }}>نص مقدمة الجدول (tableIntroText)</h2>
              <p style={{ color: '#374151', lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-line' }}>{data.tableIntroText}</p>
            </section>
          )}

          {/* Gemini narrative */}
          {data.geminiNarrative && (
            <section style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#15803D' }}>تحليل Gemini (للاختصاصيين فقط)</h2>
              <p style={{ color: '#166534', lineHeight: 1.9, fontSize: 14, whiteSpace: 'pre-line' }}>{data.geminiNarrative}</p>
            </section>
          )}
        </>
      ) : (
        /* Old format */
        <>
          <section style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#111827' }}>محاور التقييم (صيغة قديمة)</h2>
            {data.sectionScores && Object.entries(data.sectionScores).map(([key, val]) => {
              if (!val) return null
              const color = pctColor(val.pct)
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{key}</span>
                    <span style={{ fontWeight: 700, color, fontSize: 13 }}>{val.pct}% ({val.earned}/{val.max})</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' }}>
                    <div style={{ height: '100%', width: `${val.pct}%`, backgroundColor: color, borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </section>
          {data.triggeredSentences && data.triggeredSentences.length > 0 && (
            <section style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#111827' }}>الجمل المفعّلة</h2>
              <ol style={{ paddingRight: 20 }}>
                {data.triggeredSentences.map((s, i) => <li key={i} style={{ marginBottom: 10, fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{s}</li>)}
              </ol>
            </section>
          )}
          {data.geminiNarrative && (
            <section style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#15803D' }}>تحليل Gemini</h2>
              <p style={{ color: '#166534', lineHeight: 1.9, fontSize: 14, whiteSpace: 'pre-line' }}>{data.geminiNarrative}</p>
            </section>
          )}
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href="/admin" style={{ color: '#4F46E5', fontSize: 13 }}>← العودة للوحة الإدارة</a>
      </div>
    </div>
  )
}
