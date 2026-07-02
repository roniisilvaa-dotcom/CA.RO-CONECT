'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

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
  new: { label: 'Novo', bg: '#e8eaf6', color: '#3949ab' },
  warm: { label: 'Morno', bg: '#fff8e1', color: '#f59e0b' },
  hot: { label: '🔥 Quente', bg: '#ffebee', color: '#ef4444' },
  converted: { label: '✓ Convertido', bg: '#e8f5e9', color: '#16a34a' },
}

function initials(phone) {
  if (!phone) return '?'
  return phone.replace('ig_', '').slice(-2)
}

const AVATAR_COLORS = ['#128C7E', '#25D366', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444']
function avatarColor(phone) {
  if (!phone) return AVATAR_COLORS[0]
  return AVATAR_COLORS[parseInt(phone.slice(-1)) % AVATAR_COLORS.length]
}

export default function ConversationsPage() {
  const [convs, setConvs] = useState([])
  const [filter, setFilter] = useState({ stage: 'all', status: 'all' })
  const [pulse, setPulse] = useState(false)

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter.stage !== 'all') params.set('stage', filter.stage)
      if (filter.status !== 'all') params.set('status', filter.status)
      const res = await fetch(`/api/admin/conversations?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.conversations) {
        setConvs(prev => {
          const hasNew = data.conversations.some(c => !prev.find(p => p.id === c.id))
          if (hasNew) setPulse(true)
          return data.conversations
        })
      }
    } catch {}
  }, [filter])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 3000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (pulse) {
      const t = setTimeout(() => setPulse(false), 1500)
      return () => clearTimeout(t)
    }
  }, [pulse])

  const FILTERS = [
    { stage: 'all', status: 'all', label: 'Todas' },
    { stage: 'all', status: 'open', label: 'Abertas' },
    { stage: 'all', status: 'waiting_human', label: '⏳ Aguardando' },
    { stage: 'hot', status: 'all', label: '🔥 Quentes' },
    { stage: 'new', status: 'all', label: 'Novos' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f0f2f5' }}>
      <style>{`
        @keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        .conv-item:hover { background: #f5f6f6 !important; }
      `}</style>

      {/* ── LISTA ── */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', background: '#ffffff', borderRight: '1px solid #e9edef' }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 0', background: '#f0f2f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111b21' }}>Conversas</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#25D366',
                animation: pulse ? 'ping 0.6s ease 3' : 'none',
              }} />
              <span style={{ fontSize: 12.5, color: '#667781', fontWeight: 500 }}>
                {convs.length} conversa{convs.length !== 1 ? 's' : ''} · ao vivo
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ffffff', borderRadius: 10,
            padding: '8px 14px', marginBottom: 12,
            border: '1px solid #e9edef',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aab0b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span style={{ fontSize: 13.5, color: '#aab0b7' }}>Pesquisar conversas</span>
          </div>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 0 }}>
            {FILTERS.map(f => {
              const active = filter.stage === f.stage && filter.status === f.status
              return (
                <button key={f.label} onClick={() => setFilter({ stage: f.stage, status: f.status })} style={{
                  border: `1.5px solid ${active ? '#25D366' : '#e9edef'}`,
                  padding: '6px 14px', borderRadius: 20, fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  background: active ? '#e9f5ee' : '#ffffff',
                  color: active ? '#128C7E' : '#4b5563',
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                }}>{f.label}</button>
              )
            })}
          </div>
          <div style={{ height: 1, background: '#e9edef', marginTop: 10 }} />
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convs.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, color: '#667781' }}>Aguardando conversas…</div>
            </div>
          ) : convs.map((conv) => {
            const badge = STAGE[conv.stage] || STAGE.new
            const color = avatarColor(conv.phone)
            const unread = parseInt(conv.unread || 0)
            return (
              <Link key={conv.id} href={`/admin/conversations/${conv.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div className="conv-item" style={{
                  padding: '12px 16px', borderBottom: '1px solid #f0f2f5',
                  display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', background: '#fff',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 49, height: 49, borderRadius: '50%', background: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#fff',
                    }}>{initials(conv.phone)}</div>
                    <div style={{ position: 'absolute', bottom: -1, right: -1 }}>
                      {conv.channel === 'instagram' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <defs><linearGradient id={`ig${conv.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f09433" /><stop offset="50%" stopColor="#dc2743" /><stop offset="100%" stopColor="#bc1888" />
                          </linearGradient></defs>
                          <rect x="2" y="2" width="20" height="20" rx="5" fill={`url(#ig${conv.id})`} />
                          <circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.5" fill="none" />
                          <circle cx="17.5" cy="6.5" r="1" fill="#fff" />
                        </svg>
                      ) : (
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.87 9.87 0 00-5.031-1.378C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

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
                            background: '#25D366', color: '#fff', fontSize: 11.5, fontWeight: 700,
                            minWidth: 20, height: 20, borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
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

      {/* ── PLACEHOLDER ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f0f2f5', borderLeft: '1px solid #e9edef',
      }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%', background: '#e9edef',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#aab0b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 300, color: '#41525d', marginBottom: 8 }}>CA·RO Connect</div>
        <div style={{ fontSize: 14, color: '#667781', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          Selecione uma conversa para visualizar.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: 13, color: '#25D366' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366' }} />
          Atualizando em tempo real a cada 3s
        </div>
      </div>
    </div>
  )
}
