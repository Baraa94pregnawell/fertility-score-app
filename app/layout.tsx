import type { Metadata } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'تقرير درجة الخصوبة | PregnaWell',
  description: 'تقرير شخصي يُقيّم تأثير التغذية والبيئة ونمط الحياة على خصوبتكِ. أعدّته الأخصائية مها حمّص.',
  openGraph: {
    title: 'تقرير درجة الخصوبة من PregnaWell — بقلم الأخصائية مها حمّص',
    description: 'تقرير شخصي يُقيّم تأثير التغذية والبيئة ونمط الحياة على خصوبتكِ. أعدّته الأخصائية مها حمّص.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className="antialiased min-h-screen" style={{ backgroundColor: 'var(--bg-cream)', fontFamily: 'var(--font-arabic), Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
