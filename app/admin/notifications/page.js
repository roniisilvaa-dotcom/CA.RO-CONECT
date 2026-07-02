export const dynamic = 'force-dynamic'

const NOTIFS = [
  { id: 1, icon: '🤖', title: 'IA respondeu automaticamente', desc: 'Lead +55 11 99999-0001 recebeu resposta sobre o curso.', time: '2 min atrás', unread: true },
  { id: 2, icon: '🔥', title: 'Lead quente identificado', desc: '+55 11 98888-0002 — score atingiu 85%. Alta intenção de compra.', time: '14 min atrás', unread: true },
  { id: 3, icon: '⏳', title: 'Aguardando atendimento humano', desc: '+55 21 97777-0003 solicitou falar com a Camila.', time: '32 min atrás', unread: true },
  { id: 4, icon: '✅', title: 'Lead convertido', desc: '+55 31 96666-0004 confirmou presença na palestra.', time: '1h atrás', unread: false },
  { id: 5, icon: '📩', title: 'Nova mensagem recebida', desc: '+55 11 95555-0005 enviou nova mensagem no WhatsApp.', time: '2h atrás', unread: false },
  { id: 6, icon: '📊', title: 'Relatório semanal disponível', desc: '23 conversas, 4 leads quentes, 2 convertidos na última semana.', time: 'Ontem', unread: false },
  { id: 7, icon: '⚡', title: 'Saudação automática enviada', desc: 'Mensagem de boas-vindas enviada para +55 11 94444-0006.', time: 'Ontem', unread: false },
]

export default function NotificationsPage() {
  const unreadCount = NOTIFS.filter(n => n.unread).length

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111b21', margin: 0, letterSpacing: '-0.3px' }}>Notificações</h1>
          <p style={{ color: '#4b5563', fontSize: 13.5, marginTop: 4 }}>
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button style={{
            background: '#e9f5ee', color: '#128C7E', border: '1px solid #b7e4c7',
            borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ background: '#fff', border: '1px solid #e9edef', borderRadius: 12, overflow: 'hidden' }}>
        {NOTIFS.map((n, i) => (
          <div key={n.id} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            padding: '16px 20px',
            borderBottom: i < NOTIFS.length - 1 ? '1px solid #f0f2f5' : 'none',
            background: n.unread ? '#f0f9f4' : '#fff',
            cursor: 'pointer',
          }}>
            {/* Ícone */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: n.unread ? '#e9f5ee' : '#f0f2f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              {n.icon}
            </div>

            {/* Conteúdo */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontWeight: n.unread ? 700 : 500, fontSize: 14, color: '#111b21' }}>{n.title}</span>
                <span style={{ fontSize: 11.5, color: '#667781', flexShrink: 0, whiteSpace: 'nowrap' }}>{n.time}</span>
              </div>
              <div style={{ fontSize: 13, color: '#4b5563', marginTop: 3, lineHeight: 1.5 }}>{n.desc}</div>
            </div>

            {/* Ponto não lido */}
            {n.unread && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#25D366', flexShrink: 0, marginTop: 6,
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
