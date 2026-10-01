import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { TrackKey, TrackResult, Box } from '@/lib/scoring'
import { LEVEL_TEXTS, TRACK_INFO, CLOSING_LINE } from '@/lib/scoring'
import ScoreGauge from '@/components/report/ScoreGauge'
import CTAButton from '@/components/report/CTAButton'

export const revalidate = false

interface Props {
  params: { slug: string }
}

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || 'https://pregnawell.com/booking'

// ── Old report types ──────────────────────────────────────────────────────
interface OldSectionScore { earned: number; max: number; pct: number }
interface OldSectionScores {
  basicInfo?: OldSectionScore; diet?: OldSectionScore; supplements?: OldSectionScore
  stress?: OldSectionScore; exercise?: OldSectionScore; kitchen?: OldSectionScore
  personalCare?: OldSectionScore; menstrual?: OldSectionScore; caffeine?: OldSectionScore
  infoSources?: OldSectionScore; thyroid?: OldSectionScore; maleFactor?: OldSectionScore
}
const OLD_PILLAR_LABELS: Array<{ key: keyof OldSectionScores; label: string }> = [
  { key: 'diet',         label: 'التغذية والنظام الغذائي' },
  { key: 'stress',       label: 'التوتر والنوم' },
  { key: 'supplements',  label: 'المكملات والأعشاب' },
  { key: 'kitchen',      label: 'المطبخ وتحضير الطعام' },
  { key: 'exercise',     label: 'الرياضة والحركة' },
  { key: 'personalCare', label: 'العناية الشخصية' },
  { key: 'menstrual',    label: 'الدورة الشهرية' },
  { key: 'caffeine',     label: 'الكافيين والمشروبات' },
  { key: 'infoSources',  label: 'مصادر المعلومات' },
  { key: 'thyroid',      label: 'أعراض الغدة الدرقية' },
  { key: 'maleFactor',   label: 'عامل الذكورة' },
  { key: 'basicInfo',    label: 'المعلومات الأساسية (BMI)' },
]

// ── New report content type ───────────────────────────────────────────────
interface NewReportContent {
  trackScores: Record<TrackKey, TrackResult>
  topTrack: TrackKey | null
  secondTrack: TrackKey | null
  intersectionPoint: string
  totalFactors: number
  highImpactFactors: number
  ageCategory: 'a' | 'b' | 'c' | 'd'
  maritalStatus: 'married' | 'engaged' | 'single'
  medicalBoxItems: string[]
  maleFactorVariant: 'a' | 'b' | 'c' | null
  tableIntroText: string
  triggeredSentences?: string[]
  geminiNarrative?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────
function getScoreColor(s: number): string {
  if (s >= 90) return '#01ae24'
  if (s >= 70) return '#80c12b'
  if (s >= 50) return '#ffd434'
  if (s >= 30) return '#f28130'
  return '#e32f30'
}

const categoryBadge: Record<string, string> = {
  level1: 'جسمكِ في وضع جيد',
  level2: 'فيه فجوات تحتاج اهتماماً',
  level3: 'جسمكِ يحتاج تدخلاً',
  level4: 'إنذار مبكر',
  excellent: 'جسمكِ في وضع جيد',
  good: 'فيه فجوات تحتاج اهتماماً',
  needs_improvement: 'جسمكِ يحتاج تدخلاً',
  urgent: 'إنذار مبكر',
}
function normalizeCategory(cat: string): string {
  const map: Record<string, string> = { excellent: 'level1', good: 'level2', needs_improvement: 'level3', urgent: 'level4' }
  return map[cat] || cat
}

// ── Track percentage color ────────────────────────────────────────────────
function pctColor(pct: number) {
  if (pct >= 80) return '#01ae24'
  if (pct >= 60) return '#80c12b'
  if (pct >= 40) return '#f28130'
  return '#e32f30'
}

const TRACK_ORDER: TrackKey[] = ['aman', 'ayad', 'muatilat', 'iltihab', 'binaa']

// ── Age messages ─────────────────────────────────────────────────────────
const AGE_MESSAGES: Record<string, { title: string; body: string }> = {
  a: { title: 'عمركِ لصالحكِ', body: 'أنتِ في النافذة الذهبية. ما يتغير الآن في نمط حياتكِ يؤثر على كل دورة قادمة. ابدئي الآن — الوقت يعمل معكِ.' },
  b: { title: 'الوقت لا يزال يعمل معكِ', body: 'هذه المرحلة من أفضل مراحل الاستجابة للتغيير. الجسم قادر على إعادة بناء الجودة الهرمونية — لكن الترتيب الصحيح مهم.' },
  c: { title: 'كل شهر يصنع فرقاً الآن', body: 'في هذه المرحلة، البويضة التي ستخرج بعد 3 أشهر تتشكل الآن. ما تفعلينه اليوم يؤثر مباشرةً على جودتها.' },
  d: { title: 'البويضة التي ستخرج بعد 3 أشهر تتشكل الآن', body: 'في هذه المرحلة يصبح كل شهر ذا قيمة. التغييرات الصحيحة المركّزة هي الأسرع تأثيراً — والوقت أهم أداة لديكِ.' },
}

export default async function ReportPage({ params }: Props) {
  const { slug } = params

  const report = await prisma.report.findUnique({
    where: { slug },
    include: { submission: { include: { token: { select: { source: true } } } } },
  })
  if (!report) notFound()

  const isWebinar = report.submission?.token?.source === 'webinar'
  const normalizedCategory = normalizeCategory(report.scoreCategory)
  const scoreColor = getScoreColor(report.fertilityScore)
  const badgeLabel = categoryBadge[normalizedCategory] || ''

  // Parse reportContent to determine new vs old format
  const rawContent = JSON.parse(report.reportContent) as Record<string, unknown>
  const isNewFormat = Boolean(rawContent.trackScores)

  if (isNewFormat) {
    const content = rawContent as unknown as NewReportContent
    const { trackScores, topTrack, secondTrack, totalFactors, highImpactFactors,
            ageCategory, maritalStatus, medicalBoxItems, maleFactorVariant,
            tableIntroText, intersectionPoint } = content
    const levelText = LEVEL_TEXTS[normalizedCategory] || ''
    const ageMsg = AGE_MESSAGES[ageCategory] ?? AGE_MESSAGES.c
    const firstName = report.userName?.split(' ')[0] || ''

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">

          {/* Logo */}
          <div className="text-center mb-6">
            <img src="/logo/logo-wordmark.png" alt="PregnaWell" className="h-9 mx-auto mb-1" />
            <div className="text-sm font-medium" style={{ color: 'var(--rose-dusty)' }}>مقياس الخصوبة الذكي</div>
          </div>

          {/* Score Card */}
          <div className="rounded-2xl p-6 mb-6 text-center" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            {firstName && (
              <p className="text-base font-semibold mb-4" style={{ color: 'var(--purple-deep)' }}>
                هذا تقريركِ، {firstName}
              </p>
            )}
            <ScoreGauge score={report.fertilityScore} scoreCategoryAr={badgeLabel} />
          </div>

          {/* Letter from Maha */}
          {levelText && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F3EEF8' }}>
                  <span style={{ fontSize: 20 }}>💌</span>
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: 'var(--purple-deep)' }}>رسالة من مها</p>
                  <p className="text-xs" style={{ color: '#9B8BA8' }}>مؤسسة PregnaWell</p>
                </div>
              </div>
              <p className="text-base leading-loose" style={{ color: 'var(--text-dark)', whiteSpace: 'pre-line' }}>
                {levelText}
              </p>
            </div>
          )}

          {/* HPO Axis */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--purple-deep)' }}>لماذا المسارات الخمسة؟</h2>
            <p className="text-sm leading-loose mb-3" style={{ color: 'var(--text-dark)' }}>
              الخصوبة ليست عن المبيضين وحدهما — هي نتيجة سلسلة هرمونية كاملة تبدأ من الدماغ.
            </p>
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              {['الهيبوثالاموس', '←', 'النخامة', '←', 'المبيض'].map((item, i) => (
                item === '←'
                  ? <span key={i} style={{ color: 'var(--rose-dusty)', fontWeight: 700 }}>{item}</span>
                  : <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F3EEF8', color: 'var(--purple-deep)' }}>{item}</span>
              ))}
            </div>
            <p className="text-sm leading-loose" style={{ color: '#6B5E7A' }}>
              أي اضطراب في هذه السلسلة — من النوم، التوتر، التغذية، الالتهاب — يؤثر مباشرةً على التبويض وجودة البويضة.
              المسارات الخمسة في تقريركِ تعكس هذا المحور بالكامل.
            </p>
          </div>

          {/* 5 Tracks Table */}
          <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--purple-deep)' }}>الصورة الكاملة لجسمكِ</h2>
            <p className="text-sm mb-4" style={{ color: '#6B5E7A' }}>كل مسار يعكس منطقة مختلفة تؤثر على خصوبتكِ</p>
            <div className="space-y-4">
              {TRACK_ORDER.map(key => {
                const track = trackScores[key]
                if (!track) return null
                const info = TRACK_INFO[key]
                const color = pctColor(track.pct)
                const boxesToShow = track.boxes.slice(0, 3)
                const extraBoxes = track.boxes.length - 3
                const isTop = key === topTrack
                const isSecond = key === secondTrack
                return (
                  <div key={key} className="rounded-xl p-4" style={{
                    backgroundColor: isTop ? `${scoreColor}08` : '#FAFAFA',
                    border: isTop ? `1.5px solid ${scoreColor}30` : '1px solid #EDE8F3',
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base" style={{ color: 'var(--purple-deep)' }}>
                          {info.label}
                        </span>
                        {isTop && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
                            الأعلى تأثيراً
                          </span>
                        )}
                        {isSecond && !isTop && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#EDE8F3', color: '#6B5E7A' }}>
                            ثانياً
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>{track.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ backgroundColor: '#E8DFF0' }}>
                      <div className="h-full rounded-full" style={{ width: `${track.pct}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-xs mb-2" style={{ color: '#9B8BA8' }}>{info.description}</p>
                    {boxesToShow.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {boxesToShow.map((box: Box, i: number) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
                            backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A',
                          }}>
                            عادة: {box.name}
                          </span>
                        ))}
                        {extraBoxes > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#EDE8F3', color: '#6B5E7A' }}>
                            +{extraBoxes} أخرى
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ما يقوله جدولكِ */}
          {tableIntroText && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
              <h2 className="text-base font-bold mb-3" style={{ color: 'var(--purple-deep)' }}>ما يقوله جدولكِ</h2>
              <p className="text-base leading-loose" style={{ color: 'var(--text-dark)', whiteSpace: 'pre-line' }}>
                {tableIntroText}
              </p>
              {topTrack && secondTrack && (
                <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#F3EEF8' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--purple-deep)' }}>
                    نقطة الالتقاء بين مساركِ الأول والثاني: <span style={{ color: scoreColor }}>{intersectionPoint}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* جدولكِ أقصر مما يبدو */}
          {totalFactors > 3 && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
              <h2 className="text-base font-bold mb-2" style={{ color: 'var(--purple-deep)' }}>جدولكِ أقصر مما يبدو</h2>
              <p className="text-base leading-loose" style={{ color: 'var(--text-dark)' }}>
                لديكِ <span className="font-bold" style={{ color: scoreColor }}>{totalFactors} عادة</span> تؤثر على صورتكِ الهرمونية.
                {highImpactFactors > 0 && ` منها ${highImpactFactors} ذات تأثير عالٍ.`}
                {' '}لكن الترتيب الصحيح يجعل التغيير أسرع بكثير مما تتوقعين.
                كل عادة من هذه العادات تُحل في مكانها الصحيح من مساركِ — والمسار الأول يفتح الباب للبقية.
              </p>
            </div>
          )}

          {/* الصندوق الطبي */}
          {medicalBoxItems.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#FFF8F0', border: '1.5px solid #FDE68A' }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 18 }}>⚕️</span>
                <h2 className="text-base font-bold" style={{ color: '#92400E' }}>ما ذكرتِه عن دورتكِ يستحق انتباهاً</h2>
              </div>
              <p className="text-sm mb-3" style={{ color: '#78350F' }}>
                بعض ما ذكرتِه يُشير إلى أعراض تستحق تقييماً طبياً مستقلاً:
              </p>
              <ul className="space-y-1">
                {medicalBoxItems.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#92400E' }}>
                    <span className="mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-3" style={{ color: '#B45309' }}>
                هذا لا يعني وجود مشكلة مؤكدة — لكنه يعني أن الصورة الكاملة تحتاج نظرة طبية متخصصة.
              </p>
            </div>
          )}

          {/* كارد الذكورة — للمتزوجات */}
          {maritalStatus === 'married' && maleFactorVariant && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
              <h2 className="text-base font-bold mb-3" style={{ color: 'var(--purple-deep)' }}>عامل الذكورة في صورتكِ</h2>
              {maleFactorVariant === 'c' ? (
                <p className="text-base leading-loose" style={{ color: 'var(--text-dark)' }}>
                  ذكرتِ أن زوجكِ رفض إجراء التحليل. غياب هذا التقييم يجعل أي خطة ناقصة — الحمل يحتاج بويضة صحية وحيواناً منوياً صحياً معاً. التقييم بسيط ولا يأخذ أكثر من يوم.
                </p>
              ) : maleFactorVariant === 'b' ? (
                <p className="text-base leading-loose" style={{ color: 'var(--text-dark)' }}>
                  ذكرتِ أن زوجكِ لديه ملاحظات في التحليل أو نمط حياة غير صحي. جودة الحيوانات المنوية تتحسن بالتغييرات الغذائية في 74 يوماً — وهذا يعني أن العمل معاً الآن له أثر مباشر.
                </p>
              ) : (
                <p className="text-base leading-loose" style={{ color: 'var(--text-dark)' }}>
                  نتائج زوجكِ تدعم التركيز على تهيئة البيئة الهرمونية لديكِ. الحمل يحتاج بويضة صحية وحيواناً منوياً صحياً — الجانبان مرتبطان.
                </p>
              )}
            </div>
          )}

          {/* كارد عند الزواج — للمقبلات */}
          {maritalStatus === 'engaged' && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0' }}>
              <h2 className="text-base font-bold mb-3" style={{ color: '#15803D' }}>كلمة خاصة لكِ</h2>
              <p className="text-base leading-loose" style={{ color: '#166534' }}>
                أنتِ تبدئين قبل أن تبدئي — وهذا أقوى ما يمكن فعله.
                البناء الذي تضعينه الآن يُحدد جودة التبويض والحمل لاحقاً.
                الوقت الذي بين يديكِ هو رصيدكِ الأكبر.
              </p>
            </div>
          )}

          {/* شهادات فيديو — placeholder */}
          <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--purple-deep)' }}>ماذا تقول عملياتنا؟</h2>
            <div className="grid grid-cols-1 gap-3">
              {[1, 2].map(i => (
                <div key={i} className="rounded-xl flex items-center justify-center aspect-video" style={{ backgroundColor: '#F3EEF8' }}>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: '#E8DFF0' }}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--purple-deep)' }}>
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: '#9B8BA8' }}>شهادة {i}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* رسالة العمر */}
          <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#F9F4FF', border: '1px solid #E8DFF0' }}>
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--purple-deep)' }}>{ageMsg.title}</h2>
            <p className="text-base leading-loose" style={{ color: 'var(--text-dark)' }}>{ageMsg.body}</p>
          </div>

          {/* CTA */}
          {!isWebinar && (
            <div className="mb-5">
              <CTAButton scoreCategory={normalizedCategory} variant="mid" bookingUrl={BOOKING_URL} />
            </div>
          )}

          {/* Closing line */}
          <div className="text-center mb-6 px-2">
            <p className="text-sm leading-loose" style={{ color: '#9B8BA8', whiteSpace: 'pre-line' }}>{CLOSING_LINE}</p>
          </div>

          {!isWebinar && (
            <div className="mb-6">
              <CTAButton scoreCategory={normalizedCategory} variant="bottom" bookingUrl={BOOKING_URL} />
            </div>
          )}

          <div className="text-center text-sm" style={{ color: '#9B8BA8' }}>
            PregnaWell © {new Date().getFullYear()} | hello@pregnawell.com
          </div>
        </div>

        {/* Sticky CTA */}
        {!isWebinar && (
          <div className="fixed bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between gap-4 md:hidden" style={{ backgroundColor: 'var(--purple-deep)', zIndex: 50 }}>
            <span className="text-white text-sm font-medium flex-1">مكالمتكِ التقييمية مدرجة في باقتكِ</span>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--rose-dusty)', color: 'white' }}>
              احجزي الآن
            </a>
          </div>
        )}
      </div>
    )
  }

  // ── OLD REPORT FORMAT (backward compat) ───────────────────────────────
  const narrative = rawContent as { narrative?: string; triggeredSentences?: string[] }
  const sectionScores = JSON.parse(report.sectionScores || '{}') as OldSectionScores
  const triggeredSentences: string[] = narrative.triggeredSentences ?? []
  const scoreLevelText = LEVEL_TEXTS[normalizedCategory] || ''

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <img src="/logo/logo-wordmark.png" alt="PregnaWell" className="h-9 mx-auto mb-1" />
          <div className="text-sm font-medium" style={{ color: 'var(--rose-dusty)' }}>مقياس الخصوبة الذكي</div>
        </div>

        <div className="rounded-2xl p-6 mb-6 text-center" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
          <ScoreGauge score={report.fertilityScore} scoreCategoryAr={badgeLabel} />
        </div>

        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--purple-deep)' }}>تفصيل درجتكِ بالمحاور</h2>
          <p className="text-sm mb-5" style={{ color: '#6B5E7A' }}>أداؤكِ في كل محور من محاور التقييم</p>
          <div className="space-y-4">
            {OLD_PILLAR_LABELS.map(({ key, label }) => {
              const section = sectionScores[key]
              if (!section) return null
              const p = section.pct
              const barColor = p >= 90 ? '#01ae24' : p >= 80 ? '#80c12b' : p >= 70 ? '#ffd434' : p >= 60 ? '#f28130' : '#e32f30'
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{p}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFF0' }}>
                    <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {scoreLevelText && (
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: `2px solid ${scoreColor}40` }}>
            <p className="text-base leading-loose font-medium" style={{ color: scoreColor, whiteSpace: 'pre-line' }}>{scoreLevelText}</p>
          </div>
        )}

        {(triggeredSentences.length > 0 || narrative.narrative) && (
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            {triggeredSentences.map((s, i) => (
              <div key={i} className="flex gap-3 mb-5 items-start">
                <span className="text-sm font-bold flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${scoreColor}18`, color: scoreColor }}>{i + 1}</span>
                <p className="text-base leading-loose flex-1" style={{ color: 'var(--text-dark)' }}>{s}</p>
              </div>
            ))}
            {narrative.narrative && (
              <div className={triggeredSentences.length > 0 ? 'mt-2 pt-5 border-t' : ''} style={{ borderColor: '#E8DFF0' }}>
                <p className="text-base leading-loose font-medium" style={{ color: 'var(--purple-deep)', whiteSpace: 'pre-line' }}>{narrative.narrative}</p>
              </div>
            )}
          </div>
        )}

        {!isWebinar && <div className="mb-6"><CTAButton scoreCategory={normalizedCategory} variant="mid" bookingUrl={BOOKING_URL} /></div>}

        <div className="text-center mb-6 px-4">
          <p className="text-base leading-loose font-semibold" style={{ color: 'var(--purple-deep)', whiteSpace: 'pre-line' }}>{CLOSING_LINE}</p>
        </div>

        {!isWebinar && <div className="mb-6"><CTAButton scoreCategory={normalizedCategory} variant="bottom" bookingUrl={BOOKING_URL} /></div>}

        <div className="text-center text-sm" style={{ color: '#9B8BA8' }}>
          PregnaWell © {new Date().getFullYear()} | hello@pregnawell.com
        </div>
      </div>

      {!isWebinar && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between gap-4 md:hidden" style={{ backgroundColor: 'var(--purple-deep)', zIndex: 50 }}>
          <span className="text-white text-sm font-medium flex-1">مكالمتكِ التقييمية مدرجة في باقتكِ</span>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--rose-dusty)', color: 'white' }}>احجزي الآن</a>
        </div>
      )}
    </div>
  )
}
