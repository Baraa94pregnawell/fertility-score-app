export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#F9FAFB', minHeight: '100vh', direction: 'ltr' }}>
      {children}
    </div>
  )
}
