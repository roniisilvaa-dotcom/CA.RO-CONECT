'use client'

import { useState, useEffect } from 'react'

function timeAgo(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const channelLabel = (ch) => ch?.includes('instagram') ? '📷 Instagram' : '💬 WhatsApp'
const channelColor = (ch) => ch?.includes('instagram') ? '#E1306C' : '#25D366'

export default function PortalPage({ params }) {
  const { token } = params
  const [tenant, setTenant] = useState(null)
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [conversations, setConversations] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch(`/api/portal/auth?token=${token}`)
        if (!authRes.ok) {
          setError('Link de acesso inválido ou expirado.')
          setLoading(false)
          return
        }
        const authData = await authRes.json()
        setTenant(authData.tenant)

        const [statsRes, convsRes] = await Promise.all([
          fetch(`/api/portal/stats?token=${token}`),
          fetch(`/api/portal/conversations?token=${token}`)
        ])
        const statsData = await statsRes.json()
        const convsData = await convsRes.json()

        setStats(statsData.stats)
        setChartData(statsData.messagesByDay || [])
        setConversations(convsData.conversations || [])
      } catch (err) {
        setError('Erro ao carregar o portal. Tente novamente.')
      }
      setLoading(false)
    }
    init()
    const interval = setInterval(init, 30000)
    return () => clearInterval(interval)
  }, [token])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#666', fontSize: 14 }}>Carregando seu painel...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{error}</div>
      <div style={{ color: '#666', fontSize: 14 }}>Solicite um novo link ao suporte CA.RO TECH</div>
    </div>
  )

  const maxChart = Math.max(...chartData.map(d => d.total), 1)
  const aiRate = stats?.messages_today > 0 ? Math.round((stats.ai_responses_today / stats.messages_today) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #D4AF37, #F5D673)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: 16 }}>
          {tenant?.name?.[0] || 'C'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{tenant?.name || 'Meu Portal'}</div>
          <div style={{ fontSize: 11, color: '#666' }}>CA.RO TECH — Painel do Cliente</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: tenant?.ai_enabled ? '#25D36615' : '#ff6b6b15',
          color: tenant?.ai_enabled ? '#25D366' : '#ff6b6b',
          border: `1px solid ${tenant?.ai_enabled ? '#25D36640' : '#ff6b6b40'}`
        }}>
          {tenant?.ai_enabled ? '🤖 IA Ativa' : '⏸ IA Pausada'}
        </div>
      </div>

      <div style={{ background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', padding: '0 24px', display: 'flex', gap: 0 }}>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'conversas', label: '💬 Conversas' },
          { key: 'analytics', label: '📈 Analytics' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 18px', background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid #D4AF37' : '2px solid transparent',
              color: tab === t.key ? '#D4AF37' : '#666',
              cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              transition: 'all 0.2s', fontFamily: 'inherit'
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {tab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Conversas Ativas', value: stats?.active_conversations, icon: '💬', color: '#7C3AED' },
                { label: 'Mensagens Hoje', value: stats?.messages_today, icon: '📨', color: '#2563EB' },
                { label: 'IA Respondeu Hoje', value: stats?.ai_responses_today, icon: '🤖', color: '#D4AF37' },
                { label: 'Conversas Hoje', value: stats?.conversations_today, icon: '📅', color: '#059669' },
                { label: 'Total de Leads', value: stats?.total_leads, icon: '👥', color: '#DC2626' },
                { label: 'Taxa IA', value: `${aiRate}%`, icon: '⚡', color: '#F59E0B' },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: '#111', borderRadius: 12, padding: '18px 20px', border: '1px solid #222' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                    <span style={{ fontSize: 12, color: '#666' }}>{kpi.label}</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: kpi.color }}>{kpi.value ?? '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 16 }}>MENSAGENS — ÚLTIMOS 7 DIAS</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
                {chartData.length > 0 ? chartData.map((day, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ width: '100%', height: `${Math.max((day.outbound / maxChart) * 80, 2)}px`, background: '#D4AF37', borderRadius: '3px 3px 0 0' }} />
                      <div style={{ width: '100%', height: `${Math.max((day.inbound / maxChart) * 80, 2)}px`, background: '#25D366' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#555' }}>{day.date}</div>
                  </div>
                )) : <div style={{ color: '#444', fontSize: 13, margin: 'auto' }}>Sem dados nos últimos 7 dias</div>}
              </div>
            </div>
            <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
              <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 16 }}>CONVERSAS RECENTES</div>
              {conversations.slice(0, 5).map(conv => (
                <div key={conv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {conv.channel?.includes('instagram') ? '📷' : '💬'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{conv.customer_name || conv.customer_phone || 'Contato'}</div>
                    <div style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#555' }}>{timeAgo(conv.last_message_at)}</div>
                    <div style={{ fontSize: 10, marginTop: 3, color: conv.ai_enabled ? '#25D366' : '#ff6b6b' }}>{conv.ai_enabled ? 'IA ON' : 'IA OFF'}</div>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && <div style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhuma conversa ainda</div>}
            </div>
          </>
        )}

        {tab === 'conversas' && (
          <div style={{ background: '#111', borderRadius: 12, border: '1px solid #222', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#999' }}>TODAS AS CONVERSAS</div>
              <div style={{ fontSize: 12, color: '#555' }}>{conversations.length} conversas</div>
            </div>
            {conversations.map(conv => (
              <div key={conv.id} style={{ padding: '14px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: channelColor(conv.channel), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{conv.customer_name || conv.customer_phone || 'Contato'}</span>
                    <span style={{ fontSize: 10, color: channelColor(conv.channel), background: `${channelColor(conv.channel)}15`, padding: '1px 6px', borderRadius: 3 }}>{channelLabel(conv.channel)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message || 'Sem mensagens'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#555' }}>{timeAgo(conv.last_message_at)}</div>
                  <div style={{ fontSize: 10, marginTop: 2, color: '#555' }}>{conv.message_count} msgs</div>
                </div>
                <div style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: conv.ai_enabled ? '#25D36615' : '#ff6b6b15', color: conv.ai_enabled ? '#25D366' : '#ff6b6b' }}>
                  {conv.ai_enabled ? 'IA ON' : 'IA OFF'}
                </div>
              </div>
            ))}
            {conversations.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#444' }}>Nenhuma conversa ainda</div>}
          </div>
        )}

        {tab === 'analytics' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
                <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 16 }}>PERFORMANCE DA IA</div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: '#999' }}>Taxa de resposta automática</span>
                    <span style={{ color: '#D4AF37', fontWeight: 600 }}>{aiRate}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', height: 6, borderRadius: 3 }}>
                    <div style={{ width: `${aiRate}%`, height: '100%', background: '#D4AF37', borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                    <div style={{ background: '#0a0a0a', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#D4AF37' }}>{stats?.ai_responses_today || 0}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Respostas IA hoje</div>
                    </div>
                    <div style={{ background: '#0a0a0a', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#25D366' }}>{stats?.total_conversations || 0}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Total conversas</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
                <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 16 }}>LEADS</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stats?.total_leads || 0}</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>contatos no banco de dados</div>
                <div style={{ marginTop: 16, padding: 12, background: '#0a0a0a', borderRadius: 8, fontSize: 12, color: '#666' }}>
                  💡 Leads são captados automaticamente quando alguém entra em contato via WhatsApp ou Instagram.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '24px', color: '#333', fontSize: 11 }}>
        Powered by CA.RO TECH · {new Date().getFullYear()}
      </div>
    </div>
  )
}
