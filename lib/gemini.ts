import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { Answers, SectionScores } from './scoring'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Verify model string against Google AI docs at build time.
const MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT = `أنتِ كاتبة نصوص إقناعية متخصصة في الصحة الإنجابية والتغذية الوظيفية، تعملين تحت إشراف الأخصائية مها حمّص من فريق PregnaWell.

ستتلقين: درجة الخصوبة المحسوبة، وتفصيل الدرجات بالمحاور السبعة، وإجابات المستخدمة الكاملة.

مهمتكِ: كتابة تقرير مقنع وشخصي بأسلوب رسالة المبيعات — قصير، مؤثر، يقود المستخدمة مباشرة إلى حجز المكالمة التقييمية.

هيكل التقرير (اتبعيه بدقة):
١. الخطّاف (hook): جملة أو جملتان تضربان في الصميم. أبرز نتيجة واحدة مؤثرة من درجتها أو إجاباتها. لا مقدمات.
٢. السرد الإقناعي (narrative) — ٤ إلى ٦ فقرات متدفقة:
   • الفقرة الأولى: صفي وضعها الحالي بدقة، بناءً على إجاباتها الفعلية. اجعليها تشعر أنكِ تعرفينها.
   • الفقرة الثانية: أوضحي ما تكلفها هذه العوامل إذا استمرت دون معالجة — ليس تخويفاً، بل وضوح.
   • الفقرة الثالثة: افتحي الأفق — ما الذي يصبح ممكناً حين تُعالَج هذه العوامل؟
   • الفقرة الرابعة: قدّمي المكالمة التقييمية بوصفها الأداة التي تحوّل هذا الفهم إلى خطة.
   • الفقرة الخامسة (الإغلاق): دعوة مباشرة وعاجلة للحجز.
٣. جملة الإغلاق (closingLine): جملة واحدة قصيرة وحادة تسبق زر الحجز مباشرة.

قواعد صارمة:
- العربية الفصحى حصراً.
- لا تذكري أرقام الأسئلة أو مفاتيح البيانات.
- خاطبي المستخدمة بصيغة المؤنث المفرد.
- لا تشخيص طبي، ولا توصية بأدوية.
- لا قوائم، لا عناوين فرعية — النص متدفق فقط.
- إذا كانت الدرجة ممتازة: اربطي الحجز بالحفاظ على هذا المستوى وتعزيزه.
- إذا كانت الدرجة منخفضة: اربطيه بأهمية التدخل المبكر.
- التزمي بمخطط JSON المحدد تماماً — ثلاثة حقول فقط: hook, narrative, closingLine.`

export interface ReportNarrative {
  hook: string
  narrative: string
  closingLine: string
}

export async function generateReport(input: {
  score: number
  scoreCategoryAr: string
  sectionScores: SectionScores
  answers: Answers
  age: string
  bmi: number
}): Promise<ReportNarrative> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          hook:        { type: SchemaType.STRING },
          narrative:   { type: SchemaType.STRING },
          closingLine: { type: SchemaType.STRING },
        },
        required: ['hook', 'narrative', 'closingLine'],
      },
    },
  })

  const prompt = `
درجة الخصوبة: ${input.score}/100
التصنيف: ${input.scoreCategoryAr}
مؤشر كتلة الجسم: ${input.bmi}
الفئة العمرية: ${input.age}

درجات المحاور:
- التغذية والنظام الغذائي: ${input.sectionScores.diet}/${input.sectionScores.dietMax} (${Math.round((input.sectionScores.diet / input.sectionScores.dietMax) * 100)}%)
- المكملات والأعشاب: ${input.sectionScores.supplements}/${input.sectionScores.supplementsMax} (${Math.round((input.sectionScores.supplements / input.sectionScores.supplementsMax) * 100)}%)
- النوم والتوتر: ${input.sectionScores.stress}/${input.sectionScores.stressMax} (${Math.round((input.sectionScores.stress / input.sectionScores.stressMax) * 100)}%)
- النشاط البدني: ${input.sectionScores.exercise}/${input.sectionScores.exerciseMax} (${Math.round((input.sectionScores.exercise / input.sectionScores.exerciseMax) * 100)}%)
- المطبخ وتحضير الطعام: ${input.sectionScores.kitchen}/${input.sectionScores.kitchenMax} (${Math.round((input.sectionScores.kitchen / input.sectionScores.kitchenMax) * 100)}%)
- العناية الشخصية: ${input.sectionScores.personalCare}/${input.sectionScores.personalCareMax} (${Math.round((input.sectionScores.personalCare / input.sectionScores.personalCareMax) * 100)}%)
- مؤشر كتلة الجسم: ${input.sectionScores.bmi}/${input.sectionScores.bmiMax}

إجابات المستخدمة: ${JSON.stringify(input.answers, null, 2)}

اكتبي التقرير الآن.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text) as ReportNarrative
}
