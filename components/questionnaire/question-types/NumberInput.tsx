'use client'

import { useState, useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder: string
  unit: string
  min?: number
  max?: number
  showBmi?: boolean
  heightValue?: string
}

export default function NumberInput({ value, onChange, placeholder, unit, min, max, showBmi, heightValue }: Props) {
  const [bmi, setBmi] = useState<number | null>(null)

  useEffect(() => {
    if (!showBmi) return
    const h = Number(heightValue)
    const w = Number(value)
    if (h && w) {
      setBmi(Math.round((w / ((h / 100) ** 2)) * 10) / 10)
    } else {
      setBmi(null)
    }
  }, [value, heightValue, showBmi])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className="flex-1 text-center text-2xl font-semibold py-4 px-4 rounded-xl border-2 outline-none transition-all"
          style={{
            borderColor: value ? 'var(--rose-dusty)' : '#E8DFF0',
            color: 'var(--text-dark)',
            backgroundColor: 'white',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--rose-dusty)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = value ? 'var(--rose-dusty)' : '#E8DFF0'
          }}
        />
        <span className="text-lg font-medium w-16 text-center" style={{ color: '#6B5E7A' }}>
          {unit}
        </span>
      </div>

      {showBmi && bmi && (
        <div
          className="rounded-xl px-5 py-3 text-center"
          style={{ backgroundColor: '#F0EBF8', border: '1px solid #D6C9E8' }}
        >
          <span className="text-sm" style={{ color: '#6B5E7A' }}>مؤشر كتلة الجسم (BMI): </span>
          <span className="font-bold text-lg" style={{ color: 'var(--purple-deep)' }}>{bmi}</span>
        </div>
      )}
    </div>
  )
}
