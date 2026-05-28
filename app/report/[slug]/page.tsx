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
}

const categoryAr: Record<string, string> = {
  level1: 'ممتاز',
  level2: 'جيد',
  level3: 'بحاجة لتحسين',
  level4: 'تحتاج تدخلاً عاجلاً',
}

export default async function ReportPage({ params }: Props) {
  const { slug } = params

  const report = await prisma.report.findUnique({ where: { slug } })
  if (!report) notFound()

  const narrative = JSON.parse(report.reportContent) as ReportNarrative
  const sectionScores = JSON.parse(report.sectionScores) as SectionScores

  const scoreColor = categoryColors[report.scoreCategory] || '#C06078'
  const scoreLevelText = LEVEL_TEXTS[report.scoreCategory] || ''

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xl font-bold mb-1" style={{ color: 'var(--purple-deep)' }}>PregnaWell</div>
          <div className="text-sm" style={{ color: '#6B5E7A' }}>مقياس الخصوبة الذكي — بإشراف الأخصائية مها حمّص</div>
        </div>

        {/* Score Gauge */}
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}
        >
          <ScoreGauge
            score={report.fertilityScore}
            scoreCategory={report.scoreCategory}
            scoreCategoryAr={categoryAr[report.scoreCategory] || report.scoreCategory}
          />
        </div>

        {/* Sub-scores pillars */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--purple-deep)' }}>تفصيل درجتكِ بالمحاور</h2>
          <p className="text-sm mb-5" style={{ color: '#6B5E7A' }}>أداؤكِ في كل محور من محاور التقييم</p>
          <div className="space-y-4">
            {PILLAR_LABELS.map(({ key, label, weight }) => {
              const section = sectionScores[key]
              if (!section) return null
              const pct = section.pct
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color: '#9B8BA8' }}>{weight}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{label}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFF0' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#C06078',
                      }}
                    />
                  </div>
                  <div className="text-left text-xs mt-0.5" style={{ color: '#6B5E7A' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Level text — fixed pre-written text based on score band */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'white', border: `1px solid ${scoreColor}30` }}
        >
          <p
            className="text-base leading-loose font-medium"
            style={{ color: scoreColor, whiteSpace: 'pre-line' }}
          >
            {scoreLevelText}
          </p>
        </div>

        {/* Gemini narrative — elaboration of triggered pain points */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
          <div
            className="text-base leading-loose"
            style={{ color: 'var(--text-dark)', whiteSpace: 'pre-line' }}
          >
            {narrative.narrative}
          </div>
        </div>

        {/* CTA Block 1 — Mid */}
        <div className="mb-6">
          <CTAButton scoreCategory={report.scoreCategory} variant="mid" bookingUrl={BOOKING_URL} />
        </div>

        {/* Closing line — fixed constant */}
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
          <CTAButton scoreCategory={report.scoreCategory} variant="bottom" bookingUrl={BOOKING_URL} />
        </div>

        {/* Medical Disclaimer */}
        <div
          className="rounded-2xl p-5 mb-8 text-center"
          style={{ backgroundColor: '#F5F0FA', border: '1px solid #D6C9E8' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: '#6B5E7A' }}>
            هذا التقرير معدٌّ لأغراض تثقيفية وتوعوية حصراً، ولا يُعدّ تشخيصاً طبياً ولا بديلاً عن استشارة مختص.
            للحصول على تقييم شامل، احجزي مكالمتكِ التقييمية مع فريق PregnaWell.
          </p>
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
