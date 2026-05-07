'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Verify secret against dedicated verify endpoint (no DB dependency)
    const res = await fetch('/api/admin/verify', {
      headers: { 'x-admin-secret': password },
    })

    if (res.ok) {
      sessionStorage.setItem('admin_secret', password)
      router.push('/admin')
    } else {
      setError('Incorrect password. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3D2870' }}>PregnaWell Admin Panel</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>
          {error && (
            <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: '#3D2870', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
