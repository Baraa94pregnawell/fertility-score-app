'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  'تحليل أنماط تغذيتكِ ومكملاتكِ الغذائية...',
  'تقييم الأنظمة الغذائية المتبعة وتأثيرها الهرموني...',
  'مراجعة مستويات التوتر وجودة النوم...',
  'تحليل تعرضكِ للمواد البيئية في المطبخ والعناية الشخصية...',
  'حساب درجة الخصوبة الخاصة بكِ...',
]

interface Props {
  slug: string
}

export default function AnalyzingScreen({ slug }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'steps' | 'final'>('intro')
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [ringProgress, setRingProgress] = useState(0)

  useEffect(() => {
    // Phase 1: 0-4s intro
    const introTimer = setTimeout(() => {
      setPhase('steps')
    }, 4000)

    return () => clearTimeout(introTimer)
  }, [])

  useEffect(() => {
    if (phase !== 'steps') return

    // Show each step for ~1.8s
    const stepDuration = 1800
    let stepIdx = 0

    const showNextStep = () => {
      setCurrentStep(stepIdx)
      const completeTimer = setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIdx])
        stepIdx++
        if (stepIdx < STEPS.length) {
          setTimeout(showNextStep, 200)
        } else {
          // All steps done, show final phase
          setTimeout(() => {
            setPhase('final')
          }, 400)
        }
      }, stepDuration)
      return completeTimer
    }

    const first = setTimeout(showNextStep, 300)
    return () => clearTimeout(first)
  }, [phase])

  useEffect(() => {
    if (phase !== 'final') return

    // Animate ring from 0 to 100 over 5s
    let frame = 0
    const total = 100
    const duration = 5000
    const interval = duration / total

    const timer = setInterval(() => {
      frame++
      setRingProgress(frame)
      if (frame >= total) {
        clearInterval(timer)
        // Redirect
        setTimeout(() => {
          router.push(`/report/${slug}`)
        }, 300)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [phase, slug, router])

  const circumference = 2 * Math.PI * 54

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--purple-deep)' }}
    >
      {/* Phase: Intro */}
      {phase === 'intro' && (
        <div className="text-center animate-pulse">
          <div className="text-4xl font-bold text-white mb-4">PregnaWell</div>
          <p className="text-xl" style={{ color: '#C06078' }}>جارٍ تحليل استبيانكِ...</p>
        </div>
      )}

      {/* Phase: Steps */}
      {phase === 'steps' && (
        <div className="w-full max-w-md text-center">
          <div className="text-2xl font-bold text-white mb-8">PregnaWell</div>
          <div className="space-y-4">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep && !completedSteps.includes(idx)
              const isDone = completedSteps.includes(idx)
              const isVisible = idx <= currentStep

              if (!isVisible) return null

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-right"
                  style={{
                    opacity: isActive || isDone ? 1 : 0.5,
                    animation: isActive ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isDone ? '#059669' : isActive ? 'var(--rose-dusty)' : 'transparent',
                      border: `2px solid ${isDone ? '#059669' : isActive ? 'var(--rose-dusty)' : '#6B5E7A'}`,
                    }}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : null}
                  </div>
                  <span className="text-base" style={{ color: isDone ? '#A7F3D0' : 'white' }}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Phase: Final ring */}
      {phase === 'final' && (
        <div className="text-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto mb-6">
            {/* Background circle */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="#4A3580" strokeWidth="8" />
            {/* Progress ring */}
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="var(--rose-dusty)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (ringProgress / 100) * circumference}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
            {/* Center text */}
            <text
              x="60" y="65"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontFamily="IBM Plex Arabic, Arial, sans-serif"
            >
              {ringProgress}%
            </text>
          </svg>
          <p className="text-xl text-white font-semibold">تقريركِ جاهز تقريباً...</p>
        </div>
      )}
    </div>
  )
}
