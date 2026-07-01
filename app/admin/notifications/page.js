import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

async function getNotifications() {
  try {
    return await sql`
      SELECT n.*, l.phone, l.stage, l.score
      FROM notifications n
      JOIN leads l ON l.id = n.lead_id
      ORDER BY n.created_at DESC
      LIMIT 100
    `
  } catch { return [] }
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const typeConfig = {
  hot_lead: { icon: '🔥', label: 'Lead Quente', color: '#ef4444', bg: '#ef444415' },
  handoff: { icon: '🤝', label: 'Handoff solicitado', color: '#f59e0b', bg: '#f59e0b15' },
  appointment: { icon: '📅', label: 'Agendamento', color: '#10b981', bg: '#10b98115' },
  default: { icon: '🔔', label: 'Notificação', color: '#6366f1', bg: '#6366f115' },
}

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  const unread = notifications.filter(n => !n.read).length

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Alertas</h1>
          <p style={{ color: '#6b6b80', fontSize: 13, marginTop: 4 }}>
            {unread > 0 ? <span style={{ color: '#ef4444' }}>{unread} não lidos</span> : 'Tudo em dia'} · {notifications.length} total
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 80, textAlign: 'center', color: '#4b4b5a' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <div style={{ fontSize: 16, color: '#6b6b80' }}>Nenhum alerta ainda</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Os alertas aparecerão aqui quando leads quentes forem detectados</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.default
            return (
              <div key={n.id} style={{
                background: n.read ? '#111118' : '#111118',
                border: `1px solid ${n.read ? '#1e1e2e' : cfg.color + '40'}`,
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {!n.read && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: cfg.color, borderRadius: '12px 0 0 12px' }} />}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 600, marginRight: 8 }}>{cfg.label}</span>
                      {!n.read && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>NOVO</span>}
                    </div>
                    <span style={{ fontSize: 12, color: '#4b4b5a', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#e1e1e6', marginTop: 6, fontWeight: 500 }}>{n.message}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#6b6b80' }}>📱 {n.phone}</span>
                    <span style={{ fontSize: 12, color: '#6b6b80' }}>Score: <span style={{ color: '#a855f7', fontWeight: 600 }}>{n.score}</span></span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
