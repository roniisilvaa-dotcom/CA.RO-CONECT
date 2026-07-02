import sql from '../../../lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getLeads(stage) {
  try {
    if (stage && stage !== 'all') {
      return await sql`
        SELECT l.*,
          (SELECT COUNT(*) FROM conversations WHERE lead_id = l.id) as conv_count,
          (SELECT COUNT(*) FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.lead_id = l.id) as msg_count
        FROM leads l WHERE l.stage = ${stage}
        ORDER BY l.score DESC, l.last_contact_at DESC
      `
    }
    return await sql`
      SELECT l.*,
        (SELECT COUNT(*) FROM conversations WHERE lead_id = l.id) as conv_count,
        (SELECT COUNT(*) FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.lead_id = l.id) as msg_count
      FROM leads l
      ORDER BY l.score DESC, l.last_contact_at DESC
    `
  } catch { return [] }
}

function timeAgo(date) {
  if (!date) return 'nunca'
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

const STAGE = {
  new:       { label: 'Novo',           color: '#3949ab', bg: '#e8eaf6' },
  warm:      { label: 'Morno',          color: '#f59e0b', bg: '#fff8e1' },
  hot:       { label: '🔥 Quente',      color: '#ef4444', bg: '#ffebee' },
  converted: { label: '✓ Convertido',   color: '#16a34a', bg: '#e8f5e9' },
}

const AVATAR_COLORS = ['#128C7E','#25D366','#0ea5e9','#8b5cf6','#ec4899','#f59e0b']
function avatarColor(phone) {
  if (!phone) return AVATAR_COLORS[0]
  return AVATAR_COLORS[parseInt(phone.slice(-1)) % AVATAR_COLORS.length]
}

export default async function LeadsPage({ searchParams }) {
  const { stage = 'all' } = searchParams || {}
  const leads = await getLeads(stage)

  const stageCounts = leads.reduce((acc, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1
    return acc
  }, {})

  const FILTERS = [
    { href: '/admin/leads', label: 'Todos', key: 'all', count: leads.length, color: '#128C7E', bg: '#e9f5ee' },
    { href: '/admin/leads?stage=hot', label: '🔥 Quentes', key: 'hot', count: stageCounts.hot || 0, ...STAGE.hot },
    { href: '/admin/leads?stage=warm', label: 'Mornos', key: 'warm', count: stageCounts.warm || 0, ...STAGE.warm },
    { href: '/admin/leads?stage=new', label: 'Novos', key: 'new', count: stageCounts.new || 0, ...STAGE.new },
    { href: '/admin/leads?stage=converted', label: 'Convertidos', key: 'converted', count: stageCounts.converted || 0, ...STAGE.converted },
  ]

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111b21', margin: 0, letterSpacing: '-0.3px' }}>Contatos</h1>
          <p style={{ color: '#4b5563', fontSize: 13.5, marginTop: 4 }}>{leads.length} lead{leads.length !== 1 ? 's' : ''} captados</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const isActive = stage === f.key || (f.key === 'all' && stage === 'all')
          return (
            <Link key={f.key} href={f.href} style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 13,
              textDecoration: 'none',
              background: isActive ? f.bg : '#fff',
              color: isActive ? f.color : '#374151',
              fontWeight: isActive ? 700 : 500,
              border: `1.5px solid ${isActive ? f.color : '#e9edef'}`,
              display: 'flex', gap: 6, alignItems: 'center',
            }}>
              {f.label}
              <span style={{
                background: isActive ? f.color : '#f0f2f5',
                color: isActive ? '#fff' : '#4b5563',
                padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              }}>{f.count}</span>
            </Link>
          )
        })}
      </div>

      {/* Tabela */}
      <div style={{ background: '#fff', border: '1px solid #e9edef', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 120px 120px 70px 120px 100px',
          padding: '12px 20px', borderBottom: '1px solid #f0f2f5',
          fontSize: 11.5, color: '#667781', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.6,
          background: '#f9fafb',
        }}>
          <span>Contato</span>
          <span>Estágio</span>
          <span>Score</span>
          <span>Msgs</span>
          <span>Últ. contato</span>
          <span>Ações</span>
        </div>

        {leads.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, color: '#667781' }}>Nenhum lead ainda</div>
            <div style={{ fontSize: 13, color: '#aab0b7', marginTop: 6 }}>Os contatos aparecerão aqui quando chegarem pelo WhatsApp</div>
          </div>
        ) : leads.map((lead, i) => {
          const cfg = STAGE[lead.stage] || STAGE.new
          const color = avatarColor(lead.phone)
          return (
            <div key={lead.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 120px 70px 120px 100px',
              padding: '13px 20px',
              borderBottom: i < leads.length - 1 ? '1px solid #f0f2f5' : 'none',
              alignItems: 'center',
            }}>
              {/* Contato */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {lead.phone?.slice(-2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111b21' }}>{lead.phone}</div>
                  <div style={{ fontSize: 11.5, color: '#667781', marginTop: 1 }}>{lead.conv_count} conversa{lead.conv_count != 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* Estágio */}
              <span style={{
                fontSize: 11.5, padding: '4px 10px', borderRadius: 20,
                background: cfg.bg, color: cfg.color, fontWeight: 700,
                display: 'inline-block',
              }}>{cfg.label}</span>

              {/* Score */}
              <div>
                <div style={{ background: '#f0f2f5', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 3 }}>
                  <div style={{
                    width: `${lead.score || 0}%`, height: '100%',
                    background: (lead.score || 0) >= 70 ? '#25D366' : (lead.score || 0) >= 40 ? '#f59e0b' : '#e9edef',
                    borderRadius: 4,
                  }} />
                </div>
                <div style={{ fontSize: 12, color: '#374151', fontWeight: 700 }}>{lead.score || 0}%</div>
              </div>

              {/* Msgs */}
              <span style={{ fontSize: 13.5, color: '#374151', fontWeight: 500 }}>{lead.msg_count || 0}</span>

              {/* Últ. contato */}
              <span style={{ fontSize: 12.5, color: '#667781' }}>{timeAgo(lead.last_contact_at)}</span>

              {/* Ações */}
              <div>
                <Link href={`/admin/conversations`} style={{
                  fontSize: 12.5, padding: '6px 12px', borderRadius: 20,
                  background: '#e9f5ee', color: '#128C7E',
                  textDecoration: 'none', fontWeight: 600,
                  border: '1px solid #b7e4c7',
                }}>Ver chat</Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
