import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { Answers, SectionScores } from './scoring'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT = `أنتِ كاتبة نصوص إقناعية متخصصة في الصحة الإنجابية والتغذية الوظيفية، تعملين تحت إشراف الأخصائية مها حمّص من فريق PregnaWell.

ستتلقين: درجة المستخدمة ومستوى تقييمها، وعدد نقاط الضعف التي ظهرت في تقريرها العلمي.

التقرير العلمي التفصيلي قد عُرض بالفعل للمستخدمة — مهمتكِ ليست إعادة شرح النقاط العلمية.

مهمتكِ: كتابة فقرتين إلى ثلاث فقرات إقناعية فقط تقود المستخدمة نحو حجز المكالمة التقييمية.

هيكل الفقرات:
الفقرة الأولى — الجسر العاطفي: أنتِ الآن تعرفين ما يحدث في جسمك. هذه المعرفة ثمينة — لكنها وحدها لا تكفي لتغيير شيء.
الفقرة الثانية — الفجوة: بين معرفة المشكلة وبناء خطة حقيقية مخصصة فجوة كبيرة. وهذه الفجوة تحديداً هي ما تسده المكالمة التقييمية مع فريق PregnaWell.
الفقرة الثالثة — الدعوة المباشرة: دعوة عاجلة وشخصية للحجز. اربطيها بمستوى الدرجة — إذا كانت منخفضة: التدخل المبكر يُحدث الفارق والوقت عامل. إذا كانت مرتفعة: الحفاظ على هذا المستوى يحتاج خطة واعية وليس الاكتفاء بالمعرفة.

قواعد صارمة:
- العربية الفصحى حصراً.
- لا تُعيدي شرح أي نقطة علمية — هذا تم بالفعل في التقرير.
- خاطبي المستخدمة بصيغة المؤنث المفرد.
- لا تشخيص طبي، ولا توصية بأدوية بأسمائها.
- النص متدفق كفقرات — لا قوائم، لا عناوين فرعية، لا bullet points.
- التزمي بمخطط JSON المحدد — حقل واحد فقط: narrative.`

export interface ReportNarrative {
  narrative: string
  triggeredSentences?: string[]
}

export async function generateReport(input: {
  score: number
  scoreCategory: string
  scoreCategoryAr: string
  scoreLevelText: string
  triggeredSentences: string[]
  sectionScores: SectionScores
  answers: Answers
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
          narrative: { type: SchemaType.STRING },
        },
        required: ['narrative'],
      },
    },
  })

  const weakCount = input.triggeredSentences.length
  const strengthNote = weakCount === 0
    ? 'لم تظهر نقاط ضعف واضحة — النتيجة قوية جداً'
    : `ظهرت ${weakCount} نقطة ضعف في تقريرها العلمي`

  const prompt = `درجة المستخدمة: ${input.score}/100
مستوى التقييم: ${input.scoreCategoryAr}
${strengthNote}

اكتبي الآن الفقرات الإقناعية لحجز المكالمة.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text) as ReportNarrative
}
