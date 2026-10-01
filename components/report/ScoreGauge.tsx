'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number
  scoreCategoryAr: string
}

function getScoreColor(s: number): string {
  if (s >= 90) return '#01ae24'
  if (s >= 80) return '#80c12b'
  if (s >= 70) return '#ffd434'
  if (s >= 60) return '#f28130'
  return '#e32f30'
}

export default function ScoreGauge({ score, scoreCategoryAr }: Props) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let start: number | null = null
    const duration = 1800
    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(animate)
    }
    const raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const cx = 115
  const cy = 88

  // Needle: -90° when score=0 (pointing left), +90° when score=100 (pointing right)
  const needleRotation = (displayScore / 100) * 180 - 90
  const badgeColor = getScoreColor(score)
  const displayColor = getScoreColor(Math.max(displayScore, 1))

  return (
    <div className="text-center">
      <p className="text-sm font-medium mb-2" style={{ color: '#6B5E7A' }}>درجة خصوبتكِ</p>

      <svg width="240" height="130" viewBox="0 0 240 130" className="mx-auto">
        <defs>
          <linearGradient id="arcGrad" gradientUnits="userSpaceOnUse" x1="45" y1="88" x2="185" y2="88">
            <stop offset="0%"   stopColor="#e32f30" />
            <stop offset="35%"  stopColor="#e85020" />
            <stop offset="60%"  stopColor="#f28130" />
            <stop offset="76%"  stopColor="#ffd434" />
            <stop offset="90%"  stopColor="#80c12b" />
            <stop offset="100%" stopColor="#01ae24" />
          </linearGradient>
        </defs>

        {/* Single smooth gradient arc with round caps */}
        <path d="M 45 88 A 70 70 0 0 1 185 88"
          fill="none" stroke="url(#arcGrad)" strokeWidth="18" strokeLinecap="round" />

        {/* Needle */}
        <g transform={`rotate(${needleRotation}, ${cx}, ${cy})`}>
          <line
            x1={cx} y1={cy + 8}
            x2={cx} y2={cy - 56}
            stroke="#1a1a2e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        {/* Needle hub */}
        <circle cx={cx} cy={cy} r={6} fill="#1a1a2e" />
        <circle cx={cx} cy={cy} r={2.5} fill="white" />

        {/* 0 / 100 labels */}
        <text x="45" y="116" textAnchor="middle" fontSize="11" fill="#9B8BA8"
          fontFamily="IBM Plex Arabic, Arial, sans-serif">0</text>
        <text x="185" y="116" textAnchor="middle" fontSize="11" fill="#9B8BA8"
          fontFamily="IBM Plex Arabic, Arial, sans-serif">100</text>
      </svg>

      {/* Score number — displayed below the dial */}
      <div className="mt-1 mb-1">
        <span
          className="text-5xl font-bold tabular-nums"
          style={{ color: displayColor, fontFamily: 'IBM Plex Arabic, Arial, sans-serif' }}
        >
          {displayScore}
        </span>
        <span className="text-lg font-medium ml-1" style={{ color: '#9B8BA8' }}>/100</span>
      </div>

      {/* Disclaimer */}
      <p className="text-xs mt-1 px-4 leading-relaxed" style={{ color: '#9B8BA8' }}>
        هذا التقرير معدٌّ لأغراض تثقيفية وتوعوية حصراً، ولا يُعدّ تشخيصاً طبياً ولا بديلاً عن استشارة مختص.
      </p>

      {/* Badge */}
      <div
        className="inline-block mt-3 px-5 py-1.5 rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: badgeColor }}
      >
        {scoreCategoryAr}
      </div>
    </div>
  )
}
