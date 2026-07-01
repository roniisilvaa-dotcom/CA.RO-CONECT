import sql from '../../../../lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getConversation(id) {
  try {
    const [conv] = await sql`
      SELECT c.*, l.phone, l.stage, l.score, l.created_at as lead_since
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
  return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const stageConfig = {
  new: { label: 'Novo', color: '#6366f1' },
  warm: { label: 'Morno', color: '#f59e0b' },
  hot: { label: '🔥 Quente', color: '#ef4444' },
  converted: { label: '✓ Convertido', color: '#10b981' },
}

export default async function ConversationPage({ params }) {
  const data = await getConversation(params.id)
  if (!data) notFound()

  const { conv, messages, appointments } = data
  const badge = stageConfig[conv.stage] || stageConfig.new

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Messages Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', gap: 16, background: '#111118' }}>
          <Link href="/admin/conversations" style={{ color: '#6b6b80', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${badge.color}80, ${badge.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {conv.phone?.slice(-2)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>{conv.phone}</div>
            <div style={{ fontSize: 12, color: '#6b6b80' }}>
              {conv.ai_enabled ? '🤖 IA respondendo' : '👤 Aguardando humano'} · {conv.channel}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: badge.color + '25', color: badge.color, fontWeight: 600 }}>{badge.label}</span>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#1e1e2e', color: '#9090a0' }}>Score: {conv.score}/100</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4b4b5a', marginTop: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div>Nenhuma mensagem ainda</div>
            </div>
          ) : messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  background: isUser ? '#1e1e2e' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#e1e1e6',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}>
                  <div>{msg.content}</div>
                  <div style={{ fontSize: 10, color: isUser ? '#4b4b5a' : 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' }}>
                    {isUser ? '👤' : '🤖'} {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info bar */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #1e1e2e', background: '#111118', fontSize: 12, color: '#4b4b5a', display: 'flex', gap: 20 }}>
          <span>📅 Lead desde: {new Date(conv.lead_since).toLocaleDateString('pt-BR')}</span>
          <span>💬 {messages.length} mensagens</span>
          <span>Status: <span style={{ color: conv.status === 'open' ? '#10b981' : '#f59e0b' }}>{conv.status}</span></span>
        </div>
      </div>

      {/* Right panel - Lead info */}
      <div style={{ width: 280, borderLeft: '1px solid #1e1e2e', background: '#111118', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e1e2e' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#9090a0', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1 }}>Info do Lead</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#4b4b5a', marginBottom: 4 }}>Telefone</div>
              <div style={{ fontSize: 14, color: '#e1e1e6', fontWeight: 500 }}>{conv.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4b4b5a', marginBottom: 4 }}>Estágio</div>
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: badge.color + '25', color: badge.color, fontWeight: 600 }}>{badge.label}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4b4b5a', marginBottom: 6 }}>Score</div>
              <div style={{ background: '#1e1e2e', borderRadius: 8, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${conv.score}%`, height: '100%', background: `linear-gradient(90deg, #6366f1, #a855f7)`, borderRadius: 8 }} />
              </div>
              <div style={{ fontSize: 12, color: '#a855f7', marginTop: 4, fontWeight: 600 }}>{conv.score}/100</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4b4b5a', marginBottom: 4 }}>IA</div>
              <div style={{ fontSize: 13, color: conv.ai_enabled ? '#10b981' : '#f59e0b' }}>
                {conv.ai_enabled ? '🤖 Ativa' : '⏸ Pausada'}
              </div>
            </div>
          </div>
        </div>

        {/* Appointments */}
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#9090a0', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Agendamentos</h3>
          {appointments.length === 0 ? (
            <div style={{ fontSize: 13, color: '#4b4b5a' }}>Nenhum agendamento</div>
          ) : appointments.map(apt => (
            <div key={apt.id} style={{ padding: '10px', background: '#1a1a28', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#e1e1e6', fontWeight: 500 }}>{apt.service_name}</div>
              <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 4 }}>
                {new Date(apt.scheduled_at).toLocaleString('pt-BR')}
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#10b98120', color: '#10b981', fontWeight: 600 }}>{apt.status || 'agendado'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
