import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { ReportNarrative } from '@/lib/gemini'
import type { SectionScores } from '@/lib/scoring'
import { LEVEL_TEXTS, CLOSING_LINE } from '@/lib/scoring'
import ScoreGauge from '@/components/report/ScoreGauge'
import CTAButton from '@/components/report/CTAButton'

export const revalidate = false

interface Props {
  params: { slug: string }
}

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://pregnawell.com/booking'

const PILLAR_LABELS: Array<{ key: keyof SectionScores; label: string; weight: string }> = [
  { key: 'diet',        label: 'التغذية والنظام الغذائي',   weight: '25%' },
  { key: 'stress',      label: 'التوتر والنوم',              weight: '20%' },
  { key: 'supplements', label: 'المكملات والأعشاب',          weight: '15%' },
  { key: 'kitchen',     label: 'المطبخ وتحضير الطعام',       weight: '15%' },
  { key: 'exercise',    label: 'الرياضة والحركة',            weight: '10%' },
  { key: 'personalCare',label: 'العناية الشخصية',            weight: '10%' },
  { key: 'menstrual',   label: 'الدورة الشهرية',             weight: '—'   },
  { key: 'caffeine',    label: 'الكافيين والمشروبات',        weight: '—'   },
  { key: 'infoSources', label: 'مصادر المعلومات',            weight: '—'   },
  { key: 'thyroid',     label: 'أعراض الغدة الدرقية',        weight: '—'   },
  { key: 'maleFactor',  label: 'عامل الذكورة',               weight: '—'   },
  { key: 'basicInfo',   label: 'المعلومات الأساسية (BMI)',   weight: '5%'  },
]

const categoryColors: Record<string, string> = {
  level1: '#0D9488',
  level2: '#059669',
  level3: '#D97706',
  level4: '#C06078',
  // legacy
  excellent: '#0D9488',
  good: '#059669',
  needs_improvement: '#D97706',
  urgent: '#C06078',
}

// Badge labels — match user's document exactly
const categoryAr: Record<string, string> = {
  level1: 'جسمك في وضع جيد',
  level2: 'جسمك فيه فجوات تحتاج اهتمام',
  level3: 'جسمك يعاني ويحتاج تدخل فوري',
  level4: 'إنذار مبكر - جسمك يحتاجك الآن',
  // legacy
  excellent: 'جسمك في وضع جيد',
  good: 'جسمك فيه فجوات تحتاج اهتمام',
  needs_improvement: 'جسمك يعاني ويحتاج تدخل فوري',
  urgent: 'إنذار مبكر - جسمك يحتاجك الآن',
}

// Normalize legacy category keys to new level keys
function normalizeCategory(cat: string): string {
  const map: Record<string, string> = {
    excellent: 'level1',
    good: 'level2',
    needs_improvement: 'level3',
    urgent: 'level4',
  }
  return map[cat] || cat
}

export default async function ReportPage({ params }: Props) {
  const { slug } = params

  const report = await prisma.report.findUnique({ where: { slug } })
  if (!report) notFound()

  const narrative = JSON.parse(report.reportContent) as ReportNarrative
  const sectionScores = JSON.parse(report.sectionScores) as SectionScores
  const triggeredSentences: string[] = narrative.triggeredSentences ?? []

  const normalizedCategory = normalizeCategory(report.scoreCategory)
  const scoreColor = categoryColors[normalizedCategory] || '#C06078'
  const scoreLevelText = LEVEL_TEXTS[normalizedCategory] || ''
  const badgeAr = categoryAr[normalizedCategory] || ''

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo/logo-wordmark.png" alt="PregnaWell" className="h-9 mx-auto mb-1" />
          <div className="text-sm font-medium" style={{ color: 'var(--rose-dusty)' }}>مقياس الخصوبة الذكي</div>
        </div>

        {/* Score Gauge */}
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}
        >
          <ScoreGauge
            score={report.fertilityScore}
            scoreCategory={normalizedCategory}
            scoreCategoryAr={badgeAr}
          />
        </div>

        {/* Sub-scores pillars */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--purple-deep)' }}>تفصيل درجتكِ بالمحاور</h2>
          <p className="text-sm mb-5" style={{ color: '#6B5E7A' }}>أداؤكِ في كل محور من محاور التقييم</p>
          <div className="space-y-4">
            {PILLAR_LABELS.map(({ key, label }) => {
              const section = sectionScores[key]
              if (!section) return null
              const pct = section.pct
              const barColor = pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#C06078'
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    {/* In RTL: first child → right, second child → left */}
                    {/* Label on the right (reading start in Arabic) */}
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{label}</span>
                    {/* Score % on the left */}
                    <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFF0' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Level text — fixed pre-written text based on score band */}
        {scoreLevelText ? (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: 'white', border: `2px solid ${scoreColor}40` }}
          >
            <p
              className="text-base leading-loose font-medium"
              style={{ color: scoreColor, whiteSpace: 'pre-line' }}
            >
              {scoreLevelText}
            </p>
          </div>
        ) : null}

        {/* Dynamic insights + Gemini urgency narrative — blended in one card */}
        {(triggeredSentences.length > 0 || narrative?.narrative) ? (
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            {/* Pre-written dynamic sentences triggered by specific answers */}
            {triggeredSentences.map((sentence, i) => (
              <p
                key={i}
                className="text-base leading-loose mb-4"
                style={{ color: 'var(--text-dark)' }}
              >
                {sentence}
              </p>
            ))}

            {/* Gemini urgency narrative (2–3 paragraphs — booking push) */}
            {narrative?.narrative ? (
              <div
                className={triggeredSentences.length > 0 ? 'mt-2 pt-5 border-t' : ''}
                style={{ borderColor: '#E8DFF0' }}
              >
                <p
                  className="text-base leading-loose font-medium"
                  style={{ color: 'var(--purple-deep)', whiteSpace: 'pre-line' }}
                >
                  {narrative.narrative}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* CTA Block 1 — Mid */}
        <div className="mb-6">
          <CTAButton scoreCategory={normalizedCategory} variant="mid" bookingUrl={BOOKING_URL} />
        </div>

        {/* Closing line */}
        <div className="text-center mb-6 px-4">
          <p
            className="text-base leading-loose font-semibold"
            style={{ color: 'var(--purple-deep)', whiteSpace: 'pre-line' }}
          >
            {CLOSING_LINE}
          </p>
        </div>

        {/* CTA Block 2 — Bottom */}
        <div className="mb-6">
          <CTAButton scoreCategory={normalizedCategory} variant="bottom" bookingUrl={BOOKING_URL} />
        </div>

        {/* Footer */}
        <div className="text-center text-sm" style={{ color: '#9B8BA8' }}>
          PregnaWell © {new Date().getFullYear()} | hello@pregnawell.com
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between gap-4 md:hidden"
        style={{ backgroundColor: 'var(--purple-deep)', zIndex: 50 }}
      >
        <span className="text-white text-sm font-medium flex-1">مكالمتكِ التقييمية مدرجة في باقتكِ</span>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: 'var(--rose-dusty)', color: 'white' }}
        >
          احجزي الآن
        </a>
      </div>
    </div>
  )
}
