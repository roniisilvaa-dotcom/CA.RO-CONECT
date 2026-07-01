'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
  { href: '/admin/conversations', label: 'Conversas', icon: '💬' },
  { href: '/admin/leads', label: 'Contatos', icon: '👤' },
  { href: '/admin/channels', label: 'Canais', icon: '📡' },
  { href: '/admin/train', label: 'Treinar IA', icon: '🤖' },
  { href: '/admin/notifications', label: 'Alertas', icon: '🔔' },
  { href: '/admin/settings', label: 'Configurações', icon: '⚙️' },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f2f5; }
        a { text-decoration: none; color: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d7db; border-radius: 4px; }
        .nav-link:hover { background: #f5f6f6 !important; }
      `}</style>

      <div style={{
        display: 'flex', minHeight: '100vh',
        background: '#f0f2f5',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        {/* Sidebar */}
        <aside style={{
          width: 220,
          background: '#ffffff',
          borderRight: '1px solid #e9edef',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{
            padding: '18px 16px',
            borderBottom: '1px solid #e9edef',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: '#fff', fontWeight: 700, flexShrink: 0,
            }}>CR</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111b21' }}>CA·RO Connect</div>
              <div style={{ fontSize: 11, color: '#667781' }}>Painel da Camila</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
            {NAV.map(item => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} className="nav-link" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? '#e9f5ee' : 'transparent',
                  color: active ? '#128C7E' : '#54656f',
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  transition: 'background 0.1s',
                }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                  {active && (
                    <span style={{
                      marginLeft: 'auto', width: 6, height: 6,
                      borderRadius: '50%', background: '#25D366',
                    }}/>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid #e9edef' }}>
            <Link href="/camila" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 8,
              color: '#667781', fontSize: 13,
              background: '#f0f2f5', marginBottom: 8,
            }}>
              <span>🔗</span> Bio da Camila
            </Link>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#25D366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>C</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111b21' }}>Camila Rocha</div>
                <div style={{ fontSize: 11, color: '#25D366' }}>● Online</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{
          flex: 1, marginLeft: 220,
          minHeight: '100vh',
          background: '#f0f2f5',
          color: '#111b21',
        }}>
          {children}
        </main>
      </div>
    </>
  )
}
