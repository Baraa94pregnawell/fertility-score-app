'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number
  scoreCategory: string
  scoreCategoryAr: string
}

const categoryColors: Record<string, string> = {
  excellent: '#0D9488',
  good: '#059669',
  needs_improvement: '#D97706',
  urgent: '#C06078',
}

export default function ScoreGauge({ score, scoreCategory, scoreCategoryAr }: Props) {
  const [displayScore, setDisplayScore] = useState(0)
  const color = categoryColors[scoreCategory] || '#C06078'

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score])

  // SVG gauge — semicircle
  const radius = 80
  const cx = 100
  const cy = 100
  const totalArc = 180
  const scoreArc = (displayScore / 100) * totalArc

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const start = polarToCartesian(cx, cy, r, startDeg)
    const end = polarToCartesian(cx, cy, r, endDeg)
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  const bgPath = describeArc(cx, cy, radius, 180, 0)
  const scorePath = describeArc(cx, cy, radius, 180, 180 - scoreArc)

  return (
    <div className="text-center">
      <p className="text-sm font-medium mb-2" style={{ color: '#6B5E7A' }}>درجة خصوبتكِ</p>
      <svg width="200" height="120" viewBox="0 0 200 120" className="mx-auto">
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="#E8DFF0" strokeWidth="16" strokeLinecap="round" />
        {/* Score arc */}
        <path
          d={scorePath}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          style={{ transition: 'all 0.1s linear' }}
        />
        {/* Score text */}
        <text x="100" y="95" textAnchor="middle" fontSize="36" fontWeight="bold" fill={color}
          fontFamily="IBM Plex Arabic, Arial, sans-serif">
          {displayScore}
        </text>
      </svg>
      <p className="text-sm mt-1" style={{ color: '#6B5E7A' }}>وفق تقييم PregnaWell</p>

      {/* Badge */}
      <div className="inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: color }}>
        {scoreCategoryAr}
      </div>
    </div>
  )
}
