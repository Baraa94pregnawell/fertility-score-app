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
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayScore(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(animate)
    }

    const raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [score])

  // Semicircle gauge using strokeDashoffset — reliable on all browsers
  const r = 70
  const cx = 110
  const cy = 90
  // Full semicircle length = π * r
  const arcLen = Math.PI * r
  // How much of the arc to fill based on displayScore
  const fillLen = (displayScore / 100) * arcLen
  const dashOffset = arcLen - fillLen

  // SVG path: left endpoint → top → right endpoint (through top of circle)
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`

  return (
    <div className="text-center">
      <p className="text-sm font-medium mb-2" style={{ color: '#6B5E7A' }}>درجة خصوبتكِ</p>

      <svg width="220" height="110" viewBox="0 0 220 110" className="mx-auto">
        {/* Background arc — full grey semicircle */}
        <path
          d={d}
          fill="none"
          stroke="#E8DFF0"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={0}
        />
        {/* Score arc — animated fill */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={dashOffset}
        />
        {/* Score number */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fontSize="40"
          fontWeight="bold"
          fill={color}
          fontFamily="IBM Plex Arabic, Arial, sans-serif"
        >
          {displayScore}
        </text>
      </svg>

      {/* Disclaimer */}
      <p className="text-xs mt-1 px-4 leading-relaxed" style={{ color: '#9B8BA8' }}>
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
