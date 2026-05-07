import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { ReportNarrative } from '@/lib/gemini'
import type { SectionScores } from '@/lib/scoring'
import ScoreGauge from '@/components/report/ScoreGauge'
import CTAButton from '@/components/report/CTAButton'

export const revalidate = false

interface Props {
  params: { slug: string }
}

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://pregnawell.com/booking'

const PILLAR_LABELS: Array<{ key: keyof SectionScores; maxKey: keyof SectionScores; label: string; weight: string }> = [
  { key: 'diet', maxKey: 'dietMax', label: 'التغذية والنظام الغذائي', weight: '25%' },
  { key: 'supplements', maxKey: 'supplementsMax', label: 'المكملات والأعشاب', weight: '15%' },
  { key: 'stress', maxKey: 'stressMax', label: 'النوم والتوتر', weight: '20%' },
  { key: 'exercise', maxKey: 'exerciseMax', label: 'النشاط البدني', weight: '10%' },
  { key: 'kitchen', maxKey: 'kitchenMax', label: 'المطبخ وتحضير الطعام', weight: '15%' },
  { key: 'personalCare', maxKey: 'personalCareMax', label: 'العناية الشخصية', weight: '10%' },
  { key: 'bmi', maxKey: 'bmiMax', label: 'مؤشر كتلة الجسم', weight: '5%' },
]

const categoryColors: Record<string, string> = {
  excellent: '#0D9488',
  good: '#059669',
  needs_improvement: '#D97706',
  urgent: '#C06078',
}

export default async function ReportPage({ params }: Props) {
  const { slug } = params

  const report = await prisma.report.findUnique({ where: { slug } })
  if (!report) notFound()

  const narrative = JSON.parse(report.reportContent) as ReportNarrative
  const sectionScores = JSON.parse(report.sectionScores) as SectionScores

  const scoreColor = categoryColors[report.scoreCategory] || '#C06078'

  const scoreCategoryAr: Record<string, string> = {
    excellent: 'ممتاز',
    good: 'جيد',
    needs_improvement: 'بحاجة لتحسين',
    urgent: 'تحتاج تدخلاً عاجلاً',
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xl font-bold mb-1" style={{ color: 'var(--purple-deep)' }}>PregnaWell</div>
          <div className="text-sm" style={{ color: '#6B5E7A' }}>بإشراف الأخصائية مها حمّص</div>
        </div>

        {/* Score Gauge */}
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}
        >
          <ScoreGauge
            score={report.fertilityScore}
            scoreCategory={report.scoreCategory}
            scoreCategoryAr={scoreCategoryAr[report.scoreCategory] || report.scoreCategory}
          />
        </div>

        {/* Sub-scores pillars */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--purple-deep)' }}>تفصيل درجتكِ بالمحاور</h2>
          <p className="text-sm mb-5" style={{ color: '#6B5E7A' }}>أداؤكِ في كل محور من محاور التقييم</p>
          <div className="space-y-4">
            {PILLAR_LABELS.map(({ key, maxKey, label, weight }) => {
              const val = sectionScores[key] as number
              const max = sectionScores[maxKey] as number
              const pct = Math.round((val / max) * 100)
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: '#6B5E7A' }}>{weight}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{label}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFF0' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#C06078',
                      }}
                    />
                  </div>
                  <div className="text-left text-xs mt-0.5" style={{ color: '#6B5E7A' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hook */}
        <div className="mb-6">
          <p
            className="text-2xl font-bold leading-relaxed text-center"
            style={{ color: scoreColor }}
          >
            {narrative.hook}
          </p>
        </div>

        {/* Narrative */}
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

        {/* Closing Line */}
        <div className="text-center mb-6">
          <p className="text-lg font-semibold italic" style={{ color: 'var(--purple-deep)' }}>
            {narrative.closingLine}
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
