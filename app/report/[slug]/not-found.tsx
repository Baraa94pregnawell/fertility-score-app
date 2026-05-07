export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-cream)' }}>
      <div className="text-center">
        <div className="text-2xl font-bold mb-4" style={{ color: 'var(--purple-deep)' }}>PregnaWell</div>
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--purple-deep)' }}>التقرير غير متاح</h1>
        <p style={{ color: '#6B5E7A' }}>يُرجى التواصل معنا على hello@pregnawell.com</p>
      </div>
    </div>
  )
}
