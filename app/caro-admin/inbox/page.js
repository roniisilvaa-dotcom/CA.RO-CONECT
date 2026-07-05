'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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

const WA_COLOR = '#25D366'
const IG_COLOR = '#E1306C'

const channelColor = (ch) => ch === 'instagram' ? IG_COLOR : WA_COLOR
const channelIcon  = (ch) => ch === 'instagram' ? '📷' : '💬'
const channelLabel = (ch) => ch === 'instagram' ? 'Instagram' : 'WhatsApp'

export default function InboxPage() {
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv]   = useState(null)
  const [messages, setMessages]           = useState([])
  const [summary, setSummary]             = useState([])
  const [filter, setFilter]               = useState({ channel: '', status: 'open', tenantId: '' })
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const [tenants, setTenants]             = useState([])
  const [reply, setReply]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [sendError, setSendError]         = useState('')
  const messagesEndRef = useRef(null)

  const scrollBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)

  const loadConversations = useCallback(async () => {
    const params = new URLSearchParams()
    if (filter.channel)  params.set('channel',  filter.channel)
    if (filter.status)   params.set('status',   filter.status)
    if (filter.tenantId) params.set('tenantId', filter.tenantId)
    try {
      const res  = await fetch(`/api/caro-admin/inbox?${params}`)
      const data = await res.json()
      setConversations(data.conversations || [])
      setSummary(data.summary || [])
    } finally {
      setLoading(false)
    }
  }, [filter])

  const loadTenants = useCallback(async () => {
    const res  = await fetch('/api/caro-admin/tenants')
    const data = await res.json()
    setTenants(data.tenants || [])
  }, [])

  const fetchMessages = useCallback(async (convId) => {
    const res  = await fetch(`/api/caro-admin/messages?conv_id=${convId}&limit=200`)
    const data = await res.json()
    return data.messages || []
  }, [])

  const openConv = useCallback(async (conv) => {
    setSelectedConv(conv)
    setLoadingMsgs(true)
    setMessages([])
    setSendError('')
    const msgs = await fetchMessages(conv.id)
    setMessages(msgs)
    setLoadingMsgs(false)
    scrollBottom()
  }, [fetchMessages])

  const pollMessages = useCallback(async () => {
    if (!selectedConv) return
    const msgs = await fetchMessages(selectedConv.id)
    setMessages(prev => {
      if (msgs.length !== prev.length) scrollBottom()
      return msgs
    })
  }, [selectedConv, fetchMessages])

  const sendReply = useCallback(async () => {
    if (!reply.trim() || !selectedConv || sending) return
    setSending(true)
    setSendError('')
    try {
      const res  = await fetch('/api/caro-admin/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ conv_id: selectedConv.id, content: reply.trim(), role: 'assistant' })
      })
      const data = await res.json()
      if (data.ok) { setReply(''); await pollMessages() }
      else setSendError(data.error || 'Erro ao enviar')
    } catch { setSendError('Erro de rede') }
    finally { setSending(false) }
  }, [reply, selectedConv, sending, pollMessages])

  useEffect(() => { loadConversations(); loadTenants() }, [filter])
  useEffect(() => {
    const t = setInterval(() => { loadConversations(); pollMessages() }, 12000)
    return () => clearInterval(t)
  }, [filter, pollMessages])

  const filtered = conversations.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.customer_name||'').toLowerCase().includes(q) ||
           (c.customer_phone||'').toLowerCase().includes(q) ||
           (c.last_message||'').toLowerCase().includes(q) ||
           (c.tenant_name||'').toLowerCase().includes(q)
  })
  const totalUnread = conversations.reduce((s,c) => s + (c.unread_count||0), 0)
  const sStyle = { flex:1, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6, color:'#fff', padding:'5px 8px', fontSize:12, fontFamily:'inherit', outline:'none' }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0a', color:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>
      <div style={{ width:340, borderRight:'1px solid #1a1a1a', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid #1a1a1a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <a href="/caro-admin" style={{ color:'#555', textDecoration:'none', fontSize:18 }}>←</a>
            <div style={{ fontWeight:700, fontSize:14 }}>📥 Universal Inbox</div>
            {totalUnread > 0 && <div style={{ marginLeft:'auto', background:'#DC2626', borderRadius:10, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{totalUnread}</div>}
          </div>
          <input type="text" placeholder="🔍  Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', boxSizing:'border-box', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', padding:'7px 10px', fontSize:12, fontFamily:'inherit', outline:'none', marginBottom:8 }} />
          <div style={{ display:'flex', gap:6, marginBottom:6 }}>
            <select value={filter.tenantId} onChange={e => setFilter(f => ({ ...f, tenantId: e.target.value }))} style={sStyle}>
              <option value="">Todos clientes</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <select value={filter.channel} onChange={e => setFilter(f => ({ ...f, channel: e.target.value }))} style={sStyle}>
              <option value="">Todos canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
            <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={sStyle}>
              <option value="">Todos</option>
              <option value="open">Abertos</option>
              <option value="closed">Fechados</option>
            </select>
          </div>
        </div>
        {summary.length > 0 && (
          <div style={{ padding:'7px 12px', borderBottom:'1px solid #1a1a1a', display:'flex', gap:6, alignItems:'center' }}>
            {summary.map(s => (
              <button key={s.channel}
                onClick={() => setFilter(f => ({ ...f, channel: f.channel === s.channel ? '' : s.channel }))}
                style={{ fontSize:11, borderRadius:6, padding:'3px 9px', cursor:'pointer', border:'none', background: filter.channel === s.channel ? channelColor(s.channel)+'22' : '#1a1a1a', color: channelColor(s.channel), fontFamily:'inherit' }}>
                {channelIcon(s.channel)} {s.total} {s.open_count > 0 ? `(${s.open_count})` : ''}
              </button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:10, color:'#444' }}>{filtered.length}</span>
          </div>
        )}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:24, color:'#444', textAlign:'center', fontSize:13 }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:24, color:'#444', textAlign:'center', fontSize:13 }}>Nenhuma conversa</div>
          ) : filtered.map(conv => {
            const sel = selectedConv?.id === conv.id
            const clr = channelColor(conv.channel)
            return (
              <div key={conv.id} onClick={() => openConv(conv)} style={{ padding:'11px 14px', borderBottom:'1px solid #111', cursor:'pointer', background: sel ? '#151515' : 'transparent', borderLeft: sel ? `2px solid ${clr}` : '2px solid transparent' }}>
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background: clr+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border:`1px solid ${clr}30` }}>
                    {channelIcon(conv.channel)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.customer_name || conv.customer_phone || 'Contato'}</span>
                      <span style={{ fontSize:10, color:'#555', flexShrink:0, marginLeft:6 }}>{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#666', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {conv.last_message_direction === 'assistant' && <span style={{ color: WA_COLOR }}>🤖 </span>}
                      {conv.last_message || 'Sem mensagens'}
                    </div>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <span style={{ fontSize:10, color: clr, background: clr+'15', padding:'1px 5px', borderRadius:3 }}>{channelLabel(conv.channel)}</span>
                      <span style={{ fontSize:10, color:'#444' }}>{conv.tenant_name}</span>
                      <span style={{ fontSize:10, color: conv.ai_enabled ? WA_COLOR : '#555' }}>{conv.ai_enabled ? '🤖' : '⏸'}</span>
                      {conv.unread_count > 0 && <span style={{ marginLeft:'auto', background:'#DC2626', borderRadius:8, padding:'1px 6px', fontSize:10, fontWeight:700 }}>{conv.unread_count}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {selectedConv ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'12px 20px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:12, background:'#0d0d0d' }}>
            <div style={{ width:42, height:42, borderRadius:'50%', flexShrink:0, background: channelColor(selectedConv.channel)+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, border:`1px solid ${channelColor(selectedConv.channel)}30` }}>
              {channelIcon(selectedConv.channel)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{selectedConv.customer_name || selectedConv.customer_phone || 'Contato'}</div>
              <div style={{ fontSize:11, color:'#555' }}>{channelLabel(selectedConv.channel)} · {selectedConv.tenant_name}{selectedConv.customer_phone ? ` · ${selectedConv.customer_phone}` : ''} · {selectedConv.message_count||0} msgs</div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <span style={{ padding:'4px 10px', borderRadius:6, fontSize:11, background: selectedConv.ai_enabled?'#25D36615':'#1a1a1a', color: selectedConv.ai_enabled?WA_COLOR:'#888', border:`1px solid ${selectedConv.ai_enabled?'#25D36640':'#2a2a2a'}`, whiteSpace:'nowrap' }}>
                {selectedConv.ai_enabled ? '🤖 IA Ativa' : '⏸ IA Pausada'}
              </span>
              <span style={{ padding:'4px 10px', borderRadius:6, fontSize:11, background: selectedConv.status==='open'?'#2563EB15':'#1a1a1a', color: selectedConv.status==='open'?'#60A5FA':'#555', border:`1px solid ${selectedConv.status==='open'?'#2563EB40':'#2a2a2a'}`, whiteSpace:'nowrap' }}>
                {selectedConv.status==='open' ? '● Aberto' : '● Fechado'}
              </span>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:6 }}>
            {loadingMsgs ? (
              <div style={{ color:'#444', textAlign:'center', marginTop:60, fontSize:13 }}>Carregando...</div>
            ) : messages.length === 0 ? (
              <div style={{ color:'#333', textAlign:'center', marginTop:60, fontSize:13 }}>Nenhuma mensagem</div>
            ) : messages.map(msg => {
              const isAI = msg.role === 'assistant'
              return (
                <div key={msg.id} style={{ display:'flex', justifyContent: isAI?'flex-end':'flex-start' }}>
                  <div style={{ maxWidth:'72%', padding:'8px 12px', borderRadius: isAI?'14px 14px 3px 14px':'14px 14px 14px 3px', background: isAI?'#1C3A28':'#1a1a1a', fontSize:13, lineHeight:1.45, border: isAI?'1px solid #25D36625':'1px solid #222' }}>
                    {isAI && <div style={{ fontSize:10, color:WA_COLOR, marginBottom:4, fontWeight:600 }}>🤖 Assistente</div>}
                    <div style={{ color:'#e8e8e8', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.content}</div>
                    <div style={{ fontSize:10, color:'#555', marginTop:5, textAlign:'right' }}>
                      {new Date(msg.created_at).toLocaleString('pt-BR', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
          {(selectedConv.lead_score > 0 || selectedConv.lead_stage) && (
            <div style={{ padding:'8px 24px', borderTop:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:10, background:'#0d0d0d' }}>
              <span style={{ fontSize:11, color:'#555' }}>Lead score:</span>
              <div style={{ display:'flex', gap:3 }}>{[1,2,3,4,5].map(n => <div key={n} style={{ width:8, height:8, borderRadius:'50%', background: n<=(selectedConv.lead_score||0)?'#D4AF37':'#1a1a1a', border:'1px solid #2a2a2a' }} />)}</div>
              <span style={{ fontSize:11, color:'#D4AF37', fontWeight:600 }}>{selectedConv.lead_score||0}/5</span>
              {selectedConv.lead_stage && <span style={{ fontSize:11, background:'#1a1a1a', color:'#888', padding:'1px 7px', borderRadius:4 }}>{selectedConv.lead_stage}</span>}
            </div>
          )}
          <div style={{ padding:'12px 20px', borderTop:'1px solid #1a1a1a', background:'#0d0d0d' }}>
            {sendError && <div style={{ fontSize:11, color:'#DC2626', marginBottom:8, padding:'4px 8px', background:'#DC262615', borderRadius:4 }}>{sendError}</div>}
            <div style={{ display:'flex', gap:8 }}>
              <textarea value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Responder como assistente... (Enter envia)"
                rows={2}
                style={{ flex:1, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, color:'#fff', padding:'8px 12px', fontSize:13, fontFamily:'inherit', resize:'none', outline:'none', lineHeight:1.4 }}
              />
              <button onClick={sendReply} disabled={!reply.trim()||sending}
                style={{ background: reply.trim()&&!sending?'#25D366':'#1a1a1a', border:'none', borderRadius:8, color: reply.trim()&&!sending?'#000':'#555', padding:'0 18px', cursor: reply.trim()&&!sending?'pointer':'default', fontWeight:700, fontSize:13, fontFamily:'inherit', flexShrink:0 }}>
                {sending?'...':'↑ Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:56 }}>💬</div>
          <div style={{ fontSize:14, color:'#444' }}>Selecione uma conversa</div>
          <div style={{ fontSize:12, color:'#333' }}>{conversations.length} conversas carregadas</div>
        </div>
      )}
    </div>
  )
}
