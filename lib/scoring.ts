// Deterministic fertility score calculator — new weighted percentage system.
// finalScore = (totalEarned / totalMax) × 100

export interface Answers { [questionId: string]: string | string[] | number }

export interface SectionScore { earned: number; max: number; pct: number }

export interface SectionScores {
  basicInfo: SectionScore
  diet: SectionScore
  supplements: SectionScore
  stress: SectionScore
  exercise: SectionScore
  kitchen: SectionScore
  personalCare: SectionScore
  menstrual: SectionScore
  caffeine: SectionScore
  infoSources: SectionScore
  thyroid: SectionScore
  maleFactor: SectionScore
}

export interface ScoreResult {
  finalScore: number
  scoreCategory: string
  scoreCategoryAr: string
  scoreLevelText: string
  sectionScores: SectionScores
  triggeredSentences: string[]
  bmi: number
}

export const CLOSING_LINE = 'هذه النتيجة ليست حكماً على جسمك - هي نقطة بداية.\nأنتِ الآن تعرفين أكثر مما كنتِ تعرفينه قبل 10 دقائق.\nوالخطوة التالية هي تحويل هذه المعرفة إلى خطة حقيقية مخصصة لك.'

export const LEVEL_TEXTS: Record<string, string> = {
  level1: 'نتيجتك تخبرنا أن أساسك الصحي قوي - عاداتك الغذائية ونمط حياتك يدعمان بيئة هرمونية مناسبة للخصوبة.\nهذا لا يعني أن كل شيء مثالي - لكنه يعني أنك على الطريق الصحيح.\nما تحتاجينه الآن ليس تغييراً جذرياً، بل ضبطاً دقيقاً في التفاصيل التي ستفرق في نتيجتك.',
  level2: 'نتيجتك تكشف أن جسمك يعمل - لكنه لا يعمل بكامل طاقته.\nهناك عوامل واضحة تسحب من رصيدك الهرموني يومياً دون أن تشعري بها مباشرةً.\nالفجوات التي ظهرت في نتيجتك ليست عشوائية - هي تحديداً الأماكن التي يحتاج فيها جسمك دعماً حقيقياً لتتحول من \'تعمل\' إلى \'مهيأة للحمل\'.',
  level3: 'نتيجتك تخبرنا أن جسمك يتحمل ضغطاً هرمونياً حقيقياً - وأنه يعطيك إشارات منذ فترة لكن ربما لم تكوني تعرفين كيف تقرئيها.\nما تمرين به ليس قدراً ولا حظاً - هناك أسباب واضحة تظهر في إجاباتك تشرح لماذا يصعب على جسمك الوصول للحمل.\nالخبر الجيد: كل ما يظهر في نتيجتك قابل للتغيير - لكنه يحتاج خطة واضحة وليس تجارب عشوائية.',
  level4: 'نتيجتك تكشف أن هناك عوامل متعددة تعمل ضد خصوبتك في نفس الوقت - وهذا يفسر لماذا تشعرين أنك تحاولين بدون نتيجة.\nجسمك ليس معطوباً - لكنه يعيش في بيئة لا تدعم التبويض والحمل بالشكل المطلوب.\nما تحتاجينه ليس مكملاً إضافياً أو نظاماً غذائياً جديداً - تحتاجين إعادة بناء حقيقية من الأساس، خطوة خطوة، بإشراف متخصص.',
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
function getStr(a: Answers, id: string): string { return (a[id] as string) ?? '' }
function getArr(a: Answers, id: string): string[] {
  const v = a[id]; if (!v) return []
  return Array.isArray(v) ? v : [String(v)]
}
function sec(earned: number, max: number): SectionScore {
  return { earned, max, pct: max > 0 ? Math.round((earned / max) * 100) : 0 }
}

// ── BMI ────────────────────────────────────────────────────────────────────
function calcBmi(a: Answers): { bmiPoints: number; bmi: number } {
  const h = Number(a['q2']) || 0
  const w = Number(a['q3']) || 0
  if (!h || !w) return { bmiPoints: 0, bmi: 0 }
  const bmi = w / ((h / 100) ** 2)
  let bmiPoints = 0
  if (bmi >= 18.5 && bmi <= 24.9) bmiPoints = 4
  else if (bmi >= 25 && bmi <= 27.9) bmiPoints = 3
  else if (bmi >= 28 && bmi <= 30) bmiPoints = 2
  else if (bmi > 30) bmiPoints = 1
  else bmiPoints = 1 // under 18.5
  return { bmiPoints, bmi: Math.round(bmi * 10) / 10 }
}

// ── Section 1: basicInfo (max 7) ───────────────────────────────────────────
function scoreBasicInfo(a: Answers, bmiPoints: number): number {
  const q1map: Record<string, number> = { under25: 3, '25to30': 3, '31to35': 2, '36to40': 1, over40: 0 }
  return (q1map[getStr(a, 'q1')] ?? 0) + bmiPoints
}

// ── Section 2: diet (max 64) ───────────────────────────────────────────────
function scoreDiet(a: Answers): number {
  let total = 0

  // Q4 — diets (weight 3)
  const q4 = getArr(a, 'q4')
  if (q4.includes('none')) total += 3
  else {
    const count = q4.length
    const hasIfOrLowcarb = q4.some(v => ['if','lowcarb'].includes(v))
    const hasKetoOrVegan = q4.some(v => ['keto','vegan'].includes(v))
    if (count >= 3) total += 0
    else if (hasKetoOrVegan) total += 1
    else if (hasIfOrLowcarb) total += 2
    else total += 2
  }

  // Q5 (weight 4)
  const q5m: Record<string, number> = { no: 4, sometimes: 2, always: 0, dontknow: 1 }
  total += q5m[getStr(a,'q5')] ?? 0

  // Q6 (weight 3)
  const q6m: Record<string, number> = { no: 3, sometimes: 2, avoid: 1, dontknow: 1 }
  total += q6m[getStr(a,'q6')] ?? 0

  // Q9 (weight 3)
  const q9m: Record<string, number> = { noticeAvoid: 3, noticeIgnore: 2, noNotice: 1, neverRead: 0 }
  total += q9m[getStr(a,'q9')] ?? 0

  // Q10 (weight 4)
  const q10m: Record<string, number> = { threeplus: 4, two: 3, one: 1, none: 0 }
  total += q10m[getStr(a,'q10')] ?? 0

  // Q11 (weight 3)
  const q11m: Record<string, number> = { two: 3, one: 2, threeplus: 2, none: 0 }
  total += q11m[getStr(a,'q11')] ?? 0

  // Q12 (weight 3)
  const q12m: Record<string, number> = { knowApply: 3, knowNoApply: 2, dontknow: 1, neverThought: 0 }
  total += q12m[getStr(a,'q12')] ?? 0

  // Q13 (weight 2)
  const q13m: Record<string, number> = { never: 2, sometimes: 1, regularly: 0 }
  total += q13m[getStr(a,'q13')] ?? 0

  // Q15 (weight 4, multi — worst)
  const q15 = getArr(a, 'q15')
  if (q15.includes('none')) total += 4
  else if (q15.includes('crash') || q15.includes('longFast')) total += 0
  else if (q15.includes('skipMeal')) total += 1
  else if (q15.includes('skipBreakfast')) total += 2
  else total += 4

  // Q16 (weight 4, multi — worst)
  const q16 = getArr(a, 'q16')
  if (q16.includes('none')) total += 4
  else if (q16.includes('ozempic') || q16.includes('otherDrugs')) total += 0
  else if (q16.includes('saxenda') || q16.includes('mounjaro')) total += 1
  else if (q16.includes('surgery')) total += 1
  else total += 4

  // Q17 (weight 4, multi — worst)
  const q17 = getArr(a, 'q17')
  if (q17.includes('aspartame')) total += 0
  else if (q17.includes('sucralose') || q17.includes('stevia')) total += 1
  else if (q17.includes('sugar')) total += 2
  else if (q17.includes('honey')) total += 3
  else total += 4 // none

  // qRestaurant (weight 4)
  const restMap: Record<string, number> = { rarely: 4, onceTwice: 3, threeFour: 1, fivePlus: 0, everyday: 0 }
  total += restMap[getStr(a,'qRestaurant')] ?? 0

  // qSnacksFreq (weight 3)
  const sfMap: Record<string, number> = { never: 3, once: 3, twice: 2, threePlus: 0, insteadOfMeals: 0 }
  total += sfMap[getStr(a,'qSnacksFreq')] ?? 0

  // qSnackType (weight 3, multi)
  const st = getArr(a, 'qSnackType')
  const unhealthySnacks = ['chips','chocolate','biscuit']
  const healthySnacks = ['nuts','fruit','yogurt']
  if (st.includes('noSnacks') || st.length === 0) total += 3
  else if (st.every(v => healthySnacks.includes(v))) total += 3
  else if (st.some(v => unhealthySnacks.includes(v)) && st.some(v => healthySnacks.includes(v))) total += 1
  else total += 0 // only unhealthy

  // qBreakfast (weight 4)
  const bfMap: Record<string, number> = { yesHome: 4, sometimes: 2, onTheGo: 1, never: 0 }
  total += bfMap[getStr(a,'qBreakfast')] ?? 0

  // qWorkMeal (weight 3)
  const wmMap: Record<string, number> = { homePrepared: 3, delivery: 2, whatever: 1, skipLunch: 0, snacksOnly: 0 }
  total += wmMap[getStr(a,'qWorkMeal')] ?? 0

  // qSocialFreq (weight 2)
  const sfqMap: Record<string, number> = { rarely: 2, monthly: 2, onceTwiceWeek: 1, threePlusWeek: 0, daily: 0 }
  total += sfqMap[getStr(a,'qSocialFreq')] ?? 0

  // qSocialFood (weight 2, multi — worst)
  const sf2 = getArr(a, 'qSocialFood')
  if (sf2.includes('sweets') || sf2.includes('takeout')) total += 0
  else if (sf2.includes('fried')) total += 1
  else total += 2 // balanced or homemade

  // qSweetsRelation (weight 4)
  const srMap: Record<string, number> = { dontLike: 4, sometimes: 3, craveContinuously: 1, soothingCraving: 0 }
  total += srMap[getStr(a,'qSweetsRelation')] ?? 0

  // qSweetsAwareness (weight 2)
  const saMap: Record<string, number> = { knowAndDeal: 2, knowEmotional: 1, thoughtNoAnswer: 1, neverThought: 0 }
  total += saMap[getStr(a,'qSweetsAwareness')] ?? 0

  return total // max 64
}

// ── Section 3: supplements (max 14) ───────────────────────────────────────
function scoreSupplements(a: Answers): number {
  let total = 0

  // Q18 (weight 3)
  const q18m: Record<string, number> = { '1to2': 3, '3to5': 2, none: 1, '6plus': 0 }
  total += q18m[getStr(a,'q18')] ?? 0

  // Q19 (weight 4)
  const q19 = getArr(a, 'q19')
  const hasVitD = q19.includes('vitD')
  const hasFolic = q19.includes('folic')
  const hasOmega = q19.includes('omega3')
  const keyCount = [hasVitD, hasFolic, hasOmega].filter(Boolean).length
  if (keyCount === 3) total += 4
  else if (keyCount === 2) total += 3
  else if (keyCount === 1) total += 2
  else if (q19.includes('none') || q19.length === 0) total += 1
  else total += 1 // has other supp but not the 3 key ones

  // Q20 (weight 4)
  const q20 = getArr(a, 'q20')
  if (q20.includes('none') || q20.length === 0) {
    total += 4
  } else {
    const tier1 = ['vitex','maca','ashwagandha']
    const tier2 = ['licorice','redClover','kafMaryam']
    const allHerbs = [...tier1,...tier2,'eveningPrimrose','blackSeed','qustHindi','ginger','turmeric','cinnamon','fenugreek','fennel','chamomile','sage','anise']
    const herbCount = q20.filter(v => allHerbs.includes(v)).length
    const hasTier2 = q20.some(v => tier2.includes(v))
    const hasTier1 = q20.some(v => tier1.includes(v))
    if (herbCount >= 3) total += 0
    else if (hasTier2) total += 1
    else if (hasTier1) total += 2
    else total += 3
  }

  // Q21 (weight 3)
  const q21m: Record<string, number> = { doctor: 3, articles: 2, friendFamily: 1, socialMedia: 0, dontknow: 0 }
  total += q21m[getStr(a,'q21')] ?? 0

  return total // max 14
}

// ── Section 4: stress & sleep (max 25) ────────────────────────────────────
function scoreStress(a: Answers): number {
  let total = 0

  // Q22 (weight 5)
  const q22m: Record<string, number> = { '7to8': 5, over8: 4, '6to7': 3, '5to6': 1, under5: 0 }
  total += q22m[getStr(a,'q22')] ?? 0

  // qSleepTime (weight 5)
  const stm: Record<string, number> = { before10pm: 5, '10pmTo12': 4, '12to2am': 1, after2am: 0, irregular: 0 }
  total += stm[getStr(a,'qSleepTime')] ?? 0

  // Q23 (weight 4)
  const q23m: Record<string, number> = { never: 4, sometimes: 3, usually: 1, always: 0 }
  total += q23m[getStr(a,'q23')] ?? 0

  // Q24 (weight 5)
  const q24m: Record<string, number> = { calm: 5, mild: 4, clear: 2, severe: 0 }
  total += q24m[getStr(a,'q24')] ?? 0

  // Q25 (weight 3, multi)
  const q25 = getArr(a, 'q25')
  const hasTalk = q25.includes('talk')
  const hasWalk = q25.includes('walk')
  const hasBad = q25.some(v => ['eat','cry','nothing'].includes(v))
  if (hasTalk && hasWalk) total += 3
  else if (hasTalk || hasWalk) total += 2
  else if (hasBad) total += 0
  else total += 1 // scroll or sleep

  // Q26 (weight 3)
  const q26m: Record<string, number> = { no: 3, sometimes: 2, usually: 1, always: 0 }
  total += q26m[getStr(a,'q26')] ?? 0

  return total // max 25
}

// ── Section 5: exercise (max 7) ───────────────────────────────────────────
function scoreExercise(a: Answers): number {
  let total = 0

  // Q27 (weight 4)
  const q27m: Record<string, number> = { '2to3': 4, '4to5': 3, onceOrLess: 2, '6to7': 1, never: 0 }
  total += q27m[getStr(a,'q27')] ?? 0

  // Q28 (weight 3, multi)
  const q28 = getArr(a, 'q28')
  const gentle = ['walking','yoga','swimming','weights']
  const moderate = ['running','dance']
  const hasGentle = q28.some(v => gentle.includes(v))
  const hasModerate = q28.some(v => moderate.includes(v))
  const hiitOnly = q28.includes('hiit') && !hasGentle && !hasModerate
  if (q28.includes('none') || q28.length === 0) total += 0
  else if (hasGentle) total += 3
  else if (hasModerate) total += 2
  else if (hiitOnly) total += 1
  else total += 0

  return total // max 7
}

// ── Section 6: kitchen (max 19) ───────────────────────────────────────────
function scoreKitchen(a: Answers): number {
  let total = 0

  // Q30 (weight 3)
  const q30m: Record<string, number> = { yes: 3, heard: 2, no: 1, neverThought: 0 }
  total += q30m[getStr(a,'q30')] ?? 0

  // Q31 (weight 3, multi)
  const q31 = getArr(a, 'q31')
  const safe31 = ['steel','castIron','ceramic']
  const unsafe31 = ['teflon','aluminum']
  const hasSafe = q31.some(v => safe31.includes(v))
  const hasUnsafe = q31.some(v => unsafe31.includes(v))
  if (q31.includes('dontknow') && !hasSafe && !hasUnsafe) total += 1
  else if (hasSafe && !hasUnsafe) total += 3
  else if (hasSafe && hasUnsafe) total += 2
  else total += 0 // unsafe only

  // Q32 (weight 2)
  const q32m: Record<string, number> = { noSilicone: 2, someSilicone: 1, mostlySilicone: 0, dontknow: 1 }
  total += q32m[getStr(a,'q32')] ?? 0

  // Q33 (weight 2)
  const q33m: Record<string, number> = { neither: 2, parchment: 1, both: 1, aluminum: 0 }
  total += q33m[getStr(a,'q33')] ?? 0

  // Q34 (weight 3)
  const q34m: Record<string, number> = { filtered: 3, gallon: 2, tap: 1, smallPlastic: 0 }
  total += q34m[getStr(a,'q34')] ?? 0

  // Q35 (weight 3, multi)
  const q35 = getArr(a, 'q35')
  const hasGlass = q35.includes('glass')
  const hasUnsafe35 = q35.some(v => ['plastic','wrap'].includes(v))
  if (hasGlass && !hasUnsafe35) total += 3
  else if (hasGlass && hasUnsafe35) total += 2
  else if (q35.includes('eatFresh')) total += 2
  else total += 0

  // Q51 (weight 3, multi)
  const q51 = getArr(a, 'q51')
  const healthyCook = ['grill','steam','boil','airFryer']
  const unhealthyCook = ['deepFry','fryOil']
  const hasHealthyCook = q51.some(v => healthyCook.includes(v))
  const hasUnhealthyCook = q51.some(v => unhealthyCook.includes(v))
  if (hasHealthyCook && !hasUnhealthyCook) total += 3
  else if (hasHealthyCook && hasUnhealthyCook) total += 2
  else total += 0

  return total // max 19
}

// ── Section 7: personalCare (max 13) ──────────────────────────────────────
function scorePersonalCare(a: Answers): number {
  let total = 0
  const readMap: Record<string, number> = { always: 2, sometimes: 1, rarely: 1, never: 0 }
  total += readMap[getStr(a,'q36')] ?? 0
  total += readMap[getStr(a,'q37')] ?? 0
  const q38m: Record<string, number> = { rarely: 2, sometimes: 2, mostDays: 1, everyday: 0 }
  total += q38m[getStr(a,'q38')] ?? 0
  // Q39 (weight 3, multi — best option)
  const q39 = getArr(a, 'q39')
  if (q39.includes('cup') || q39.includes('cloth')) total += 3
  else if (q39.includes('regularUnscented')) total += 2
  else if (q39.includes('tampon')) total += 1
  else if (q39.includes('scented')) total += 0
  else total += 1
  const q40m: Record<string, number> = { yes: 2, heardIssues: 1, never: 0 }
  total += q40m[getStr(a,'q40')] ?? 0
  const q41m: Record<string, number> = { cotton: 2, mixed: 1, synthetic: 0, noAttention: 1 }
  total += q41m[getStr(a,'q41')] ?? 0
  return total // max 13
}

// ── Section 8: menstrual (max 22) ─────────────────────────────────────────
function scoreMenstrual(a: Answers): number {
  let total = 0
  const q42m: Record<string, number> = { '21to35': 5, under21: 2, over35: 1, irregular: 0 }
  total += q42m[getStr(a,'q42')] ?? 0
  const q43m: Record<string, number> = { normal: 4, veryLight: 2, heavy: 2, veryHeavy: 0 }
  total += q43m[getStr(a,'q43')] ?? 0
  const q44m: Record<string, number> = { noneOrMild: 4, moderate: 3, severe: 1, verySevere: 0 }
  total += q44m[getStr(a,'q44')] ?? 0
  const q45m: Record<string, number> = { never: 3, sometimesSmall: 2, regularlyLarge: 0 }
  total += q45m[getStr(a,'q45')] ?? 0
  const q46m: Record<string, number> = { never: 3, sometimes: 1, regularly: 0 }
  total += q46m[getStr(a,'q46')] ?? 0
  // Q47 (weight 3, multi)
  const q47 = getArr(a, 'q47')
  const symptoms = q47.filter(v => v !== 'none')
  if (q47.includes('none') || symptoms.length === 0) total += 3
  else if (symptoms.length <= 2) total += 2
  else total += 0
  return total // max 22
}

// ── Section 9: caffeine (max 9) ───────────────────────────────────────────
function scoreCaffeine(a: Answers): number {
  let total = 0
  const q48m: Record<string, number> = { none: 3, one: 3, two: 2, threePlus: 0 }
  total += q48m[getStr(a,'q48')] ?? 0
  const q49m: Record<string, number> = { never: 3, sometimes: 1, regularly: 0 }
  total += q49m[getStr(a,'q49')] ?? 0
  const q50m: Record<string, number> = { over2: 3, '1p5to2': 2, '1to1p5': 1, underOne: 0 }
  total += q50m[getStr(a,'q50')] ?? 0
  return total // max 9
}

// ── Section 10: infoSources (max 3) ───────────────────────────────────────
function scoreInfoSources(a: Answers): number {
  const q52 = getArr(a, 'q52')
  const trusted = ['doctor','trustedSites']
  const bad = ['social','whatsapp','friends','noResearch']
  const hasTrusted = q52.some(v => trusted.includes(v))
  const hasBad = q52.some(v => bad.includes(v))
  if (hasTrusted && !hasBad) return 3
  if (hasTrusted && hasBad) return 2
  return 0
}

// ── Section 11: thyroid (max 5) ───────────────────────────────────────────
function scoreThyroid(a: Answers): number {
  const q53 = getArr(a, 'q53')
  const symptoms = q53.filter(v => v !== 'none')
  if (q53.includes('none') || symptoms.length === 0) return 5
  if (symptoms.length <= 2) return 3
  return 0
}

// ── Section 12: maleFactor (max 10) ───────────────────────────────────────
function scoreMaleFactor(a: Answers): number {
  let total = 0
  const q54m: Record<string, number> = { yesNormal: 4, yesIssues: 2, notDone: 1, refused: 0 }
  total += q54m[getStr(a,'q54')] ?? 0
  const q55m: Record<string, number> = { knowApply: 2, heardNoApply: 1, dontknow: 0 }
  total += q55m[getStr(a,'q55')] ?? 0
  const q56m: Record<string, number> = { yesDoctor: 2, yesSelf: 1, none: 1, neverThought: 0 }
  total += q56m[getStr(a,'q56')] ?? 0
  const q57m: Record<string, number> = { healthy: 2, acceptable: 1, unhealthy: 0, dontknow: 1 }
  total += q57m[getStr(a,'q57')] ?? 0
  return total // max 10
}

// ── Triggered sentences ────────────────────────────────────────────────────
function getTriggeredSentences(a: Answers, bmi: number): string[] {
  const triggered: string[] = []
  const str = (id: string) => getStr(a, id)
  const arr = (id: string) => getArr(a, id)

  // BMI
  if (bmi > 25 && bmi > 0) triggered.push('وزنك الزائد يؤثر مباشرةً على مستوى الإستروجين في جسمك - الخلايا الدهنية تنتج إستروجيناً إضافياً يخل بالتوازن الهرموني ويعطل إشارات التبويض.')
  if (bmi < 18.5 && bmi > 0) triggered.push('انخفاض وزنك عن المعدل الطبيعي يرسل إشارة للدماغ بأن الجسم ليس في وضع آمن للحمل - فيبدأ بتقليص إنتاج هرمونات التبويض.')

  // Diet
  const q4 = arr('q4').filter(v => v !== 'none')
  if (q4.length >= 3) triggered.push('تنقلك بين أنظمة غذائية متعددة أرهق جسمك هرمونياً - كل نظام جديد يعيد ضبط الإنسولين والليبتين من الصفر، وهذا التذبذب المتكرر يضرب استقرار محور الدماغ والمبيض.')
  if (str('q5') === 'always') triggered.push('تقليل الكربوهيدرات بشكل حاد يخفض هرمون اللبتين الذي يخبر الدماغ بأن الجسم جاهز للإنجاب - غيابه يوقف إشارات التبويض.')
  if (str('q6') === 'avoid') triggered.push('الحذف الكامل للألبان بدون بديل غذائي مدروس يؤدي لنقص في الكالسيوم وفيتامين D - وكلاهما ضروريان لجودة البويضة وانتظام الدورة.')
  if (str('q9') === 'neverRead') triggered.push('النكهات المضافة والمواد الحافظة في الأطعمة المصنعة تعمل كمعطلات هرمونية داخل جسمك - وأنتِ لا تعرفين كم تتعرضين لها يومياً.')
  if (str('q10') === 'none') triggered.push('الخضار هي المصدر الرئيسي للألياف التي تساعد الكبد على التخلص من الإستروجين الزائد - غيابها يعني تراكم الهرمونات في جسمك.')
  if (str('q11') === 'none') triggered.push('الفاكهة تحتوي على مضادات أكسدة ضرورية لحماية البويضة من الإجهاد التأكسدي - وغيابها يترك البويضة أكثر عرضة للتلف.')
  if (['dontknow','neverThought'].includes(str('q12'))) triggered.push('البروتين هو اللبنة الأساسية لبناء الهرمونات - بدون كمية كافية يومياً، جسمك يفتقر للمواد الخام التي يحتاجها لصنع هرمونات الخصوبة.')
  const q15 = arr('q15')
  if (q15.includes('crash') || q15.includes('longFast')) triggered.push('الحمية القاسية ترفع الكورتيزول بشكل حاد - والكورتيزول المرتفع يأمر الجسم بتأجيل التبويض لأن الدماغ يعتبر الجوع خطراً.')
  const q16 = arr('q16')
  if (!q16.includes('none') && q16.length > 0) triggered.push('هذه الحقن تؤثر على هرمون GLP-1 الذي يرتبط بمحور الإنسولين والتبويض - التوقف عنها بدون خطة غذائية داعمة يخلق تذبذباً هرمونياً.')
  const q17 = arr('q17')
  if (q17.includes('aspartame') || q17.includes('sucralose')) triggered.push('المحليات الصناعية تؤثر على بكتيريا الأمعاء التي تلعب دوراً في تنظيم الإستروجين - اضطراب الميكروبيوم يعني اضطراباً في إعادة تدوير الهرمونات.')
  if (['fivePlus','everyday'].includes(str('qRestaurant'))) triggered.push('تناول الأكل الجاهز بهذه الكثافة يعني تعرضاً يومياً للدهون المتحولة والصوديوم المرتفع والمواد الحافظة - وكلها تغذي الالتهاب الذي يعطل الخصوبة.')
  if (str('qSnacksFreq') === 'insteadOfMeals') triggered.push('الاعتماد على السناكات بدل وجبات حقيقية يخلق تذبذباً مستمراً في سكر الدم - وهذا التذبذب يرهق البنكرياس ويضرب حساسية الإنسولين يومياً.')
  const st = arr('qSnackType').filter(v => v !== 'noSnacks')
  const unhealthy = ['chips','chocolate','biscuit']
  const healthy = ['nuts','fruit','yogurt']
  if (st.length > 0 && st.every(v => unhealthy.includes(v))) triggered.push('السناكات المصنعة ترفع السكر بسرعة ثم تهبط بسرعة - هذه الدورة المتكررة تجهد الإنسولين وتؤثر مباشرةً على انتظام التبويض.')
  if (str('qBreakfast') === 'never') triggered.push('تخطي الفطور يرفع الكورتيزول في الصباح ويزيد مقاومة الإنسولين خلال اليوم - وكلاهما يؤثر على جودة التبويض.')
  if (['whatever','snacksOnly'].includes(str('qWorkMeal'))) triggered.push('الأكل العشوائي بدون تخطيط يعني أن جسمك لا يحصل على العناصر الغذائية التي تحتاجها هرموناتك بشكل منتظم.')
  if (['threePlusWeek','daily'].includes(str('qSocialFreq'))) triggered.push('التجمعات المتكررة مع أكل غير متحكم فيه تجعل من الصعب بناء نمط غذائي مستقر - والهرمونات تحتاج استقراراً وليس تذبذباً.')
  const sf2 = arr('qSocialFood')
  if (sf2.includes('fried') || sf2.includes('sweets')) triggered.push('الحلويات والمقليات بكميات كبيرة في التجمعات تعني جرعات مرتفعة من السكر والدهون المشبعة - وتأثيرها على الإنسولين يمتد لأيام بعد الوجبة.')
  if (str('qSweetsRelation') === 'craveContinuously') triggered.push('الرغبة المستمرة بالحلويات ليست ضعف إرادة - هي إشارة جسمك أن هناك خللاً في الإنسولين أو انخفاضاً في السيروتونين يحتاج معالجة حقيقية.')
  if (str('qSweetsRelation') === 'soothingCraving') triggered.push('استخدام الحلويات للتهدئة يكشف ارتباطاً بين محور التوتر والسكر في جسمك - الكورتيزول المرتفع يطلب السكر، والسكر يرفع الإنسولين، والإنسولين يضرب التبويض.')

  // Supplements
  if (str('q18') === '6plus') triggered.push('أخذ عدد كبير من المكملات بدون توجيه متخصص قد يسبب تعارضاً في الامتصاص - بعض المكملات تمنع امتصاص بعضها وتصبح عبئاً بدل فائدة.')
  const q19 = arr('q19')
  if (!q19.includes('vitD') && !q19.includes('folic')) triggered.push('هذه الثلاثة هي الأساس العلمي لدعم الخصوبة - غيابها يعني أن جسمك يفتقر للبنية التحتية الهرمونية الأساسية.')
  const q20 = arr('q20')
  if (q20.includes('licorice') || q20.includes('redClover') || q20.includes('kafMaryam')) triggered.push('هذه الأعشاب تحتوي على مركبات تشبه الإستروجين - تناولها بدون إشراف قد يزيد الإستروجين ويخل بتوازن الهرمونات.')
  const herbCount = q20.filter(v => v !== 'none').length
  if (herbCount >= 3) triggered.push('الجمع بين أعشاب متعددة بدون توجيه متخصص خطر - التفاعلات بينها غير محسوبة وقد تعطي نتيجة عكسية على هرموناتك.')
  if (['socialMedia','dontknow'].includes(str('q21'))) triggered.push('المكملات التي تُختار بناءً على إعلانات أو توصيات غير متخصصة غالباً لا تناسب وضعك الهرموني الفعلي - وقد تعالج شيئاً لست بحاجته.')

  // Sleep & stress
  if (str('q22') === 'under5') triggered.push('النوم أقل من 5 ساعات يقطع إنتاج هرمون النمو والميلاتونين - وكلاهما ضروريان لإصلاح الخلايا التناسلية وتنظيم دورة التبويض.')
  if (str('q22') === '5to6') triggered.push('ساعات نومك أقل من حاجة جسمك الهرمونية - الجسم يحتاج 7 ساعات على الأقل لإتمام دورة إصلاح الهرمونات أثناء النوم.')
  if (['12to2am','after2am','irregular'].includes(str('qSleepTime'))) triggered.push('النوم المتأخر يعطل إفراز الميلاتونين الذي يحمي البويضة من الإجهاد التأكسدي - وبعد منتصف الليل يرتفع الكورتيزول بدل أن ينخفض.')
  if (['usually','always'].includes(str('q23'))) triggered.push('الاستيقاظ المتكرر ليلاً يمنع الجسم من الوصول لمراحل النوم العميق - وفي هذه المراحل تحديداً يُصلح الجسم اختلالاته الهرمونية.')
  if (str('q24') === 'severe') triggered.push('التوتر المزمن يرفع الكورتيزول باستمرار - والكورتيزول المرتفع يسرق المواد الخام التي يحتاجها جسمك لصنع هرمونات الخصوبة.')
  const q25 = arr('q25')
  if (q25.includes('eat') || q25.includes('cry')) triggered.push('طريقة تعاملك مع التوتر تخبرنا أن جسمك يبحث عن متنفس - الأكل العاطفي يرفع الإنسولين والكبت يرفع الكورتيزول وكلاهما يؤثر على الخصوبة.')
  if (str('q26') === 'always') triggered.push('الضوء الأزرق من الشاشات يوقف إنتاج الميلاتونين - وبدون ميلاتونين كافٍ تبقى هرمونات التوتر مرتفعة حتى أثناء النوم.')

  // Exercise
  if (str('q27') === 'never') triggered.push('غياب الحركة يضعف حساسية الإنسولين ويقلل تدفق الدم للرحم والمبيض - الحركة المنتظمة ليست رفاهية بل جزء من بيئة الخصوبة.')
  if (str('q27') === '6to7') triggered.push('التمرين المكثف جداً يرفع الكورتيزول ويرسل للجسم إشارة إجهاد - وهذا قد يوقف التبويض عند بعض النساء خاصة مع قلة السعرات.')
  const q28 = arr('q28')
  const gentleEx = ['walking','yoga','swimming','weights']
  if (q28.includes('hiit') && !q28.some(v => gentleEx.includes(v))) triggered.push('التمارين عالية الكثافة وحدها ترفع الكورتيزول بشكل متكرر - الخصوبة تحتاج توازناً بين التمرين الشديد والتمارين الهادئة كاليوغا والمشي.')

  // Kitchen
  if (['no','neverThought'].includes(str('q30'))) triggered.push('الزيت المحروق أو غير المناسب لدرجة الحرارة ينتج مركبات التهابية تؤثر على جودة البويضة والبيئة الهرمونية.')
  const q31 = arr('q31')
  if (q31.includes('teflon') && !q31.some(v => ['steel','castIron','ceramic'].includes(v))) triggered.push('الطبخ في أواني التيفلون المخدوشة أو الألمنيوم يطلق مركبات تعمل كمعطلات هرمونية تتراكم في الجسم مع الوقت.')
  if (str('q32') === 'mostlySilicone') triggered.push('السيليكون عند تعرضه للحرارة العالية قد يطلق مركبات غير مستقرة - الأفضل استخدام المعدن أو الخشب في الطبخ.')
  if (str('q33') === 'aluminum') triggered.push('الطبخ المباشر في ورق الألمنيوم خاصة مع الأطعمة الحامضة يزيد انتقال الألمنيوم للطعام - وتراكمه في الجسم يؤثر على الجهاز العصبي والهرموني.')
  if (str('q34') === 'smallPlastic') triggered.push('الزجاجات البلاستيكية الصغيرة خاصة عند تعرضها للحرارة تطلق BPA وBPS - وهي من أقوى المعطلات الهرمونية المعروفة.')
  const q35 = arr('q35')
  if (q35.includes('plastic') || q35.includes('wrap')) triggered.push('حفظ الأكل الساخن في أوعية بلاستيكية يزيد انتقال المواد الكيميائية للطعام - وهذه المواد تقلد الإستروجين وتخل بالتوازن الهرموني.')
  const q51 = arr('q51')
  const healthyCook = ['grill','steam','boil','airFryer']
  if ((q51.includes('deepFry') || q51.includes('fryOil')) && !q51.some(v => healthyCook.includes(v))) triggered.push('الاعتماد على القلي العميق يعني استهلاكاً يومياً للدهون المتحولة الناتجة عن تسخين الزيت - وهي ترفع الالتهاب وتضر بجودة البويضة.')

  // Personal care
  if (str('q36') === 'never' || str('q37') === 'never') triggered.push('منتجات العناية الشخصية تحتوي على parabens وphthalates - وهي مواد تمتصها الجلد وتعمل كإستروجين صناعي داخل جسمك.')
  if (str('q38') === 'everyday') triggered.push('مضادات التعرق التقليدية تحتوي على الألمنيوم الذي يمتصه الجلد بالقرب من الغدد الليمفاوية - والتراكم المستمر يثير قلقاً هرمونياً حقيقياً.')
  if (arr('q39').includes('scented')) triggered.push('العطور المضافة للفوط الصحية تحتوي على مواد كيميائية تلامس منطقة حساسة هرمونياً بشكل يومي - وهذا التعرض المتكرر ليس بلا تأثير.')
  if (str('q41') === 'synthetic') triggered.push('الأقمشة الصناعية كالبوليستر تطلق microplastics تمتصها الجلد - إضافة لأنها لا تسمح للجلد بالتنفس مما يؤثر على التوازن الحراري للجهاز التناسلي.')

  // Menstrual
  if (str('q42') === 'under21') triggered.push('دورتك القصيرة تشير إلى أن مرحلة الجسم الأصفر غير كافية - البيضة لا تحظى بالوقت الكافي للنضج قبل الإطراح.')
  if (str('q42') === 'over35') triggered.push('الدورة الطويلة تعكس غالباً تأخراً في التبويض أو غيابه - وهذا مباشرةً يؤثر على فرص الحمل.')
  if (str('q42') === 'irregular') triggered.push('عدم انتظام دورتك يخبرنا أن هناك اضطراباً في محور الهرمونات بين الدماغ والمبيض - الجسم فقد إيقاعه الطبيعي.')
  if (str('q43') === 'veryLight') triggered.push('الدم الخفيف جداً قد يشير إلى ضعف في بطانة الرحم أو انخفاض في الإستروجين - وكلاهما يؤثر على قدرة البيضة الملقحة على الانغراس.')
  if (str('q43') === 'veryHeavy') triggered.push('الغزارة الشديدة قد تكون علامة على خلل في البروجستيرون أو وجود التهاب مزمن في بطانة الرحم.')
  if (str('q44') === 'severe') triggered.push('الألم الشديد ليس طبيعياً - وغالباً يشير إلى التهاب مزمن أو بداية بطانة رحم مهاجرة تحتاج تقييماً.')
  if (str('q44') === 'verySevere') triggered.push('هذا المستوى من الألم يستدعي تقييماً طبياً - الألم المشلّ مرتبط ببطانة الرحم المهاجرة وهي من أكثر أسباب تأخر الحمل التي تُكتشف متأخراً.')
  if (str('q45') === 'regularlyLarge') triggered.push('التجلطات الكبيرة والمتكررة تشير إلى خلل في البروجستيرون وزيادة في الإستروجين - هذا التوازن المختل يؤثر مباشرةً على جودة بطانة الرحم.')
  if (str('q46') === 'regularly') triggered.push('النزيف بين الدورتين إشارة تحتاج انتباهاً - قد يعكس ضعفاً في مرحلة الجسم الأصفر أو تقلبات حادة في الإستروجين.')
  const q47symptoms = arr('q47').filter(v => v !== 'none')
  if (q47symptoms.length >= 3) triggered.push('وجود أعراض متعددة قبل الدورة يشير إلى خلل في نسبة الإستروجين إلى البروجستيرون في النصف الثاني من دورتك.')

  // Caffeine
  if (str('q48') === 'threePlus') triggered.push('الكافيين بهذه الكمية يرفع الكورتيزول ويضيق الأوعية الدموية المغذية للرحم - وبعض الدراسات تربطه بصعوبة الانغراس.')
  if (str('q49') === 'regularly') triggered.push('مشروبات الطاقة تجمع بين الكافيين العالي والسكر والمواد الحافظة - وهذا المزيج يرهق الغدة الكظرية ويرفع الكورتيزول بشكل حاد.')
  if (str('q50') === 'underOne') triggered.push('الجفاف الخفيف المزمن يؤثر على سماكة المخاط العنقي الضروري لحركة الحيوانات المنوية - وعلى تدفق الدم للرحم والمبيض.')

  // Info sources
  const q52 = arr('q52')
  const badSources = ['social','whatsapp','friends','noResearch']
  if (q52.some(v => badSources.includes(v)) && !q52.some(v => ['doctor','trustedSites'].includes(v))) triggered.push('المعلومات الصحية من السوشيال ميديا غير مصفاة علمياً - وكثير مما يُنشر عن الخصوبة مبني على تجارب شخصية لا على أدلة سريرية.')

  // Thyroid
  const thyroidSymptoms = arr('q53').filter(v => v !== 'none')
  if (thyroidSymptoms.length >= 3) triggered.push('الأعراض التي ذكرتِها تشير إلى احتمال وجود خلل في الغدة الدرقية - والغدة الدرقية تتحكم في سرعة كل العمليات الهرمونية في جسمك بما فيها التبويض.')

  // Male factor
  if (str('q54') === 'notDone') triggered.push('الخصوبة مسؤولية مشتركة - 40% من حالات تأخر الحمل سببها عامل الذكورة، وتأجيل التحليل يعني تأجيل نصف الصورة الكاملة.')
  if (str('q54') === 'refused') triggered.push('غياب تقييم عامل الذكورة يجعل أي خطة علاجية ناقصة - الحمل يحتاج بويضة صحية وحيواناً منوياً صحياً في نفس الوقت.')
  if (str('q57') === 'unhealthy') triggered.push('جودة الحيوانات المنوية تتأثر بشكل مباشر بالنظام الغذائي ومستوى الحركة - نمط حياة الزوج جزء لا يتجزأ من معادلة الخصوبة.')

  return triggered
}

// ── Main export ────────────────────────────────────────────────────────────
export function calculateScore(answers: Answers): ScoreResult {
  const { bmiPoints, bmi } = calcBmi(answers)

  const basicInfoEarned = scoreBasicInfo(answers, bmiPoints)
  const dietEarned      = scoreDiet(answers)
  const suppEarned      = scoreSupplements(answers)
  const stressEarned    = scoreStress(answers)
  const exerciseEarned  = scoreExercise(answers)
  const kitchenEarned   = scoreKitchen(answers)
  const careEarned      = scorePersonalCare(answers)
  const menstrualEarned = scoreMenstrual(answers)
  const caffeineEarned  = scoreCaffeine(answers)
  const infoEarned      = scoreInfoSources(answers)
  const thyroidEarned   = scoreThyroid(answers)
  const maleEarned      = scoreMaleFactor(answers)

  const totalEarned = basicInfoEarned + dietEarned + suppEarned + stressEarned +
    exerciseEarned + kitchenEarned + careEarned + menstrualEarned +
    caffeineEarned + infoEarned + thyroidEarned + maleEarned

  const totalMax = 7 + 64 + 14 + 25 + 7 + 19 + 13 + 22 + 9 + 3 + 5 + 10 // = 198

  const finalScore = Math.round(clamp((totalEarned / totalMax) * 100, 0, 100))

  let scoreCategory: string, scoreCategoryAr: string
  if (finalScore >= 90) { scoreCategory = 'level1'; scoreCategoryAr = 'جسمك في وضع جيد - أساسك قوي' }
  else if (finalScore >= 70) { scoreCategory = 'level2'; scoreCategoryAr = 'فيه فجوات واضحة تؤثر على هرموناتك' }
  else if (finalScore >= 50) { scoreCategory = 'level3'; scoreCategoryAr = 'جسمك يعاني بصمت' }
  else { scoreCategory = 'level4'; scoreCategoryAr = 'إنذار مبكر - عوامل كثيرة تؤثر على خصوبتك' }

  const triggeredSentences = getTriggeredSentences(answers, bmi)

  return {
    finalScore,
    scoreCategory,
    scoreCategoryAr,
    scoreLevelText: LEVEL_TEXTS[scoreCategory],
    sectionScores: {
      basicInfo:   sec(basicInfoEarned, 7),
      diet:        sec(dietEarned, 64),
      supplements: sec(suppEarned, 14),
      stress:      sec(stressEarned, 25),
      exercise:    sec(exerciseEarned, 7),
      kitchen:     sec(kitchenEarned, 19),
      personalCare: sec(careEarned, 13),
      menstrual:   sec(menstrualEarned, 22),
      caffeine:    sec(caffeineEarned, 9),
      infoSources: sec(infoEarned, 3),
      thyroid:     sec(thyroidEarned, 5),
      maleFactor:  sec(maleEarned, 10),
    },
    triggeredSentences,
    bmi,
  }
}
