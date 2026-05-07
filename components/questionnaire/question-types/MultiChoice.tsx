'use client'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  values: string[]
  onChange: (values: string[]) => void
  exclusiveValues?: string[]  // values like 'none' that deselect everything else
}

export default function MultiChoice({ options, values, onChange, exclusiveValues = [] }: Props) {
  const toggle = (val: string) => {
    if (exclusiveValues.includes(val)) {
      // Selecting an exclusive option clears everything else
      onChange(values.includes(val) ? [] : [val])
      return
    }
    // Selecting a non-exclusive option clears exclusive selections
    const withoutExclusive = values.filter(v => !exclusiveValues.includes(v))
    if (withoutExclusive.includes(val)) {
      onChange(withoutExclusive.filter(v => v !== val))
    } else {
      onChange([...withoutExclusive, val])
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm mb-1" style={{ color: '#6B5E7A' }}>يمكنكِ اختيار أكثر من إجابة</p>
      {options.map((opt) => {
        const selected = values.includes(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className="w-full text-right px-5 py-4 rounded-xl border-2 transition-all font-medium text-base"
            style={{
              borderColor: selected ? 'var(--rose-dusty)' : '#E8DFF0',
              backgroundColor: selected ? '#FDF0F3' : 'white',
              color: selected ? 'var(--rose-dusty)' : 'var(--text-dark)',
            }}
          >
            <span className="flex items-center justify-between">
              <span
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: selected ? 'var(--rose-dusty)' : '#C4B5D0',
                  backgroundColor: selected ? 'var(--rose-dusty)' : 'transparent',
                }}
              >
                {selected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span>{opt.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
