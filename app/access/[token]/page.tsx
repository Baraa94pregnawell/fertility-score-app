import { validateToken } from '@/lib/tokens'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Props {
  params: { token: string }
}

export default async function AccessPage({ params }: Props) {
  const { token } = params
  const result = await validateToken(token)

  // State C — invalid
  if (!result.valid && result.reason === 'not_found') {
    return (
      <ErrorState
        headline="هذا الرابط غير صالح"
        support="إذا كنتِ تعتقدين أن هذا خطأ، يُرجى التواصل معنا على hello@pregnawell.com"
      />
    )
  }

  // State D — revoked
  if (!result.valid && result.reason === 'revoked') {
    return (
      <ErrorState
        headline="انتهت صلاحية هذا الرابط"
        support="للمساعدة يُرجى التواصل معنا على hello@pregnawell.com"
      />
    )
  }

  if (!result.record) {
    return <ErrorState headline="هذا الرابط غير صالح" support="يُرجى التواصل معنا على hello@pregnawell.com" />
  }

  // Get submissions for this token
  const submissions = await prisma.questionnaireSubmission.findMany({
    where: { tokenId: result.record.id },
    include: { report: true },
    orderBy: { submittedAt: 'desc' },
  })

  // State A — first visit
  if (submissions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-cream)' }}>
        <div className="w-full max-w-lg text-center">
          {/* Logo placeholder */}
          <div className="mb-8 flex justify-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--purple-deep)' }}>
              PregnaWell
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--purple-deep)' }}>
            مرحباً بكِ في اختبار درجة الخصوبة
          </h1>
          <p className="text-base mb-6" style={{ color: '#6B5E7A' }}>
            طوّرته الأخصائية مها حمّص | PregnaWell
          </p>

          <div className="rounded-2xl p-6 mb-8 text-right" style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-dark)' }}>
              ستجيبين على مجموعة من الأسئلة المتعلقة بنمط حياتكِ وتغذيتكِ وبيئتكِ. بناءً على إجاباتكِ، سيُولَّد النظام تقريراً شخصياً يُقيّم العوامل المؤثرة على خصوبتكِ من منظور علم التغذية الوظيفية.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-medium" style={{ color: '#6B5E7A' }}>المدة المتوقعة: من ٥ إلى ١٠ دقائق</span>
              <span>⏱</span>
            </div>
          </div>

          <Link
            href={`/questionnaire/${token}`}
            className="inline-block w-full py-4 px-8 rounded-xl text-white text-lg font-semibold text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--rose-dusty)' }}
          >
            ابدئي الاختبار
          </Link>
        </div>
      </div>
    )
  }

  // State B — returning user
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--purple-deep)' }}>
            PregnaWell
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: 'var(--purple-deep)' }}>
          مرحباً بعودتكِ
        </h1>
        <p className="text-center mb-8" style={{ color: '#6B5E7A' }}>
          لديكِ تقرير سابق متاح للمراجعة
        </p>

        <div className="space-y-3 mb-8">
          {submissions.map((sub) => (
            sub.report ? (
              <div
                key={sub.id}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ backgroundColor: 'white', border: '1px solid #E8DFF0' }}
              >
                <div>
                  <div className="font-semibold" style={{ color: 'var(--purple-deep)' }}>
                    درجة الخصوبة: {sub.report.fertilityScore}/100
                  </div>
                  <div className="text-sm" style={{ color: '#6B5E7A' }}>
                    {new Date(sub.submittedAt).toLocaleDateString('ar-SA', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                </div>
                <Link
                  href={`/report/${sub.report.slug}`}
                  className="py-2 px-4 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: 'var(--purple-deep)' }}
                >
                  عرض تقريري
                </Link>
              </div>
            ) : null
          ))}
        </div>

        <p className="text-center text-sm mb-4" style={{ color: '#6B5E7A' }}>
          يمكنكِ إعادة الاختبار في أي وقت للحصول على تقرير محدَّث يعكس التغييرات في نمط حياتكِ.
        </p>
        <Link
          href={`/questionnaire/${token}`}
          className="inline-block w-full py-3 px-8 rounded-xl text-center font-semibold transition-opacity hover:opacity-80"
          style={{ border: '2px solid var(--rose-dusty)', color: 'var(--rose-dusty)', backgroundColor: 'transparent' }}
        >
          إعادة الاختبار
        </Link>
      </div>
    </div>
  )
}

function ErrorState({ headline, support }: { headline: string; support: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-2xl font-bold" style={{ color: 'var(--purple-deep)' }}>PregnaWell</div>
        <div className="text-5xl mb-6">🔗</div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--purple-deep)' }}>{headline}</h1>
        <p className="text-base" style={{ color: '#6B5E7A' }}>{support}</p>
      </div>
    </div>
  )
}
