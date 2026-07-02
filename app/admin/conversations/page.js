import sql from '../../../lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getConversations(stage, status) {
  try {
    const base = sql`
      SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
             l.phone, l.stage, l.score,
             (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND role = 'user') as unread
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
    `
    let rows
    if (stage && stage !== 'all') {
      rows = await sql`${base} WHERE l.stage = ${stage} ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC`
    } else if (status && status !== 'all') {
      rows = await sql`${base} WHERE c.status = ${status} ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC`
    } else {
      rows = await sql`
        SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
               l.phone, l.stage, l.score,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND role = 'user') as unread
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
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  if (h < 48) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const STAGE = {
  new:       { label: 'Novo',       bg: '#e8eaf6', color: '#3949ab' },
  warm:      { label: 'Morno',      bg: '#fff8e1', color: '#f59e0b' },
  hot:       { label: '🔥 Quente',  bg: '#ffebee', color: '#ef4444' },
  converted: { label: '✓ Convertido', bg: '#e8f5e9', color: '#16a34a' },
}

// Iniciais do número
function initials(phone) {
  if (!phone) return '?'
  return phone.slice(-2)
}

// Cor de avatar baseado no número
const AVATAR_COLORS = ['#128C7E','#25D366','#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#ef4444']
function avatarColor(phone) {
  if (!phone) return AVATAR_COLORS[0]
  return AVATAR_COLORS[parseInt(phone.slice(-1)) % AVATAR_COLORS.length]
}

export default async function ConversationsPage({ searchParams }) {
  const { stage = 'all', status = 'all' } = searchParams || {}
  const convs = await getConversations(stage, status)

  const FILTERS = [
    { href: '/admin/conversations',                     label: 'Todas',       active: stage === 'all' && status === 'all' },
    { href: '/admin/conversations?status=open',         label: 'Abertas',     active: status === 'open' },
    { href: '/admin/conversations?status=waiting_human',label: '⏳ Aguardando',active: status === 'waiting_human' },
    { href: '/admin/conversations?stage=hot',           label: '🔥 Quentes',  active: stage === 'hot' },
    { href: '/admin/conversations?stage=new',           label: 'Novos',       active: stage === 'new' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f0f2f5' }}>

      {/* ── LISTA DE CONVERSAS ── */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', background: '#ffffff', borderRight: '1px solid #e9edef' }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 0', background: '#f0f2f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111b21' }}>Conversas</span>
            <span style={{ fontSize: 12.5, color: '#667781', fontWeight: 500 }}>
              {convs.length} conversa{convs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Barra de pesquisa estilo WA */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ffffff', borderRadius: 10,
            padding: '8px 14px', marginBottom: 12,
            border: '1px solid #e9edef',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aab0b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span style={{ fontSize: 13.5, color: '#aab0b7' }}>Pesquisar conversas</span>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 0 }}>
            {FILTERS.map(f => (
              <Link key={f.label} href={f.href} style={{
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: f.active ? 600 : 500,
                background: f.active ? '#e9f5ee' : '#ffffff',
                color: f.active ? '#128C7E' : '#4b5563',
                border: `1.5px solid ${f.active ? '#25D366' : '#e9edef'}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>{f.label}</Link>
            ))}
          </div>
          <div style={{ height: 1, background: '#e9edef', marginTop: 10 }} />
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convs.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, color: '#667781' }}>Nenhuma conversa encontrada</div>
            </div>
          ) : convs.map((conv, i) => {
            const badge = STAGE[conv.stage] || STAGE.new
            const color = avatarColor(conv.phone)
            const unread = parseInt(conv.unread || 0)
            return (
              <Link key={conv.id} href={`/admin/conversations/${conv.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f2f5',
                  display: 'flex', gap: 12, alignItems: 'center',
                  cursor: 'pointer',
                  background: '#fff',
                  transition: 'background 0.1s',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 49, height: 49, borderRadius: '50%',
                    background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                    userSelect: 'none',
                  }}>
                    {initials(conv.phone)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {conv.phone}
                      </span>
                      <span style={{ fontSize: 11.5, color: unread > 0 ? '#25D366' : '#667781', flexShrink: 0, marginLeft: 8, fontWeight: unread > 0 ? 600 : 400 }}>
                        {timeAgo(conv.last_msg_at || conv.created_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13.5, color: '#667781', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {conv.ai_enabled && <span style={{ marginRight: 4 }}>🤖</span>}
                        {conv.last_message || 'Sem mensagens ainda'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {unread > 0 && (
                          <span style={{
                            background: '#25D366', color: '#fff',
                            fontSize: 11.5, fontWeight: 700,
                            minWidth: 20, height: 20, borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0 5px',
                          }}>{unread > 99 ? '99+' : unread}</span>
                        )}
                        <span style={{
                          fontSize: 10.5, padding: '2px 7px', borderRadius: 10,
                          background: badge.bg, color: badge.color, fontWeight: 600,
                        }}>{badge.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── ÁREA VAZIA / PLACEHOLDER WA ── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f0f2f5',
        borderLeft: '1px solid #e9edef',
      }}>
        <div style={{
          width: 200, height: 200,
          borderRadius: '50%',
          background: '#e9edef',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#aab0b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 300, color: '#41525d', marginBottom: 8 }}>CA·RO Connect</div>
        <div style={{ fontSize: 14, color: '#667781', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          Selecione uma conversa na lista para visualizar as mensagens.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: 13, color: '#aab0b7' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366' }}/>
          IA ativa e respondendo automaticamente
        </div>
      </div>

    </div>
  )
}
