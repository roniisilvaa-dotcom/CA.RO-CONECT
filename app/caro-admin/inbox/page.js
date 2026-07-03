'use client'

import { useState, useEffect, useRef } from 'react'

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

const CHANNEL_COLORS = { whatsapp: '#25D366', instagram: '#E1306C' }
const CHANNEL_ICONS = { whatsapp: '💬', instagram: '📷' }

export default function InboxPage() {
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [summary, setSummary] = useState([])
  const [filter, setFilter] = useState({ channel: '', status: '', tenantId: '' })
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [tenants, setTenants] = useState([])
  const messagesEndRef = useRef(null)

  async function loadConversations() {
    const params = new URLSearchParams()
    if (filter.channel) params.set('channel', filter.channel)
    if (filter.status) params.set('status', filter.status)
    if (filter.tenantId) params.set('tenantId', filter.tenantId)
    const res = await fetch(`/api/caro-admin/inbox?${params}`)
    const data = await res.json()
    setConversations(data.conversations || [])
    setSummary(data.summary || [])
    setLoading(false)
  }

  async function loadTenants() {
    const res = await fetch('/api/caro-admin/tenants')
    if (res.ok) {
      const data = await res.json()
      setTenants(data.tenants || [])
    }
  }

  async function loadMessages(conv) {
    setSelectedConv(conv)
    setLoadingMsgs(true)
    const res = await fetch(`/api/caro-admin/messages?conversationId=${conv.id}`)
    const data = await res.json()
    setMessages(data.messages || [])
    setLoadingMsgs(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => { loadConversations(); loadTenants() }, [filter])
  useEffect(() => {
    const t = setInterval(loadConversations, 15000)
    return () => clearInterval(t)
  }, [filter])

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <div style={{ width: 320, borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <a href="/caro-admin" style={{ color: '#555', textDecoration: 'none', fontSize: 20 }}>←</a>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📥 Universal Inbox</div>
            {totalUnread > 0 && (
              <div style={{ marginLeft: 'auto', background: '#DC2626', borderRadius: 10, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>
                {totalUnread}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select value={filter.tenantId} onChange={e => setFilter(f => ({ ...f, tenantId: e.target.value }))}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', padding: '5px 8px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Todos os clientes</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={filter.channel} onChange={e => setFilter(f => ({ ...f, channel: e.target.value }))}
                style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', padding: '5px 8px', fontSize: 12, fontFamily: 'inherit' }}>
                <option value="">Todos canais</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
              </select>
              <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', padding: '5px 8px', fontSize: 12, fontFamily: 'inherit' }}>
                <option value="">Todos status</option>
                <option value="open">Abertos</option>
                <option value="closed">Fechados</option>
              </select>
            </div>
          </div>
        </div>

        {summary.length > 0 && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 6 }}>
            {summary.map(s => (
              <div key={s.channel} style={{ fontSize: 11, background: '#1a1a1a', borderRadius: 4, padding: '3px 8px', color: CHANNEL_COLORS[s.channel] }}>
                {CHANNEL_ICONS[s.channel]} {s.total} {s.open_count > 0 ? `(${s.open_count} abertos)` : ''}
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, color: '#555', textAlign: 'center' }}>Carregando...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 24, color: '#555', textAlign: 'center' }}>Nenhuma conversa</div>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => loadMessages(conv)} style={{
              padding: '12px 14px', borderBottom: '1px solid #111', cursor: 'pointer',
              background: selectedConv?.id === conv.id ? '#1a1a1a' : 'transparent',
              borderLeft: selectedConv?.id === conv.id ? '2px solid #D4AF37' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{CHANNEL_ICONS[conv.channel] || '💬'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.customer_name || conv.customer_phone || 'Contato'}
                    </span>
                    <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>{timeAgo(conv.last_message_at)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#777', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.last_message_direction === 'outbound' ? '🤖 ' : ''}{conv.last_message || 'Sem mensagens'}
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#555', background: '#1a1a1a', padding: '1px 5px', borderRadius: 3 }}>{conv.tenant_name}</span>
                    <span style={{ fontSize: 10, color: conv.ai_enabled ? '#25D366' : '#555' }}>{conv.ai_enabled ? '🤖' : '⏸'}</span>
                    {conv.unread_count > 0 && (
                      <span style={{ marginLeft: 'auto', background: '#DC2626', borderRadius: 8, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{conv.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedConv.customer_name || selectedConv.customer_phone || 'Contato'}</div>
              <div style={{ fontSize: 11, color: '#555' }}>
                {CHANNEL_ICONS[selectedConv.channel]} {selectedConv.channel} · {selectedConv.tenant_name}
                {selectedConv.customer_phone && ` · ${selectedConv.customer_phone}`}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: selectedConv.ai_enabled ? '#25D36615' : '#ff6b6b15', color: selectedConv.ai_enabled ? '#25D366' : '#ff6b6b', border: `1px solid ${selectedConv.ai_enabled ? '#25D36640' : '#ff6b6b40'}` }}>
                {selectedConv.ai_enabled ? '🤖 IA Ativa' : '⏸ IA Pausada'}
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: selectedConv.status === 'open' ? '#2563EB15' : '#1a1a1a', color: selectedConv.status === 'open' ? '#60A5FA' : '#555' }}>
                {selectedConv.status === 'open' ? '● Aberto' : '● Fechado'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingMsgs ? (
              <div style={{ color: '#555', textAlign: 'center', marginTop: 40 }}>Carregando mensagens...</div>
            ) : messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '8px 12px',
                  borderRadius: msg.direction === 'outbound' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.direction === 'outbound' ? '#1C3A2A' : '#1a1a1a',
                  fontSize: 13, lineHeight: 1.4
                }}>
                  {msg.direction === 'outbound' && <div style={{ fontSize: 10, color: '#25D366', marginBottom: 3 }}>🤖 IA</div>}
                  <div style={{ color: '#e0e0e0' }}>{msg.content}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 4, textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {selectedConv.lead_score > 0 && (
            <div style={{ padding: '8px 20px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#555' }}>Score do lead:</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: n <= selectedConv.lead_score ? '#D4AF37' : '#1a1a1a' }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>{selectedConv.lead_score}/5</span>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>{selectedConv.message_count} mensagens no total</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#333' }}>
          <div style={{ fontSize: 48 }}>💬</div>
          <div style={{ fontSize: 14 }}>Selecione uma conversa para visualizar</div>
          <div style={{ fontSize: 12, color: '#444' }}>{conversations.length} conversa(s) carregadas</div>
        </div>
      )}
    </div>
  )
}
