'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const STAGE = {
  new:       { label: 'Novo',         bg: '#e8eaf6', color: '#3949ab' },
  warm:      { label: 'Morno',        bg: '#fff8e1', color: '#f59e0b' },
  hot:       { label: '🔥 Quente',    bg: '#ffebee', color: '#ef4444' },
  converted: { label: '✓ Convertido', bg: '#e8f5e9', color: '#16a34a' },
}

const AVATAR_COLORS = ['#128C7E','#25D366','#0ea5e9','#8b5cf6','#ec4899','#f59e0b']
function avatarColor(phone) {
  if (!phone) return AVATAR_COLORS[0]
  return AVATAR_COLORS[parseInt(phone.slice(-1)) % AVATAR_COLORS.length]
}

function timeOnly(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Ícone de canal
function ChannelIcon({ channel, size = 16 }) {
  if (channel === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433"/>
            <stop offset="25%" stopColor="#e6683c"/>
            <stop offset="50%" stopColor="#dc2743"/>
            <stop offset="75%" stopColor="#cc2366"/>
            <stop offset="100%" stopColor="#bc1888"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)"/>
        <circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.5" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1" fill="#fff"/>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

export default function ChatClient({ conv: initialConv, messages: initialMessages, appointments }) {
  const [messages, setMessages] = useState(initialMessages)
  const [conv, setConv] = useState(initialConv)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const badge = STAGE[conv.stage] || STAGE.new
  const color = avatarColor(conv.phone)
  const channel = conv.channel || 'whatsapp'
  const isIG = channel === 'instagram'

  // Scroll automático para o fim
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || sending) return
    setSending(true)
    setError('')
    const optimistic = {
      id: `opt_${Date.now()}`,
      role: 'assistant',
      content: text.trim(),
      created_at: new Date().toISOString(),
      optimistic: true,
    }
    setMessages(m => [...m, optimistic])
    setText('')
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conv.id, message: optimistic.content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      // Atualiza id real
      setMessages(m => m.map(msg =>
        msg.id === optimistic.id ? { ...msg, id: data.messageId, created_at: data.created_at, optimistic: false } : msg
      ))
    } catch (err) {
      setError(err.message)
      setMessages(m => m.filter(msg => msg.id !== optimistic.id))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function handleToggleAI() {
    setTogglingAI(true)
    const newEnabled = !conv.ai_enabled
    try {
      const res = await fetch('/api/toggle-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conv.id, enabled: newEnabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConv(c => ({ ...c, ai_enabled: data.ai_enabled, status: data.status }))
    } catch (err) {
      setError(err.message)
    } finally {
      setTogglingAI(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── PAINEL DE CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '10px 16px',
          background: '#f0f2f5',
          borderBottom: '1px solid #e9edef',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Voltar */}
          <Link href="/admin/conversations" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#e9edef', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', color: '#54656f', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </Link>

          {/* Avatar + canal */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
            }}>
              {conv.phone?.replace('ig_','').slice(-2)}
            </div>
            <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
              <ChannelIcon channel={channel} size={16} />
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111b21', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.name || conv.phone?.replace('ig_','')}
            </div>
            <div style={{ fontSize: 12, color: conv.ai_enabled ? '#25D366' : '#f59e0b', marginTop: 1, fontWeight: 500 }}>
              {conv.ai_enabled ? '🤖 IA respondendo' : '👤 Atendimento humano'} · {isIG ? 'Instagram' : 'WhatsApp'}
            </div>
          </div>

          {/* Controles */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: badge.bg, color: badge.color, fontWeight: 700 }}>
              {badge.label}
            </span>
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#fff', color: '#374151', fontWeight: 600, border: '1px solid #e9edef' }}>
              Score {conv.score || 0}
            </span>

            {/* Toggle IA */}
            <button
              onClick={handleToggleAI}
              disabled={togglingAI}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                border: 'none', cursor: togglingAI ? 'wait' : 'pointer',
                background: conv.ai_enabled ? '#ffebee' : '#e9f5ee',
                color: conv.ai_enabled ? '#ef4444' : '#128C7E',
                transition: 'all 0.2s',
              }}
            >
              {togglingAI ? '...' : conv.ai_enabled ? '⏸ Pausar IA' : '▶ Ligar IA'}
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div style={{ padding: '8px 16px', background: '#ffebee', color: '#c62828', fontSize: 13, borderBottom: '1px solid #ffcdd2' }}>
            ⚠️ {error}
            <button onClick={() => setError('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Mensagens */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 8%',
          display: 'flex', flexDirection: 'column', gap: 3,
          background: '#efeae2',
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '40px 20px' }}>
              <div style={{ background: '#ffffffcc', borderRadius: 10, padding: '12px 20px', display: 'inline-block', fontSize: 13, color: '#667781' }}>
                🔒 Nenhuma mensagem ainda. Inicie a conversa!
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 12px' }}>
                <div style={{ background: '#ffffffcc', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#54656f' }}>
                  {new Date(messages[0]?.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {messages.map((msg, i) => {
                const isUser = msg.role === 'user'
                const isOptimistic = msg.optimistic
                const showLabel = !isUser && (i === 0 || messages[i - 1]?.role === 'user')
                return (
                  <div key={msg.id || i} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end', marginBottom: 2 }}>
                    <div style={{
                      maxWidth: '65%',
                      padding: '7px 12px 6px',
                      borderRadius: isUser ? '0px 8px 8px 8px' : '8px 0px 8px 8px',
                      background: isUser ? '#ffffff' : '#d9fdd3',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.07)',
                      opacity: isOptimistic ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}>
                      {!isUser && showLabel && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: isIG ? '#bc1888' : '#128C7E', marginBottom: 2 }}>
                          {isIG ? '📸 Camila (Instagram)' : '🤖 Assistente'}
                        </div>
                      )}
                      <div style={{ fontSize: 14, color: '#111b21', lineHeight: 1.55, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#667781' }}>{timeOnly(msg.created_at)}</span>
                        {!isUser && !isOptimistic && (
                          <svg width="14" height="10" viewBox="0 0 16 11" fill="#53bdeb">
                            <path d="M15.01 1.18L5.8 10.39l-.45.45L.9 6.39l.9-.9 3.55 3.55 9.31-9.31.35.45z"/>
                          </svg>
                        )}
                        {isOptimistic && <span style={{ fontSize: 10, color: '#aab0b7' }}>enviando…</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Caixa de envio */}
        <div style={{
          background: '#f0f2f5',
          borderTop: '1px solid #e9edef',
          padding: '10px 16px',
          display: 'flex', alignItems: 'flex-end', gap: 10,
        }}>
          {/* Input */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 24, padding: '10px 16px', border: '1px solid #e9edef', display: 'flex', alignItems: 'center' }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Responder via ${isIG ? 'Instagram' : 'WhatsApp'}… (Enter para enviar)`}
              rows={1}
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                fontSize: 14, color: '#111b21', lineHeight: 1.5,
                background: 'transparent', fontFamily: 'inherit',
                maxHeight: 120, overflowY: 'auto',
              }}
            />
          </div>

          {/* Botão enviar */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: text.trim() && !sending
                ? (isIG ? 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)' : '#25D366')
                : '#e9edef',
              border: 'none', cursor: text.trim() && !sending ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            {sending ? (
              <div style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* ── PAINEL LATERAL DO LEAD ── */}
      <div style={{ width: 280, background: '#fff', borderLeft: '1px solid #e9edef', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', background: '#f0f2f5', borderBottom: '1px solid #e9edef' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8 }}>Info do Lead</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {conv.phone?.replace('ig_','').slice(-2)}
              </div>
              <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                <ChannelIcon channel={channel} size={14} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111b21' }}>{conv.name || conv.phone?.replace('ig_','')}</div>
              <div style={{ fontSize: 12, color: '#667781', marginTop: 2 }}>{isIG ? 'Instagram' : conv.phone}</div>
            </div>
          </div>

          <div style={{ height: 1, background: '#f0f2f5', margin: '0 -16px 16px' }} />

          {[
            { label: 'Canal', value: isIG ? '📸 Instagram' : '📱 WhatsApp' },
            { label: 'Status', value: conv.status === 'open' ? '● Aberta' : conv.status === 'waiting_human' ? '⏳ Aguardando' : conv.status },
            { label: 'Lead desde', value: conv.lead_since ? new Date(conv.lead_since).toLocaleDateString('pt-BR') : '—' },
            { label: 'Mensagens', value: `${messages.length}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13.5, color: '#111b21', fontWeight: 500 }}>{value}</div>
            </div>
          ))}

          {/* Estágio */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Estágio</div>
            <span style={{ fontSize: 12.5, padding: '4px 12px', borderRadius: 20, background: badge.bg, color: badge.color, fontWeight: 700 }}>{badge.label}</span>
          </div>

          {/* Score */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Score</div>
            <div style={{ background: '#f0f2f5', borderRadius: 100, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${conv.score || 0}%`, height: '100%',
                background: conv.score >= 70 ? '#25D366' : conv.score >= 40 ? '#f59e0b' : '#e9edef',
                borderRadius: 100,
              }} />
            </div>
            <div style={{ fontSize: 13, color: '#111b21', marginTop: 5, fontWeight: 700 }}>{conv.score || 0}<span style={{ fontSize: 11, color: '#667781', fontWeight: 400 }}>/100</span></div>
          </div>

          {/* IA status */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Inteligência Artificial</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: conv.ai_enabled ? '#e9f5ee' : '#fff8f0',
              border: `1px solid ${conv.ai_enabled ? '#b7e4c7' : '#fde68a'}`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: conv.ai_enabled ? '#25D366' : '#f59e0b', flexShrink: 0 }}/>
              <span style={{ fontSize: 12.5, color: conv.ai_enabled ? '#0a5c44' : '#92400e', fontWeight: 600 }}>
                {conv.ai_enabled ? 'Ativa — respondendo' : 'Pausada — aguardando você'}
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: '#f0f2f5', margin: '0 -16px 16px' }} />

          {/* Agendamentos */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#667781', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Agendamentos</div>
            {appointments.length === 0 ? (
              <div style={{ fontSize: 13, color: '#aab0b7', fontStyle: 'italic' }}>Nenhum agendamento</div>
            ) : appointments.map(apt => (
              <div key={apt.id} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 10, marginBottom: 8, border: '1px solid #f0f2f5' }}>
                <div style={{ fontSize: 13, color: '#111b21', fontWeight: 600 }}>{apt.service_name}</div>
                <div style={{ fontSize: 12, color: '#667781', marginTop: 3 }}>{new Date(apt.scheduled_at).toLocaleString('pt-BR')}</div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e9f5ee', color: '#128C7E', fontWeight: 600 }}>{apt.status || 'agendado'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
