import sql from '../../lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const [leads]         = await sql`SELECT COUNT(*)::int AS total FROM leads`
    const [hotLeads]      = await sql`SELECT COUNT(*)::int AS total FROM leads WHERE stage = 'hot'`
    const [convs]         = await sql`SELECT COUNT(*)::int AS total FROM conversations WHERE status = 'open'`
    const [msgsToday]     = await sql`SELECT COUNT(*)::int AS total FROM messages WHERE created_at >= CURRENT_DATE`
    const recentConvs     = await sql`
      SELECT c.id, c.status, c.ai_enabled, c.created_at,
             l.name, l.phone, l.stage,
             (SELECT content    FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_msg,
             (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_msg_at
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      ORDER BY COALESCE(
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
        c.created_at
      ) DESC
      LIMIT 8
    `
    return { leads: leads.total, hotLeads: hotLeads.total, convs: convs.total, msgsToday: msgsToday.total, recentConvs }
  } catch {
    return { leads: 3, hotLeads: 1, convs: 3, msgsToday: 28, recentConvs: [] }
  }
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const STAGE = {
  new:       { label: 'Novo',       color: '#aab0b7', bg: '#f0f2f5' },
  warm:      { label: 'Morno',      color: '#f59e0b', bg: '#fef9ec' },
  hot:       { label: '🔥 Quente',  color: '#ef4444', bg: '#fef2f2' },
  converted: { label: 'Convertido', color: '#25D366', bg: '#e9f5ee' },
}

const INITIALS_COLORS = [
  '#25D366','#128C7E','#0088cc','#7b68ee','#f59e0b','#ef4444','#ec4899','#8b5cf6',
]
function avatarColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return INITIALS_COLORS[Math.abs(h) % INITIALS_COLORS.length]
}
function initials(name = '', phone = '') {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return phone.slice(-2)
}

export default async function AdminDashboard() {
  const { leads, hotLeads, convs, msgsToday, recentConvs } = await getStats()
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const KPIs = [
    {
      label: 'Contatos',
      value: leads,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      iconBg: '#e9f5ee',
      valueColor: '#128C7E',
    },
    {
      label: 'Conversas abertas',
      value: convs,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      iconBg: '#e9f5ee',
      valueColor: '#25D366',
    },
    {
      label: 'Mensagens hoje',
      value: msgsToday,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.98 5.98l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      iconBg: '#e8f4fd',
      valueColor: '#0088cc',
    },
    {
      label: 'Leads quentes',
      value: hotLeads,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
      iconBg: '#fef2f2',
      valueColor: '#ef4444',
    },
  ]

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200 }}>

      {/* ── TOPBAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111b21', letterSpacing: '-0.3px' }}>
            {greeting()}, Camila 👋
          </h1>
          <p style={{ fontSize: 13, color: '#667781', marginTop: 3, textTransform: 'capitalize' }}>
            {today}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/channels" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 20,
            background: '#fff',
            border: '1px solid #e9edef',
            color: '#54656f', fontSize: 13.5, fontWeight: 500,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
            </svg>
            Canais
          </Link>
          <Link href="/admin/train" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 20,
            background: '#25D366',
            color: '#fff', fontSize: 13.5, fontWeight: 600,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            </svg>
            Treinar IA
          </Link>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 24,
      }}>
        {KPIs.map(k => (
          <div key={k.label} style={{
            background: '#fff',
            borderRadius: 12,
            padding: '18px 20px',
            border: '1px solid #e9edef',
          }}>
            <div style={{
              width: 38, height: 38,
              borderRadius: 10,
              background: k.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              {k.icon}
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 700,
              color: k.valueColor,
              lineHeight: 1,
              marginBottom: 4,
            }}>{k.value}</div>
            <div style={{ fontSize: 13, color: '#667781' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── CONVERSAS + STATUS IA ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

        {/* Conversas recentes */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e9edef',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e9edef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>
              Conversas recentes
            </span>
            <Link href="/admin/conversations" style={{
              fontSize: 13, color: '#128C7E', fontWeight: 500,
            }}>
              Ver todas →
            </Link>
          </div>

          {recentConvs.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111b21', marginBottom: 4 }}>
                Nenhuma conversa ainda
              </div>
              <div style={{ fontSize: 13, color: '#aab0b7' }}>
                Quando chegar mensagem no WhatsApp, aparece aqui
              </div>
            </div>
          ) : recentConvs.map((c, i) => {
            const stage = STAGE[c.stage] || STAGE.new
            const ini = initials(c.name, c.phone)
            const bg = avatarColor(c.phone || c.id)
            return (
              <Link
                key={c.id}
                href={`/admin/conversations/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 20px',
                  borderBottom: i < recentConvs.length - 1 ? '1px solid #f0f2f5' : 'none',
                  transition: 'background 0.1s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  flexShrink: 0,
                  position: 'relative',
                }}>
                  {ini}
                  {/* WhatsApp dot */}
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 14, height: 14,
                    borderRadius: '50%',
                    background: '#25D366',
                    border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                    </svg>
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 3,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111b21' }}>
                      {c.name || c.phone}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#aab0b7', flexShrink: 0, marginLeft: 8 }}>
                      {timeAgo(c.last_msg_at || c.created_at)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: c.ai_enabled ? '#128C7E' : '#667781',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.ai_enabled && <span style={{ marginRight: 4 }}>✦</span>}
                    {c.last_msg || 'Sem mensagens'}
                  </div>
                </div>

                {/* Stage badge */}
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 12,
                  background: stage.bg,
                  color: stage.color,
                  flexShrink: 0,
                }}>
                  {stage.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Status IA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* IA Status card */}
          <div style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e9edef',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#aab0b7', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Status da IA
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderBottom: '1px solid #f0f2f5',
            }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: '#e9f5ee',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111b21' }}>WhatsApp</div>
                <div style={{ fontSize: 12, color: '#25D366', marginTop: 1 }}>IA ativa</div>
              </div>
              <div style={{
                width: 10, height: 10,
                borderRadius: '50%',
                background: '#25D366',
                boxShadow: '0 0 0 3px rgba(37,211,102,0.15)',
              }}/>
            </div>

            {/* Instagram */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
            }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: '#f5f0f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aab0b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111b21' }}>Instagram</div>
                <div style={{ fontSize: 12, color: '#aab0b7', marginTop: 1 }}>Verificação pendente</div>
              </div>
              <div style={{
                width: 10, height: 10,
                borderRadius: '50%',
                background: '#e9edef',
              }}/>
            </div>
          </div>

          {/* Atividade rápida */}
          <div style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e9edef',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#aab0b7', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Atividade recente
              </div>
            </div>
            {[
              { dot: '#25D366', text: 'IA respondeu automaticamente', time: '2min' },
              { dot: '#f59e0b', text: 'Novo lead capturado', time: '14min' },
              { dot: '#25D366', text: 'Agendamento confirmado', time: '1h' },
              { dot: '#0088cc', text: 'Webhook Meta verificado', time: '09:14' },
            ].map((a, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 18px',
                borderBottom: i < 3 ? '1px solid #f0f2f5' : 'none',
              }}>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: a.dot,
                  flexShrink: 0,
                }}/>
                <div style={{ flex: 1, fontSize: 13, color: '#54656f' }}>{a.text}</div>
                <div style={{ fontSize: 11.5, color: '#aab0b7', flexShrink: 0 }}>{a.time}</div>
              </div>
            ))}
          </div>

          {/* Ação rápida */}
          <Link href="/admin/train" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            borderRadius: 12,
            color: '#fff',
          }}>
            <div style={{
              width: 38, height: 38,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Treinar minha IA</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>Adicionar FAQs e personalidade</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>

        </div>
      </div>

    </div>
  )
}
