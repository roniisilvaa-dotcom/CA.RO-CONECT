import sql from '../../../../lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getConversation(id) {
  try {
    const [conv] = await sql`
      SELECT c.*, l.phone, l.stage, l.score, l.name, l.created_at as lead_since
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = ${id}
    `
    if (!conv) return null
    const messages = await sql`
      SELECT * FROM messages WHERE conversation_id = ${id}
      ORDER BY created_at ASC
    `
    const appointments = await sql`
      SELECT * FROM appointments WHERE lead_id = (
        SELECT lead_id FROM conversations WHERE id = ${id}
      ) ORDER BY created_at DESC LIMIT 5
    `
    return { conv, messages, appointments }
  } catch { return null }
}

function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function timeOnly(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const STAGE = {
  new:       { label: 'Novo',         bg: '#e8eaf6', color: '#3949ab' },
  warm:      { label: 'Morno',        bg: '#fff8e1', color: '#f59e0b' },
  hot:       { label: '🔥 Quente',    bg: '#ffebee', color: '#ef4444' },
  converted: { label: '✓ Convertido', bg: '#e8f5e9', color: '#16a34a' },
}

const AVATAR_COLORS = ['#128C7E','#25D366','#0ea5e9','#8b5cf6','#ec4899','#f59e0b']
function avatarColor(phone) {
  if (!phone) return AVATAR_COLORS[0]
  return AVATAR_COLORS[parseInt(phone.slice(-1)) % AVATAR_COLORS.length]
}

export default async function ConversationPage({ params }) {
  const data = await getConversation(params.id)
  if (!data) notFound()

  const { conv, messages, appointments } = data
  const badge = STAGE[conv.stage] || STAGE.new
  const color = avatarColor(conv.phone)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── LISTA LATERAL (mini) ── */}
      <div style={{
        width: 72, background: '#f0f2f5',
        borderRight: '1px solid #e9edef',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 0', gap: 8,
      }}>
        <Link href="/admin/conversations" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#e9edef', color: '#54656f' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
          {conv.phone?.slice(-2)}
        </div>
      </div>

      {/* ── PAINEL DE CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header estilo WA */}
        <div style={{
          padding: '10px 16px',
          background: '#f0f2f5',
          borderBottom: '1px solid #e9edef',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {conv.phone?.slice(-2)}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111b21', lineHeight: 1.2 }}>
              {conv.name || conv.phone}
            </div>
            <div style={{ fontSize: 12.5, color: conv.ai_enabled ? '#25D366' : '#667781', marginTop: 1 }}>
              {conv.ai_enabled ? '🤖 IA respondendo' : '👤 Aguardando humano'} · {conv.channel || 'WhatsApp'}
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20,
              background: badge.bg, color: badge.color, fontWeight: 700,
            }}>{badge.label}</span>
            <span style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20,
              background: '#fff', color: '#374151', fontWeight: 600,
              border: '1px solid #e9edef',
            }}>Score: {conv.score || 0}/100</span>
            {/* Ícones de ação */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              {[
                <svg key="s" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
                <svg key="d" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
              ].map((icon, i) => (
                <button key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Área de mensagens — fundo WA bege */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 8%',
          display: 'flex', flexDirection: 'column', gap: 4,
          background: '#efeae2',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext y='50' font-size='60' opacity='0.03'%3E🌿%3C/text%3E%3C/svg%3E")`,
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '40px 20px' }}>
              <div style={{
                background: '#ffffffcc', borderRadius: 10,
                padding: '12px 20px', display: 'inline-block',
                fontSize: 13, color: '#667781',
              }}>
                🔒 As mensagens são criptografadas de ponta a ponta. Nenhuma mensagem ainda.
              </div>
            </div>
          ) : (
            <>
              {/* Cabeçalho de data */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 12px' }}>
                <div style={{
                  background: '#ffffffcc', borderRadius: 8,
                  padding: '5px 12px', fontSize: 12.5,
                  color: '#54656f', fontWeight: 500,
                }}>
                  {new Date(messages[0]?.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {messages.map((msg, i) => {
                const isUser = msg.role === 'user'
                const showAvatar = !isUser && (i === 0 || messages[i - 1]?.role === 'user')
                return (
                  <div key={msg.id || i} style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-start' : 'flex-end',
                    marginBottom: 2,
                  }}>
                    <div style={{
                      maxWidth: '65%',
                      padding: '7px 12px 8px',
                      borderRadius: isUser
                        ? '0px 8px 8px 8px'
                        : '8px 0px 8px 8px',
                      background: isUser ? '#ffffff' : '#d9fdd3',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.07)',
                      position: 'relative',
                    }}>
                      {/* Remetente (só na IA) */}
                      {!isUser && showAvatar && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#128C7E', marginBottom: 2 }}>
                          🤖 Assistente da Camila
                        </div>
                      )}
                      {/* Conteúdo */}
                      <div style={{ fontSize: 14, color: '#111b21', lineHeight: 1.55, wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                      {/* Hora + status */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        gap: 4, marginTop: 3,
                      }}>
                        <span style={{ fontSize: 11, color: '#667781' }}>{timeOnly(msg.created_at)}</span>
                        {!isUser && (
                          <svg width="14" height="10" viewBox="0 0 16 11" fill="#53bdeb">
                            <path d="M15.01 1.18L5.8 10.39l-.45.45L.9 6.39l.9-.9 3.55 3.55 9.31-9.31.35.45z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Barra inferior — info do lead */}
        <div style={{
          padding: '10px 16px',
          background: '#f0f2f5',
          borderTop: '1px solid #e9edef',
          display: 'flex', gap: 20, alignItems: 'center',
          fontSize: 12.5, color: '#54656f',
        }}>
          <span>📅 Lead desde: {new Date(conv.lead_since).toLocaleDateString('pt-BR')}</span>
          <span>💬 {messages.length} mensagens</span>
          <span>Status: <span style={{ color: conv.status === 'open' ? '#25D366' : '#f59e0b', fontWeight: 600 }}>{conv.status === 'open' ? 'Aberta' : conv.status}</span></span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button style={{
              padding: '7px 16px', borderRadius: 20,
              border: '1.5px solid #e9edef', background: '#fff',
              fontSize: 12.5, color: '#374151', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Assumir atendimento</button>
          </div>
        </div>
      </div>

      {/* ── PAINEL DO LEAD ── */}
      <div style={{
        width: 300, background: '#fff',
        borderLeft: '1px solid #e9edef',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header do painel */}
        <div style={{ padding: '20px 16px', background: '#f0f2f5', borderBottom: '1px solid #e9edef' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8 }}>Info do Lead</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Avatar e nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#fff',
            }}>{conv.phone?.slice(-2)}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>{conv.name || conv.phone}</div>
              <div style={{ fontSize: 12.5, color: '#667781', marginTop: 2 }}>{conv.phone}</div>
            </div>
          </div>

          {/* Linha divisória */}
          <div style={{ height: 1, background: '#f0f2f5', margin: '0 -16px 16px' }} />

          {/* Campos */}
          {[
            { label: 'Telefone', value: conv.phone },
            { label: 'Canal', value: conv.channel || 'WhatsApp' },
            { label: 'Status', value: conv.status === 'open' ? '● Aberta' : conv.status },
          ].map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#111b21', fontWeight: 500 }}>{value}</div>
            </div>
          ))}

          {/* Estágio */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Estágio</div>
            <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, background: badge.bg, color: badge.color, fontWeight: 700 }}>{badge.label}</span>
          </div>

          {/* Score */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Score de lead</div>
            <div style={{ background: '#f0f2f5', borderRadius: 100, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${conv.score || 0}%`, height: '100%',
                background: conv.score >= 70 ? '#25D366' : conv.score >= 40 ? '#f59e0b' : '#e9edef',
                borderRadius: 100, transition: 'width 0.5s',
              }} />
            </div>
            <div style={{ fontSize: 13.5, color: '#111b21', marginTop: 6, fontWeight: 700 }}>{conv.score || 0}<span style={{ fontSize: 11, color: '#667781', fontWeight: 400 }}>/100</span></div>
          </div>

          {/* IA */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Inteligência Artificial</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: conv.ai_enabled ? '#e9f5ee' : '#fff8f0',
              border: `1px solid ${conv.ai_enabled ? '#b7e4c7' : '#fde68a'}`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: conv.ai_enabled ? '#25D366' : '#f59e0b', flexShrink: 0 }}/>
              <span style={{ fontSize: 13.5, color: conv.ai_enabled ? '#0a5c44' : '#92400e', fontWeight: 600 }}>
                {conv.ai_enabled ? 'Ativa — respondendo automaticamente' : 'Pausada — aguardando humano'}
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: '#f0f2f5', margin: '0 -16px 16px' }} />

          {/* Agendamentos */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Agendamentos</div>
            {appointments.length === 0 ? (
              <div style={{ fontSize: 13.5, color: '#aab0b7', fontStyle: 'italic' }}>Nenhum agendamento</div>
            ) : appointments.map(apt => (
              <div key={apt.id} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 10, marginBottom: 8, border: '1px solid #f0f2f5' }}>
                <div style={{ fontSize: 13.5, color: '#111b21', fontWeight: 600 }}>{apt.service_name}</div>
                <div style={{ fontSize: 12, color: '#667781', marginTop: 3 }}>
                  {new Date(apt.scheduled_at).toLocaleString('pt-BR')}
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e9f5ee', color: '#128C7E', fontWeight: 600 }}>
                  {apt.status || 'agendado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
