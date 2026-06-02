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

  const r = 70
  const cx = 115
  const cy = 88

  // Point on the semicircle for a given score (0–100)
  // angle = π at score=0 (left), 0 at score=100 (right), arc goes through the top
  function arcPoint(s: number): [number, number] {
    const angle = Math.PI - (s / 100) * Math.PI
    return [
      Math.round((cx + r * Math.cos(angle)) * 10) / 10,
      Math.round((cy - r * Math.sin(angle)) * 10) / 10,
    ]
  }

  const [x0, y0]     = arcPoint(0)
  const [x60, y60]   = arcPoint(60)
  const [x70, y70]   = arcPoint(70)
  const [x80, y80]   = arcPoint(80)
  const [x90, y90]   = arcPoint(90)
  const [x100, y100] = arcPoint(100)

  // Needle: -90° when score=0 (pointing left), +90° when score=100 (pointing right)
  const needleRotation = (displayScore / 100) * 180 - 90
  const badgeColor = getScoreColor(score)
  const displayColor = getScoreColor(Math.max(displayScore, 1))

  return (
    <div className="text-center">
      <p className="text-sm font-medium mb-2" style={{ color: '#6B5E7A' }}>درجة خصوبتكِ</p>

      <svg width="230" height="122" viewBox="0 0 230 122" className="mx-auto">
        {/* ── Colored arc segments (low→high = left→right) ── */}
        {/* Red 0–60 */}
        <path d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x60} ${y60}`}
          fill="none" stroke="#e32f30" strokeWidth="14" strokeLinecap="butt" />
        {/* Orange 60–70 */}
        <path d={`M ${x60} ${y60} A ${r} ${r} 0 0 1 ${x70} ${y70}`}
          fill="none" stroke="#f28130" strokeWidth="14" strokeLinecap="butt" />
        {/* Yellow 70–80 */}
        <path d={`M ${x70} ${y70} A ${r} ${r} 0 0 1 ${x80} ${y80}`}
          fill="none" stroke="#ffd434" strokeWidth="14" strokeLinecap="butt" />
        {/* Light green 80–90 */}
        <path d={`M ${x80} ${y80} A ${r} ${r} 0 0 1 ${x90} ${y90}`}
          fill="none" stroke="#80c12b" strokeWidth="14" strokeLinecap="butt" />
        {/* Green 90–100 */}
        <path d={`M ${x90} ${y90} A ${r} ${r} 0 0 1 ${x100} ${y100}`}
          fill="none" stroke="#01ae24" strokeWidth="14" strokeLinecap="butt" />

        {/* ── Score number (drawn before needle so needle sits on top) ── */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          fontSize="38"
          fontWeight="bold"
          fill={displayColor}
          fontFamily="IBM Plex Arabic, Arial, sans-serif"
        >
          {displayScore}
        </text>

        {/* ── Needle ── */}
        <g transform={`rotate(${needleRotation}, ${cx}, ${cy})`}>
          <line
            x1={cx} y1={cy + 8}
            x2={cx} y2={cy - (r - 14)}
            stroke="#1a1a2e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        {/* Needle hub */}
        <circle cx={cx} cy={cy} r={6} fill="#1a1a2e" />
        <circle cx={cx} cy={cy} r={2.5} fill="white" />

        {/* ── 0 / 100 labels ── */}
        <text x={x0} y={y0 + 15} textAnchor="middle" fontSize="11" fill="#9B8BA8"
          fontFamily="IBM Plex Arabic, Arial, sans-serif">0</text>
        <text x={x100} y={y100 + 15} textAnchor="middle" fontSize="11" fill="#9B8BA8"
          fontFamily="IBM Plex Arabic, Arial, sans-serif">100</text>
      </svg>

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
