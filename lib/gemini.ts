import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { Answers, SectionScores } from './scoring'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT = `أنتِ أخصائية تغذية وظيفية متخصصة في صحة الخصوبة، تعملين تحت إشراف الأخصائية مها حمّص من فريق PregnaWell.

ستتلقين:
- نتيجة المستخدمة ومستوى تقييمها
- قائمة بنقاط الضعف المحددة التي ظهرت في إجاباتها (الجمل المُفعَّلة)
- ملخص درجات المحاور الاثني عشر

مهمتكِ: كتابة تقرير سردي شخصي ودافئ يشرح لكل نقطة ضعف لماذا تؤثر على الخصوبة من منظور علمي — بلغة واضحة، غير قاسية، تُشعر المستخدمة بأنها مفهومة وليست مُحكوماً عليها.

هيكل التقرير (اتبعيه بدقة):

لكل جملة في قائمة "الجمل المُفعَّلة":
- اذكريها بشكل مدمج في الفقرة (لا تذكريها حرفياً ككوتيشن)
- اشرحي في جملتين إلى ثلاث: لماذا تؤثر هذه العادة أو هذا النمط على الخصوبة، ما الذي يحدث في الجسم بسببها، وما الإمكانية الموجودة إذا عُولجت.
- الأسلوب: سريري ودافئ في نفس الوقت — معلومة حقيقية بلغة إنسانية.

ختامي ثابت (لا تكتبيه — سيُضاف آلياً): لا تضيفي أي جملة إغلاق أو دعوة للحجز، هذا سيُضاف تلقائياً بعد نصك.

قواعد صارمة:
- العربية الفصحى حصراً.
- لا تذكري أرقام الأسئلة أو مفاتيح البيانات التقنية.
- خاطبي المستخدمة بصيغة المؤنث المفرد.
- لا تشخيص طبي، ولا توصية بأدوية بأسمائها.
- النص متدفق كفقرات — لا قوائم، لا عناوين فرعية، لا bullet points.
- إذا كانت قائمة الجمل المُفعَّلة فارغة: اكتبي فقرة قصيرة واحدة تُهنئ المستخدمة على نتيجتها القوية وتشجعها على المكالمة لمعرفة كيف تحافظ على هذا المستوى.
- التزمي بمخطط JSON المحدد — حقل واحد فقط: narrative.`

export interface ReportNarrative {
  narrative: string
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

  const pillarsText = Object.entries(input.sectionScores)
    .map(([key, val]) => {
      const labels: Record<string, string> = {
        basicInfo: 'المعلومات الأساسية',
        diet: 'التغذية والنظام الغذائي',
        supplements: 'المكملات والأعشاب',
        stress: 'التوتر والنوم',
        exercise: 'الرياضة والحركة',
        kitchen: 'المطبخ وطريقة الطبخ',
        personalCare: 'العناية الشخصية',
        menstrual: 'الدورة الشهرية',
        caffeine: 'الكافيين والمشروبات',
        infoSources: 'مصادر المعلومات',
        thyroid: 'أعراض الغدة الدرقية',
        maleFactor: 'عامل الذكورة',
      }
      return `${labels[key] ?? key}: ${val.pct}%`
    })
    .join('\n')

  const triggeredText = input.triggeredSentences.length > 0
    ? input.triggeredSentences.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '(لا توجد نقاط ضعف واضحة — النتيجة قوية)'

  const prompt = `درجة المستخدمة: ${input.score}/100
مستوى التقييم: ${input.scoreCategoryAr}
مؤشر كتلة الجسم: ${input.bmi}

ملخص المحاور:
${pillarsText}

الجمل المُفعَّلة (نقاط الضعف التي ظهرت في إجاباتها):
${triggeredText}

اكتبي الآن التقرير السردي.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text) as ReportNarrative
}
