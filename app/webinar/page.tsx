'use client'

import { useState } from 'react'

export default function WebinarPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/webinar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      if (res.status === 403) {
        setError('التسجيل مغلق حالياً.')
      } else if (data.error === 'invalid_email') {
        setError('الرجاء إدخال إيميل صحيح.')
      } else {
        setError('حدث خطأ، الرجاء المحاولة مرة أخرى.')
      }
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-cream)' }}
      dir="rtl"
    >
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo/logo-wordmark.png" alt="PregnaWell" className="h-9 mx-auto mb-2" />
          <div className="text-sm font-medium" style={{ color: 'var(--rose-dusty)' }}>مقياس الخصوبة الذكي</div>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}
        >
          {submitted ? (
            /* ── Confirmation ── */
            <div className="text-center py-4">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-base leading-loose font-medium" style={{ color: 'var(--purple-deep)' }}>
                تم إرسال رابطك! تفقدي صندوق الوارد وابدئي المقياس قبل جلسة اليوم الثاني 🎉
              </p>
              <p className="text-sm mt-3" style={{ color: '#9B8BA8' }}>
                الرجاء أيضاً تفقد Junk Mail / Spam
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <p className="text-base leading-loose mb-2" style={{ color: 'var(--text-dark)' }}>
                أنت على وشك استلام هدية الحضور في اليوم الأول! الرجاء وضع إيميلك بشكل صحيح هنا حيث سيتم إرسال رابط خاص بكِ على الإيميل للبدء بمقياس الخصوبة الذكي
              </p>
              <p
                className="text-sm font-semibold mb-6 pb-4"
                style={{ color: 'var(--rose-dusty)', borderBottom: '1px solid #E8DFF0' }}
              >
                يجب إتمام المقياس قبل جلسة اليوم الثاني!
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="إيميلك هنا..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full mb-4 text-right"
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '10px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'IBM Plex Arabic, Arial, sans-serif',
                    boxSizing: 'border-box',
                  }}
                />

                {error && (
                  <p className="text-sm mb-3 text-center" style={{ color: '#DC2626' }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-white text-base font-semibold transition-opacity"
                  style={{
                    backgroundColor: 'var(--rose-dusty)',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: 'IBM Plex Arabic, Arial, sans-serif',
                  }}
                >
                  {loading ? '...' : 'اضغطي هنا للحصول على الرابط'}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
