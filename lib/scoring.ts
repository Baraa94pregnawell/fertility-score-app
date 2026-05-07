// Deterministic fertility score calculator.
// All point values defined here. No scoring logic anywhere else.

export interface Answers { [questionId: string]: string | string[] | number }

export interface SectionScores {
  diet: number; dietMax: number
  supplements: number; supplementsMax: number
  stress: number; stressMax: number
  exercise: number; exerciseMax: number
  kitchen: number; kitchenMax: number
  personalCare: number; personalCareMax: number
  bmi: number; bmiMax: number
}

export interface ScoreResult {
  finalScore: number
  scoreCategory: string
  scoreCategoryAr: string
  sectionScores: SectionScores
  bmi: number
}

// ─── helpers ───────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
function getStr(a: Answers, id: string): string { return (a[id] as string) ?? '' }
function getArr(a: Answers, id: string): string[] {
  const v = a[id]; if (!v) return []
  return Array.isArray(v) ? v : [String(v)]
}

// ─── BMI ───────────────────────────────────────────────────────────────────

function scoreBmi(a: Answers): { points: number; bmi: number } {
  const h = Number(a['q2']) || 0
  const w = Number(a['q3']) || 0
  if (!h || !w) return { points: 0, bmi: 0 }
  const bmi = w / ((h / 100) ** 2)
  let points = 0
  if (bmi >= 18.5 && bmi <= 24.9) points = 4
  else if ((bmi >= 25 && bmi <= 29.9) || (bmi >= 17 && bmi < 18.5)) points = 2
  else if (bmi >= 30 && bmi <= 34.9) points = 1
  else points = 0
  return { points, bmi: Math.round(bmi * 10) / 10 }
}

// ─── Section 2: Diet (25%) — max 44 pts ────────────────────────────────────

function scoreDiet(a: Answers): number {
  let total = 0

  // Q4 — diets tried
  const q4 = getArr(a, 'q4')
  const noDiet = q4.includes('none')
  const count = noDiet ? 0 : q4.length
  if (count === 0) total += 4
  else if (count === 1) total += 3
  else if (count <= 3) total += 2
  else if (count <= 5) total += 1

  // Q5 — cutting carbs
  const q5map: Record<string, number> = { no: 4, sometimes: 2, always: 1, dontknow: 1 }
  total += q5map[getStr(a, 'q5')] ?? 0

  // Q6 — cutting dairy
  const q6map: Record<string, number> = { no: 4, sometimes: 3, avoid: 1, dontknow: 2 }
  total += q6map[getStr(a, 'q6')] ?? 0

  // Q9 — added flavors awareness
  const q9map: Record<string, number> = { noticeAvoid: 4, noticeIgnore: 2, noNotice: 1, neverRead: 0 }
  total += q9map[getStr(a, 'q9')] ?? 0

  // Q10 — vegetables
  const q10map: Record<string, number> = { threeplus: 4, two: 3, one: 1, none: 0 }
  total += q10map[getStr(a, 'q10')] ?? 0

  // Q11 — fruit
  const q11map: Record<string, number> = { two: 4, one: 3, threeplus: 2, none: 0 }
  total += q11map[getStr(a, 'q11')] ?? 0

  // Q12 — protein knowledge
  const q12map: Record<string, number> = { knowApply: 4, knowNoApply: 2, dontknow: 1, neverThought: 0 }
  total += q12map[getStr(a, 'q12')] ?? 0

  // Q13 — protein shakes
  const q13map: Record<string, number> = { never: 4, sometimes: 2, regularly: 0 }
  total += q13map[getStr(a, 'q13')] ?? 0

  // Q15 — crash diet history (worst selected wins)
  const q15 = getArr(a, 'q15')
  if (q15.includes('none')) total += 4
  else if (q15.includes('crash') || q15.includes('longFast')) total += 0
  else if (q15.includes('skipMeal')) total += 1
  else if (q15.includes('skipBreakfast')) total += 2
  else total += 4

  // Q16 — weight loss meds (worst wins)
  const q16 = getArr(a, 'q16')
  if (q16.includes('none')) total += 4
  else if (q16.includes('ozempic') || q16.includes('saxenda') || q16.includes('mounjaro') || q16.includes('otherDrugs')) total += 1
  else if (q16.includes('surgery')) total += 2
  else total += 4

  // Q17 — sweeteners (worst wins)
  const q17 = getArr(a, 'q17')
  if (q17.includes('aspartame')) total += 0
  else if (q17.includes('sucralose')) total += 1
  else if (q17.includes('sugar')) total += 2
  else if (q17.includes('none')) total += 4
  else total += 3 // honey or stevia

  return total // max 44
}

// ─── Section 3: Supplements (15%) — max 16 pts ─────────────────────────────

function scoreSupplements(a: Answers): number {
  let total = 0

  // Q18
  const q18map: Record<string, number> = { none: 2, '1to2': 4, '3to5': 2, '6plus': 0 }
  total += q18map[getStr(a, 'q18')] ?? 0

  // Q19 — multi-select additive (start 0, max 4)
  const q19 = getArr(a, 'q19')
  let s19 = 0
  const positive = ['vitD','vitB','iron','zinc','magnesium','prenatal','folic']
  const negative = ['omega3','spirulina']
  for (const v of q19) {
    if (positive.includes(v)) s19 += 1
    if (negative.includes(v)) s19 -= 1
  }
  total += clamp(s19, 0, 4)

  // Q20 — herbs (start 4, each herb -1)
  const q20 = getArr(a, 'q20')
  const herbPenalty = ['ashwagandha','vitex','maca','redClover','eveningPrimrose','blackSeed',
    'kafMaryam','qustHindi','licorice','ginger','turmeric','cinnamon','fenugreek',
    'fennel','chamomile','sage','anise']
  if (q20.includes('none')) {
    total += 4
  } else {
    const penalty = q20.filter(v => herbPenalty.includes(v)).length
    total += clamp(4 - penalty, 0, 4)
  }

  // Q21
  const q21map: Record<string, number> = { doctor: 4, articles: 2, friendFamily: 1, socialMedia: 0, dontknow: 0 }
  total += q21map[getStr(a, 'q21')] ?? 0

  return total // max 16
}

// ─── Section 4: Stress & Sleep (20%) — max 20 pts ──────────────────────────

function scoreStress(a: Answers): number {
  let total = 0

  const q22map: Record<string, number> = { '7to8': 4, '6to7': 2, over8: 2, '5to6': 1, under5: 0 }
  total += q22map[getStr(a, 'q22')] ?? 0

  const q23map: Record<string, number> = { never: 4, sometimes: 3, usually: 1, always: 0 }
  total += q23map[getStr(a, 'q23')] ?? 0

  const q24map: Record<string, number> = { calm: 4, mild: 3, clear: 1, severe: 0 }
  total += q24map[getStr(a, 'q24')] ?? 0

  // Q25 — multi, additive
  const q25 = getArr(a, 'q25')
  let s25 = 0
  for (const v of q25) {
    if (v === 'talk' || v === 'walk') s25 += 1
    if (v === 'scroll' || v === 'eat' || v === 'cry' || v === 'nothing') s25 -= 1
    // sleep → 0 (neutral)
  }
  total += clamp(s25, 0, 4)

  const q26map: Record<string, number> = { no: 4, sometimes: 3, usually: 1, always: 0 }
  total += q26map[getStr(a, 'q26')] ?? 0

  return total // max 20
}

// ─── Section 5: Exercise (10%) — max 8 pts ─────────────────────────────────

function scoreExercise(a: Answers): number {
  let total = 0

  const q27map: Record<string, number> = { '2to3': 4, '4to5': 3, onceOrLess: 1, '6to7': 1, never: 0 }
  total += q27map[getStr(a, 'q27')] ?? 0

  const q28 = getArr(a, 'q28')
  const gentle = ['walking','yoga','swimming']
  const moderate = ['dance']
  const intense = ['running','weights','hiit']
  let s28 = 0
  for (const v of q28) {
    if (gentle.includes(v)) s28 += 2
    if (moderate.includes(v)) s28 += 1
    if (intense.includes(v)) s28 += 1
  }
  // Only high-intensity with no gentle = cap at 2
  const hasGentle = q28.some(v => [...gentle,...moderate].includes(v))
  const hasIntense = q28.some(v => intense.includes(v))
  if (hasIntense && !hasGentle) s28 = Math.min(s28, 2)
  total += clamp(s28, 0, 4)

  return total // max 8
}

// ─── Section 6: Kitchen (15%) — max 24 pts ─────────────────────────────────

function scoreKitchen(a: Answers): number {
  let total = 0

  const q30map: Record<string, number> = { yes: 4, heard: 2, no: 1, neverThought: 0 }
  total += q30map[getStr(a, 'q30')] ?? 0

  // Q31 — cookware multi
  const q31 = getArr(a, 'q31')
  let s31 = 0
  for (const v of q31) {
    if (['steel','castIron','ceramic'].includes(v)) s31 += 2
    if (v === 'teflon') s31 -= 2
    if (v === 'aluminum') s31 -= 1
    if (v === 'dontknow') s31 += 1
  }
  total += clamp(s31, 0, 4)

  const q32map: Record<string, number> = { noSilicone: 4, someSilicone: 2, mostlySilicone: 0, dontknow: 1 }
  total += q32map[getStr(a, 'q32')] ?? 0

  const q33map: Record<string, number> = { neither: 4, parchment: 3, both: 2, aluminum: 0 }
  total += q33map[getStr(a, 'q33')] ?? 0

  const q34map: Record<string, number> = { filtered: 4, gallon: 3, smallPlastic: 1, tap: 0 }
  total += q34map[getStr(a, 'q34')] ?? 0

  // Q35 — storage multi
  const q35 = getArr(a, 'q35')
  let s35 = 0
  for (const v of q35) {
    if (v === 'glass') s35 += 2
    if (v === 'eatFresh') s35 += 1
    if (v === 'plastic') s35 -= 1
    if (v === 'aluminumFoil') s35 -= 1
    if (v === 'wrap') s35 -= 2
  }
  total += clamp(s35, 0, 4)

  return total // max 24
}

// ─── Section 7: Personal Care (10%) — max 24 pts ───────────────────────────

function scorePersonalCare(a: Answers): number {
  let total = 0

  const readMap: Record<string, number> = { always: 4, sometimes: 2, rarely: 1, never: 0 }
  total += readMap[getStr(a, 'q36')] ?? 0
  total += readMap[getStr(a, 'q37')] ?? 0

  const q38map: Record<string, number> = { rarely: 4, sometimes: 3, mostDays: 1, everyday: 0 }
  total += q38map[getStr(a, 'q38')] ?? 0

  // Q39 — menstrual products multi
  const q39 = getArr(a, 'q39')
  let s39 = 0
  for (const v of q39) {
    if (v === 'cup' || v === 'cloth') s39 += 3
    if (v === 'regularUnscented') s39 += 2
    if (v === 'tampon') s39 += 1
    if (v === 'scented') s39 -= 2
  }
  total += clamp(s39, 0, 4)

  const q40map: Record<string, number> = { yes: 4, heardIssues: 2, never: 0 }
  total += q40map[getStr(a, 'q40')] ?? 0

  const q41map: Record<string, number> = { cotton: 4, mixed: 2, synthetic: 0, noAttention: 1 }
  total += q41map[getStr(a, 'q41')] ?? 0

  return total // max 24
}

// ─── Final calculation ──────────────────────────────────────────────────────

export function calculateScore(answers: Answers): ScoreResult {
  const { points: bmiPoints, bmi } = scoreBmi(answers)
  const diet        = scoreDiet(answers)
  const supplements = scoreSupplements(answers)
  const stress      = scoreStress(answers)
  const exercise    = scoreExercise(answers)
  const kitchen     = scoreKitchen(answers)
  const personalCare = scorePersonalCare(answers)

  const dietMax = 44; const supplementsMax = 16; const stressMax = 20
  const exerciseMax = 8; const kitchenMax = 24; const personalCareMax = 24; const bmiMax = 4

  const weighted =
    (diet / dietMax)           * 25 +
    (supplements / supplementsMax) * 15 +
    (stress / stressMax)       * 20 +
    (exercise / exerciseMax)   * 10 +
    (kitchen / kitchenMax)     * 15 +
    (personalCare / personalCareMax) * 10 +
    (bmiPoints / bmiMax)       * 5

  const finalScore = Math.round(clamp(weighted, 0, 100))

  let scoreCategory: string
  let scoreCategoryAr: string
  if (finalScore >= 85) { scoreCategory = 'excellent'; scoreCategoryAr = 'ممتاز' }
  else if (finalScore >= 65) { scoreCategory = 'good'; scoreCategoryAr = 'جيد' }
  else if (finalScore >= 40) { scoreCategory = 'needs_improvement'; scoreCategoryAr = 'بحاجة لتحسين' }
  else { scoreCategory = 'urgent'; scoreCategoryAr = 'تحتاج تدخلاً عاجلاً' }

  return {
    finalScore,
    scoreCategory,
    scoreCategoryAr,
    bmi,
    sectionScores: {
      diet, dietMax,
      supplements, supplementsMax,
      stress, stressMax,
      exercise, exerciseMax,
      kitchen, kitchenMax,
      personalCare, personalCareMax,
      bmi: bmiPoints, bmiMax,
    },
  }
}
