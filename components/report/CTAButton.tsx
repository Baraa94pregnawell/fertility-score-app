interface Props {
  scoreCategory: string
  variant: 'mid' | 'bottom'
  bookingUrl: string
}

const CTA_COPY = {
  mid: {
    level1: {
      headline: 'درجتكِ ممتازة — والخطوة التالية تحمي ما بنيتيه',
      subtext: 'نتائجكِ تعكس وعياً حقيقياً بعوامل الخصوبة. المكالمة التقييمية المدرجة في باقتكِ هي فرصتكِ للحصول على خطة دقيقة تضمن استمرار هذه النتائج وتعززها.',
      button: 'احجزي مكالمتكِ التقييمية — مدرجة في باقتكِ',
    },
    level2: {
      headline: 'أساسكِ قوي — وبعض التعديلات الدقيقة ستُحدث فارقاً كبيراً',
      subtext: 'درجتكِ تُظهر أنكِ على الطريق الصحيح. المكالمة التقييمية ستساعدكِ على تحديد المجالات القليلة التي تستحق الاهتمام أولاً، وفق وضعكِ الفردي.',
      button: 'احجزي مكالمتكِ التقييمية — مدرجة في باقتكِ',
    },
    level3: {
      headline: 'التقرير يُظهر الصورة — المكالمة تُرسم الخطة',
      subtext: 'حدّد التقرير العوامل التي تؤثر على درجتكِ. المكالمة التقييمية المدرجة في باقتكِ هي الخطوة المنطقية التالية للحصول على خطة عملية مخصصة لوضعكِ.',
      button: 'احجزي مكالمتكِ التقييمية — مدرجة في باقتكِ',
    },
    level4: {
      headline: 'درجتكِ تستدعي التحرك — المكالمة التقييمية خطوتكِ الأولى',
      subtext: 'النتائج تُشير إلى عوامل متعددة تستحق مراجعة متخصصة. المكالمة التقييمية مدرجة في باقتكِ ولا تكلفكِ شيئاً — استخدميها الآن.',
      button: 'احجزي مكالمتكِ التقييمية الآن',
    },
  },
  bottom: {
    level1: {
      headline: 'نتائج ممتازة تستحق متابعة متخصصة',
      subtext: 'استثمري وعيكِ بحجز المكالمة التقييمية مع فريق PregnaWell. سنراجع تقريركِ معاً ونضع لكِ خطة تحافظ على هذا المستوى وتأخذكِ أبعد.',
      button: 'احجزي الآن — المكالمة مجانية وضمن باقتكِ',
    },
    level2: {
      headline: 'أنتِ قريبة — المكالمة ستُقربكِ أكثر',
      subtext: 'لا تكتفي بالتقرير. تحدثي مع أحد متخصصي فريق PregnaWell لتحديد أولوياتكِ بدقة والبدء بالتغييرات الأكثر تأثيراً في وضعكِ.',
      button: 'احجزي الآن — المكالمة مجانية وضمن باقتكِ',
    },
    level3: {
      headline: 'التغيير ممكن — ويبدأ بمحادثة واحدة',
      subtext: 'فريق PregnaWell جاهز لمساعدتكِ على ترجمة توصيات التقرير إلى خطوات عملية مناسبة لحياتكِ. المكالمة مجانية وضمن باقتكِ.',
      button: 'احجزي الآن — المكالمة مجانية وضمن باقتكِ',
    },
    level4: {
      headline: 'لا تنتظري — التدخل المبكر يُحدث الفارق',
      subtext: 'هذه النتائج تستحق مراجعة متخصصة فورية. المكالمة التقييمية مدرجة في باقتكِ — احجزيها الآن وابدئي رحلتكِ بخطة واضحة.',
      button: 'احجزي مكالمتكِ التقييمية الآن',
    },
  },
}

export default function CTAButton({ scoreCategory, variant, bookingUrl }: Props) {
  const copy = CTA_COPY[variant][scoreCategory as keyof typeof CTA_COPY['mid']] || CTA_COPY[variant].level3
  const isMid = variant === 'mid'

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: isMid
          ? 'linear-gradient(135deg, #C06078, #9B4B62)'
          : 'linear-gradient(135deg, #3D2870, #5B3FA8)',
      }}
    >
      <h3 className="text-xl font-bold text-white mb-3">{copy.headline}</h3>
      <p className="text-sm leading-relaxed mb-5" style={{ color: isMid ? '#FFE4EB' : '#D6C9F0' }}>
        {copy.subtext}
      </p>
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 rounded-xl font-semibold text-base transition-opacity hover:opacity-90"
        style={{
          backgroundColor: isMid ? '#3D2870' : '#C06078',
          color: 'white',
        }}
      >
        {copy.button}
      </a>
    </div>
  )
}
