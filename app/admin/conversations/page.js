import sql from '../../../lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getConversations(stage, status) {
  try {
    let rows
    if (stage && stage !== 'all') {
      rows = await sql`
        SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
               l.phone, l.stage, l.score,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as msg_count
        FROM conversations c
        JOIN leads l ON l.id = c.lead_id
        WHERE l.stage = ${stage}
        ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC
      `
    } else if (status && status !== 'all') {
      rows = await sql`
        SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
               l.phone, l.stage, l.score,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as msg_count
        FROM conversations c
        JOIN leads l ON l.id = c.lead_id
        WHERE c.status = ${status}
        ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC
      `
    } else {
      rows = await sql`
        SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
               l.phone, l.stage, l.score,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as msg_count
        FROM conversations c
        JOIN leads l ON l.id = c.lead_id
        ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC
      `
    }
    return rows
  } catch { return [] }
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

const stageConfig = {
  new: { label: 'Novo', color: '#6366f1' },
  warm: { label: 'Morno', color: '#f59e0b' },
  hot: { label: '🔥 Quente', color: '#ef4444' },
  converted: { label: 'Convertido', color: '#10b981' },
}

export default async function ConversationsPage({ searchParams }) {
  const { stage = 'all', status = 'all' } = searchParams || {}
  const conversations = await getConversations(stage, status)

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'open', label: 'Abertas', isStatus: true },
    { key: 'waiting_human', label: 'Aguardando', isStatus: true },
    { key: 'hot', label: '🔥 Quentes', isStage: true },
    { key: 'new', label: 'Novos', isStage: true },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Conversation List */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #1e1e2e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Conversas</h1>
            <span style={{ fontSize: 13, color: '#6b6b80' }}>{conversations.length} conversa{conversations.length !== 1 ? 's' : ''}</span>
          </div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 0 }}>
            {[
              { href: '/admin/conversations', label: 'Todas', active: stage === 'all' && status === 'all' },
              { href: '/admin/conversations?status=open', label: '● Abertas', active: status === 'open' },
              { href: '/admin/conversations?status=waiting_human', label: '⏳ Aguardando', active: status === 'waiting_human' },
              { href: '/admin/conversations?stage=hot', label: '🔥 Quentes', active: stage === 'hot' },
              { href: '/admin/conversations?stage=new', label: 'Novos', active: stage === 'new' },
            ].map(f => (
              <Link key={f.label} href={f.href} style={{
                padding: '8px 14px',
                fontSize: 13,
                textDecoration: 'none',
                color: f.active ? '#a855f7' : '#6b6b80',
                borderBottom: f.active ? '2px solid #a855f7' : '2px solid transparent',
                fontWeight: f.active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}>{f.label}</Link>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b4b5a' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15 }}>Nenhuma conversa encontrada</div>
            </div>
          ) : conversations.map(conv => {
            const badge = stageConfig[conv.stage] || stageConfig.new
            return (
              <Link key={conv.id} href={`/admin/conversations/${conv.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  padding: '16px 28px',
                  borderBottom: '1px solid #151520',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${badge.color}80, ${badge.color})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {conv.phone?.slice(-2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#e1e1e6' }}>{conv.phone}</span>
                      <span style={{ fontSize: 11, color: '#4b4b5a', flexShrink: 0 }}>{timeAgo(conv.last_msg_at || conv.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6b6b80', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message || 'Sem mensagens ainda'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: badge.color + '25', color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                      {conv.ai_enabled
                        ? <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#10b98120', color: '#10b981', fontWeight: 600 }}>🤖 IA ativa</span>
                        : <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f59e0b20', color: '#f59e0b', fontWeight: 600 }}>👤 Humano</span>
                      }
                      <span style={{ fontSize: 10, color: '#4b4b5a', marginLeft: 'auto' }}>{conv.msg_count} msgs</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
