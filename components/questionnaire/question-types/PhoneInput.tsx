'use client'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function PhoneInput({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Country code prefix */}
        <div
          className="flex items-center px-4 py-4 rounded-xl border-2 text-lg font-medium shrink-0"
          style={{ borderColor: '#E8DFF0', backgroundColor: '#F5F0FA', color: '#6B5E7A' }}
        >
          🇸🇦 +966
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => {
            // Allow digits only
            const digits = e.target.value.replace(/\D/g, '')
            onChange(digits)
          }}
          placeholder="5XXXXXXXX"
          maxLength={9}
          dir="ltr"
          className="flex-1 text-center text-2xl font-semibold py-4 px-4 rounded-xl border-2 outline-none transition-all"
          style={{
            borderColor: value ? 'var(--rose-dusty)' : '#E8DFF0',
            color: 'var(--text-dark)',
            backgroundColor: 'white',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--rose-dusty)' }}
          onBlur={(e) => { e.target.style.borderColor = value ? 'var(--rose-dusty)' : '#E8DFF0' }}
        />
      </div>
      <p className="text-center text-sm" style={{ color: '#9B8BA8' }}>
        سيُستخدم للتواصل معكِ عبر واتساب فقط 🔒
      </p>
    </div>
  )
}
