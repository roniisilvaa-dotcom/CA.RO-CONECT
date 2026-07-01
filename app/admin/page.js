import sql from '../../lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const [leads] = await sql`SELECT COUNT(*) as total FROM leads`
    const [hotLeads] = await sql`SELECT COUNT(*) as total FROM leads WHERE stage = 'hot'`
    const [conversations] = await sql`SELECT COUNT(*) as total FROM conversations WHERE status = 'open'`
    const [messagesToday] = await sql`SELECT COUNT(*) as total FROM messages WHERE created_at >= CURRENT_DATE`
    const [notifs] = await sql`SELECT COUNT(*) as total FROM notifications WHERE read = false`
    const recentConvs = await sql`
      SELECT c.id, c.status, c.ai_enabled, c.created_at,
             l.phone, l.stage,
             (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at
      FROM conversations c JOIN leads l ON l.id = c.lead_id
      ORDER BY c.created_at DESC LIMIT 8
    `
    return { totalLeads: leads.total, hotLeads: hotLeads.total, openConversations: conversations.total, messagesToday: messagesToday.total, unreadNotifs: notifs.total, recentConvs }
  } catch {
    return { totalLeads: 0, hotLeads: 0, openConversations: 0, messagesToday: 0, unreadNotifs: 0, recentConvs: [] }
  }
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const stageColor = { new: '#667781', warm: '#f59e0b', hot: '#ef4444', converted: '#25D366' }
const stageLabel = { new: 'Novo', warm: 'Morno', hot: '🔥 Quente', converted: 'Convertido' }

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: 'Contatos', value: stats.totalLeads, icon: '👤', color: '#128C7E', bg: '#e9f5ee' },
    { label: 'Conversas Abertas', value: stats.openConversations, icon: '💬', color: '#25D366', bg: '#e9f5ee' },
    { label: 'Mensagens Hoje', value: stats.messagesToday, icon: '📨', color: '#0088cc', bg: '#e8f4fd' },
    { label: 'Leads Quentes', value: stats.hotLeads, icon: '🔥', color: '#ef4444', bg: '#fef2f2' },
  ]

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '18px 22px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111b21' }}>Bom dia, Camila 👋</h1>
          <p style={{ fontSize: 13, color: '#667781', marginTop: 2 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/channels" style={{
            padding: '8px 16px', borderRadius: 20,
            background: '#e9f5ee', color: '#128C7E',
            fontSize: 13, fontWeight: 500,
          }}>📡 Canais</Link>
          <Link href="/admin/train" style={{
            padding: '8px 16px', borderRadius: 20,
            background: '#25D366', color: '#fff',
            fontSize: 13, fontWeight: 500,
          }}>🤖 Treinar IA</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background: '#fff', borderRadius: 12, padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12.5, color: '#667781', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Conversations */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #e9edef',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>Conversas Recentes</span>
          <Link href="/admin/conversations" style={{ fontSize: 13, color: '#25D366', fontWeight: 500 }}>Ver todas →</Link>
        </div>

        {stats.recentConvs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#667781' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 14 }}>Nenhuma conversa ainda</div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#aab0b7' }}>As mensagens do WhatsApp vão aparecer aqui</div>
          </div>
        ) : stats.recentConvs.map(conv => {
          const color = stageColor[conv.stage] || '#667781'
          const label = stageLabel[conv.stage] || 'Novo'
          return (
            <Link key={conv.id} href={`/admin/conversations/${conv.id}`} style={{
              display: 'flex', gap: 12, padding: '12px 20px',
              borderBottom: '1px solid #f0f2f5', alignItems: 'center',
              transition: 'background 0.1s',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: '#128C7E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>{conv.phone?.slice(-2)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111b21' }}>{conv.phone}</span>
                  <span style={{ fontSize: 11.5, color: '#aab0b7' }}>{timeAgo(conv.last_msg_at || conv.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#667781', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message || 'Sem mensagens'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: color + '18', color }}>{label}</span>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 10,
                  background: conv.ai_enabled ? '#e9f5ee' : '#f0f2f5',
                  color: conv.ai_enabled ? '#25D366' : '#aab0b7',
                }}>IA {conv.ai_enabled ? 'ativa' : 'off'}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
