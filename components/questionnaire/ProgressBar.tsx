'use client'

interface Props {
  currentSection: number
  totalSections: number
  currentQuestion: number
  totalQuestions: number
  sectionName: string
}

export default function ProgressBar({
  currentSection,
  totalSections,
  currentQuestion,
  totalQuestions,
  sectionName,
}: Props) {
  const progress = (currentQuestion / totalQuestions) * 100

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium" style={{ color: '#6B5E7A' }}>
          السؤال {currentQuestion} من {totalQuestions}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--purple-deep)' }}>
          القسم {currentSection} من {totalSections} — {sectionName}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFF0' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(to left, var(--rose-dusty), var(--purple-deep))',
          }}
        />
      </div>
    </div>
  )
}
