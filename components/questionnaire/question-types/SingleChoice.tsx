'use client'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export default function SingleChoice({ options, value, onChange }: Props) {
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="w-full text-right px-5 py-4 rounded-xl border-2 transition-all font-medium text-base"
          style={{
            borderColor: value === opt.value ? 'var(--rose-dusty)' : '#E8DFF0',
            backgroundColor: value === opt.value ? '#FDF0F3' : 'white',
            color: value === opt.value ? 'var(--rose-dusty)' : 'var(--text-dark)',
          }}
        >
          <span className="flex items-center justify-between">
            <span
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: value === opt.value ? 'var(--rose-dusty)' : '#C4B5D0',
                backgroundColor: value === opt.value ? 'var(--rose-dusty)' : 'transparent',
              }}
            >
              {value === opt.value && (
                <span className="w-2 h-2 rounded-full bg-white" />
              )}
            </span>
            <span>{opt.label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
