'use client'

import type { Question } from '@/lib/questions'
import SingleChoice from './question-types/SingleChoice'
import MultiChoice from './question-types/MultiChoice'
import NumberInput from './question-types/NumberInput'

interface Props {
  question: Question
  value: string | string[]
  onChange: (val: string | string[]) => void
  heightValue?: string
  exclusiveOptions?: string[]
}

export default function QuestionCard({ question, value, onChange, heightValue, exclusiveOptions = [] }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2 leading-relaxed" style={{ color: 'var(--purple-deep)' }}>
        {question.text}
      </h2>
      {question.helperText && question.type !== 'multi' && (
        <p className="text-sm mb-4" style={{ color: '#6B5E7A' }}>{question.helperText}</p>
      )}

      <div className="mt-4">
        {question.type === 'single' && (
          <SingleChoice
            options={question.options || []}
            value={value as string}
            onChange={onChange as (v: string) => void}
          />
        )}
        {question.type === 'multi' && (
          <MultiChoice
            options={question.options || []}
            values={value as string[]}
            onChange={onChange as (v: string[]) => void}
            exclusiveValues={exclusiveOptions}
          />
        )}
        {question.type === 'number' && (
          <NumberInput
            value={value as string}
            onChange={onChange as (v: string) => void}
            placeholder={question.helperText || ''}
            unit={question.unit || ''}
            min={question.id === 'q2' ? 100 : question.id === 'q3' ? 30 : 0}
            max={question.id === 'q2' ? 220 : question.id === 'q3' ? 250 : 9999}
            showBmi={question.id === 'q3'}
            heightValue={heightValue}
          />
        )}
      </div>
    </div>
  )
}
