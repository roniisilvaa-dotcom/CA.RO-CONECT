'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    group: null,
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        exact: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
        ),
      },
      {
        href: '/admin/conversations',
        label: 'Conversas',
        pill: null,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
      },
      {
        href: '/admin/leads',
        label: 'Contatos',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Automação',
    items: [
      {
        href: '/admin/channels',
        label: 'Canais',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2"/>
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
          </svg>
        ),
      },
      {
        href: '/admin/train',
        label: 'Treinar IA',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/>
          </svg>
        ),
      },
      {
        href: '/admin/notifications',
        label: 'Alertas',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Conta',
    items: [
      {
        href: '/admin/settings',
        label: 'Configurações',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f0f2f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        a { text-decoration: none; color: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d7db; border-radius: 4px; }
        .nav-link-item { transition: background 0.15s, color 0.15s; }
        .nav-link-item:hover { background: #f5f6f6 !important; color: #111b21 !important; }
        .nav-link-item:hover svg { stroke: #111b21 !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 240,
          background: '#ffffff',
          borderRight: '1px solid #e9edef',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
        }}>

          {/* Logo / Header */}
          <div style={{
            padding: '20px 16px 18px',
            borderBottom: '1px solid #e9edef',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 42, height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21', letterSpacing: '-0.2px' }}>
                CA·RO Connect
              </div>
              <div style={{ fontSize: 11.5, color: '#667781', marginTop: 1 }}>Painel da Camila</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
            {NAV.map((section, si) => (
              <div key={si} style={{ marginBottom: 4 }}>
                {section.group && (
                  <div style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: '#aab0b7',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    padding: '12px 12px 4px',
                  }}>
                    {section.group}
                  </div>
                )}
                {section.items.map(item => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href + '/') || pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-link-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 2,
                        background: active ? '#e9f5ee' : 'transparent',
                        color: active ? '#128C7E' : '#54656f',
                        fontSize: 14,
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: active ? '#128C7E' : '#aab0b7',
                        flexShrink: 0,
                      }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.pill && (
                        <span style={{
                          background: '#25D366',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: 10,
                          lineHeight: '18px',
                        }}>{item.pill}</span>
                      )}
                      {active && (
                        <span style={{
                          width: 6, height: 6,
                          borderRadius: '50%',
                          background: '#25D366',
                          flexShrink: 0,
                        }}/>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer — perfil */}
          <div style={{ borderTop: '1px solid #e9edef', padding: '12px 8px' }}>
            {/* Link bio */}
            <Link href="/camila" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              color: '#667781',
              fontSize: 13.5,
              fontWeight: 400,
              marginBottom: 4,
              background: '#f0f2f5',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aab0b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Ver página pública
            </Link>

            {/* Usuário */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}>C</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111b21', lineHeight: 1.3 }}>Camila Rocha</div>
                <div style={{ fontSize: 11.5, color: '#25D366', lineHeight: 1.3 }}>● Online</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aab0b7" strokeWidth="2">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </div>
          </div>

        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{
          flex: 1,
          marginLeft: 240,
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
