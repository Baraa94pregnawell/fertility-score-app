'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number
  scoreCategory: string
  scoreCategoryAr: string
}

const categoryColors: Record<string, string> = {
  level1: '#0D9488',
  level2: '#059669',
  level3: '#D97706',
  level4: '#C06078',
  // legacy keys for old reports stored before rename
  excellent: '#0D9488',
  good: '#059669',
  needs_improvement: '#D97706',
  urgent: '#C06078',
}

export default function ScoreGauge({ score, scoreCategory, scoreCategoryAr }: Props) {
  const [displayScore, setDisplayScore] = useState(0)
  const color = categoryColors[scoreCategory] || '#C06078'

  useEffect(() => {
    let start: number | null = null
    const duration = 1800

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(animate)
    }

    const raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [score])

  // SVG semicircle gauge — starts at left (180°), sweeps right to (0°)
  const radius = 75
  const cx = 100
  const cy = 100
  const strokeW = 14

  const polarToCartesian = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  const arcPath = (startDeg: number, endDeg: number) => {
    const s = polarToCartesian(startDeg)
    const e = polarToCartesian(endDeg)
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    const sweep = endDeg < startDeg ? 0 : 1
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${e.x} ${e.y}`
  }

  // Background: 180° → 0° (right sweep = sweep=0 going counter-clockwise from left to right)
  const bgPath = arcPath(180, 0)
  // Score arc: 180° → (180 - score% * 180°)
  const scoreEndDeg = 180 - (displayScore / 100) * 180
  const scorePath = displayScore > 0 ? arcPath(180, scoreEndDeg) : null

  return (
    <div className="text-center">
      <p className="text-sm font-medium mb-2" style={{ color: '#6B5E7A' }}>درجة خصوبتكِ</p>
      <svg width="200" height="115" viewBox="0 0 200 115" className="mx-auto">
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="#E8DFF0" strokeWidth={strokeW} strokeLinecap="round" />
        {/* Score arc */}
        {scorePath && (
          <path
            d={scorePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Score number */}
        <text
          x="100" y="98"
          textAnchor="middle"
          fontSize="38"
          fontWeight="bold"
          fill={color}
          fontFamily="IBM Plex Arabic, Arial, sans-serif"
        >
          {displayScore}
        </text>
      </svg>
      {/* Disclaimer under score */}
      <p className="text-xs mt-2 px-4 leading-relaxed" style={{ color: '#9B8BA8' }}>
        هذا التقرير معدٌّ لأغراض تثقيفية وتوعوية حصراً، ولا يُعدّ تشخيصاً طبياً ولا بديلاً عن استشارة مختص.
      </p>

      {/* Badge */}
      <div
        className="inline-block mt-3 px-5 py-1.5 rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {scoreCategoryAr}
      </div>
    </div>
  )
}
