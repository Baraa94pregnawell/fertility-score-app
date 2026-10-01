// 5-Track fertility scoring engine.
// finalScore = (totalEarned / totalMax) × 100
// Each track score = trackEarned / trackMax × 100

export interface Answers { [questionId: string]: string | string[] | number }

export type TrackKey = 'aman' | 'ayad' | 'muatilat' | 'iltihab' | 'binaa'

export interface Box {
  name: string
  questionId: string
  pointsLost: number
}

export interface TrackResult {
  earned: number
  max: number
  pct: number
  boxes: Box[]
}

export interface ScoreResult {
  finalScore: number
  scoreCategory: string
  scoreCategoryAr: string
  scoreLevelText: string
  tracks: Record<TrackKey, TrackResult>
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
  triggeredSentences: string[]
  bmi: number
  // Kept for backward compat with old reports (empty for new)
  sectionScores: Record<string, unknown>
}

// ── Level texts ────────────────────────────────────────────────────────────
export const LEVEL_TEXTS: Record<string, string> = {
  level1: 'صورتكِ قوية، لكن مساراً واحداً نشطاً يكفي لإرباك قرار التبويض. والفجوات القليلة المركّزة هي الأسرع استجابة، إذا عولجت من المكان الصحيح.',
  level2: 'جسمكِ يعمل، لكنه يتلقى إشارات تسحب من قدرته على التبويض كل شهر. الفجوات واضحة، ومعالجتها بالترتيب الصحيح هي ما يصنع الفرق.',
  level3: 'جسمكِ يتلقى إشارات مربكة من أكثر من مسار، ويعطيكِ علامات منذ فترة. هذا ليس قدراً ولا حظاً، وكل ما يظهر في صورتكِ قابل للتغيير، إذا بدأتِ من المكان الصحيح.',
  level4: 'جسمكِ يتلقى إشارات مربكة من مسارات متعددة في الوقت نفسه. هذا لا يعني أن الحمل بعيد، بل يعني أن جسمكِ يحتاج أن تُرتَّب هذه الإشارات قبل أي شيء آخر.',
}

export const CLOSING_LINE = 'هذه النتيجة ليست حكماً على جسمك - هي نقطة بداية.\nأنتِ الآن تعرفين أكثر مما كنتِ تعرفينه قبل 10 دقائق.\nوالخطوة التالية هي تحويل هذه المعرفة إلى خطة حقيقية مخصصة لك.'

// ── Track info ─────────────────────────────────────────────────────────────
export const TRACK_INFO: Record<TrackKey, { label: string; description: string; howItEnters: string }> = {
  aman:      { label: 'الأمان',              description: 'النوم، التوتر، والتوازن الأدرينالي', howItEnters: 'الدماغ والغدة الكظرية' },
  ayad:      { label: 'الأيض',               description: 'الأكل، الإنسولين، والوزن',           howItEnters: 'المبيض والإنسولين' },
  muatilat:  { label: 'المعطلات الهرمونية', description: 'التعرض للمواد الكيميائية',             howItEnters: 'الرسائل بين الدماغ والمبيض' },
  iltihab:   { label: 'الالتهاب',            description: 'جودة البيئة التناسلية',               howItEnters: 'بيئة البويضة والبطانة' },
  binaa:     { label: 'البناء',              description: 'المكملات والمواد الخام',               howItEnters: 'إنتاج الهرمونات' },
}

// Intersection: given top 2 tracks (lowest %), what is the shared outcome?
// Priority: التبويض > جودة البويضة > انتظام الدورة
const INTERSECTION: Record<string, string> = {
  'aman-ayad':     'التبويض',
  'aman-muatilat': 'التبويض',
  'aman-iltihab':  'انتظام الدورة',
  'aman-binaa':    'انتظام الدورة',
  'ayad-muatilat': 'التبويض',
  'ayad-iltihab':  'جودة البويضة',
  'ayad-binaa':    'جودة البويضة',
  'muatilat-iltihab': 'جودة البويضة',
  'muatilat-binaa':   'انتظام الدورة',
  'iltihab-binaa':    'جودة البويضة',
}

function intersectionKey(a: TrackKey, b: TrackKey): string {
  const order: TrackKey[] = ['aman', 'ayad', 'muatilat', 'iltihab', 'binaa']
  return order.indexOf(a) < order.indexOf(b) ? `${a}-${b}` : `${b}-${a}`
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getStr(a: Answers, id: string): string { return (a[id] as string) ?? '' }
function getArr(a: Answers, id: string): string[] {
  const v = a[id]; if (!v) return []
  return Array.isArray(v) ? v : [String(v)]
}

interface QResult {
  earned: number
  weight: number
  tracks: TrackKey[]
  // Optional box: the box may appear in tracks different from the question's tracks
  box?: { name: string; tracks: TrackKey[] }
}

// Track accumulators
interface TrackAccum { earned: number; max: number; boxes: Box[] }

// ── BMI ────────────────────────────────────────────────────────────────────
function calcBmi(a: Answers): { bmiPoints: number; bmi: number; bmiBox?: { name: string; tracks: TrackKey[] } } {
  const h = Number(a['q2']) || 0
  const w = Number(a['q3']) || 0
  if (!h || !w) return { bmiPoints: 0, bmi: 0 }
  const bmi = w / ((h / 100) ** 2)
  const bmiRounded = Math.round(bmi * 10) / 10
  let bmiPoints = 0
  let bmiBox: { name: string; tracks: TrackKey[] } | undefined
  if (bmi >= 18.5 && bmi <= 24.9) { bmiPoints = 4 }
  else if (bmi >= 25 && bmi <= 27.9) { bmiPoints = 3 }
  else if (bmi >= 28 && bmi <= 30) { bmiPoints = 2 }
  else if (bmi > 30) {
    bmiPoints = 1
    bmiBox = { name: 'وزن مرتفع', tracks: ['ayad', 'iltihab'] }
  } else {
    // < 18.5
    bmiPoints = 1
    bmiBox = { name: 'وزن منخفض', tracks: ['aman'] }
  }
  return { bmiPoints, bmi: bmiRounded, bmiBox }
}

// ── Per-question scoring ────────────────────────────────────────────────────

function scoreQ1(a: Answers): QResult {
  const map: Record<string, number> = { under25: 3, '25to30': 3, '31to35': 2, '36to40': 1, '41to45': 0, over40: 0, over45: 0 }
  return { earned: map[getStr(a, 'q1')] ?? 0, weight: 3, tracks: [] }
}

function scoreQ4(a: Answers): QResult {
  const q4 = getArr(a, 'q4')
  let earned = 3
  let boxName: string | undefined
  if (!q4.includes('none')) {
    const count = q4.filter(v => v !== 'none').length
    const hasKeto = q4.some(v => ['keto', 'vegan', 'carnivore'].includes(v))
    if (count >= 3) { earned = 0; boxName = '3 أنظمة غذائية أو أكثر' }
    else if (hasKeto) { earned = 1; boxName = 'كيتو / نباتي كامل' }
    else if (q4.some(v => ['if', 'lowcarb'].includes(v))) { earned = 2 }
    else earned = 2
  }
  return {
    earned, weight: 3, tracks: ['aman'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['aman'] } } : {}),
  }
}

function scoreQ5(a: Answers): QResult {
  const map: Record<string, number> = { no: 4, sometimes: 2, always: 0, dontknow: 1 }
  const earned = map[getStr(a, 'q5')] ?? 0
  return {
    earned, weight: 4, tracks: ['aman'],
    ...(earned < 2 ? { box: { name: 'تقليص حاد للنشويات', tracks: ['aman'] } } : {}),
  }
}

function scoreQ6(a: Answers): QResult {
  const map: Record<string, number> = { no: 3, sometimes: 2, avoid: 1, dontknow: 1 }
  const earned = map[getStr(a, 'q6')] ?? 0
  return {
    earned, weight: 3, tracks: ['binaa'],
    ...(earned < 1.5 ? { box: { name: 'حذف الحليب كلياً', tracks: ['binaa'] } } : {}),
  }
}

function scoreQ9(a: Answers): QResult {
  const map: Record<string, number> = { noticeAvoid: 3, noticeIgnore: 2, noNotice: 1, neverRead: 0 }
  const earned = map[getStr(a, 'q9')] ?? 0
  return {
    earned, weight: 3, tracks: ['muatilat'],
    ...(earned < 1.5 ? { box: { name: 'لا تقرأ مكونات الطعام', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ10(a: Answers): QResult {
  const map: Record<string, number> = { threeplus: 4, two: 3, one: 1, none: 0 }
  const earned = map[getStr(a, 'q10')] ?? 0
  return {
    earned, weight: 4, tracks: ['iltihab'],
    ...(earned < 2 ? { box: { name: 'خضار منخفضة جداً', tracks: ['iltihab'] } } : {}),
  }
}

function scoreQ11(a: Answers): QResult {
  const map: Record<string, number> = { two: 3, one: 2, threeplus: 2, none: 0 }
  const earned = map[getStr(a, 'q11')] ?? 0
  return {
    earned, weight: 3, tracks: ['iltihab'],
    ...(earned < 1.5 ? { box: { name: 'فاكهة منخفضة جداً', tracks: ['iltihab'] } } : {}),
  }
}

function scoreQ12(a: Answers): QResult {
  const map: Record<string, number> = { knowApply: 3, knowNoApply: 2, dontknow: 1, neverThought: 0 }
  const earned = map[getStr(a, 'q12')] ?? 0
  return {
    earned, weight: 3, tracks: ['binaa'],
    ...(earned < 1.5 ? { box: { name: 'لا تعرف احتياج البروتين', tracks: ['binaa'] } } : {}),
  }
}

function scoreQ13(a: Answers): QResult {
  const map: Record<string, number> = { never: 2, sometimes: 1, regularly: 0 }
  const earned = map[getStr(a, 'q13')] ?? 0
  return {
    earned, weight: 2, tracks: ['binaa'],
    ...(earned < 1 ? { box: { name: 'بروتين باودر يومياً', tracks: ['binaa'] } } : {}),
  }
}

function scoreQ15(a: Answers): QResult {
  const q15 = getArr(a, 'q15')
  let earned = 4
  let boxName: string | undefined
  if (!q15.includes('none')) {
    if (q15.includes('crash') && q15.includes('longFast')) { earned = 0; boxName = 'كراش دايت وصيام طويل' }
    else if (q15.includes('crash')) { earned = 0; boxName = 'كراش دايت' }
    else if (q15.includes('longFast')) { earned = 0; boxName = 'صيام طويل' }
    else if (q15.includes('skipMeal')) { earned = 1; boxName = 'حذف وجبة كاملة' }
    else if (q15.includes('skipBreakfast')) { earned = 2 }
    else earned = 4
  }
  return {
    earned, weight: 4, tracks: ['aman'],
    ...(earned < 2 && boxName ? { box: { name: boxName, tracks: ['aman'] } } : {}),
  }
}

function scoreQ16(a: Answers): QResult {
  const q16 = getArr(a, 'q16')
  let earned = 4
  let boxName: string | undefined
  if (!q16.includes('none') && q16.length > 0) {
    if (q16.includes('ozempic') || q16.includes('otherDrugs')) { earned = 0; boxName = 'أدوية حقن إنقاص الوزن' }
    else if (q16.includes('saxenda') || q16.includes('mounjaro')) { earned = 1; boxName = 'حقن إنقاص الوزن' }
    else if (q16.includes('surgery')) { earned = 1; boxName = 'تكميم / ربط معدة' }
    else earned = 4
  }
  return {
    earned, weight: 4, tracks: ['ayad'],
    ...(earned < 2 && boxName ? { box: { name: boxName, tracks: ['ayad'] } } : {}),
  }
}

function scoreQ17(a: Answers): QResult {
  const q17 = getArr(a, 'q17')
  let earned = 4
  let boxName: string | undefined
  if (q17.includes('aspartame')) { earned = 0; boxName = 'محليات صناعية (أسبارتام)' }
  else if (q17.includes('sucralose')) { earned = 1; boxName = 'محليات صناعية (سكرالوز)' }
  else if (q17.includes('stevia')) { earned = 2 }
  else if (q17.includes('sugar')) { earned = 2 }
  else if (q17.includes('honey')) { earned = 3 }
  // else none → 4
  return {
    earned, weight: 4, tracks: ['iltihab'],
    ...(earned < 2 && boxName ? { box: { name: boxName, tracks: ['iltihab'] } } : {}),
  }
}

function scoreQRestaurant(a: Answers): QResult {
  const map: Record<string, number> = { rarely: 4, onceTwice: 3, threeFour: 1, fivePlus: 0, everyday: 0 }
  const earned = map[getStr(a, 'qRestaurant')] ?? 0
  return {
    earned, weight: 4, tracks: ['ayad', 'iltihab'],
    ...(earned < 2 ? { box: { name: 'مطاعم كثيرة أسبوعياً', tracks: ['ayad', 'iltihab'] } } : {}),
  }
}

function scoreQSnacksFreq(a: Answers): QResult {
  const map: Record<string, number> = { never: 3, once: 3, twice: 2, threePlus: 0, insteadOfMeals: 0 }
  const earned = map[getStr(a, 'qSnacksFreq')] ?? 0
  return {
    earned, weight: 3, tracks: ['ayad'],
    ...(earned < 1.5 ? { box: { name: 'سناكات متكررة بدل وجبات', tracks: ['ayad'] } } : {}),
  }
}

function scoreQSnackType(a: Answers): QResult {
  const st = getArr(a, 'qSnackType')
  const unhealthy = ['chips', 'chocolate', 'biscuit']
  const healthy = ['nuts', 'fruit', 'yogurt']
  let earned = 3
  let boxName: string | undefined
  if (st.includes('noSnacks') || st.length === 0) { earned = 3 }
  else if (st.every(v => healthy.includes(v))) { earned = 3 }
  else if (st.some(v => unhealthy.includes(v)) && st.some(v => healthy.includes(v))) { earned = 1 }
  else if (st.some(v => unhealthy.includes(v))) { earned = 0; boxName = 'سناكات غير صحية فقط' }
  return {
    earned, weight: 3, tracks: ['ayad'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['ayad'] } } : {}),
  }
}

function scoreQBreakfast(a: Answers): QResult {
  const map: Record<string, number> = { yesHome: 4, sometimes: 2, onTheGo: 1, never: 0 }
  const earned = map[getStr(a, 'qBreakfast')] ?? 0
  return {
    earned, weight: 4, tracks: ['aman'],
    ...(earned < 2 ? { box: { name: 'حذف الفطور دائماً', tracks: ['aman'] } } : {}),
  }
}

function scoreQWorkMeal(a: Answers): QResult {
  const map: Record<string, number> = { homePrepared: 3, delivery: 2, whatever: 1, skipLunch: 0, snacksOnly: 0 }
  const earned = map[getStr(a, 'qWorkMeal')] ?? 0
  return {
    earned, weight: 3, tracks: ['ayad'],
    ...(earned < 1.5 ? { box: { name: 'وجبات عمل غير منظمة', tracks: ['ayad'] } } : {}),
  }
}

function scoreQSocialFreq(a: Answers): QResult {
  const map: Record<string, number> = { rarely: 2, monthly: 2, onceTwiceWeek: 1, threePlusWeek: 0, daily: 0 }
  const earned = map[getStr(a, 'qSocialFreq')] ?? 0
  return {
    earned, weight: 2, tracks: ['ayad'],
    ...(earned < 1 ? { box: { name: 'تجمعات أكل يومية أو شبه يومية', tracks: ['ayad'] } } : {}),
  }
}

function scoreQSocialFood(a: Answers): QResult {
  const sf = getArr(a, 'qSocialFood')
  let earned = 2
  let boxName: string | undefined
  if (sf.includes('sweets') || sf.includes('takeout')) { earned = 0; boxName = 'حلويات ومطاعم في التجمعات' }
  else if (sf.includes('fried')) { earned = 1 }
  else earned = 2
  return {
    earned, weight: 2, tracks: ['ayad'],
    ...(earned < 1 && boxName ? { box: { name: boxName, tracks: ['ayad'] } } : {}),
  }
}

function scoreQSweetsRelation(a: Answers): QResult {
  const map: Record<string, number> = { dontLike: 4, sometimes: 3, craveContinuously: 1, soothingCraving: 0 }
  const earned = map[getStr(a, 'qSweetsRelation')] ?? 0
  return {
    earned, weight: 4, tracks: ['ayad'],
    ...(earned < 2 ? { box: { name: 'شهوة حلويات مستمرة / عاطفية', tracks: ['ayad'] } } : {}),
  }
}

function scoreQSweetsAwareness(a: Answers): QResult {
  // Weight 0 — no contribution to score or tracks
  void a
  return { earned: 0, weight: 0, tracks: [] }
}

function scoreQ18(a: Answers): QResult {
  const map: Record<string, number> = { '1to2': 3, '3to5': 2, none: 1, '6plus': 0 }
  const earned = map[getStr(a, 'q18')] ?? 0
  return {
    earned, weight: 3, tracks: ['binaa'],
    ...(earned < 1.5 ? { box: { name: '6 مكملات أو أكثر بدون إشراف', tracks: ['binaa'] } } : {}),
  }
}

function scoreQ19(a: Answers): QResult {
  const q19 = getArr(a, 'q19')
  const hasVitD = q19.includes('vitD')
  const hasFolic = q19.includes('folic')
  const hasOmega = q19.includes('omega3')
  const keyCount = [hasVitD, hasFolic, hasOmega].filter(Boolean).length
  let earned = 1
  if (keyCount === 3) earned = 4
  else if (keyCount === 2) earned = 3
  else if (keyCount === 1) earned = 2
  else if (q19.includes('none') || q19.length === 0) earned = 1
  else earned = 1
  return {
    earned, weight: 4, tracks: ['binaa'],
    ...(earned < 2 ? { box: { name: 'نقص مكملات خصوبة أساسية', tracks: ['binaa'] } } : {}),
  }
}

function scoreQ20(a: Answers): QResult {
  const q20 = getArr(a, 'q20')
  if (q20.includes('none') || q20.length === 0) {
    return { earned: 4, weight: 4, tracks: ['binaa'] }
  }
  const estrogenHerbs = ['licorice', 'redClover', 'kafMaryam', 'fenugreek', 'fennel', 'anise', 'sage']
  const noFertilityHerbs = ['vitex', 'maca', 'ashwagandha', 'qustHindi', 'eveningPrimrose', 'turmeric', 'cinnamon']
  const safeHerbs = ['ginger', 'blackSeed', 'chamomile']
  const allHerbs = [...estrogenHerbs, ...noFertilityHerbs, ...safeHerbs]
  const herbCount = q20.filter(v => allHerbs.includes(v)).length
  const hasEstrogen = q20.some(v => estrogenHerbs.includes(v))
  const hasNoFertility = q20.some(v => noFertilityHerbs.includes(v))

  if (herbCount >= 3) {
    return {
      earned: 0, weight: 4, tracks: ['binaa'],
      box: { name: '3 أعشاب أو أكثر معاً', tracks: ['binaa'] },
    }
  }
  if (hasEstrogen) {
    const herbName = q20.find(v => estrogenHerbs.includes(v)) ?? ''
    const herbLabels: Record<string, string> = {
      licorice: 'عرق السوس', redClover: 'برسيم أحمر', kafMaryam: 'كف مريم',
      fenugreek: 'الحلبة', fennel: 'الشبث', anise: 'اليانسون', sage: 'المريمية',
    }
    return {
      earned: 1, weight: 4, tracks: ['binaa'],
      box: { name: `عشبة شبيهة بالإستروجين (${herbLabels[herbName] ?? herbName})`, tracks: ['muatilat'] },
    }
  }
  if (hasNoFertility) return { earned: 2, weight: 4, tracks: ['binaa'] }
  return { earned: 3, weight: 4, tracks: ['binaa'] }
}

function scoreQ21(a: Answers): QResult {
  const map: Record<string, number> = { doctor: 3, articles: 2, friendFamily: 1, socialMedia: 0, dontknow: 0 }
  const earned = map[getStr(a, 'q21')] ?? 0
  return {
    earned, weight: 3, tracks: ['binaa'],
    ...(earned < 1.5 ? { box: { name: 'مصدر مكملات غير موثوق', tracks: ['binaa'] } } : {}),
  }
}

function scoreQ22(a: Answers): QResult {
  const map: Record<string, number> = { '7to8': 5, over8: 4, '6to7': 3, '5to6': 1, under5: 0 }
  const earned = map[getStr(a, 'q22')] ?? 0
  return {
    earned, weight: 5, tracks: ['aman'],
    ...(earned < 2.5 ? { box: { name: 'نوم قليل (أقل من 6 ساعات)', tracks: ['aman'] } } : {}),
  }
}

function scoreQSleepTime(a: Answers): QResult {
  const map: Record<string, number> = { before10pm: 5, '10pmTo12': 4, '12to2am': 1, after2am: 0, irregular: 0 }
  const earned = map[getStr(a, 'qSleepTime')] ?? 0
  return {
    earned, weight: 5, tracks: ['aman'],
    ...(earned < 2.5 ? { box: { name: 'نوم متأخر أو غير منتظم', tracks: ['aman'] } } : {}),
  }
}

function scoreQ23(a: Answers): QResult {
  const map: Record<string, number> = { never: 4, sometimes: 3, usually: 1, always: 0 }
  const earned = map[getStr(a, 'q23')] ?? 0
  return {
    earned, weight: 4, tracks: ['aman'],
    ...(earned < 2 ? { box: { name: 'صحيان ليلي متكرر', tracks: ['aman'] } } : {}),
  }
}

function scoreQ24(a: Answers): QResult {
  const map: Record<string, number> = { calm: 5, mild: 4, clear: 2, severe: 0 }
  const earned = map[getStr(a, 'q24')] ?? 0
  return {
    earned, weight: 5, tracks: ['aman'],
    ...(earned < 2.5 ? { box: { name: 'توتر شديد ومستمر', tracks: ['aman'] } } : {}),
  }
}

function scoreQ25(a: Answers): QResult {
  const q25 = getArr(a, 'q25')
  const hasTalk = q25.includes('talk')
  const hasWalk = q25.includes('walk')
  const hasBad = q25.some(v => ['eat', 'cry', 'nothing'].includes(v))
  let earned = 1
  let boxName: string | undefined
  if (hasTalk && hasWalk) earned = 3
  else if (hasTalk || hasWalk) earned = 2
  else if (hasBad) { earned = 0; boxName = 'استجابة توتر غير صحية (أكل / كبت)' }
  else earned = 1
  return {
    earned, weight: 3, tracks: ['aman'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['aman'] } } : {}),
  }
}

function scoreQ26(a: Answers): QResult {
  const map: Record<string, number> = { no: 3, sometimes: 2, usually: 1, always: 0 }
  const earned = map[getStr(a, 'q26')] ?? 0
  return {
    earned, weight: 3, tracks: ['aman'],
    ...(earned < 1.5 ? { box: { name: 'شاشات حتى لحظة النوم', tracks: ['aman'] } } : {}),
  }
}

function scoreQ27(a: Answers): QResult {
  // q27 is in AMAN for denominator, but "never" box appears in AYAD
  const map: Record<string, number> = { '2to3': 4, '4to5': 3, onceOrLess: 2, '6to7': 1, never: 0 }
  const v = getStr(a, 'q27')
  const earned = map[v] ?? 0
  let box: { name: string; tracks: TrackKey[] } | undefined
  if (v === '6to7') box = { name: 'تمرين 6-7 مرات أسبوعياً', tracks: ['aman'] }
  else if (v === 'never') box = { name: 'لا تمرين', tracks: ['ayad'] }
  else if (earned < 2) box = { name: 'تمرين نادر', tracks: ['aman'] }
  return { earned, weight: 4, tracks: ['aman'], ...(box ? { box } : {}) }
}

function scoreQ28(a: Answers): QResult {
  const q28 = getArr(a, 'q28')
  const gentle = ['walking', 'yoga', 'swimming', 'weights']
  const moderate = ['running', 'dance']
  const hasGentle = q28.some(v => gentle.includes(v))
  const hasModerate = q28.some(v => moderate.includes(v))
  const hiitOnly = q28.includes('hiit') && !hasGentle && !hasModerate
  let earned = 0
  let boxName: string | undefined
  if (q28.includes('none') || q28.length === 0) { earned = 0; boxName = 'لا نوع تمرين محدد' }
  else if (hasGentle) earned = 3
  else if (hasModerate) earned = 2
  else if (hiitOnly) { earned = 1; boxName = 'تمرين عالي الكثافة فقط' }
  return {
    earned, weight: 3, tracks: ['aman'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['aman'] } } : {}),
  }
}

function scoreQ30(a: Answers): QResult {
  const map: Record<string, number> = { yes: 3, heard: 2, no: 1, neverThought: 0 }
  const earned = map[getStr(a, 'q30')] ?? 0
  return {
    earned, weight: 3, tracks: ['iltihab'],
    ...(earned < 1.5 ? { box: { name: 'لا تعرف اختيار الزيت', tracks: ['iltihab'] } } : {}),
  }
}

function scoreQ31(a: Answers): QResult {
  const q31 = getArr(a, 'q31')
  const safe = ['steel', 'castIron', 'ceramic']
  const unsafe = ['teflon', 'aluminum']
  const hasSafe = q31.some(v => safe.includes(v))
  const hasUnsafe = q31.some(v => unsafe.includes(v))
  let earned = 1
  let boxName: string | undefined
  if (q31.includes('dontknow') && !hasSafe && !hasUnsafe) earned = 1
  else if (hasSafe && !hasUnsafe) earned = 3
  else if (hasSafe && hasUnsafe) earned = 2
  else { earned = 0; boxName = 'أواني غير آمنة (تيفلون / ألمنيوم)' }
  return {
    earned, weight: 3, tracks: ['muatilat'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ32(a: Answers): QResult {
  const map: Record<string, number> = { noSilicone: 2, someSilicone: 1, mostlySilicone: 0, dontknow: 1 }
  const earned = map[getStr(a, 'q32')] ?? 0
  return {
    earned, weight: 2, tracks: ['muatilat'],
    ...(earned < 1 ? { box: { name: 'أدوات سيليكون في الطبخ', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ33(a: Answers): QResult {
  const map: Record<string, number> = { neither: 2, parchment: 1, both: 1, aluminum: 0 }
  const earned = map[getStr(a, 'q33')] ?? 0
  return {
    earned, weight: 2, tracks: ['muatilat'],
    ...(earned < 1 ? { box: { name: 'ورق ألمنيوم في الطبخ', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ34(a: Answers): QResult {
  const map: Record<string, number> = { filtered: 3, gallon: 2, tap: 1, smallPlastic: 0 }
  const earned = map[getStr(a, 'q34')] ?? 0
  return {
    earned, weight: 3, tracks: ['muatilat'],
    ...(earned < 1.5 ? { box: { name: 'مياه زجاجات بلاستيك صغيرة', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ35(a: Answers): QResult {
  const q35 = getArr(a, 'q35')
  const hasGlass = q35.includes('glass')
  const hasUnsafe = q35.some(v => ['plastic', 'wrap'].includes(v))
  let earned = 0
  let boxName: string | undefined
  if (hasGlass && !hasUnsafe) earned = 3
  else if (hasGlass && hasUnsafe) earned = 2
  else if (q35.includes('eatFresh')) earned = 2
  else { earned = 0; boxName = 'حفظ أكل في أوعية بلاستيكية' }
  return {
    earned, weight: 3, tracks: ['muatilat'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ36(a: Answers): QResult {
  const map: Record<string, number> = { always: 2, sometimes: 1, rarely: 1, never: 0 }
  const earned = map[getStr(a, 'q36')] ?? 0
  return {
    earned, weight: 2, tracks: ['muatilat'],
    ...(earned < 1 ? { box: { name: 'لا تقرأ مكونات منتجات الجسم', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ37(a: Answers): QResult {
  const map: Record<string, number> = { always: 2, sometimes: 1, rarely: 1, never: 0 }
  const earned = map[getStr(a, 'q37')] ?? 0
  return {
    earned, weight: 2, tracks: ['muatilat'],
    ...(earned < 1 ? { box: { name: 'لا تقرأ مكونات العطور', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ38(a: Answers): QResult {
  const map: Record<string, number> = { rarely: 2, sometimes: 2, mostDays: 1, everyday: 0 }
  const earned = map[getStr(a, 'q38')] ?? 0
  return {
    earned, weight: 2, tracks: ['muatilat'],
    ...(earned < 1 ? { box: { name: 'ديودورانت يومي (ألمنيوم)', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ39(a: Answers): QResult {
  const q39 = getArr(a, 'q39')
  let earned = 1
  let boxName: string | undefined
  if (q39.includes('cup') || q39.includes('cloth')) earned = 3
  else if (q39.includes('regularUnscented')) earned = 2
  else if (q39.includes('tampon')) earned = 1
  else if (q39.includes('scented')) { earned = 0; boxName = 'فوط معطرة' }
  else earned = 1
  return {
    earned, weight: 3, tracks: ['muatilat'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ40(a: Answers): QResult {
  const map: Record<string, number> = { yes: 2, heardIssues: 1, never: 0 }
  const earned = map[getStr(a, 'q40')] ?? 0
  return {
    earned, weight: 2, tracks: ['muatilat'],
    ...(earned < 1 ? { box: { name: 'لا تعرف مكونات الفوط', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ41(a: Answers): QResult {
  const map: Record<string, number> = { cotton: 2, mixed: 1, synthetic: 0, noAttention: 1 }
  const earned = map[getStr(a, 'q41')] ?? 0
  return {
    earned, weight: 2, tracks: ['muatilat'],
    ...(earned < 1 ? { box: { name: 'ملابس صناعية (بوليستر / نايلون)', tracks: ['muatilat'] } } : {}),
  }
}

function scoreQ42(a: Answers): QResult {
  const map: Record<string, number> = { '21to35': 5, under21: 2, over35: 1, irregular: 0 }
  return { earned: map[getStr(a, 'q42')] ?? 0, weight: 5, tracks: [] }
}

function scoreQ43(a: Answers): QResult {
  const map: Record<string, number> = { normal: 4, veryLight: 2, heavy: 2, veryHeavy: 0 }
  return { earned: map[getStr(a, 'q43')] ?? 0, weight: 4, tracks: [] }
}

function scoreQ44(a: Answers): QResult {
  const map: Record<string, number> = { noneOrMild: 4, moderate: 3, severe: 1, verySevere: 0 }
  return { earned: map[getStr(a, 'q44')] ?? 0, weight: 4, tracks: [] }
}

function scoreQ45(a: Answers): QResult {
  const map: Record<string, number> = { never: 3, sometimesSmall: 2, regularlyLarge: 0 }
  return { earned: map[getStr(a, 'q45')] ?? 0, weight: 3, tracks: [] }
}

function scoreQ46(a: Answers): QResult {
  const map: Record<string, number> = { never: 3, sometimes: 1, regularly: 0 }
  return { earned: map[getStr(a, 'q46')] ?? 0, weight: 3, tracks: [] }
}

function scoreQ47(a: Answers): QResult {
  const q47 = getArr(a, 'q47')
  const symptoms = q47.filter(v => v !== 'none')
  let earned = 3
  if (symptoms.length === 0 || q47.includes('none')) earned = 3
  else if (symptoms.length <= 2) earned = 2
  else earned = 0
  return { earned, weight: 3, tracks: [] }
}

function scoreQSmoking(a: Answers): QResult {
  const q = getArr(a, 'qSmoking')
  if (q.includes('noSmoke') || q.length === 0) {
    return { earned: 5, weight: 5, tracks: ['muatilat', 'iltihab'] }
  }
  let earned = 5
  let boxName: string | undefined
  if (q.includes('cigarettes')) { earned = 0; boxName = 'تدخين سجائر' }
  else if (q.includes('vape')) { earned = 0; boxName = 'فيب / سجائر إلكترونية' }
  else if (q.includes('hookahRegular')) { earned = 0; boxName = 'شيشة بانتظام' }
  else if (q.includes('hookahOccasional')) { earned = 1; boxName = 'شيشة أحياناً' }
  else if (q.includes('passive')) { earned = 2; boxName = 'تدخين سلبي يومي' }
  return {
    earned, weight: 5, tracks: ['muatilat', 'iltihab'],
    ...(earned < 2.5 && boxName ? { box: { name: boxName, tracks: ['muatilat', 'iltihab'] } } : {}),
  }
}

function scoreQ48(a: Answers): QResult {
  const map: Record<string, number> = { none: 3, one: 3, two: 2, threePlus: 0 }
  const earned = map[getStr(a, 'q48')] ?? 0
  return {
    earned, weight: 3, tracks: ['aman'],
    ...(earned < 1.5 ? { box: { name: 'كافيين عالي (3+ أكواب يومياً)', tracks: ['aman'] } } : {}),
  }
}

function scoreQ49(a: Answers): QResult {
  const map: Record<string, number> = { never: 3, sometimes: 1, regularly: 0 }
  const earned = map[getStr(a, 'q49')] ?? 0
  return {
    earned, weight: 3, tracks: ['aman'],
    ...(earned < 1.5 ? { box: { name: 'مشروبات طاقة منتظمة', tracks: ['aman'] } } : {}),
  }
}

function scoreQ50(a: Answers): QResult {
  const map: Record<string, number> = { over2: 3, '1p5to2': 2, '1to1p5': 1, underOne: 0 }
  const earned = map[getStr(a, 'q50')] ?? 0
  return {
    earned, weight: 3, tracks: ['binaa'],
    ...(earned < 1.5 ? { box: { name: 'قلة شرب الماء', tracks: ['binaa'] } } : {}),
  }
}

function scoreQ51(a: Answers): QResult {
  const q51 = getArr(a, 'q51')
  const healthy = ['grill', 'steam', 'boil', 'airFryer']
  const unhealthy = ['deepFry', 'fryOil']
  const hasHealthy = q51.some(v => healthy.includes(v))
  const hasUnhealthy = q51.some(v => unhealthy.includes(v))
  let earned = 0
  let boxName: string | undefined
  if (hasHealthy && !hasUnhealthy) earned = 3
  else if (hasHealthy && hasUnhealthy) earned = 2
  else { earned = 0; boxName = 'قلي كطريقة طبخ أساسية' }
  return {
    earned, weight: 3, tracks: ['iltihab'],
    ...(earned < 1.5 && boxName ? { box: { name: boxName, tracks: ['iltihab'] } } : {}),
  }
}

function scoreQ52(a: Answers): QResult {
  const q52 = getArr(a, 'q52')
  const trusted = ['doctor', 'trustedSites']
  const bad = ['social', 'whatsapp', 'friends', 'noResearch']
  const hasTrusted = q52.some(v => trusted.includes(v))
  const hasBad = q52.some(v => bad.includes(v))
  let earned = 0
  if (hasTrusted && !hasBad) earned = 3
  else if (hasTrusted && hasBad) earned = 2
  else earned = 0
  return { earned, weight: 3, tracks: [] }
}

function scoreQ53(a: Answers): QResult {
  const q53 = getArr(a, 'q53')
  const symptoms = q53.filter(v => v !== 'none')
  let earned = 5
  if (q53.includes('none') || symptoms.length === 0) earned = 5
  else if (symptoms.length <= 2) earned = 3
  else earned = 0
  return { earned, weight: 5, tracks: [] }
}

function scoreQ54(a: Answers): QResult {
  const map: Record<string, number> = { yesNormal: 4, yesIssues: 2, notDone: 1, refused: 0 }
  return { earned: map[getStr(a, 'q54')] ?? 0, weight: 4, tracks: [] }
}

function scoreQ55(a: Answers): QResult {
  const map: Record<string, number> = { knowApply: 2, heardNoApply: 1, dontknow: 0 }
  return { earned: map[getStr(a, 'q55')] ?? 0, weight: 2, tracks: [] }
}

function scoreQ56(a: Answers): QResult {
  const map: Record<string, number> = { yesDoctor: 2, yesSelf: 1, none: 1, neverThought: 0 }
  return { earned: map[getStr(a, 'q56')] ?? 0, weight: 2, tracks: [] }
}

function scoreQ57(a: Answers): QResult {
  const map: Record<string, number> = { healthy: 2, acceptable: 1, unhealthy: 0, dontknow: 1 }
  return { earned: map[getStr(a, 'q57')] ?? 0, weight: 2, tracks: [] }
}

// ── Medical box items ──────────────────────────────────────────────────────
function getMedicalBoxItems(a: Answers): string[] {
  const items: string[] = []
  const q42 = getStr(a, 'q42')
  if (q42 === 'under21') items.push('دورة شهرية قصيرة (أقل من 21 يوماً)')
  if (q42 === 'over35') items.push('دورة شهرية طويلة (أكثر من 35 يوماً)')
  if (q42 === 'irregular') items.push('دورة شهرية غير منتظمة')
  const q43 = getStr(a, 'q43')
  if (q43 === 'veryLight') items.push('نزيف خفيف جداً')
  if (q43 === 'veryHeavy') items.push('نزيف غزير جداً')
  const q44 = getStr(a, 'q44')
  if (q44 === 'severe') items.push('ألم شديد في الدورة')
  if (q44 === 'verySevere') items.push('ألم يمنع الحركة — يستدعي تقييماً')
  if (getStr(a, 'q45') === 'regularlyLarge') items.push('تجلطات كبيرة ومنتظمة')
  if (getStr(a, 'q46') === 'regularly') items.push('نزيف بين الدورتين')
  const q47symptoms = getArr(a, 'q47').filter(v => v !== 'none')
  const symptomLabels: Record<string, string> = {
    bloating: 'انتفاخ شديد قبل الدورة', moodSwings: 'تقلبات مزاجية حادة',
    sugarCravings: 'شهوة سكر قبل الدورة', headache: 'صداع متكرر', breastPain: 'ألم الثدي',
  }
  if (q47symptoms.length >= 3) items.push(`أعراض PMS متعددة: ${q47symptoms.slice(0, 3).map(s => symptomLabels[s] ?? s).join('، ')}`)
  const thyroidSymptoms = getArr(a, 'q53').filter(v => v !== 'none')
  const thyroidLabels: Record<string, string> = {
    hairLoss: 'تساقط شعر', fatigue: 'إرهاق شديد', coldHands: 'برود في الأطراف',
    constipation: 'إمساك مزمن', fogBrain: 'ضباب ذهني', weightGain: 'زيادة وزن بدون سبب',
  }
  if (thyroidSymptoms.length >= 3) items.push(`أعراض الغدة الدرقية: ${thyroidSymptoms.slice(0, 3).map(s => thyroidLabels[s] ?? s).join('، ')}`)
  else if (thyroidSymptoms.length > 0) items.push(`أعراض محتملة للغدة الدرقية: ${thyroidSymptoms.map(s => thyroidLabels[s] ?? s).join('، ')}`)
  return items
}

// ── Male factor variant ────────────────────────────────────────────────────
function getMaleFactorVariant(a: Answers): 'a' | 'b' | 'c' | null {
  const marital = getStr(a, 'qMaritalStatus')
  if (marital !== 'married') return null
  const q54 = getStr(a, 'q54')
  const q57 = getStr(a, 'q57')
  if (q54 === 'refused') return 'c'
  if (q54 === 'yesIssues' || q57 === 'unhealthy') return 'b'
  if (q54 === 'notDone') return 'a'
  return 'a' // yesNormal with no issues
}

// ── Age category ──────────────────────────────────────────────────────────
function getAgeCategory(a: Answers): 'a' | 'b' | 'c' | 'd' {
  const q1 = getStr(a, 'q1')
  if (['under25', '25to30'].includes(q1)) return 'a'
  if (q1 === '31to35') return 'b'
  if (q1 === '36to40') return 'c'
  return 'd' // 41to45 or over45
}

// ── Table intro text ───────────────────────────────────────────────────────
function buildTableIntroText(topTrack: TrackKey | null, secondTrack: TrackKey | null, intersectionPoint: string): string {
  if (!topTrack) return 'صورتكِ متوازنة عبر المسارات الخمسة.'
  const topInfo = TRACK_INFO[topTrack]
  const secondInfo = secondTrack ? TRACK_INFO[secondTrack] : null
  const introByTrack: Record<TrackKey, string> = {
    aman: `مسار الأمان هو الأعلى تأثيراً لديكِ — وهو يؤثر على الخصوبة عبر ${topInfo.howItEnters}. حين يتلقى جسمكِ إشارات إجهاد متكررة، الدماغ يؤجل قرار التبويض لأن الأولوية تكون للبقاء.`,
    ayad: `مسار الأيض هو الأعلى تأثيراً لديكِ — وهو يؤثر على الخصوبة عبر ${topInfo.howItEnters}. ما تأكلينه يُترجم مباشرةً إلى إشارات يرسلها الإنسولين للمبيض، وهذه الإشارات تُحدد متى وكيف يحدث التبويض.`,
    muatilat: `مسار المعطلات الهرمونية هو الأعلى تأثيراً لديكِ — وهو يؤثر على الخصوبة عبر ${topInfo.howItEnters}. التعرض للمواد الكيميائية من الطعام والمنتجات يشوش الإشارات الهرمونية بين الدماغ والمبيض.`,
    iltihab: `مسار الالتهاب هو الأعلى تأثيراً لديكِ — وهو يؤثر على الخصوبة عبر ${topInfo.howItEnters}. الالتهاب المزمن يضر بجودة البويضة وبيئة الرحم قبل أن تحسي به مباشرةً.`,
    binaa: `مسار البناء هو الأعلى تأثيراً لديكِ — وهو يؤثر على الخصوبة عبر ${topInfo.howItEnters}. الجسم يحتاج المواد الخام الصحيحة لبناء الهرمونات، وغيابها يقلل كفاءة المبيض تدريجياً.`,
  }
  let text = introByTrack[topTrack]
  if (secondInfo) {
    text += ` التقاطع مع مسار ${secondInfo.label} يجعل ${intersectionPoint} المحور الأكثر تأثراً لديكِ الآن.`
  }
  return text
}

// ── Staff triggered sentences ──────────────────────────────────────────────
function getTriggeredSentences(a: Answers, bmi: number): string[] {
  const triggered: string[] = []
  const str = (id: string) => getStr(a, id)
  const arr = (id: string) => getArr(a, id)

  if (bmi > 0) {
    if (bmi < 18.5) triggered.push(`BMI: ${bmi} — نقص وزن. انخفاض الوزن يُرسل إشارة للدماغ بأن الجسم ليس في وضع آمن للحمل، فيقلص إنتاج هرمونات التبويض.`)
    else if (bmi <= 24.9) triggered.push(`BMI: ${bmi} — وزن طبيعي ✅. الوزن الطبيعي وحده لا يعني غياب كل العوامل المؤثرة على الخصوبة.`)
    else if (bmi <= 29.9) triggered.push(`BMI: ${bmi} — وزن زائد. يؤثر مباشرةً على مستوى الإستروجين لأن الخلايا الدهنية تنتج إستروجيناً يخل بالتوازن الهرموني.`)
    else triggered.push(`BMI: ${bmi} — سمنة. تؤثر بشكل حاد على التوازن الهرموني — الإستروجين المرتفع يعطل إشارات التبويض.`)
  }

  const q4 = arr('q4').filter(v => v !== 'none')
  if (q4.length >= 3) triggered.push(`جربت ${q4.length} أنظمة غذائية — التنقل بينها يرهق جسمكِ هرمونياً ويضرب استقرار محور الدماغ والمبيض.`)
  if (str('q5') === 'always') triggered.push(`تتجنب النشويات دائماً — يخفض هرمون اللبتين الذي يخبر الدماغ بأن الجسم جاهز للإنجاب.`)
  if (str('q6') === 'avoid') triggered.push(`تتجنب الحليب كلياً — يؤدي لنقص في الكالسيوم وفيتامين D، وكلاهما ضروريان لجودة البويضة.`)
  if (str('q9') === 'neverRead') triggered.push(`لا تقرأ مكونات الطعام — النكهات المضافة والمواد الحافظة تعمل كمعطلات هرمونية.`)
  if (str('q10') === 'none') triggered.push(`لا تأكل خضاراً تقريباً — الخضار مصدر الألياف التي تساعد الكبد على التخلص من الإستروجين الزائد.`)
  if (str('q11') === 'none') triggered.push(`لا تأكل فاكهة تقريباً — تحتوي على مضادات أكسدة ضرورية لحماية البويضة.`)
  if (['dontknow', 'neverThought'].includes(str('q12'))) triggered.push(`لا تعرف احتياجها من البروتين — البروتين اللبنة الأساسية لبناء الهرمونات.`)
  const q15 = arr('q15')
  if (q15.includes('crash') || q15.includes('longFast')) triggered.push(`كراش دايت / صيام طويل — يرفع الكورتيزول الذي يأمر الجسم بتأجيل التبويض.`)
  const q16 = arr('q16')
  if (!q16.includes('none') && q16.length > 0) triggered.push(`استخدمت حقن / أدوية إنقاص الوزن — تؤثر على هرمون GLP-1 المرتبط بمحور الإنسولين والتبويض.`)
  const q17 = arr('q17')
  if (q17.includes('aspartame') || q17.includes('sucralose')) triggered.push(`محليات صناعية — تؤثر على بكتيريا الأمعاء التي تنظم الإستروجين.`)
  if (['fivePlus', 'everyday'].includes(str('qRestaurant'))) triggered.push(`مطاعم 5+ مرات بالأسبوع — تعرض يومي للدهون المتحولة والمواد الحافظة تغذي الالتهاب.`)
  if (str('qSnacksFreq') === 'insteadOfMeals') triggered.push(`سناكات بدل وجبات — يخلق تذبذباً مستمراً في سكر الدم يرهق الإنسولين.`)
  if (str('qBreakfast') === 'never') triggered.push(`لا تأكل فطوراً أبداً — يرفع الكورتيزول صباحاً ويزيد مقاومة الإنسولين.`)
  if (str('qSweetsRelation') === 'soothingCraving') triggered.push(`تأكل الحلويات للتهدئة — كورتيزول مرتفع يطلب سكراً، والسكر يرفع الإنسولين، والإنسولين يضرب التبويض.`)
  if (str('q18') === '6plus') triggered.push(`6 مكملات أو أكثر يومياً — قد يسبب تعارضاً في الامتصاص.`)
  const q19 = arr('q19')
  if (!q19.includes('vitD') && !q19.includes('folic')) triggered.push(`لا تأخذ فيتامين D ولا فوليك أسيد — هما الأساس العلمي لدعم الخصوبة.`)
  if (str('q22') === 'under5') triggered.push(`أقل من 5 ساعات نوم — يقطع إنتاج هرمون النمو والميلاتونين اللازمين لإصلاح الخلايا التناسلية.`)
  if (['12to2am', 'after2am', 'irregular'].includes(str('qSleepTime'))) triggered.push(`نوم متأخر أو غير منتظم — يعطل الميلاتونين الذي يحمي البويضة من الإجهاد التأكسدي.`)
  if (['usually', 'always'].includes(str('q23'))) triggered.push(`صحيان ليلي متكرر — يمنع الجسم من الوصول لمراحل النوم العميق التي تُصلح الاختلالات الهرمونية.`)
  if (str('q24') === 'severe') triggered.push(`توتر شديد مستمر — الكورتيزول المرتفع يسرق المواد الخام لصنع هرمونات الخصوبة.`)
  if (str('q27') === 'never') triggered.push(`لا تتمرن أبداً — يضعف حساسية الإنسولين ويقلل تدفق الدم للرحم والمبيض.`)
  if (str('q27') === '6to7') triggered.push(`تمرين 6-7 مرات بالأسبوع — التمرين المكثف يرفع الكورتيزول وقد يوقف التبويض.`)
  const q28 = arr('q28')
  if (q28.includes('hiit') && !q28.some(v => ['walking', 'yoga', 'swimming', 'weights'].includes(v))) {
    triggered.push(`تمرين HIIT فقط — يرفع الكورتيزول بشكل متكرر. تحتاج توازناً مع تمارين هادئة.`)
  }
  if (['no', 'neverThought'].includes(str('q30'))) triggered.push(`لا تعرف اختيار الزيت المناسب — الزيت المحروق ينتج مركبات التهابية تؤثر على جودة البويضة.`)
  if (str('q34') === 'smallPlastic') triggered.push(`مياه زجاجات بلاستيك صغيرة — تطلق BPA وBPS عند الحرارة، وهي من أقوى المعطلات الهرمونية.`)
  if (['no', 'neverThought'].includes(str('q42'))) {/* skip */ }
  const q42 = str('q42')
  if (q42 === 'under21') triggered.push(`دورة أقل من 21 يوماً — مرحلة الجسم الأصفر غير كافية، البيضة لا تحظى بوقت كافٍ للنضج.`)
  if (q42 === 'over35') triggered.push(`دورة أكثر من 35 يوماً — يعكس تأخراً في التبويض أو غيابه.`)
  if (q42 === 'irregular') triggered.push(`دورة غير منتظمة — اضطراب في محور الهرمونات بين الدماغ والمبيض.`)
  if (str('q44') === 'verySevere') triggered.push(`ألم يمنع الحركة — يستدعي تقييماً عاجلاً. مرتبط ببطانة الرحم المهاجرة.`)
  const thyroidSymptoms = arr('q53').filter(v => v !== 'none')
  if (thyroidSymptoms.length >= 3) triggered.push(`${thyroidSymptoms.length} أعراض غدة درقية — احتمال خلل في الغدة التي تتحكم في كل العمليات الهرمونية.`)
  const qSmoking = arr('qSmoking')
  if (!qSmoking.includes('noSmoke') && qSmoking.length > 0) triggered.push(`تدخين / تعرض للدخان — يؤثر مباشرةً على جودة البويضة والبيئة الهرمونية.`)
  if (str('q54') === 'refused') triggered.push(`زوجها رفض تحليل السائل المنوي — يجعل أي خطة علاجية ناقصة.`)
  if (str('q54') === 'notDone') triggered.push(`زوجها لم يُجرِ تحليل السائل المنوي — 40% من حالات تأخر الحمل سببها عامل الذكورة.`)
  if (str('q57') === 'unhealthy') triggered.push(`نمط حياة الزوج غير صحي — جودة الحيوانات المنوية تتأثر مباشرةً.`)

  return triggered
}

// ── Main export ────────────────────────────────────────────────────────────
export function calculateScore(answers: Answers): ScoreResult {
  const maritalStatus = (getStr(answers, 'qMaritalStatus') || 'single') as 'married' | 'engaged' | 'single'
  const isMarried = maritalStatus === 'married'
  const { bmiPoints, bmi, bmiBox } = calcBmi(answers)

  // Collect all question results
  const qResults: Array<{ id: string; result: QResult }> = [
    { id: 'q1', result: scoreQ1(answers) },
    { id: 'bmi', result: { earned: bmiPoints, weight: 4, tracks: [], ...(bmiBox ? { box: bmiBox } : {}) } },
    { id: 'q4', result: scoreQ4(answers) },
    { id: 'q5', result: scoreQ5(answers) },
    { id: 'q6', result: scoreQ6(answers) },
    { id: 'q9', result: scoreQ9(answers) },
    { id: 'q10', result: scoreQ10(answers) },
    { id: 'q11', result: scoreQ11(answers) },
    { id: 'q12', result: scoreQ12(answers) },
    { id: 'q13', result: scoreQ13(answers) },
    { id: 'q15', result: scoreQ15(answers) },
    { id: 'q16', result: scoreQ16(answers) },
    { id: 'q17', result: scoreQ17(answers) },
    { id: 'qRestaurant', result: scoreQRestaurant(answers) },
    { id: 'qSnacksFreq', result: scoreQSnacksFreq(answers) },
    { id: 'qSnackType', result: scoreQSnackType(answers) },
    { id: 'qBreakfast', result: scoreQBreakfast(answers) },
    { id: 'qWorkMeal', result: scoreQWorkMeal(answers) },
    { id: 'qSocialFreq', result: scoreQSocialFreq(answers) },
    { id: 'qSocialFood', result: scoreQSocialFood(answers) },
    { id: 'qSweetsRelation', result: scoreQSweetsRelation(answers) },
    { id: 'qSweetsAwareness', result: scoreQSweetsAwareness(answers) },
    { id: 'q18', result: scoreQ18(answers) },
    { id: 'q19', result: scoreQ19(answers) },
    { id: 'q20', result: scoreQ20(answers) },
    { id: 'q21', result: scoreQ21(answers) },
    { id: 'q22', result: scoreQ22(answers) },
    { id: 'qSleepTime', result: scoreQSleepTime(answers) },
    { id: 'q23', result: scoreQ23(answers) },
    { id: 'q24', result: scoreQ24(answers) },
    { id: 'q25', result: scoreQ25(answers) },
    { id: 'q26', result: scoreQ26(answers) },
    { id: 'q27', result: scoreQ27(answers) },
    { id: 'q28', result: scoreQ28(answers) },
    { id: 'q30', result: scoreQ30(answers) },
    { id: 'q31', result: scoreQ31(answers) },
    { id: 'q32', result: scoreQ32(answers) },
    { id: 'q33', result: scoreQ33(answers) },
    { id: 'q34', result: scoreQ34(answers) },
    { id: 'q35', result: scoreQ35(answers) },
    { id: 'q36', result: scoreQ36(answers) },
    { id: 'q37', result: scoreQ37(answers) },
    { id: 'q38', result: scoreQ38(answers) },
    { id: 'q39', result: scoreQ39(answers) },
    { id: 'q40', result: scoreQ40(answers) },
    { id: 'q41', result: scoreQ41(answers) },
    { id: 'q42', result: scoreQ42(answers) },
    { id: 'q43', result: scoreQ43(answers) },
    { id: 'q44', result: scoreQ44(answers) },
    { id: 'q45', result: scoreQ45(answers) },
    { id: 'q46', result: scoreQ46(answers) },
    { id: 'q47', result: scoreQ47(answers) },
    { id: 'qSmoking', result: scoreQSmoking(answers) },
    { id: 'q48', result: scoreQ48(answers) },
    { id: 'q49', result: scoreQ49(answers) },
    { id: 'q50', result: scoreQ50(answers) },
    { id: 'q51', result: scoreQ51(answers) },
    { id: 'q52', result: scoreQ52(answers) },
    { id: 'q53', result: scoreQ53(answers) },
    ...(isMarried ? [
      { id: 'q54', result: scoreQ54(answers) },
      { id: 'q55', result: scoreQ55(answers) },
      { id: 'q56', result: scoreQ56(answers) },
      { id: 'q57', result: scoreQ57(answers) },
    ] : []),
  ]

  // Compute totals
  let totalEarned = 0, totalMax = 0
  const trackAccum: Record<TrackKey, TrackAccum> = {
    aman:     { earned: 0, max: 0, boxes: [] },
    ayad:     { earned: 0, max: 0, boxes: [] },
    muatilat: { earned: 0, max: 0, boxes: [] },
    iltihab:  { earned: 0, max: 0, boxes: [] },
    binaa:    { earned: 0, max: 0, boxes: [] },
  }

  for (const { id, result } of qResults) {
    totalEarned += result.earned
    totalMax += result.weight
    for (const t of result.tracks) {
      trackAccum[t].earned += result.earned
      trackAccum[t].max += result.weight
    }
    if (result.box) {
      const pointsLost = result.weight - result.earned
      for (const bt of result.box.tracks) {
        trackAccum[bt].boxes.push({ name: result.box.name, questionId: id, pointsLost })
      }
    }
  }

  // Build track results
  const tracks = {} as Record<TrackKey, TrackResult>
  for (const key of ['aman', 'ayad', 'muatilat', 'iltihab', 'binaa'] as TrackKey[]) {
    const acc = trackAccum[key]
    const pct = acc.max > 0 ? Math.round((acc.earned / acc.max) * 100) : 0
    const sortedBoxes = [...acc.boxes].sort((a, b) => b.pointsLost - a.pointsLost)
    tracks[key] = { earned: acc.earned, max: acc.max, pct, boxes: sortedBoxes }
  }

  // Total score
  const finalScore = Math.round(Math.max(0, Math.min(100, (totalEarned / Math.max(totalMax, 1)) * 100)))

  let scoreCategory: string, scoreCategoryAr: string
  if (finalScore >= 90) { scoreCategory = 'level1'; scoreCategoryAr = 'جسمكِ في وضع جيد - أساسكِ قوي' }
  else if (finalScore >= 70) { scoreCategory = 'level2'; scoreCategoryAr = 'فيه فجوات واضحة تؤثر على هرموناتكِ' }
  else if (finalScore >= 50) { scoreCategory = 'level3'; scoreCategoryAr = 'جسمكِ يعاني بصمت' }
  else { scoreCategory = 'level4'; scoreCategoryAr = 'إنذار مبكر - عوامل كثيرة تؤثر على خصوبتكِ' }

  // Top/second track — lowest pct first; among ties, most boxes wins
  const trackKeys: TrackKey[] = ['aman', 'ayad', 'muatilat', 'iltihab', 'binaa']
  const tracksWithBoxes = trackKeys.filter(k => tracks[k].boxes.length > 0)
  const ranked = [...tracksWithBoxes].sort((a, b) => {
    const pctDiff = tracks[a].pct - tracks[b].pct
    if (pctDiff !== 0) return pctDiff
    return tracks[b].boxes.length - tracks[a].boxes.length
  })
  const topTrack = ranked[0] ?? null
  const secondTrack = ranked[1] ?? null
  const intersectionPoint = topTrack && secondTrack
    ? (INTERSECTION[intersectionKey(topTrack, secondTrack)] ?? 'التبويض')
    : topTrack ? 'التبويض' : ''

  // Factors
  const allBoxQuestionIds = new Set(
    trackKeys.flatMap(k => tracks[k].boxes.map(b => b.questionId))
  )
  const totalFactors = allBoxQuestionIds.size
  const allBoxes = trackKeys.flatMap(k => tracks[k].boxes)
  const maxLost = Math.max(...allBoxes.map(b => b.pointsLost), 0)
  const threshold = maxLost >= 4 ? 4 : 3
  const highImpactQuestions = new Set(allBoxes.filter(b => b.pointsLost >= threshold).map(b => b.questionId))
  const highImpactFactors = highImpactQuestions.size

  const tableIntroText = buildTableIntroText(topTrack, secondTrack, intersectionPoint)
  const triggeredSentences = getTriggeredSentences(answers, bmi)
  const medicalBoxItems = getMedicalBoxItems(answers)
  const maleFactorVariant = getMaleFactorVariant(answers)
  const ageCategory = getAgeCategory(answers)

  return {
    finalScore,
    scoreCategory,
    scoreCategoryAr,
    scoreLevelText: LEVEL_TEXTS[scoreCategory],
    tracks,
    topTrack,
    secondTrack,
    intersectionPoint,
    totalFactors,
    highImpactFactors,
    ageCategory,
    maritalStatus,
    medicalBoxItems,
    maleFactorVariant,
    tableIntroText,
    triggeredSentences,
    bmi,
    sectionScores: {},
  }
}

// Legacy type alias kept for backward compat
export type SectionScores = Record<string, unknown>
export type SectionScore = { earned: number; max: number; pct: number }
