import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen" style={{ backgroundColor: 'var(--bg-cream)' }}>
        {children}
      </body>
    </html>
  )
}
