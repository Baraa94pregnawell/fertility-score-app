'use client'

import { useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
}

const COUNTRIES = [
  // Gulf
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: '+968', flag: '🇴🇲', name: 'عُمان' },
  // Levant & Middle East
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: '+963', flag: '🇸🇾', name: 'سوريا' },
  { code: '+964', flag: '🇮🇶', name: 'العراق' },
  { code: '+972', flag: '🇵🇸', name: 'فلسطين' },
  // North Africa
  { code: '+20',  flag: '🇪🇬', name: 'مصر' },
  { code: '+212', flag: '🇲🇦', name: 'المغرب' },
  { code: '+216', flag: '🇹🇳', name: 'تونس' },
  { code: '+213', flag: '🇩🇿', name: 'الجزائر' },
  { code: '+218', flag: '🇱🇾', name: 'ليبيا' },
  { code: '+249', flag: '🇸🇩', name: 'السودان' },
  { code: '+967', flag: '🇾🇪', name: 'اليمن' },
  // Americas
  { code: '+1',   flag: '🇺🇸', name: 'أمريكا' },
  { code: '+1',   flag: '🇨🇦', name: 'كندا' },
  // Oceania
  { code: '+61',  flag: '🇦🇺', name: 'أستراليا' },
  { code: '+64',  flag: '🇳🇿', name: 'نيوزيلندا' },
  // Europe
  { code: '+44',  flag: '🇬🇧', name: 'بريطانيا' },
  { code: '+49',  flag: '🇩🇪', name: 'ألمانيا' },
  { code: '+33',  flag: '🇫🇷', name: 'فرنسا' },
  { code: '+31',  flag: '🇳🇱', name: 'هولندا' },
  { code: '+32',  flag: '🇧🇪', name: 'بلجيكا' },
  { code: '+41',  flag: '🇨🇭', name: 'سويسرا' },
  { code: '+43',  flag: '🇦🇹', name: 'النمسا' },
  { code: '+46',  flag: '🇸🇪', name: 'السويد' },
  { code: '+47',  flag: '🇳🇴', name: 'النرويج' },
  { code: '+45',  flag: '🇩🇰', name: 'الدنمارك' },
  { code: '+358', flag: '🇫🇮', name: 'فنلندا' },
  { code: '+34',  flag: '🇪🇸', name: 'إسبانيا' },
  { code: '+39',  flag: '🇮🇹', name: 'إيطاليا' },
  { code: '+351', flag: '🇵🇹', name: 'البرتغال' },
  { code: '+30',  flag: '🇬🇷', name: 'اليونان' },
  { code: '+48',  flag: '🇵🇱', name: 'بولندا' },
  { code: '+7',   flag: '🇷🇺', name: 'روسيا' },
  // Other
  { code: '+90',  flag: '🇹🇷', name: 'تركيا' },
  { code: '+92',  flag: '🇵🇰', name: 'باكستان' },
  { code: '+91',  flag: '🇮🇳', name: 'الهند' },
]

export default function PhoneInput({ value, onChange }: Props) {
  // value format: "countryCode|number" e.g. "+966|512345678"
  const parts = value && value.includes('|') ? value.split('|') : ['+966', value || '']
  const [selectedCode, setSelectedCode] = useState(parts[0] || '+966')
  const [open, setOpen] = useState(false)
  const number = parts[1] || ''

  const selectedCountry = COUNTRIES.find(c => c.code === selectedCode) || COUNTRIES[0]

  const handleCodeChange = (code: string) => {
    setSelectedCode(code)
    setOpen(false)
    onChange(`${code}|${number}`)
  }

  const handleNumberChange = (digits: string) => {
    onChange(`${selectedCode}|${digits}`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-3 relative">
        {/* Country selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-4 rounded-xl border-2 text-base font-medium shrink-0 h-full"
            style={{ borderColor: '#E8DFF0', backgroundColor: '#F5F0FA', color: '#6B5E7A' }}
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.code}</span>
            <span className="text-xs opacity-60">▼</span>
          </button>

          {open && (
            <div
              className="absolute top-full mt-1 left-0 z-50 rounded-xl border shadow-lg overflow-y-auto"
              style={{ backgroundColor: 'white', borderColor: '#E8DFF0', width: '180px', maxHeight: '240px' }}
            >
              {COUNTRIES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCodeChange(c.code)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-purple-50 transition-colors text-sm"
                  style={{ color: '#3D2870' }}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-right">{c.name}</span>
                  <span className="text-xs opacity-60 shrink-0">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Number input */}
        <input
          type="tel"
          value={number}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            handleNumberChange(digits)
          }}
          placeholder="5XXXXXXXX"
          maxLength={12}
          dir="ltr"
          className="flex-1 text-center text-2xl font-semibold py-4 px-4 rounded-xl border-2 outline-none transition-all"
          style={{
            borderColor: number ? 'var(--rose-dusty)' : '#E8DFF0',
            color: 'var(--text-dark)',
            backgroundColor: 'white',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--rose-dusty)' }}
          onBlur={(e) => { e.target.style.borderColor = number ? 'var(--rose-dusty)' : '#E8DFF0' }}
        />
      </div>
      <p className="text-center text-sm" style={{ color: '#9B8BA8' }}>
        سيُستخدم للتواصل معكِ عبر واتساب فقط 🔒
      </p>
    </div>
  )
}
