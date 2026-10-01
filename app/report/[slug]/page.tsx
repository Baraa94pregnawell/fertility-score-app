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

// ── Short score descriptions (shown under progress bar in تقريركِ section) ──
const SCORE_SHORT_DESC: Record<string, string> = {
  level1: 'جسمكِ في وضع جيد. النتائج تقول إن الرسائل الإيجابية تصل بوضوح إلى محور الخصوبة. الهدف الآن: الحفاظ على هذا المستوى ودعمه.',
  level2: 'جسمكِ يستقبل بعض الرسائل الإيجابية، لكن فيه فجوات تُبطئ الاستجابة. الخبر الجيد: ما ترينه هنا قابل للتغيير، إذا بدأتِ من المكان الصحيح.',
  level3: 'جسمكِ يستقبل رسائل مُتعِبة من أكثر من مجموعة. هذا ليس حظاً سيئاً، وكل ما ترينه هنا يمكن تغييره، إذا بدأتِ من المكان الصحيح.',
  level4: 'جسمكِ يتلقى ضغوطاً من أكثر من مصدر، وهذا يؤثر مباشرة على محور الخصوبة. لكن هذا ليس نهاية الطريق — بل هو نقطة البداية الصحيحة.',
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
            maritalStatus, medicalBoxItems, maleFactorVariant,
            tableIntroText, intersectionPoint } = content
    const firstName = report.userName?.split(' ')[0] || ''
    const scoreShortDesc = SCORE_SHORT_DESC[normalizedCategory] || SCORE_SHORT_DESC.level3

    const ctaCard = (
      <div className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: '#F3EEF8', border: '1px solid #E8DFF0' }}>
        <div className="p-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4" style={{ backgroundColor: 'var(--purple-deep)' }}>
            مكافأة خاصة من العيادة
          </span>
          <h2 className="text-xl font-bold leading-snug mb-4" style={{ color: 'var(--purple-deep)' }}>
            لأنكِ أظهرتِ جديتكِ، نحن جاهزون لنساعدكِ على الانتقال إلى المرحلة التالية
          </h2>
          <p className="text-sm leading-loose mb-4" style={{ color: 'var(--text-dark)' }}>
            أكملتِ التقييم، وكانت نتيجتكِ {report.fertilityScore} من 100. ولهذا نقدّم لكِ جلسة خاصة مع فريقنا:
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex gap-3 items-start p-4 rounded-xl" style={{ backgroundColor: 'white' }}>
              <span className="font-bold text-base flex-shrink-0" style={{ color: 'var(--purple-deep)' }}>١</span>
              <p className="text-sm leading-loose" style={{ color: 'var(--text-dark)' }}>
                يجلس معكِ الفريق، ويشرح لكِ كيف تنظّمين كل هذه العوامل ضمن المراحل الثلاث للعلاج الصحي.
              </p>
            </div>
            <div className="flex gap-3 items-start p-4 rounded-xl" style={{ backgroundColor: 'white' }}>
              <span className="font-bold text-base flex-shrink-0" style={{ color: 'var(--purple-deep)' }}>٢</span>
              <p className="text-sm leading-loose" style={{ color: 'var(--text-dark)' }}>
                وإن حضرتِ في موعدكِ، وكنتِ جادة ومؤهلة، نعرض عليكِ البرنامج الملائم لحالتكِ، الذي تتابعين فيه شخصياً مع الأخصائية مها.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--purple-deep)' }}>هذه الجلسة ليست لكل سيدة</p>
            <p className="text-sm leading-loose" style={{ color: '#6B5E7A' }}>
              إنها لكِ فقط إن كنتِ تطمحين لإكمال الطريق حتى النهاية، ومستعدة للالتزام بخطة حقيقية، وتريدين أن تنهي الضياع والتشتت بين النصائح والتجارب.
            </p>
          </div>
          <p className="text-xs text-center mb-3" style={{ color: '#9B8BA8' }}>هذه المكافأة متاحة الآن فقط</p>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
            className="block w-full text-center py-3.5 rounded-xl font-bold text-white text-base"
            style={{ backgroundColor: 'var(--purple-deep)' }}>
            احجزي جلستكِ الآن
          </a>
        </div>
      </div>
    )

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">

          {/* ── Logo ── */}
          <div className="text-center mb-6">
            <img src="/logo/logo-wordmark.png" alt="PregnaWell" className="h-9 mx-auto mb-1" />
            <div className="text-sm font-medium" style={{ color: 'var(--rose-dusty)' }}>مقياس الخصوبة الذكي</div>
          </div>

          {/* ── ١. Score Card ── */}
          <div className="rounded-2xl p-6 mb-6 text-center" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            {firstName && (
              <p className="text-base font-semibold mb-4" style={{ color: 'var(--purple-deep)' }}>
                هذا تقريركِ، {firstName}
              </p>
            )}
            <ScoreGauge score={report.fertilityScore} scoreCategoryAr={badgeLabel} />
          </div>

          {/* ── ٢. رسالة من مها ── */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--rose-dusty)' }}>رسالة من مها</p>
            <h2 className="text-2xl font-bold mb-5" style={{ color: 'var(--text-dark)' }}>
              عزيزتي {firstName || 'صديقتي'}،
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              أنا مها حمّص، أخصائية تغذية علاجية متخصصة في الخصوبة والهرمونات، ومؤسّسة PregnaWell.
            </p>
            <p className="text-sm mb-4 italic" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              خلال دراستي وعملي البحثي في كندا، تغيّرت نظرتي إلى الخصوبة بالكامل. تعلّمت أن خصوبة المرأة يديرها محور يبدأ من الدماغ، هو محور HPO، وأن هذا المحور يتأثر بكل ما يحيط بها: أكلها، ونومها، وتوترها، وبيئتها اليومية. وأن السؤال الأول عند تأخر الحمل يجب أن يكون: ما الذي يُربك هذا المحور؟
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              لكنني حين عدت إلى عملي مع السيدات في الخليج، رأيت الصورة معكوسة. سيدات يصلن إلى المنشطات وأطفال الأنابيب قبل أن يسألهن أحد عن السبب الجذري. ونصائح خصوبة مستوردة من الغرب، لم تُصمَّم لأجسامنا ولا لأكلنا ولا لحياتنا.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              لهذا بنيت طريقتي الخاصة: طريقة تنطلق من محور الـ HPO، وتعمل مع ثقافتكِ ومطبخكِ لا ضدهما.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F9F4FF' }}>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--purple-deep)' }}>+١ مليون</p>
                <p className="text-xs mt-1" style={{ color: '#6B5E7A' }}>يتابعون رسائلي التوعوية</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--purple-deep)' }}>+650</p>
                <p className="text-xs mt-1" style={{ color: '#6B5E7A' }}>سيدة قيّمتها عيادتنا من دول الخليج</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              اليوم، يتابع رسائلي التوعوية أكثر من مليون شخص على منصات التواصل الاجتماعي، ومن بينهن سيدات كثيرات تابعتُ رحلتهن بنفسي. وقيّمت عيادتنا أكثر من 650 سيدة من مختلف دول الخليج.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              هذا المقياس هو خلاصة طريقة التقييم التي نعتمدها في العيادة. وهذا التقرير ليس قائمة نصائح، بل صورة لما يحدث داخل جسمكِ الآن.
            </p>
            <p className="text-base font-bold" style={{ color: 'var(--rose-dusty)' }}>مها حمّص</p>
          </div>

          {/* ── ٣. HPO Section ── */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--rose-dusty)' }}>لماذا بنينا المقياس بهذه الطريقة</p>
            <h2 className="text-2xl font-bold mb-5" style={{ color: 'var(--text-dark)' }}>خصوبتكِ لا تبدأ من المبيض</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              ربما قيل لكِ إن تحاليلكِ طبيعية، أو إن المبيض يعمل، ومع ذلك لم يحدث الحمل. والسبب أن المبيض لا يقرر، بل ينفّذ.
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              تُظهر الدراسات في منطقة الخليج أن اضطرابات التبويض هي السبب الأكثر شيوعاً لتأخر الحمل. وهذه الاضطرابات تظهر في المبيض كآخر حلقة في السلسلة، لكن إشارتها غالباً تبدأ من خارجه.
            </p>
            <div className="rounded-xl p-5 mb-6 flex items-center gap-5" style={{ backgroundColor: 'var(--purple-deep)' }}>
              <p className="text-5xl font-bold flex-shrink-0" style={{ color: 'white' }}>٨٦٪</p>
              <p className="text-sm leading-loose" style={{ color: '#D6C9F0' }}>
                من بين أكثر من ٦٥٠ سيدة قيّمناهن في عيادتنا، ٨٦٪ كان ما يؤثر على خصوبتهن يبدأ من خارج المبيض.
              </p>
            </div>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--purple-deep)' }}>محور الخصوبة (HPO)</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              القرار يبدأ من الدماغ. في كل شهر، يقرأ الدماغ الرسائل القادمة من جسمكِ ويسأل: هل الوقت آمن للتبويض؟ فإذا اطمأن، أرسلت الغدة النخامية الأوامر، ونفّذها المبيض.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              وجودة البويضة لا تُصنع في يوم التبويض. البويضة تنضج على مدى أشهر، وتتأثر طوال هذه المدة بما يعيشه جسمكِ كل يوم.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              هذه الرسائل تأتي من <strong>5 مجموعات من عاداتكِ</strong>. وكل مجموعة تصل إلى مكان مختلف في محور الخصوبة:
            </p>
            <div className="rounded-xl overflow-hidden mb-5" style={{ border: '1px solid #E8DFF0' }}>
              <div className="grid grid-cols-2 px-4 py-2.5" style={{ backgroundColor: '#F3EEF8' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--purple-deep)' }}>مجموعة العادات</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--purple-deep)' }}>تصل إلى</p>
              </div>
              {[
                { habit: 'الأمان', sub: 'النوم والتوتر والحميات', dest: 'الدماغ', destSub: 'يقرر: هل الوقت آمن؟' },
                { habit: 'المعطلات الهرمونية', sub: 'مواد كيميائية تشبه الهرمونات', dest: 'الغدة النخامية', destSub: 'ترسل الأوامر للمبيض' },
                { habit: 'الأبيض', sub: 'السكر والوزن', dest: 'المبيض', destSub: 'ينفّذ التبويض' },
                { habit: 'الالتهاب', sub: 'الأنظمة الغذائية الخطأ والأكل المصنع', dest: 'البويضة والرحم', destSub: 'الجودة والاستعداد' },
                { habit: 'البناء', sub: 'البروتين والمكملات والماء: المواد التي يصنع منها الجسم هرموناته', dest: 'تصل إلى المحور كله', destSub: '' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-2 px-4 py-3" style={{ borderTop: '1px solid #E8DFF0', backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <div className="pl-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{row.habit}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9B8BA8' }}>{row.sub}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold" style={{ color: 'var(--rose-dusty)' }}>←</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--purple-deep)' }}>{row.dest}</p>
                      {row.destSub && <p className="text-xs mt-0.5" style={{ color: '#9B8BA8' }}>{row.destSub}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm font-bold leading-loose" style={{ color: 'var(--text-dark)' }}>
              لهذا لم نبن المقياس ليسأل &quot;ما مشكلة المبيض؟&quot;، بل ليسأل: ما الرسائل التي تصل إلى محور الخصوبة كله، ومن أين تأتي؟
            </p>
          </div>

          {/* ── ٤. تقريركِ + صورتكِ الكاملة ── */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <p className="text-xs font-semibold mb-4" style={{ color: 'var(--rose-dusty)' }}>تقريركِ</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold tabular-nums" style={{ color: scoreColor }}>{report.fertilityScore}</span>
              <span className="text-lg" style={{ color: '#9B8BA8' }}>من 100</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: '#E8DFF0' }}>
              <div className="h-full rounded-full" style={{ width: `${report.fertilityScore}%`, backgroundColor: scoreColor }} />
            </div>
            <p className="text-sm leading-loose mb-8" style={{ color: 'var(--text-dark)' }}>
              {scoreShortDesc}
            </p>

            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>صورتكِ الكاملة</h2>
            <p className="text-sm mb-5" style={{ color: '#6B5E7A' }}>
              كل صف هو مجموعة من عاداتكِ.{' '}
              <span className="font-semibold px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>المربعات الصفراء</span>
              {' '}هي العادات التي تُتعب جسمكِ.
            </p>
            <div className="space-y-4">
              {TRACK_ORDER.map(key => {
                const track = trackScores[key]
                if (!track) return null
                const info = TRACK_INFO[key]
                const color = pctColor(track.pct)
                const isTop = key === topTrack
                const isSecond = key === secondTrack
                return (
                  <div key={key} className="rounded-xl p-4" style={{
                    backgroundColor: isTop ? `${scoreColor}08` : '#FAFAFA',
                    border: isTop ? `1.5px solid ${scoreColor}30` : '1px solid #EDE8F3',
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: 'var(--purple-deep)' }}>{info.label}</span>
                        {isTop && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>الأعلى تأثيراً</span>}
                        {isSecond && !isTop && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#EDE8F3', color: '#6B5E7A' }}>ثانياً</span>}
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>{track.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ backgroundColor: '#E8DFF0' }}>
                      <div className="h-full rounded-full" style={{ width: `${track.pct}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-xs mb-2" style={{ color: '#9B8BA8' }}>{info.description}</p>
                    {track.boxes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {track.boxes.map((box: Box, i: number) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                            {box.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── ما يقوله جدولكِ ── */}
          {tableIntroText && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
              <h2 className="text-base font-bold mb-3" style={{ color: 'var(--purple-deep)' }}>ما يقوله جدولكِ</h2>
              <p className="text-base leading-loose" style={{ color: 'var(--text-dark)', whiteSpace: 'pre-line' }}>{tableIntroText}</p>
              {topTrack && secondTrack && (
                <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#F3EEF8' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--purple-deep)' }}>
                    نقطة الالتقاء بين مساركِ الأول والثاني: <span style={{ color: scoreColor }}>{intersectionPoint}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ٥. الجدول أقصر مما يبدو ── */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-dark)' }}>الجدول أقصر مما يبدو</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              هذا الجدول ليس قائمة مهام. ظهرت عندكِ <strong>{totalFactors}</strong> عادة، لكن <strong>{highImpactFactors > 0 ? highImpactFactors : 3}</strong> عادات فقط لها الأثر الأكبر على جسمكِ. عندما تبدئين بها، يتحسن كثير من الباقي معها.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dark)', lineHeight: '2.2' }}>
              وهذا ما نراه في عيادتنا مرة بعد مرة: سيدات حملن قبل أن يُكملن نصف الطريق. السبب ليس أنهن غيّرن كل شيء، بل أنهن بدأن بالعادات الأهم، لا بالأسهل.
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
              أيّ العادات تبدئين بها، وبأي ترتيب؟ هذا ما صُممت له المراحل الثلاث في طريقتنا.
            </p>
          </div>

          {/* ── الصندوق الطبي (conditional) ── */}
          {medicalBoxItems.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#FFF8F0', border: '1.5px solid #FDE68A' }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 18 }}>⚕️</span>
                <h2 className="text-base font-bold" style={{ color: '#92400E' }}>ما ذكرتِه عن دورتكِ يستحق انتباهاً</h2>
              </div>
              <p className="text-sm mb-3" style={{ color: '#78350F' }}>بعض ما ذكرتِه يُشير إلى أعراض تستحق تقييماً طبياً مستقلاً:</p>
              <ul className="space-y-1">
                {medicalBoxItems.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#92400E' }}>
                    <span className="mt-0.5 flex-shrink-0">•</span><span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-3" style={{ color: '#B45309' }}>
                هذا لا يعني وجود مشكلة مؤكدة — لكنه يعني أن الصورة الكاملة تحتاج نظرة طبية متخصصة.
              </p>
            </div>
          )}

          {/* ── عامل الذكورة (conditional) ── */}
          {maritalStatus === 'married' && maleFactorVariant && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
              <h2 className="text-base font-bold mb-3" style={{ color: 'var(--purple-deep)' }}>عامل الذكورة في صورتكِ</h2>
              {maleFactorVariant === 'c' ? (
                <p className="text-sm leading-loose" style={{ color: 'var(--text-dark)' }}>
                  ذكرتِ أن زوجكِ رفض إجراء التحليل. غياب هذا التقييم يجعل أي خطة ناقصة — الحمل يحتاج بويضة صحية وحيواناً منوياً صحياً معاً. التقييم بسيط ولا يأخذ أكثر من يوم.
                </p>
              ) : maleFactorVariant === 'b' ? (
                <p className="text-sm leading-loose" style={{ color: 'var(--text-dark)' }}>
                  ذكرتِ أن زوجكِ لديه ملاحظات في التحليل أو نمط حياة غير صحي. جودة الحيوانات المنوية تتحسن بالتغييرات الغذائية في 74 يوماً — وهذا يعني أن العمل معاً الآن له أثر مباشر.
                </p>
              ) : (
                <p className="text-sm leading-loose" style={{ color: 'var(--text-dark)' }}>
                  نتائج زوجكِ تدعم التركيز على تهيئة البيئة الهرمونية لديكِ. الحمل يحتاج بويضة صحية وحيواناً منوياً صحياً — الجانبان مرتبطان.
                </p>
              )}
            </div>
          )}

          {/* ── كارد المقبلة على الزواج (conditional) ── */}
          {maritalStatus === 'engaged' && (
            <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0' }}>
              <h2 className="text-base font-bold mb-3" style={{ color: '#15803D' }}>كلمة خاصة لكِ</h2>
              <p className="text-sm leading-loose" style={{ color: '#166534' }}>
                أنتِ تبدئين قبل أن تبدئي — وهذا أقوى ما يمكن فعله. البناء الذي تضعينه الآن يُحدد جودة التبويض والحمل لاحقاً. الوقت الذي بين يديكِ هو رصيدكِ الأكبر.
              </p>
            </div>
          )}

          {/* ── CTA card (first) ── */}
          {!isWebinar && ctaCard}

          {/* ── ٦. الخطوة التالية — dark hero ── */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: 'var(--purple-deep)' }}>
            <div className="p-6">
              <p className="text-xs font-semibold mb-3" style={{ color: '#D6C9F0' }}>الخطوة التالية</p>
              <h2 className="text-2xl font-bold mb-3 leading-snug" style={{ color: 'white' }}>
                البويضة التي ستخرج بعد 3 أشهر تتشكل الآن
              </h2>
              <p className="text-sm leading-loose" style={{ color: '#D6C9F0' }}>
                ما تفعلينه في الأسابيع القادمة يصل أثره إلى بويضة الأشهر القادمة. لهذا، لا يحتمل قرارُكِ التالي التجربة والخطأ.
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-dark)' }}>
              المقياس حدّد لكِ الأخطاء. والسؤال الآن: كيف تنظّمينها؟
            </h2>
            <p className="text-sm leading-loose mb-6" style={{ color: 'var(--text-dark)' }}>
              في تقريركِ، ظهرت العوامل التي تُربك محور الخصوبة لديكِ. لكن معرفة الأخطاء وحدها لا تكفي. ما يصنع الفرق هو أن تُنظِّم كل هذه العوامل بطريقة يستجيب لها جسمكِ.
            </p>
            <div className="rounded-xl flex items-center justify-center aspect-video mb-6" style={{ backgroundColor: '#F3EEF8' }}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: '#E8DFF0' }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" fill="var(--purple-deep)"/>
                  </svg>
                </div>
                <p className="text-sm" style={{ color: '#9B8BA8' }}>[فيديو قصة السيدة]</p>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#F9F4FF', border: '1px solid #E8DFF0' }}>
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--purple-deep)' }}>لا تخافي من رقمكِ</h3>
              <p className="text-sm leading-loose mb-1" style={{ color: 'var(--text-dark)' }}>
                بدأت معنا بدرجة قريبة من درجتكِ، والحمد لله تمّ حملها على خير.
              </p>
              <p className="text-xs" style={{ color: '#9B8BA8' }}>لكل سيدة رحلتها، والنتائج تختلف من حالة لأخرى.</p>
            </div>
          </div>

          {/* ── CTA card (second) ── */}
          {!isWebinar && ctaCard}

          <div className="text-center text-sm py-4" style={{ color: '#9B8BA8' }}>
            PregnaWell © {new Date().getFullYear()} | hello@pregnawell.com
          </div>
        </div>

        {/* ── Sticky bar ── */}
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
