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

const stageConfig = {
  new: { label: 'Novo', color: '#6366f1', bg: '#6366f120' },
  warm: { label: 'Morno', color: '#f59e0b', bg: '#f59e0b20' },
  hot: { label: '🔥 Quente', color: '#ef4444', bg: '#ef444420' },
  converted: { label: '✓ Convertido', color: '#10b981', bg: '#10b98120' },
}

export default async function LeadsPage({ searchParams }) {
  const { stage = 'all' } = searchParams || {}
  const leads = await getLeads(stage)

  const stageCounts = leads.reduce((acc, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Leads</h1>
          <p style={{ color: '#6b6b80', fontSize: 13, marginTop: 4 }}>{leads.length} contato{leads.length !== 1 ? 's' : ''} captados</p>
        </div>
      </div>

      {/* Stage filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { href: '/admin/leads', label: 'Todos', key: 'all', count: leads.length },
          { href: '/admin/leads?stage=hot', label: '🔥 Quentes', key: 'hot', count: stageCounts.hot || 0 },
          { href: '/admin/leads?stage=warm', label: 'Mornos', key: 'warm', count: stageCounts.warm || 0 },
          { href: '/admin/leads?stage=new', label: 'Novos', key: 'new', count: stageCounts.new || 0 },
          { href: '/admin/leads?stage=converted', label: 'Convertidos', key: 'converted', count: stageCounts.converted || 0 },
        ].map(f => {
          const active = stage === f.key || (f.key === 'all' && stage === 'all')
          const cfg = stageConfig[f.key]
          return (
            <Link key={f.key} href={f.href} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, textDecoration: 'none',
              background: active ? (cfg?.bg || '#a855f720') : '#1e1e2e',
              color: active ? (cfg?.color || '#a855f7') : '#6b6b80',
              fontWeight: active ? 600 : 400,
              display: 'flex', gap: 6, alignItems: 'center',
              border: active ? `1px solid ${cfg?.color || '#a855f7'}40` : '1px solid transparent',
            }}>
              {f.label}
              <span style={{ background: '#0a0a0f', padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>{f.count}</span>
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 100px 120px', padding: '12px 20px', borderBottom: '1px solid #1e1e2e', fontSize: 11, color: '#4b4b5a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          <span>Contato</span>
          <span>Estágio</span>
          <span>Score</span>
          <span>Msgs</span>
          <span>Últ. contato</span>
          <span>Ações</span>
        </div>

        {leads.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#4b4b5a' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div>Nenhum lead ainda</div>
          </div>
        ) : leads.map(lead => {
          const cfg = stageConfig[lead.stage] || stageConfig.new
          return (
            <div key={lead.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 100px 120px', padding: '14px 20px', borderBottom: '1px solid #151520', alignItems: 'center' }}>
              {/* Phone */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${cfg.color}60, ${cfg.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {lead.phone?.slice(-2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e1e1e6' }}>{lead.phone}</div>
                  <div style={{ fontSize: 11, color: '#4b4b5a' }}>{lead.conv_count} conversa{lead.conv_count != 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* Stage */}
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 600, display: 'inline-block' }}>{cfg.label}</span>

              {/* Score bar */}
              <div>
                <div style={{ background: '#1e1e2e', borderRadius: 4, height: 4, overflow: 'hidden', marginBottom: 3 }}>
                  <div style={{ width: `${lead.score}%`, height: '100%', background: `linear-gradient(90deg, #6366f1, #a855f7)` }} />
                </div>
                <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>{lead.score}%</div>
              </div>

              {/* Msgs */}
              <span style={{ fontSize: 13, color: '#9090a0' }}>{lead.msg_count || 0}</span>

              {/* Last contact */}
              <span style={{ fontSize: 12, color: '#6b6b80' }}>{timeAgo(lead.last_contact_at)}</span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/admin/conversations?phone=${lead.phone}`} style={{
                  fontSize: 11, padding: '5px 10px', borderRadius: 6,
                  background: '#1e1e2e', color: '#a855f7', textDecoration: 'none',
                  fontWeight: 500,
                }}>Ver chat</Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
