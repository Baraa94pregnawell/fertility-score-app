'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QUESTIONS, SECTIONS } from '@/lib/questions'
import type { Answers } from '@/lib/scoring'
import ProgressBar from './ProgressBar'
import QuestionCard from './QuestionCard'

interface Props {
  token: string
}

const MULTI_QUESTIONS = new Set(['q4', 'q15', 'q16', 'q17', 'qSnackType', 'qSocialFood', 'q19', 'q20', 'q25', 'q28', 'q31', 'q35', 'q51', 'q39', 'q47', 'q52', 'q53'])
const EXCLUSIVE_OPTIONS: Record<string, string[]> = {
  q4: ['none'],
  q15: ['none'],
  q16: ['none'],
  q17: ['none'],
  q19: ['none'],
  q20: ['none'],
  q28: ['none'],
}

export default function QuestionnaireShell({ token }: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const question = QUESTIONS[currentIndex]
  const totalQuestions = QUESTIONS.length
  const section = SECTIONS.find(s => s.id === question.sectionId)!

  const getValue = () => {
    const raw = answers[question.id]
    if (MULTI_QUESTIONS.has(question.id)) {
      return Array.isArray(raw) ? raw : (raw ? [raw as string] : [])
    }
    return (raw as string) || ''
  }

  const setValue = useCallback((val: string | string[]) => {
    setAnswers(prev => ({ ...prev, [question.id]: val }))
  }, [question.id])

  const canProceed = () => {
    const val = answers[question.id]
    if (!question.required) return true
    if (MULTI_QUESTIONS.has(question.id)) {
      return Array.isArray(val) && val.length > 0
    }
    if (question.type === 'number') {
      return val !== undefined && val !== '' && Number(val) > 0
    }
    return !!val
  }

  const goNext = async () => {
    if (!canProceed()) return

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(i => i + 1)
      return
    }

    // Submit
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/submit-questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطأ في الخادم')
      // Redirect to analyzing page with the pending slug
      router.push(`/analyzing/${token}?slug=${data.slug}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      setSubmitting(false)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  const isLastQuestion = currentIndex === QUESTIONS.length - 1

  // height value for BMI display
  const heightValue = (answers['q2'] as string) || ''

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-cream)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ backgroundColor: 'var(--bg-cream)' }}>
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-3">
            <img src="/logo/logo-wordmark.png" alt="PregnaWell" className="h-8 mx-auto" />
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--rose-dusty)' }}>مقياس الخصوبة الذكي</p>
          </div>
          <ProgressBar
            currentSection={question.sectionId}
            totalSections={SECTIONS.length}
            currentQuestion={currentIndex + 1}
            totalQuestions={totalQuestions}
            sectionName={section.label}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-xl">
          <QuestionCard
            question={question}
            value={getValue()}
            onChange={setValue}
            heightValue={heightValue}
            exclusiveOptions={EXCLUSIVE_OPTIONS[question.id] || []}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <div className="max-w-xl mx-auto text-center py-3 px-4 rounded-xl text-sm"
            style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            {error}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="sticky bottom-0 px-4 py-4" style={{ backgroundColor: 'var(--bg-cream)', borderTop: '1px solid #E8DFF0' }}>
        <div className="max-w-xl mx-auto flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="flex-1 py-3 rounded-xl font-semibold text-base transition-opacity hover:opacity-80"
              style={{ border: '2px solid #E8DFF0', color: '#6B5E7A', backgroundColor: 'white' }}
            >
              السابق
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canProceed() || submitting}
            className="flex-1 py-3 rounded-xl font-semibold text-base text-white transition-opacity"
            style={{
              backgroundColor: canProceed() ? '#059669' : '#D4C5D8',
              opacity: submitting ? 0.7 : 1,
              cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting
              ? '...'
              : isLastQuestion
              ? 'احصلي على تقرير الخصوبة الخاص بكِ'
              : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  )
}
