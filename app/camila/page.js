// Bio pública da Camila Rocha — acessível via camilarocha.carostudio.com.br
// Editável pelo admin em /admin/settings/bio

export const metadata = {
  title: 'Camila Rocha · Studio',
  description: 'Consultoria de imagem, moda e estilo de vida',
}

const LINKS = [
  { label: 'Agendar Consultoria', href: 'https://wa.me/5511999999999?text=Olá+Camila!+gostaria+de+agendar+uma+consultoria', primary: true, icon: '✦' },
  { label: 'WhatsApp', href: 'https://wa.me/5511999999999', icon: '◈' },
  { label: 'Instagram', href: 'https://instagram.com/camilarocha', icon: '◎' },
  { label: 'Portfólio & Serviços', href: '#servicos', icon: '▪' },
  { label: 'Depoimentos', href: '#depoimentos', icon: '◌' },
]

const SERVICES = [
  { title: 'Personal Styling', desc: 'Consultoria completa de imagem e guarda-roupa personalizada para o seu estilo de vida.' },
  { title: 'Shopping Pessoal', desc: 'Acompanhamento exclusivo nas compras para montar looks perfeitos para cada ocasião.' },
  { title: 'Consultoria Online', desc: 'Sessões de consultoria via videoconferência — onde você estiver.' },
]

export default function CamilaBio() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #FAF5EF; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(196,146,74,0.3); border-radius: 3px; }
        a { text-decoration: none; color: inherit; }
        .link-btn { transition: all 0.2s ease; }
        .link-btn:hover { transform: translateY(-1px); }
        .link-btn:hover .link-inner { border-color: rgba(196,146,74,0.6) !important; background: rgba(196,146,74,0.06) !important; }
        .primary-btn:hover { background: #b8822e !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FAF5EF 0%, #F5EDE0 40%, #FAF5EF 100%)',
        fontFamily: "'Jost', -apple-system, sans-serif",
        overflowX: 'hidden',
      }}>

        {/* Background ornament */}
        <div style={{
          position: 'fixed',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: '1px solid rgba(196,146,74,0.08)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'fixed',
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: '1px solid rgba(196,146,74,0.05)',
          pointerEvents: 'none',
        }}/>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '56px 24px 80px' }}>

          {/* Avatar & Identity */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3D1826 0%, #6b2d44 50%, #3D1826 100%)',
              margin: '0 auto 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              color: '#C4924A',
              letterSpacing: 2,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                border: '1px solid rgba(196,146,74,0.3)',
              }}/>
              CR
            </div>

            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32,
              fontWeight: 400,
              color: '#3D1826',
              letterSpacing: 2,
              lineHeight: 1,
              marginBottom: 6,
            }}>Camila Rocha</div>

            <div style={{
              fontSize: 10,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#C4924A',
              fontWeight: 300,
              marginBottom: 14,
            }}>Consultora de Imagem</div>

            <p style={{
              fontSize: 13.5,
              color: 'rgba(61,24,38,0.55)',
              lineHeight: 1.7,
              fontWeight: 300,
              maxWidth: 320,
              margin: '0 auto',
            }}>
              Transformo estilos e elevo autoestimas através da consultoria de imagem e moda personalizada.
            </p>

            <div style={{ width: 24, height: 1, background: '#C4924A', margin: '20px auto 0', opacity: 0.4 }}/>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
            {LINKS.map((link, i) => (
              <a key={i} href={link.href} className={`link-btn${link.primary ? ' primary-btn' : ''}`}
                style={{
                  display: 'block',
                  padding: link.primary ? '15px 20px' : '12px 20px',
                  borderRadius: 4,
                  background: link.primary ? '#C4924A' : 'transparent',
                  border: link.primary ? 'none' : '1px solid rgba(196,146,74,0.2)',
                  textAlign: 'center',
                  color: link.primary ? '#fff' : '#3D1826',
                  fontSize: link.primary ? 13.5 : 13,
                  letterSpacing: link.primary ? 1 : 0.5,
                  fontWeight: link.primary ? 500 : 300,
                  position: 'relative',
                }}>
                <div className="link-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 9, opacity: link.primary ? 0.8 : 0.5 }}>{link.icon}</span>
                  {link.label}
                </div>
              </a>
            ))}
          </div>

          {/* Services */}
          <div id="servicos" style={{ marginBottom: 48 }}>
            <div style={{
              textAlign: 'center',
              marginBottom: 24,
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22,
                fontWeight: 400,
                color: '#3D1826',
                letterSpacing: 1.5,
                marginBottom: 4,
              }}>Serviços</div>
              <div style={{ width: 20, height: 1, background: '#C4924A', margin: '0 auto', opacity: 0.4 }}/>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SERVICES.map((s, i) => (
                <div key={i} style={{
                  padding: '18px 20px',
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(196,146,74,0.1)',
                  borderRadius: 4,
                }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#3D1826',
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(61,24,38,0.5)', lineHeight: 1.6, fontWeight: 300 }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 9,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: 'rgba(196,146,74,0.4)',
              marginBottom: 4,
            }}>CA·RO Studio</div>
            <div style={{ fontSize: 10.5, color: 'rgba(61,24,38,0.3)', fontWeight: 300 }}>
              © 2026 Camila Rocha · Todos os direitos reservados
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
