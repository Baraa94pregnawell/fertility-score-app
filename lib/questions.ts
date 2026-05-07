// UI content only — question IDs, Arabic text, input type, answer labels.
// NO point values here. All scoring lives in lib/scoring.ts.

export type QuestionType = 'single' | 'multi' | 'number'

export interface Option { value: string; label: string }

export interface Question {
  id: string
  text: string
  helperText?: string
  type: QuestionType
  options?: Option[]
  unit?: string
  required: boolean
  sectionId: number
}

export interface Section {
  id: number
  label: string
  englishRef: string
}

export const SECTIONS: Section[] = [
  { id: 1, label: 'المعلومات الأساسية', englishRef: 'Basic Info' },
  { id: 2, label: 'التغذية والنظام الغذائي', englishRef: 'Diet & Nutrition' },
  { id: 3, label: 'المكملات والأعشاب', englishRef: 'Supplements & Herbs' },
  { id: 4, label: 'النوم والتوتر', englishRef: 'Sleep & Stress' },
  { id: 5, label: 'النشاط البدني', englishRef: 'Exercise' },
  { id: 6, label: 'المطبخ وتحضير الطعام', englishRef: 'Kitchen & Food Prep' },
  { id: 7, label: 'العناية الشخصية', englishRef: 'Personal Care & Clothing' },
]

export const QUESTIONS: Question[] = [
  // ── Section 1 ──────────────────────────────────────────────────
  {
    id: 'q1', sectionId: 1, type: 'single', required: true,
    text: 'كم عمرك؟',
    options: [
      { value: 'under25', label: 'أقل من 25 سنة' },
      { value: '25to30', label: 'من 25 إلى 30 سنة' },
      { value: '31to35', label: 'من 31 إلى 35 سنة' },
      { value: '36to40', label: 'من 36 إلى 40 سنة' },
      { value: 'over40', label: 'أكثر من 40 سنة' },
    ],
  },
  {
    id: 'q2', sectionId: 1, type: 'number', required: true,
    text: 'ما هو طولك؟', unit: 'سم',
    helperText: 'الطول بالسنتيمتر',
  },
  {
    id: 'q3', sectionId: 1, type: 'number', required: true,
    text: 'ما هو وزنك؟', unit: 'كغ',
    helperText: 'الوزن بالكيلوغرام',
  },

  // ── Section 2 ──────────────────────────────────────────────────
  {
    id: 'q4', sectionId: 2, type: 'multi', required: true,
    text: 'هل جربتِ يوماً أي من هذه الأنظمة الغذائية؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'keto', label: 'الكيتو' },
      { value: 'if', label: 'الصيام المتقطع' },
      { value: 'lowcarb', label: 'Low carb (تقليل النشويات)' },
      { value: 'paleo', label: 'الباليو' },
      { value: 'vegan', label: 'النظام النباتي الكامل (Vegan)' },
      { value: 'lowcal', label: 'نظام منخفض السعرات الحرارية' },
      { value: 'carnivore', label: 'حمية رجل الكهف' },
      { value: 'none', label: 'ما جربت شي' },
    ],
  },
  {
    id: 'q5', sectionId: 2, type: 'single', required: true,
    text: 'هل تقللين النشويات بشكل مستمر الآن؟',
    options: [
      { value: 'always', label: 'نعم، أتجنب الكربوهيدرات دائماً' },
      { value: 'sometimes', label: 'أحياناً أقللها' },
      { value: 'no', label: 'لا، آكل كربوهيدرات بشكل طبيعي' },
      { value: 'dontknow', label: 'ما أعرف ماهي النشويات بالضبط' },
    ],
  },
  {
    id: 'q6', sectionId: 2, type: 'single', required: true,
    text: 'هل تقللين الحليب ومنتجاته؟',
    options: [
      { value: 'avoid', label: 'نعم، أتجنبها كلياً' },
      { value: 'sometimes', label: 'أقللها أحياناً' },
      { value: 'no', label: 'لا، آكلها بشكل طبيعي' },
      { value: 'dontknow', label: 'ما أعرف إذا كانت مشكلة أو لا' },
    ],
  },
  {
    id: 'q9', sectionId: 2, type: 'single', required: true,
    text: 'هل لاحظتِ كلمة "نكهات مضافة" أو "added flavors" في مكونات طعامك؟',
    options: [
      { value: 'noticeAvoid', label: 'نعم، ألاحظها وأتجنب المنتج' },
      { value: 'noticeIgnore', label: 'نعم، لاحظتها لكن ما كنت أعرف أهميتها' },
      { value: 'noNotice', label: 'لا، ما انتبهت لهاي الأشياء' },
      { value: 'neverRead', label: 'ما أقرأ المكونات أبداً' },
    ],
  },
  {
    id: 'q10', sectionId: 2, type: 'single', required: true,
    text: 'كم حصة خضار تأكلين يومياً؟',
    helperText: 'الحصة = حفنة أو نصف كوب',
    options: [
      { value: 'none', label: 'لا آكل خضار تقريباً' },
      { value: 'one', label: 'حصة واحدة' },
      { value: 'two', label: 'حصتين' },
      { value: 'threeplus', label: '3 حصص أو أكثر' },
    ],
  },
  {
    id: 'q11', sectionId: 2, type: 'single', required: true,
    text: 'كم حصة فاكهة تأكلين يومياً؟',
    options: [
      { value: 'none', label: 'لا آكل فاكهة تقريباً' },
      { value: 'one', label: 'حصة واحدة' },
      { value: 'two', label: 'حصتين' },
      { value: 'threeplus', label: '3 حصص أو أكثر' },
    ],
  },
  {
    id: 'q12', sectionId: 2, type: 'single', required: true,
    text: 'هل تعرفين كم غرام بروتين يجب أن تأكليه يومياً؟',
    options: [
      { value: 'knowApply', label: 'نعم، وأنا آكل الكمية الصح' },
      { value: 'knowNoApply', label: 'نعم، لكن ما أطبقها دائماً' },
      { value: 'dontknow', label: 'لا، ما أعرف' },
      { value: 'neverThought', label: 'ما فكرت بالموضوع أبداً' },
    ],
  },
  {
    id: 'q13', sectionId: 2, type: 'single', required: true,
    text: 'هل تشربين بروتين شيك أو تأخذين بروتين باودر؟',
    options: [
      { value: 'never', label: 'لا أبداً' },
      { value: 'sometimes', label: 'أحياناً (مرة أو مرتين بالأسبوع)' },
      { value: 'regularly', label: 'بشكل منتظم (3 مرات أو أكثر بالأسبوع)' },
    ],
  },
  {
    id: 'q15', sectionId: 2, type: 'multi', required: true,
    text: 'هل سبق وحاولتِ إنقاص وزنك بطريقة سريعة؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'crash', label: 'نعم، كراش دايت (أقل من 1000 سعرة)' },
      { value: 'longFast', label: 'نعم، صيام طويل' },
      { value: 'skipMeal', label: 'نعم، حذفت وجبة كاملة لفترة' },
      { value: 'skipBreakfast', label: 'احذف فقط الفطور أو العشاء' },
      { value: 'none', label: 'لا، ما جربت هيك أشياء' },
    ],
  },
  {
    id: 'q16', sectionId: 2, type: 'multi', required: true,
    text: 'هل استخدمتِ حقن أو أدوية إنقاص الوزن سابقاً؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'ozempic', label: 'نعم، أوزمبيك (Ozempic)' },
      { value: 'saxenda', label: 'نعم، ساكسندا (Saxenda)' },
      { value: 'mounjaro', label: 'مونجارو' },
      { value: 'otherDrugs', label: 'نعم، أدوية تنحيف أخرى' },
      { value: 'surgery', label: 'نعم، تكميم أو ربط معدة' },
      { value: 'none', label: 'لا، لم أستخدم أي شيء من هذا' },
    ],
  },
  {
    id: 'q17', sectionId: 2, type: 'multi', required: true,
    text: 'هل تستخدمين محليات صناعية؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'sugar', label: 'لا، أستخدم سكر عادي' },
      { value: 'honey', label: 'عسل طبيعي' },
      { value: 'stevia', label: 'ستيفيا' },
      { value: 'sucralose', label: 'سكرالوز (سبليندا)' },
      { value: 'aspartame', label: 'أسبارتام (دايت كولا وغيرها)' },
      { value: 'none', label: 'لا أستخدم أي محلي' },
    ],
  },

  // ── Section 3 ──────────────────────────────────────────────────
  {
    id: 'q18', sectionId: 3, type: 'single', required: true,
    text: 'كم مكمل غذائي تأخذين يومياً؟',
    options: [
      { value: 'none', label: 'لا آخذ شي' },
      { value: '1to2', label: '1 إلى 2' },
      { value: '3to5', label: '3 إلى 5' },
      { value: '6plus', label: '6 أو أكثر' },
    ],
  },
  {
    id: 'q19', sectionId: 3, type: 'multi', required: true,
    text: 'أي من هذه المكملات تأخذينها؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'vitD', label: 'فيتامين D' },
      { value: 'vitB', label: 'فيتامين B complex' },
      { value: 'iron', label: 'حديد (Iron)' },
      { value: 'zinc', label: 'زنك (Zinc)' },
      { value: 'omega3', label: 'أوميغا 3 (زيت السمك)' },
      { value: 'magnesium', label: 'ماغنيسيوم' },
      { value: 'multi', label: 'مولتي فيتامين عام' },
      { value: 'prenatal', label: 'فيتامينات ما قبل الحمل (Prenatal)' },
      { value: 'folic', label: 'حمض الفوليك (Folic acid)' },
      { value: 'collagen', label: 'كولاجين' },
      { value: 'spirulina', label: 'سبيرولينا' },
      { value: 'biotin', label: 'بيوتين (Biotin)' },
      { value: 'none', label: 'ما آخذ شي' },
    ],
  },
  {
    id: 'q20', sectionId: 3, type: 'multi', required: true,
    text: 'هل تأخذين أي من هذه الأعشاب؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'ashwagandha', label: 'أشواغاندا (Ashwagandha)' },
      { value: 'vitex', label: 'فيتيكس (Vitex / Chasteberry)' },
      { value: 'maca', label: 'ماكا (Maca root)' },
      { value: 'redClover', label: 'برسيم أحمر (Red clover)' },
      { value: 'eveningPrimrose', label: 'زهرة الربيع المسائية (Evening primrose)' },
      { value: 'blackSeed', label: 'زيت حبة البركة' },
      { value: 'kafMaryam', label: 'كف مريم' },
      { value: 'qustHindi', label: 'القسط الهندي' },
      { value: 'licorice', label: 'عرق السوس' },
      { value: 'ginger', label: 'شاي الزنجبيل يومياً' },
      { value: 'turmeric', label: 'الكركم بكميات كبيرة يومياً' },
      { value: 'cinnamon', label: 'القرفة بكميات كبيرة يومياً' },
      { value: 'fenugreek', label: 'الحلبة' },
      { value: 'fennel', label: 'الشبث (الشمر)' },
      { value: 'chamomile', label: 'البابونج يومياً' },
      { value: 'sage', label: 'المريمية' },
      { value: 'anise', label: 'اليانسون' },
      { value: 'none', label: 'ما آخذ شي من هذه' },
    ],
  },
  {
    id: 'q21', sectionId: 3, type: 'single', required: true,
    text: 'كيف اخترتِ المكملات التي تأخذينها؟',
    options: [
      { value: 'doctor', label: 'بناءً على توصية طبيب أو أخصائية تغذية' },
      { value: 'articles', label: 'قرأت عنها في مواقع أو مقالات' },
      { value: 'friendFamily', label: 'نصحتني صديقة أو أحد من العائلة' },
      { value: 'socialMedia', label: 'شفت إعلاناً أو محتوى على السوشيال ميديا' },
      { value: 'dontknow', label: 'ما أعرف، اشتريتها لأنها كانت موجودة' },
    ],
  },

  // ── Section 4 ──────────────────────────────────────────────────
  {
    id: 'q22', sectionId: 4, type: 'single', required: true,
    text: 'كم ساعة تنامين بالليل بالمعدل؟',
    options: [
      { value: 'under5', label: 'أقل من 5 ساعات' },
      { value: '5to6', label: 'من 5 إلى 6 ساعات' },
      { value: '6to7', label: 'من 6 إلى 7 ساعات' },
      { value: '7to8', label: 'من 7 إلى 8 ساعات' },
      { value: 'over8', label: 'أكثر من 8 ساعات' },
    ],
  },
  {
    id: 'q23', sectionId: 4, type: 'single', required: true,
    text: 'هل تصحين من النوم في منتصف الليل؟',
    options: [
      { value: 'never', label: 'لا، نومي متواصل' },
      { value: 'sometimes', label: 'أحياناً (مرة أو مرتين بالأسبوع)' },
      { value: 'usually', label: 'في الغالب (معظم الليالي)' },
      { value: 'always', label: 'دائماً، ما أكمل ليلة بدون ما أصحى' },
    ],
  },
  {
    id: 'q24', sectionId: 4, type: 'single', required: true,
    text: 'كيف تصفين مستوى التوتر عندك معظم الأيام؟',
    options: [
      { value: 'calm', label: 'هادئة ومرتاحة في الغالب' },
      { value: 'mild', label: 'توتر خفيف لكن أتعامل معه' },
      { value: 'clear', label: 'توتر واضح يأثر على يومي' },
      { value: 'severe', label: 'توتر شديد ومستمر ما أقدر أتحكم فيه' },
    ],
  },
  {
    id: 'q25', sectionId: 4, type: 'multi', required: true,
    text: 'لما تحسين بالتوتر أو القلق، شو تعملين؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'talk', label: 'أتكلم مع شخص قريب مني' },
      { value: 'walk', label: 'أمشي أو أتمرن' },
      { value: 'scroll', label: 'أتصفح الجوال' },
      { value: 'eat', label: 'آكل أكثر من المعتاد' },
      { value: 'sleep', label: 'أنام' },
      { value: 'cry', label: 'أبكي وأحتفظ بكل شي لحالي' },
      { value: 'nothing', label: 'ما أعمل شي' },
    ],
  },
  {
    id: 'q26', sectionId: 4, type: 'single', required: true,
    text: 'هل تستخدمين الجوال أو تشاهدين شاشات قبل النوم بأقل من ساعة؟',
    options: [
      { value: 'no', label: 'لا، أوقف الشاشات قبل النوم بساعة على الأقل' },
      { value: 'sometimes', label: 'أحياناً' },
      { value: 'usually', label: 'في الغالب نعم' },
      { value: 'always', label: 'دائماً، الجوال معي حتى وأنا أنام' },
    ],
  },

  // ── Section 5 ──────────────────────────────────────────────────
  {
    id: 'q27', sectionId: 5, type: 'single', required: true,
    text: 'كم مرة تتمرنين بالأسبوع؟',
    options: [
      { value: 'never', label: 'لا أتمرن أبداً' },
      { value: 'onceOrLess', label: 'مرة واحدة أو أقل' },
      { value: '2to3', label: 'مرتين إلى 3 مرات' },
      { value: '4to5', label: '4 إلى 5 مرات' },
      { value: '6to7', label: '6 إلى 7 مرات' },
    ],
  },
  {
    id: 'q28', sectionId: 5, type: 'multi', required: true,
    text: 'ما نوع التمرين الذي تمارسينه؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'walking', label: 'مشي خفيف' },
      { value: 'yoga', label: 'يوغا أو تمارين تنفس' },
      { value: 'swimming', label: 'سباحة' },
      { value: 'running', label: 'ركض' },
      { value: 'weights', label: 'رفع أثقال' },
      { value: 'hiit', label: 'تمارين عالية الكثافة (HIIT)' },
      { value: 'dance', label: 'رقص أو زومبا' },
      { value: 'none', label: 'لا أتمرن' },
    ],
  },

  // ── Section 6 ──────────────────────────────────────────────────
  {
    id: 'q30', sectionId: 6, type: 'single', required: true,
    text: 'هل تعرفين كيف تختارين الزيت المناسب للطبخ؟',
    options: [
      { value: 'yes', label: 'نعم، أعرف أي زيت يناسب أي درجة حرارة' },
      { value: 'heard', label: 'سمعت عن الموضوع لكن مش متأكدة' },
      { value: 'no', label: 'لا، أستخدم نفس الزيت لكل شيء' },
      { value: 'neverThought', label: 'ما فكرت بالموضوع قبل' },
    ],
  },
  {
    id: 'q31', sectionId: 6, type: 'multi', required: true,
    text: 'ما نوع أواني الطبخ التي تستخدمينها؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'teflon', label: 'مقالي تيفلون أو نون ستيك' },
      { value: 'steel', label: 'ستيل (Stainless steel)' },
      { value: 'castIron', label: 'حديد زهر (Cast iron)' },
      { value: 'ceramic', label: 'سيراميك' },
      { value: 'aluminum', label: 'ألمنيوم' },
      { value: 'dontknow', label: 'ما أعرف نوعها' },
    ],
  },
  {
    id: 'q32', sectionId: 6, type: 'single', required: true,
    text: 'هل تستخدمين أدوات مطبخ من السيليكون؟',
    options: [
      { value: 'mostlySilicone', label: 'نعم، معظم أدواتي سيليكون' },
      { value: 'someSilicone', label: 'بعضها سيليكون' },
      { value: 'noSilicone', label: 'لا، أستخدم معدن أو خشب' },
      { value: 'dontknow', label: 'ما أعرف' },
    ],
  },
  {
    id: 'q33', sectionId: 6, type: 'single', required: true,
    text: 'هل تستخدمين ورق الزبدة أو ورق الألمنيوم في الطبخ؟',
    options: [
      { value: 'parchment', label: 'ورق زبدة دائماً' },
      { value: 'aluminum', label: 'ورق ألمنيوم دائماً' },
      { value: 'both', label: 'أحياناً هذا وأحياناً ذاك' },
      { value: 'neither', label: 'ما أستخدم أي منهما' },
    ],
  },
  {
    id: 'q34', sectionId: 6, type: 'single', required: true,
    text: 'ما نوع الماء الذي تشربينه في الغالب؟',
    options: [
      { value: 'tap', label: 'ماء صنبور مباشرة' },
      { value: 'filtered', label: 'ماء مفلتر (فلتر في البيت)' },
      { value: 'smallPlastic', label: 'ماء معبأ في زجاجات بلاستيك صغيرة' },
      { value: 'gallon', label: 'ماء معبأ في قلل كبيرة (غالون)' },
    ],
  },
  {
    id: 'q35', sectionId: 6, type: 'multi', required: true,
    text: 'كيف تحفظين الأكل في الغالب؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'plastic', label: 'أوعية بلاستيك' },
      { value: 'glass', label: 'أوعية زجاج' },
      { value: 'aluminumFoil', label: 'ورق ألمنيوم' },
      { value: 'wrap', label: 'نايلون أو بلاستيك ملفوف' },
      { value: 'eatFresh', label: 'آكل الأكل مباشرة ما أخزنه كثير' },
    ],
  },

  // ── Section 7 ──────────────────────────────────────────────────
  {
    id: 'q36', sectionId: 7, type: 'single', required: true,
    text: 'هل قرأتِ يوماً المكونات على كريم جسمك أو لوشن؟',
    options: [
      { value: 'always', label: 'نعم، دائماً أقرأ المكونات قبل ما أشتري' },
      { value: 'sometimes', label: 'أحياناً' },
      { value: 'rarely', label: 'نادراً' },
      { value: 'never', label: 'لا، ما نظرت إليها يوماً' },
    ],
  },
  {
    id: 'q37', sectionId: 7, type: 'single', required: true,
    text: 'هل قرأتِ يوماً مكونات العطر أو البخاخ الذي تستخدمينه؟',
    options: [
      { value: 'always', label: 'نعم، دائماً أتحقق من المكونات' },
      { value: 'sometimes', label: 'أحياناً' },
      { value: 'rarely', label: 'نادراً' },
      { value: 'never', label: 'لا أبداً' },
    ],
  },
  {
    id: 'q38', sectionId: 7, type: 'single', required: true,
    text: 'هل تستخدمين ديودورانت أو مضاد للتعرق يومياً؟',
    options: [
      { value: 'everyday', label: 'نعم، كل يوم بدون استثناء' },
      { value: 'mostDays', label: 'معظم الأيام' },
      { value: 'sometimes', label: 'أحياناً' },
      { value: 'rarely', label: 'نادراً أو لا أستخدم' },
    ],
  },
  {
    id: 'q39', sectionId: 7, type: 'multi', required: true,
    text: 'ما نوع الفوط الصحية التي تستخدمينها؟',
    helperText: 'يمكنكِ اختيار أكثر من إجابة',
    options: [
      { value: 'regularUnscented', label: 'فوط عادية بدون عطر' },
      { value: 'scented', label: 'فوط معطرة' },
      { value: 'tampon', label: 'تامبون' },
      { value: 'cup', label: 'كأس الحيض (Menstrual cup)' },
      { value: 'cloth', label: 'فوط قماشية قابلة لإعادة الاستخدام' },
      { value: 'dontknow', label: 'ما أعرف ايش نوع اللي أستخدمه' },
    ],
  },
  {
    id: 'q40', sectionId: 7, type: 'single', required: true,
    text: 'هل قرأتِ يوماً مكونات الفوط الصحية؟',
    options: [
      { value: 'yes', label: 'نعم، أعرف بالضبط ماذا تحتوي' },
      { value: 'heardIssues', label: 'سمعت إن فيها مشاكل لكن ما تحققت' },
      { value: 'never', label: 'لا، ما فكرت في الأمر يوماً' },
    ],
  },
  {
    id: 'q41', sectionId: 7, type: 'single', required: true,
    text: 'ملابسك في الغالب من أي نوع قماش؟',
    options: [
      { value: 'cotton', label: 'قطن في الغالب' },
      { value: 'mixed', label: 'خليط بين القطن والصناعي' },
      { value: 'synthetic', label: 'صناعي في الغالب (بوليستر، نايلون)' },
      { value: 'noAttention', label: 'ما أنتبه لنوع القماش' },
    ],
  },
]
