'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const C = {
  bg:      '#080B12',
  surf:    '#0F1320',
  surf2:   '#161D2E',
  surf3:   '#1E2740',
  border:  '#1E2740',
  borderL: '#2A3558',
  gold:    '#C4924A',
  goldL:   '#F4E1BE',
  green:   '#00D2AA',
  blue:    '#4F9CF9',
  purple:  '#9B77FF',
  pink:    '#FF6B9D',
  red:     '#FF5B5B',
  orange:  '#FF8C42',
  text:    '#E8EEFF',
  muted:   '#5A6890',
  mutedL:  '#8A9BC0',
}

const KNOWN_CLIENTS = [
  {
    id: 'camila-rocha',
    name: 'Camila Rocha',
    role: 'Consultora de Estilo',
    color: '#C4924A',
    init: 'CR',
    channels: ['whatsapp', 'instagram'],
    painel: '/camila-painel',
    status: 'ativo',
  },
]

function getMeta(id) {
  const known = KNOWN_CLIENTS.find(c => c.id === id)
  if (known) return known
  const parts = (id || 'unk').split('-')
  const palette = ['#4F9CF9','#9B77FF','#FF6B9D','#00D2AA','#FF8C42','#E1306C']
  const color = palette[id ? id.charCodeAt(0) % palette.length : 0]
  return {
    id, name: parts.map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' '),
    role: 'Cliente CA.RO', color, init: parts.slice(0,2).map(w => w ? w[0].toUpperCase() : '').join(''),
    channels: [], painel: null, status: 'ativo',
  }
}

// ─── MICRO COMPONENTES ────────────────────────────────────────────────────────
function Dot({ color, size=7, glow=false }) {
  return (
    <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color, flexShrink:0, boxShadow: glow ? `0 0 8px ${color}` : 'none' }}/>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color||C.gold},transparent)` }}/>
      <div style={{ fontSize:11, fontWeight:600, color:C.muted, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:900, color:color||C.text, lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:C.mutedL }}>{sub}</div>}
    </div>
  )
}

function StageChip({ stage }) {
  const map = {
    new:        { label:'Novo',         color:C.blue   },
    contacted:  { label:'Contactado',   color:C.purple },
    interested: { label:'Interessado',  color:C.gold   },
    converted:  { label:'Convertido',   color:C.green  },
  }
  const s = (stage||'new').toLowerCase()
  const { label, color } = map[s] || { label: stage||'Novo', color:C.muted }
  return (
    <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background:color+'22', color, fontWeight:700, whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

function MiniBar({ data, color }) {
  if (!data || !data.length) return <div style={{ height:44, display:'flex', alignItems:'center', color:C.muted, fontSize:12 }}>Sem dados</div>
  const max = Math.max(...data.map(d=>d.v), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:44 }}>
      {data.map((d,i) => (
        <div key={i} title={`${d.l}: ${d.v}`}
          style={{ flex:1, height:`${Math.max(4,(d.v/max)*100)}%`, background:color||C.gold, borderRadius:'2px 2px 0 0', opacity:0.5+0.5*(d.v/max), minWidth:4 }}/>
      ))}
    </div>
  )
}

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000)    return 'agora'
  if (diff < 3600000)  return `${Math.floor(diff/60000)}min`
  if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
}

// ─── MODAL NOVO CLIENTE ────────────────────────────────────────────────────────
function NovoClienteModal({ onClose, onCreated }) {
  const [step,    setStep]    = useState('form')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [result,  setResult]  = useState(null)
  const [copied,  setCopied]  = useState(false)
  const [form, setForm] = useState({
    name: '', business_name: '', whatsapp_phone: '', instagram_handle: '', plan: 'starter',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setError(null)
    if (!form.name.trim() || !form.business_name.trim()) {
      setError('Nome e nome do negócio são obrigatórios.')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/caro-admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d.error || 'Erro ao criar cliente')
      } else {
        setResult(d)
        setStep('success')
        onCreated?.()
      }
    } catch (e) {
      setError('Erro de conexão: ' + e.message)
    }
    setSaving(false)
  }

  const setupLink = result ? `${typeof window !== 'undefined' ? window.location.origin : 'https://connect.carostudio.com.br'}/portal/${result?.tenant?.id}/setup` : ''

  const copyLink = () => {
    if (!setupLink) return
    navigator.clipboard.writeText(setupLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const inputSt = {
    width: '100%', padding: '10px 13px', borderRadius: 10, border: `1px solid ${C.borderL}`,
    background: C.surf2, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelSt = { fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5, display: 'block' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:C.surf, border:`1px solid ${C.borderL}`, borderRadius:20, padding:32, width:500, maxWidth:'90vw', maxHeight:'90vh', overflowY:'auto' }}
        onClick={e=>e.stopPropagation()}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.text }}>
              {step === 'form' ? 'Novo Cliente' : '✅ Cliente Criado!'}
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
              {step === 'form' ? 'Preencha os dados para cadastrar' : 'Envie o link de configuração ao cliente'}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:'50%', border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {step === 'form' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={labelSt}>Nome do cliente *</label>
              <input style={inputSt} placeholder="Ex: Camila Rocha" value={form.name} onChange={e => set('name', e.target.value)}/>
            </div>
            <div>
              <label style={labelSt}>Nome do negócio *</label>
              <input style={inputSt} placeholder="Ex: Studio Camila Rocha" value={form.business_name} onChange={e => set('business_name', e.target.value)}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={labelSt}>WhatsApp (número)</label>
                <input style={inputSt} placeholder="+55 11 99999-9999" value={form.whatsapp_phone} onChange={e => set('whatsapp_phone', e.target.value)}/>
              </div>
              <div>
                <label style={labelSt}>Instagram (@handle)</label>
                <input style={inputSt} placeholder="@camilarocha" value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value)}/>
              </div>
            </div>
            <div>
              <label style={labelSt}>Plano</label>
              <select style={{ ...inputSt }} value={form.plan} onChange={e => set('plan', e.target.value)}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:`${C.red}18`, border:`1px solid ${C.red}44`, fontSize:13, color:C.red }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={onClose}
                style={{ flex:1, padding:'11px', borderRadius:11, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontSize:13, cursor:'pointer', fontWeight:600 }}>
                Cancelar
              </button>
              <button onClick={submit} disabled={saving}
                style={{ flex:2, padding:'11px', borderRadius:11, border:'none', background: saving ? C.surf3 : `linear-gradient(135deg,${C.gold},${C.goldL}80)`, color: saving ? C.muted : '#1a1000', fontSize:13, cursor: saving ? 'default':'pointer', fontWeight:800 }}>
                {saving ? 'Criando...' : 'Criar Cliente'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Info do cliente */}
            <div style={{ background:C.surf2, borderRadius:14, padding:'16px 18px', marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{result?.tenant?.name}</div>
              <div style={{ fontSize:12, color:C.muted }}>{result?.tenant?.business_name}</div>
              <div style={{ fontSize:11, color:C.mutedL, marginTop:6 }}>
                ID: <code style={{ color:C.gold, fontSize:11 }}>{result?.tenant?.id}</code>
              </div>
            </div>

            {/* Link de configuração */}
            <div style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}44`, borderRadius:14, padding:'16px 18px', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.gold, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                🔗 Link de Configuração da IA
              </div>
              <div style={{ fontSize:12, color:C.mutedL, marginBottom:12, lineHeight:1.6 }}>
                Envie este link para <strong style={{ color:C.text }}>{result?.tenant?.name}</strong> configurar a IA dela (nome, persona, documentos).
              </div>
              <div style={{
                background: C.surf, border:`1px solid ${C.borderL}`, borderRadius:10,
                padding:'10px 12px', fontSize:11, color:C.mutedL, wordBreak:'break-all',
                marginBottom:10, fontFamily:'monospace',
              }}>
                {setupLink}
              </div>
              <button onClick={copyLink}
                style={{
                  width:'100%', padding:'10px', borderRadius:10, border:'none',
                  background: copied ? `${C.green}22` : `linear-gradient(135deg,${C.gold},${C.goldL}80)`,
                  color: copied ? C.green : '#1a1000', fontSize:13, cursor:'pointer', fontWeight:700,
                  transition:'all .2s',
                }}>
                {copied ? '✓ Link copiado!' : '📋 Copiar Link'}
              </button>
            </div>

            {/* Próximos passos */}
            {(result?.next_steps||[]).length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Próximos passos</div>
                {(result.next_steps || []).map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:`${C.gold}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.gold, flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontSize:12, color:C.mutedL }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={onClose}
              style={{ width:'100%', padding:'11px', borderRadius:11, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldL}80)`, color:'#1a1000', fontSize:13, cursor:'pointer', fontWeight:800 }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── WHATSAPP PANEL (split view) ──────────────────────────────────────────────
function WhatsAppPanel({ tenantId, convos: initialConvos }) {
  const [convos,       setConvos]       = useState(initialConvos || [])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages,     setMessages]     = useState([])
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [reply,        setReply]        = useState('')
  const [sending,      setSending]      = useState(false)
  const [sendErr,      setSendErr]      = useState(null)
  const msgEndRef = useRef(null)

  // Sync convos from parent
  useEffect(() => {
    const waConvos = (initialConvos || []).filter(c => (c.channel || 'whatsapp') === 'whatsapp')
    setConvos(waConvos)
    // Auto-select first conversation
    if (waConvos.length && !selectedConv) {
      setSelectedConv(waConvos[0].id)
    }
  }, [initialConvos])

  // Poll fresh conversations from inbox
  useEffect(() => {
    if (!tenantId) return
    const poll = async () => {
      try {
        const r = await fetch(`/api/caro-admin/inbox?tenant_id=${encodeURIComponent(tenantId)}`)
        const d = await r.json()
        const wa = (d.conversations || []).filter(c => (c.channel || 'whatsapp') === 'whatsapp')
        setConvos(wa)
        if (wa.length && !selectedConv) setSelectedConv(wa[0].id)
      } catch {}
    }
    poll()
    const t = setInterval(poll, 15000)
    return () => clearInterval(t)
  }, [tenantId])

  // Fetch messages when conv selected
  const fetchMsgs = useCallback(async (convId) => {
    if (!convId) return
    setLoadingMsgs(true)
    try {
      const r = await fetch(`/api/caro-admin/messages?conv_id=${encodeURIComponent(convId)}`)
      const d = await r.json()
      setMessages(d.messages || [])
    } catch {}
    setLoadingMsgs(false)
  }, [])

  useEffect(() => {
    if (!selectedConv) return
    fetchMsgs(selectedConv)
    const t = setInterval(() => fetchMsgs(selectedConv), 8000)
    return () => clearInterval(t)
  }, [selectedConv, fetchMsgs])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || sending) return
    setSending(true)
    setSendErr(null)
    try {
      const r = await fetch('/api/caro-admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conv_id: selectedConv, content: reply.trim(), direction: 'outbound' }),
      })
      const d = await r.json()
      if (!r.ok) {
        setSendErr(d.error || 'Erro ao enviar')
      } else {
        setReply('')
        await fetchMsgs(selectedConv)
      }
    } catch (e) {
      setSendErr(e.message)
    }
    setSending(false)
  }

  const selectedConvData = convos.find(c => c.id === selectedConv)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:C.surf2, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#25D366,#128C7E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💬</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>WhatsApp</div>
            <div style={{ fontSize:10, color:C.muted, display:'flex', alignItems:'center', gap:4 }}>
              <Dot color={C.green} size={5} glow/>
              <span>Ao vivo · {convos.length} conversa{convos.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation list — horizontal strip */}
      {convos.length > 0 && (
        <div style={{ padding:'8px 10px', borderBottom:`1px solid ${C.border}`, background:C.surf2, flexShrink:0, overflowX:'auto', display:'flex', gap:6, scrollbarWidth:'none' }}>
          {convos.map(c => {
            const name = c.customer_name || c.customer_phone || 'Desconhecido'
            const init = name.slice(0,2).toUpperCase()
            const isSelected = c.id === selectedConv
            const hasUnread = (c.unread_count || 0) > 0
            return (
              <div key={c.id} onClick={() => setSelectedConv(c.id)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  padding:'6px 8px', borderRadius:10, cursor:'pointer', flexShrink:0,
                  background: isSelected ? `#25D36622` : 'transparent',
                  border: `1px solid ${isSelected ? '#25D366' : 'transparent'}`,
                  transition:'all .15s', position:'relative',
                }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  background:'linear-gradient(135deg,#25D366,#128C7E)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:800, color:'#fff',
                }}>
                  {init}
                </div>
                {hasUnread && (
                  <div style={{
                    position:'absolute', top:4, right:4,
                    width:12, height:12, borderRadius:'50%',
                    background:C.red, border:`2px solid ${C.surf2}`,
                  }}/>
                )}
                <div style={{ fontSize:9, color: isSelected ? '#25D366' : C.muted, fontWeight:600, whiteSpace:'nowrap', maxWidth:52, overflow:'hidden', textOverflow:'ellipsis' }}>
                  {name.split(' ')[0]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Messages + empty state */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8, minHeight:200 }}>
        {!selectedConv || convos.length === 0 ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:C.muted }}>
            <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>💬</div>
            <div style={{ fontSize:13, fontWeight:600, color:C.mutedL }}>Nenhuma conversa WhatsApp</div>
            <div style={{ fontSize:11, marginTop:4, textAlign:'center' }}>As mensagens recebidas aparecem aqui</div>
          </div>
        ) : loadingMsgs && messages.length === 0 ? (
          <div style={{ textAlign:'center', color:C.muted, paddingTop:20, fontSize:13 }}>Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign:'center', color:C.muted, paddingTop:20, fontSize:13 }}>Nenhuma mensagem nesta conversa</div>
        ) : (
          <>
            {/* Selected conv header */}
            {selectedConvData && (
              <div style={{ fontSize:11, color:C.muted, textAlign:'center', marginBottom:4 }}>
                {selectedConvData.customer_name || selectedConvData.customer_phone} · {selectedConvData.message_count || messages.length} msg
                {selectedConvData.ai_enabled
                  ? <span style={{ marginLeft:6, color:C.green }}>· IA Ativa</span>
                  : <span style={{ marginLeft:6, color:C.orange }}>· IA Pausada</span>
                }
              </div>
            )}
            {messages.map(msg => {
              const isOut = msg.direction === 'outbound'
              return (
                <div key={msg.id} style={{ display:'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }}>
                  {msg.content_type === 'image' && msg.media_url ? (
                    <div style={{
                      maxWidth:'75%', borderRadius: isOut ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.3)',
                    }}>
                      <img src={msg.media_url} alt="imagem" style={{ display:'block', maxWidth:'100%', maxHeight:200, objectFit:'cover' }}/>
                      <div style={{
                        padding:'4px 10px 6px', background: isOut ? '#25D366' : C.surf3,
                        fontSize:9, color: isOut ? '#00400028' : C.muted, textAlign: isOut ? 'right' : 'left',
                      }}>
                        {fmtTime(msg.created_at)}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      maxWidth:'78%', padding:'8px 12px',
                      borderRadius: isOut ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isOut ? '#25D366' : C.surf3,
                      color: isOut ? '#fff' : C.text,
                    }}>
                      <div style={{ fontSize:12, lineHeight:1.5, wordBreak:'break-word' }}>{msg.content}</div>
                      <div style={{ fontSize:9, opacity:0.7, marginTop:3, textAlign: isOut ? 'right' : 'left' }}>
                        {isOut ? '✓✓ IA' : '📩'} · {fmtTime(msg.created_at)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={msgEndRef}/>
          </>
        )}
      </div>

      {/* Send bar */}
      {selectedConv && (
        <div style={{ padding:'8px 10px', borderTop:`1px solid ${C.border}`, background:C.surf2, flexShrink:0 }}>
          {sendErr && (
            <div style={{ fontSize:10, color:C.red, marginBottom:5, padding:'3px 8px', background:`${C.red}15`, borderRadius:6 }}>{sendErr}</div>
          )}
          <div style={{ display:'flex', gap:6 }}>
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              placeholder="Responder via WhatsApp..."
              style={{
                flex:1, padding:'9px 12px', borderRadius:20, border:`1px solid ${C.borderL}`,
                background:C.surf3, color:C.text, fontSize:12, outline:'none',
              }}
            />
            <button onClick={sendReply} disabled={sending || !reply.trim()}
              style={{
                padding:'9px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12,
                cursor: (sending || !reply.trim()) ? 'default' : 'pointer',
                background: (sending || !reply.trim()) ? C.surf3 : 'linear-gradient(135deg,#25D366,#128C7E)',
                color: (sending || !reply.trim()) ? C.muted : '#fff',
                transition:'all .15s', flexShrink:0,
              }}>
              {sending ? '...' : '↑'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── INSTAGRAM DIRECT PANEL (split view) ─────────────────────────────────────
function IGPanel({ tenantId }) {
  const [convList,     setConvList]     = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages,     setMessages]     = useState([])
  const [loadingList,  setLoadingList]  = useState(true)
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [reply,        setReply]        = useState('')
  const [sending,      setSending]      = useState(false)
  const [sendErr,      setSendErr]      = useState(null)
  const intervalRef = useRef(null)
  const msgEndRef   = useRef(null)

  const fetchConvs = useCallback(async () => {
    try {
      const r = await fetch(`/api/caro-admin/instagram?tenant_id=${encodeURIComponent(tenantId)}`)
      const d = await r.json()
      const convs = d.conversations || []
      setConvList(convs)
      // Auto-select first
      if (convs.length && !selectedConv) setSelectedConv(convs[0].id)
    } catch {}
    setLoadingList(false)
  }, [tenantId, selectedConv])

  const fetchMsgs = useCallback(async (convId) => {
    if (!convId) return
    setLoadingMsgs(true)
    try {
      const r = await fetch(`/api/caro-admin/instagram?tenant_id=${encodeURIComponent(tenantId)}&conv_id=${encodeURIComponent(convId)}`)
      const d = await r.json()
      setMessages(d.messages || [])
    } catch {}
    setLoadingMsgs(false)
  }, [tenantId])

  useEffect(() => {
    fetchConvs()
    intervalRef.current = setInterval(fetchConvs, 5000)
    return () => clearInterval(intervalRef.current)
  }, [fetchConvs])

  useEffect(() => {
    if (!selectedConv) return
    fetchMsgs(selectedConv)
    const t = setInterval(() => fetchMsgs(selectedConv), 5000)
    return () => clearInterval(t)
  }, [selectedConv, fetchMsgs])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || sending) return
    setSending(true)
    setSendErr(null)
    try {
      const r = await fetch('/api/caro-admin/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, conv_id: selectedConv, message: reply.trim() }),
      })
      const d = await r.json()
      if (!r.ok) {
        setSendErr(d.error || 'Erro ao enviar')
      } else {
        setReply('')
        await fetchMsgs(selectedConv)
      }
    } catch (e) {
      setSendErr(e.message)
    }
    setSending(false)
  }

  const displayName = (c) => {
    if (c.sender_name && c.sender_name !== c.sender_id) return c.sender_name
    const raw = c.ig_sender_id || c.sender_id || ''
    return raw.startsWith('ig_') ? `@${raw.slice(3)}` : raw || 'Usuário'
  }

  const selectedConvData = convList.find(c => c.id === selectedConv)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:C.surf2, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#E1306C,#833AB4,#F77737)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📸</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Instagram Direct</div>
            <div style={{ fontSize:10, color:C.muted, display:'flex', alignItems:'center', gap:4 }}>
              <Dot color='#E1306C' size={5} glow/>
              <span>Ao vivo · atualiza a cada 5s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation list — horizontal strip */}
      {loadingList && convList.length === 0 ? null : (
        <div style={{ padding:'8px 10px', borderBottom:`1px solid ${C.border}`, background:C.surf2, flexShrink:0, overflowX:'auto', display:'flex', gap:6, scrollbarWidth:'none' }}>
          {convList.length === 0 ? (
            <div style={{ fontSize:11, color:C.muted, padding:'4px 0' }}>Nenhuma conversa via Direct ainda</div>
          ) : convList.map(c => {
            const name = displayName(c)
            const init = name.replace('@','').slice(0,2).toUpperCase()
            const isSelected = c.id === selectedConv
            const hasUnread = (c.unread_count || 0) > 0
            return (
              <div key={c.id} onClick={() => setSelectedConv(c.id)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  padding:'6px 8px', borderRadius:10, cursor:'pointer', flexShrink:0,
                  background: isSelected ? '#E1306C22' : 'transparent',
                  border: `1px solid ${isSelected ? '#E1306C' : 'transparent'}`,
                  transition:'all .15s', position:'relative',
                }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  background:'linear-gradient(135deg,#E1306C,#833AB4,#F77737)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:800, color:'#fff',
                }}>
                  {init}
                </div>
                {hasUnread && (
                  <div style={{
                    position:'absolute', top:4, right:4,
                    width:12, height:12, borderRadius:'50%',
                    background:C.red, border:`2px solid ${C.surf2}`,
                  }}/>
                )}
                <div style={{ fontSize:9, color: isSelected ? '#E1306C' : C.muted, fontWeight:600, whiteSpace:'nowrap', maxWidth:52, overflow:'hidden', textOverflow:'ellipsis' }}>
                  {name.replace('@','').split('_')[0]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8, minHeight:200 }}>
        {!selectedConv || convList.length === 0 ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:C.muted }}>
            <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>📸</div>
            <div style={{ fontSize:13, fontWeight:600, color:C.mutedL }}>
              {loadingList ? 'Carregando...' : 'Nenhuma conversa'}
            </div>
            <div style={{ fontSize:11, marginTop:4 }}>Direct aparece aqui em tempo real</div>
          </div>
        ) : loadingMsgs && messages.length === 0 ? (
          <div style={{ textAlign:'center', color:C.muted, paddingTop:20, fontSize:13 }}>Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign:'center', color:C.muted, paddingTop:20, fontSize:13 }}>Nenhuma mensagem ainda</div>
        ) : (
          <>
            {selectedConvData && (
              <div style={{ fontSize:11, color:C.muted, textAlign:'center', marginBottom:4 }}>
                {displayName(selectedConvData)} · {selectedConvData.message_count || messages.length} msg
                {selectedConvData.ai_enabled
                  ? <span style={{ marginLeft:6, color:C.green }}>· IA Ativa</span>
                  : <span style={{ marginLeft:6, color:C.orange }}>· IA Pausada</span>
                }
              </div>
            )}
            {messages.map(msg => {
              const isOut = msg.direction === 'outbound'
              return (
                <div key={msg.id} style={{ display:'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }}>
                  {msg.content_type === 'image' && msg.media_url ? (
                    <div style={{
                      maxWidth:'75%', borderRadius: isOut ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.3)',
                    }}>
                      <img src={msg.media_url} alt="imagem" style={{ display:'block', maxWidth:'100%', maxHeight:200, objectFit:'cover' }}/>
                      <div style={{
                        padding:'4px 10px 6px',
                        background: isOut ? 'linear-gradient(135deg,#E1306C,#833AB4)' : C.surf3,
                        fontSize:9, color:'rgba(255,255,255,0.6)', textAlign:'right',
                      }}>
                        {fmtTime(msg.created_at)}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      maxWidth:'78%', padding:'8px 12px',
                      borderRadius: isOut ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isOut ? 'linear-gradient(135deg,#E1306C,#833AB4)' : C.surf3,
                      color: isOut ? '#fff' : C.text,
                    }}>
                      <div style={{ fontSize:12, lineHeight:1.5, wordBreak:'break-word' }}>{msg.content}</div>
                      <div style={{ fontSize:9, opacity:0.65, marginTop:3, textAlign: isOut ? 'right' : 'left' }}>
                        {isOut ? '✓ IA' : '📩'} · {fmtTime(msg.created_at)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={msgEndRef}/>
          </>
        )}
      </div>

      {/* Send bar */}
      {selectedConv && (
        <div style={{ padding:'8px 10px', borderTop:`1px solid ${C.border}`, background:C.surf2, flexShrink:0 }}>
          {sendErr && (
            <div style={{ fontSize:10, color:C.red, marginBottom:5, padding:'3px 8px', background:`${C.red}15`, borderRadius:6 }}>{sendErr}</div>
          )}
          <div style={{ display:'flex', gap:6 }}>
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              placeholder="Responder via Direct..."
              style={{
                flex:1, padding:'9px 12px', borderRadius:20, border:`1px solid ${C.borderL}`,
                background:C.surf3, color:C.text, fontSize:12, outline:'none',
              }}
            />
            <button onClick={sendReply} disabled={sending || !reply.trim()}
              style={{
                padding:'9px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12,
                cursor: (sending || !reply.trim()) ? 'default' : 'pointer',
                background: (sending || !reply.trim()) ? C.surf3 : 'linear-gradient(135deg,#E1306C,#833AB4)',
                color: (sending || !reply.trim()) ? C.muted : '#fff',
                transition:'all .15s', flexShrink:0,
              }}>
              {sending ? '...' : '↑'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── BASE DE CONHECIMENTO ──────────────────────────────────────────────────────
function KnowledgeBase({ tenantId }) {
  const [docs,       setDocs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [uploading,  setUploading]  = useState(false)
  const [uploadMsg,  setUploadMsg]  = useState(null)
  const [dragOver,   setDragOver]   = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const fileRef = useRef(null)

  const fetchDocs = useCallback(async () => {
    try {
      const r = await fetch(`/api/caro-admin/knowledge?tenant_id=${encodeURIComponent(tenantId)}`)
      const d = await r.json()
      setDocs(d.docs || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const upload = async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadMsg({ type: 'error', text: 'Apenas arquivos PDF são suportados' })
      return
    }
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tenant_id', tenantId)
      const r = await fetch('/api/caro-admin/knowledge/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (d.ok) {
        setUploadMsg({ type: 'success', text: `✓ "${file.name}" importado — ${d.pages || 0} pág · ${(d.chars || 0).toLocaleString('pt-BR')} chars` })
        await fetchDocs()
      } else {
        setUploadMsg({ type: 'error', text: d.error || 'Erro ao processar PDF' })
      }
    } catch (e) {
      setUploadMsg({ type: 'error', text: 'Erro de conexão: ' + e.message })
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const del = async (id, name) => {
    if (!confirm(`Remover "${name}" da base de conhecimento?`)) return
    try {
      await fetch(`/api/caro-admin/knowledge?id=${id}`, { method: 'DELETE' })
      setDocs(prev => prev.filter(d => d.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{ border:`2px dashed ${dragOver ? C.gold : C.borderL}`, borderRadius:16, padding:'28px 24px', textAlign:'center', cursor: uploading ? 'default' : 'pointer', background: dragOver ? `${C.gold}08` : C.surf2, transition:'all .2s', marginBottom:14, position:'relative' }}>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display:'none' }} onChange={e => e.target.files[0] && upload(e.target.files[0])}/>
        <div style={{ fontSize:28, marginBottom:8, lineHeight:1 }}>📄</div>
        <div style={{ fontSize:14, fontWeight:700, color: uploading ? C.muted : C.text, marginBottom:4 }}>
          {uploading ? 'Processando PDF...' : dragOver ? 'Solte para importar' : 'Arraste PDF ou clique para selecionar'}
        </div>
        <div style={{ fontSize:12, color:C.muted }}>O texto é extraído e usado como contexto da IA</div>
      </div>

      {uploadMsg && (
        <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:12, background: uploadMsg.type === 'success' ? `${C.green}18` : `${C.red}18`, border:`1px solid ${uploadMsg.type === 'success' ? C.green : C.red}55`, fontSize:12, color: uploadMsg.type === 'success' ? C.green : C.red, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <span>{uploadMsg.text}</span>
          <button onClick={() => setUploadMsg(null)} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:16, opacity:0.6 }}>×</button>
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          {loading ? 'Carregando...' : `${docs.length} documento${docs.length !== 1 ? 's' : ''}`}
        </div>
        {docs.length > 0 && <div style={{ fontSize:11, color:C.muted }}>{docs.reduce((a,d) => a+(d.chars||0), 0).toLocaleString('pt-BR')} chars total</div>}
      </div>

      {!loading && docs.length === 0 && (
        <div style={{ padding:'40px 24px', textAlign:'center', color:C.muted, background:C.surf, borderRadius:14, border:`1px dashed ${C.border}` }}>
          <div style={{ fontSize:24, marginBottom:8, opacity:0.4 }}>📚</div>
          <div style={{ fontSize:13 }}>Nenhum documento. Suba um PDF para treinar a IA.</div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {docs.map(doc => (
          <div key={doc.id} style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:11, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:`${C.gold}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📄</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{doc.filename}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                  {(doc.chars||0).toLocaleString('pt-BR')} chars · {Math.round((doc.size_bytes||0)/1024)} KB
                </div>
              </div>
              <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                <button onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)} style={{ padding:'4px 10px', borderRadius:7, border:`1px solid ${C.borderL}`, background:'transparent', color:C.mutedL, fontSize:10, cursor:'pointer', fontWeight:600 }}>
                  {expandedId === doc.id ? 'Fechar' : 'Preview'}
                </button>
                <button onClick={() => del(doc.id, doc.filename)} style={{ padding:'4px 10px', borderRadius:7, border:`1px solid ${C.red}44`, background:'transparent', color:C.red, fontSize:10, cursor:'pointer', fontWeight:600 }}>
                  Remover
                </button>
              </div>
            </div>
            {expandedId === doc.id && (
              <div style={{ padding:'10px 14px', borderTop:`1px solid ${C.border}`, background:C.surf2 }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Preview</div>
                <div style={{ fontSize:11, color:C.mutedL, lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:160, overflowY:'auto' }}>
                  {doc.preview || '(sem preview)'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DETALHE DO CLIENTE — SPLIT VIEW ─────────────────────────────────────────
function ClienteDetail({ clientId, convos, onBack }) {
  const [showKB, setShowKB] = useState(false)
  const meta = getMeta(clientId)
  const clConvos = convos.filter(c => c.tenant_id === clientId)
  const waConvos = clConvos.filter(c => (c.channel || 'whatsapp') === 'whatsapp')
  const igConvos = clConvos.filter(c => c.channel === 'instagram')
  const today    = new Date().toDateString()
  const todayCount = clConvos.filter(c => new Date(c.created_at || c.last_message_at || 0).toDateString() === today).length
  const conv  = clConvos.filter(c => c.stage === 'converted').length
  const convRate = clConvos.length > 0 ? ((conv / clConvos.length) * 100).toFixed(0) : 0

  return (
    <div>
      <button onClick={onBack}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontSize:12, cursor:'pointer', marginBottom:18, fontWeight:600 }}
        onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.mutedL }}
        onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}>
        ← Voltar para Clientes
      </button>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:18, padding:'20px 22px', background:C.surf, border:`1px solid ${C.border}`, borderRadius:18, position:'relative', overflow:'hidden', marginBottom:18 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${meta.color},${meta.color}55,transparent)` }}/>
        <div style={{ width:60, height:60, borderRadius:'50%', background:`linear-gradient(135deg,${meta.color},${meta.color}66)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#fff', boxShadow:`0 0 0 4px ${meta.color}22`, flexShrink:0 }}>
          {meta.init}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:800, color:C.text, letterSpacing:'-0.3px' }}>{meta.name}</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{meta.role}</div>
          <div style={{ display:'flex', gap:6, marginTop:8, alignItems:'center', flexWrap:'wrap' }}>
            {meta.channels.includes('whatsapp') && (
              <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background:'#25D36622', color:'#25D366', fontWeight:700 }}>💬 WhatsApp</span>
            )}
            {meta.channels.includes('instagram') && (
              <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background:'#E1306C22', color:'#E1306C', fontWeight:700 }}>📸 Instagram</span>
            )}
            <Dot color={C.green} size={7} glow/>
            <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>IA Ativa</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, marginRight:8 }}>
          {[
            { l:'Total',  v:clConvos.length,  c:C.text      },
            { l:'Hoje',   v:todayCount,         c:C.green    },
            { l:'WA',     v:waConvos.length,    c:'#25D366'  },
            { l:'IG',     v:igConvos.length,    c:'#E1306C'  },
            { l:'Conv.',  v:`${convRate}%`,      c:C.gold    },
          ].map(s => (
            <div key={s.l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {meta.painel && (
          <a href={meta.painel}
            style={{ padding:'9px 16px', borderRadius:11, background:`${meta.color}22`, color:meta.color, textDecoration:'none', fontSize:13, fontWeight:700, whiteSpace:'nowrap', border:`1px solid ${meta.color}44` }}>
            Ver Painel →
          </a>
        )}
      </div>

      {/* ── SPLIT PANELS ─────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        {/* WhatsApp */}
        <div style={{ height:520 }}>
          <WhatsAppPanel tenantId={clientId} convos={clConvos}/>
        </div>

        {/* Instagram Direct */}
        <div style={{ height:520 }}>
          <IGPanel tenantId={clientId}/>
        </div>
      </div>

      {/* ── KNOWLEDGE BASE (colapsável) ──────────────────────────────────── */}
      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
        <button
          onClick={() => setShowKB(p => !p)}
          style={{
            width:'100%', padding:'14px 20px', background:'transparent', border:'none',
            display:'flex', alignItems:'center', gap:10, cursor:'pointer', borderBottom: showKB ? `1px solid ${C.border}` : 'none',
          }}>
          <span style={{ fontSize:16 }}>📚</span>
          <div style={{ flex:1, textAlign:'left' }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Base de Conhecimento</div>
            <div style={{ fontSize:12, color:C.muted }}>PDFs usados pela IA como referência</div>
          </div>
          <span style={{ color:C.muted, fontSize:18, transition:'transform .2s', transform: showKB ? 'rotate(180deg)' : 'none' }}>›</span>
        </button>
        {showKB && (
          <div style={{ padding:'20px 22px' }}>
            <KnowledgeBase tenantId={clientId}/>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview({ clients, convos, loading, lastRefresh }) {
  const today      = new Date().toDateString()
  const todayCount = convos.filter(c => new Date(c.created_at||c.last_message_at||0).toDateString()===today).length
  const waCount    = convos.filter(c => (c.channel||'whatsapp')==='whatsapp').length
  const igCount    = convos.filter(c => c.channel==='instagram').length
  const converted  = convos.filter(c => c.stage==='converted').length
  const convRate   = convos.length > 0 ? ((converted/convos.length)*100).toFixed(1) : '0.0'

  const days7 = Array.from({ length:7 }).map((_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i)
    const label = d.toLocaleDateString('pt-BR', { weekday:'short' }).replace('.','')
    const v = convos.filter(c => new Date(c.created_at||c.last_message_at||0).toDateString()===d.toDateString()).length
    return { l:label, v }
  })

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:28, fontWeight:900, color:C.text, letterSpacing:'-0.7px' }}>Visão Geral</h2>
        <p style={{ margin:'5px 0 0', fontSize:13, color:C.muted }}>CA.RO Connect · Plataforma</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:22 }}>
        <StatCard label="Clientes Ativos"     value={clients.length}     color={C.gold}    sub="na plataforma"/>
        <StatCard label="Total de Conversas"  value={convos.length}      color={C.blue}    sub="todos os clientes"/>
        <StatCard label="Hoje"                value={todayCount}          color={C.green}   sub="novas conversas"/>
        <StatCard label="WhatsApp"            value={waCount}             color='#25D366'   sub="conversas"/>
        <StatCard label="Instagram"           value={igCount}             color='#E1306C'   sub="conversas"/>
        <StatCard label="Taxa de Conversão"   value={`${convRate}%`}      color={C.gold}    sub="geral"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:22 }}>
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 22px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:14 }}>Últimos 7 dias</div>
          <MiniBar data={days7} color={C.gold}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {days7.map(d => <span key={d.l} style={{ fontSize:9, color:C.muted }}>{d.l}</span>)}
          </div>
        </div>
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 22px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:14 }}>Por Canal</div>
          {[
            { l:'WhatsApp', v:waCount, c:'#25D366' },
            { l:'Instagram',v:igCount, c:'#E1306C' },
          ].map(row => (
            <div key={row.l} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ fontSize:12, color:C.mutedL, width:80 }}>{row.l}</div>
              <div style={{ flex:1, height:8, background:C.surf3, borderRadius:4 }}>
                <div style={{ height:'100%', width:`${convos.length ? (row.v/convos.length)*100 : 0}%`, background:row.c, borderRadius:4 }}/>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:row.c, width:30, textAlign:'right' }}>{row.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 22px' }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16 }}>Clientes Ativos</div>
        <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
          {clients.map(cl => {
            const meta  = getMeta(cl.id)
            const pct   = (cl.count / Math.max(...clients.map(c=>c.count), 1)) * 100
            const clToday = convos.filter(c => c.tenant_id === cl.id && new Date(c.created_at||c.last_message_at||0).toDateString()===today).length
            return (
              <div key={cl.id}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${meta.color},${meta.color}66)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>{meta.init}</div>
                    <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{meta.name}</span>
                  </div>
                  <div style={{ display:'flex', gap:14 }}>
                    <span style={{ fontSize:12, color:C.muted }}>{cl.count} conv.</span>
                    {clToday > 0 && <span style={{ fontSize:12, color:C.green, fontWeight:700 }}>+{clToday} hoje</span>}
                  </div>
                </div>
                <div style={{ height:6, background:C.surf3, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.max(pct,cl.count===0?0:2)}%`, background:`linear-gradient(90deg,${meta.color},${meta.color}88)`, borderRadius:3 }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
function Clientes({ clients, convos, onSelectClient, onNovoCliente }) {
  const today = new Date().toDateString()
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:28, fontWeight:900, color:C.text, letterSpacing:'-0.7px' }}>Clientes</h2>
          <p style={{ margin:'5px 0 0', fontSize:13, color:C.muted }}>{clients.length} cliente{clients.length !== 1 ? 's' : ''} na plataforma</p>
        </div>
        <button onClick={onNovoCliente}
          style={{ padding:'10px 20px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.gold},${C.goldL}80)`, color:'#1a1000', fontSize:13, cursor:'pointer', fontWeight:800 }}>
          + Novo Cliente
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
        {clients.map(cl => {
          const meta     = getMeta(cl.id)
          const clConvos = convos.filter(c => c.tenant_id === cl.id)
          const clToday  = clConvos.filter(c => new Date(c.created_at||c.last_message_at||0).toDateString()===today).length
          const waC      = clConvos.filter(c => (c.channel||'whatsapp')==='whatsapp').length
          const igC      = clConvos.filter(c => c.channel==='instagram').length

          return (
            <div key={cl.id}
              onClick={() => onSelectClient(cl.id)}
              style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px', cursor:'pointer', position:'relative', overflow:'hidden', transition:'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = meta.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${meta.color},transparent)` }}/>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg,${meta.color},${meta.color}66)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#fff', boxShadow:`0 0 0 3px ${meta.color}22` }}>
                  {meta.init}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{meta.name}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{meta.role}</div>
                </div>
                <div style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:`${C.green}22`, color:C.green, fontWeight:700 }}>Ativo</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                {[
                  { l:'Total', v:cl.count,  c:C.text    },
                  { l:'Hoje',  v:clToday,    c:C.green   },
                  { l:'WA',    v:waC,         c:'#25D366' },
                  { l:'IG',    v:igC,         c:'#E1306C' },
                ].map(s => (
                  <div key={s.l} style={{ background:C.surf2, borderRadius:9, padding:'9px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {meta.channels.includes('whatsapp') && <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background:'#25D36622', color:'#25D366', fontWeight:700 }}>WA</span>}
                {meta.channels.includes('instagram') && <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background:'#E1306C22', color:'#E1306C', fontWeight:700 }}>IG</span>}
                <span style={{ marginLeft:'auto', fontSize:12, color:C.muted }}>Ver mensagens →</span>
              </div>
            </div>
          )
        })}

        <div onClick={onNovoCliente}
          style={{ background:'transparent', border:`2px dashed ${C.borderL}`, borderRadius:16, padding:'20px 22px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, transition:'border-color .15s, background .15s', minHeight:180 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = `${C.gold}08` }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderL; e.currentTarget.style.background = 'transparent' }}>
          <div style={{ fontSize:32, opacity:0.4 }}>+</div>
          <div style={{ fontSize:14, fontWeight:700, color:C.muted }}>Novo Cliente</div>
          <div style={{ fontSize:12, color:C.muted, textAlign:'center' }}>Cadastrar cliente na plataforma</div>
        </div>
      </div>
    </div>
  )
}

// ─── CONVERSAS ────────────────────────────────────────────────────────────────
function Conversas({ convos, loading, filterClient, clients }) {
  const [search, setSearch] = useState('')
  const [ch,     setCh]     = useState('all')
  const [client, setClient] = useState(filterClient || 'all')

  const allKnown = [...clients, ...KNOWN_CLIENTS.filter(k => !clients.find(c => c.id === k.id)).map(k => ({ id:k.id, count:0 }))]

  const filtered = convos.filter(c => {
    if (ch !== 'all' && c.channel !== ch) return false
    if (client !== 'all' && c.tenant_id !== client) return false
    if (search) {
      const q = search.toLowerCase()
      if (!(c.customer_name||'').toLowerCase().includes(q) &&
          !(c.customer_phone||'').toLowerCase().includes(q) &&
          !(c.last_message||'').toLowerCase().includes(q)) return false
    }
    return true
  })

  const selSt = { padding:'7px 12px', borderRadius:9, border:`1px solid ${C.border}`, background:C.surf2, color:C.text, fontSize:12, outline:'none' }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h2 style={{ margin:0, fontSize:28, fontWeight:900, color:C.text, letterSpacing:'-0.7px' }}>Conversas</h2>
          <p style={{ margin:'5px 0 0', fontSize:13, color:C.muted }}>{filtered.length} de {convos.length} conversas</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, telefone, mensagem..."
          style={{ ...selSt, flex:1, minWidth:200 }}/>
        <select value={ch} onChange={e => setCh(e.target.value)} style={selSt}>
          <option value="all">Todos os canais</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
        </select>
        <select value={client} onChange={e => setClient(e.target.value)} style={selSt}>
          <option value="all">Todos os clientes</option>
          {allKnown.map(cl => <option key={cl.id} value={cl.id}>{getMeta(cl.id).name}</option>)}
        </select>
        {(client !== 'all' || ch !== 'all' || search) && (
          <button onClick={() => { setCh('all'); setClient('all'); setSearch('') }}
            style={{ padding:'7px 12px', borderRadius:20, border:`1px solid ${C.red}44`, background:'transparent', color:C.red, fontSize:11, cursor:'pointer', fontWeight:600 }}>
            Limpar
          </button>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {loading ? (
          <div style={{ padding:80, textAlign:'center', color:C.muted }}>Carregando conversas...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:80, textAlign:'center', color:C.muted }}>Nenhuma conversa encontrada</div>
        ) : filtered.slice(0,100).map(c => {
          const meta    = getMeta(c.tenant_id)
          const isIG    = c.channel === 'instagram'
          const chColor = isIG ? '#E1306C' : '#25D366'
          const contact = c.customer_name || c.customer_phone || 'Desconhecido'
          const time    = c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : ''
          return (
            <div key={c.id}
              style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:12, padding:'11px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', transition:'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = meta.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${meta.color},${meta.color}55)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>
                {meta.init}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:C.text }}>{contact}</span>
                  <Dot color={chColor} size={6}/>
                  <span style={{ fontSize:11, color:C.muted }}>{meta.name}</span>
                </div>
                <div style={{ fontSize:12, color:C.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {c.last_message || 'Sem mensagens recentes'}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                {c.unread_count > 0 && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background:`${chColor}44`, color:chColor, fontWeight:700 }}>{c.unread_count}</span>}
                {time && <span style={{ fontSize:10, color:C.muted }}>{time}</span>}
              </div>
            </div>
          )
        })}
        {filtered.length > 100 && <div style={{ padding:14, textAlign:'center', color:C.muted, fontSize:12 }}>Mostrando 100 de {filtered.length}. Use filtros para refinar.</div>}
      </div>
    </div>
  )
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({ clients, convos }) {
  const maxConvos = Math.max(...clients.map(cl=>cl.count), 1)
  const today = new Date().toDateString()

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:28, fontWeight:900, color:C.text, letterSpacing:'-0.7px' }}>Analytics</h2>
        <p style={{ margin:'5px 0 0', fontSize:13, color:C.muted }}>Performance por cliente</p>
      </div>

      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:14, padding:'20px 22px', marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16 }}>Volume por Cliente</div>
        <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
          {clients.sort((a,b)=>b.count-a.count).map(cl => {
            const meta  = getMeta(cl.id)
            const pct   = (cl.count / maxConvos) * 100
            const conv  = convos.filter(c => c.tenant_id === cl.id && c.stage === 'converted').length
            const rate  = cl.count > 0 ? ((conv/cl.count)*100).toFixed(0) : 0
            const clToday = convos.filter(c => c.tenant_id === cl.id && new Date(c.created_at||c.last_message_at||0).toDateString()===today).length
            return (
              <div key={cl.id}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${meta.color},${meta.color}66)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>{meta.init}</div>
                    <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{meta.name}</span>
                  </div>
                  <div style={{ display:'flex', gap:14 }}>
                    <span style={{ fontSize:12, color:C.muted }}>{cl.count} conv.</span>
                    <span style={{ fontSize:12, color:C.green, fontWeight:700 }}>{rate}% conv.</span>
                    {clToday > 0 && <span style={{ fontSize:12, color:C.blue }}>+{clToday} hoje</span>}
                  </div>
                </div>
                <div style={{ height:7, background:C.surf3, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.max(pct,cl.count===0?0:2)}%`, background:`linear-gradient(90deg,${meta.color},${meta.color}88)`, borderRadius:4 }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:'overview',  label:'Visão Geral' },
  { id:'clientes',  label:'Clientes'    },
  { id:'conversas', label:'Conversas'   },
  { id:'analytics', label:'Analytics'   },
]

const REFRESH_INTERVAL = 15000

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function CaroAdmin() {
  const [active,         setActive]         = useState('overview')
  const [convos,         setConvos]         = useState([])
  const [clients,        setClients]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [filterClient,   setFilterClient]   = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [lastRefresh,    setLastRefresh]    = useState(null)
  const [countdown,      setCountdown]      = useState(REFRESH_INTERVAL/1000)
  const [showModal,      setShowModal]      = useState(false)
  const timerRef = useRef(null)
  const countRef = useRef(null)

  const load = useCallback(async (silent=false) => {
    if (!silent) setLoading(true)
    try {
      const r = await fetch('/api/caro-admin/inbox')
      const d = await r.json()
      const all = d.conversations || []
      setConvos(all)
      const map = {}
      all.forEach(c => {
        const tid = c.tenant_id || 'unknown'
        if (!map[tid]) map[tid] = { id:tid, count:0, hasWA:false, hasIG:false }
        map[tid].count++
        if (c.channel === 'instagram') map[tid].hasIG = true
        else map[tid].hasWA = true
      })
      KNOWN_CLIENTS.forEach(k => {
        if (!map[k.id]) map[k.id] = { id:k.id, count:0, hasWA:k.channels.includes('whatsapp'), hasIG:k.channels.includes('instagram') }
      })
      setClients(Object.values(map))
      setLastRefresh(new Date())
    } catch (e) { console.error('CaroAdmin load error', e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    timerRef.current = setInterval(() => { load(true); setCountdown(REFRESH_INTERVAL/1000) }, REFRESH_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [load])
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL/1000)
    countRef.current = setInterval(() => setCountdown(c => c > 0 ? c-1 : REFRESH_INTERVAL/1000), 1000)
    return () => clearInterval(countRef.current)
  }, [lastRefresh])

  const today      = new Date().toDateString()
  const todayCount = convos.filter(c => new Date(c.created_at||c.last_message_at||0).toDateString()===today).length

  const navBtnSt = (isActive) => ({
    width:'100%', display:'flex', alignItems:'center', padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer',
    background: isActive ? `${C.gold}18` : 'transparent', color: isActive ? C.gold : C.muted,
    fontSize:13, fontWeight: isActive ? 700 : 500, textAlign:'left', marginBottom:2, gap:8,
  })

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg, fontFamily:'Inter,-apple-system,BlinkMacSystemFont,sans-serif', color:C.text }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0 }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:${C.surf3}; border-radius:2px }
        select option { background:${C.surf2}; color:${C.text} }
        button:focus { outline:none }
        input { outline:none }
        input::placeholder { color:${C.muted} }
        a { color:inherit }
      `}</style>

      {showModal && (
        <NovoClienteModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setTimeout(() => load(true), 500) }}
        />
      )}

      {/* SIDEBAR */}
      <div style={{ width:224, background:C.surf, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ padding:'22px 18px 18px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:22, fontWeight:900, background:`linear-gradient(135deg,${C.gold},${C.goldL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-1.5px', lineHeight:1 }}>CA.RO</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:3, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Connect Admin</div>
        </div>

        <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:C.surf2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Dot color={loading ? C.muted : C.green} size={7} glow={!loading}/>
            <span style={{ fontSize:11, color:loading ? C.muted : C.green, fontWeight:600 }}>{loading ? 'Atualizando...' : 'Ao vivo'}</span>
            {!loading && <span style={{ fontSize:10, color:C.muted, marginLeft:'auto' }}>{countdown}s</span>}
          </div>
          <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{clients.length} clientes · {convos.length} conv · {todayCount} hoje</div>
          <div style={{ height:2, background:C.surf3, borderRadius:1, marginTop:6 }}>
            <div style={{ height:'100%', width:`${(countdown/(REFRESH_INTERVAL/1000))*100}%`, background:C.green, borderRadius:1, transition:'width 1s linear' }}/>
          </div>
        </div>

        <nav style={{ flex:1, padding:'10px 8px' }}>
          {NAV.map(item => {
            const isActive = active === item.id && !selectedClient
            return (
              <button key={item.id} onClick={() => { setActive(item.id); setFilterClient(null); setSelectedClient(null) }} style={navBtnSt(isActive)}>
                <div style={{ width:7, height:7, borderRadius:'50%', background: isActive ? C.gold : 'transparent', border:`1px solid ${isActive ? C.gold : C.muted+'44'}`, flexShrink:0 }}/>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Clientes</div>
          {clients.map(cl => {
            const meta    = getMeta(cl.id)
            const clToday = convos.filter(c => c.tenant_id===cl.id && new Date(c.created_at||c.last_message_at||0).toDateString()===today).length
            return (
              <div key={cl.id}
                style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7, cursor:'pointer', padding:'4px 6px', borderRadius:8, transition:'background .15s', background: selectedClient===cl.id ? `${meta.color}15` : 'transparent' }}
                onMouseEnter={e => { if (selectedClient!==cl.id) e.currentTarget.style.background = C.surf3 }}
                onMouseLeave={e => { e.currentTarget.style.background = selectedClient===cl.id ? `${meta.color}15` : 'transparent' }}
                onClick={() => { setSelectedClient(cl.id); setActive('clientes') }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:`linear-gradient(135deg,${meta.color},${meta.color}66)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'#fff', flexShrink:0 }}>{meta.init}</div>
                <div style={{ fontSize:11, fontWeight:600, color:C.text, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{meta.name}</div>
                {clToday > 0 && <div style={{ fontSize:10, fontWeight:700, color:C.green }}>+{clToday}</div>}
              </div>
            )
          })}
          <button onClick={() => setShowModal(true)}
            style={{ width:'100%', padding:'7px', borderRadius:8, border:`1px dashed ${C.borderL}`, background:'transparent', color:C.muted, fontSize:11, cursor:'pointer', marginTop:4, fontWeight:600 }}>
            + Novo Cliente
          </button>
        </div>

        <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}` }}>
          <button onClick={() => load(true)} disabled={loading}
            style={{ width:'100%', padding:'9px', borderRadius:9, border:`1px solid ${C.borderL}`, background:'transparent', color: loading ? C.muted : C.mutedL, fontSize:12, cursor: loading ? 'default':'pointer', fontWeight:600 }}>
            {loading ? 'Atualizando...' : 'Atualizar agora'}
          </button>
          {lastRefresh && <div style={{ fontSize:10, color:C.muted, textAlign:'center', marginTop:6 }}>{lastRefresh.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</div>}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, overflowY:'auto', padding:'36px 36px 80px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          {selectedClient ? (
            <ClienteDetail clientId={selectedClient} convos={convos} onBack={() => setSelectedClient(null)}/>
          ) : (
            <>
              {active === 'overview'  && <Overview  clients={clients} convos={convos} loading={loading} lastRefresh={lastRefresh}/>}
              {active === 'clientes'  && <Clientes  clients={clients} convos={convos} onSelectClient={id => setSelectedClient(id)} onNovoCliente={() => setShowModal(true)}/>}
              {active === 'conversas' && <Conversas convos={convos} loading={loading} filterClient={filterClient} clients={clients}/>}
              {active === 'analytics' && <Analytics clients={clients} convos={convos}/>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
