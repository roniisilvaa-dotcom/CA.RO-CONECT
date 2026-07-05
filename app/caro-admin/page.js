'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:      '#080B12',
  surf:    '#0D1219',
  surf2:   '#111824',
  surf3:   '#1A2335',
  border:  '#1E2A3D',
  borderL: '#2A3F5F',
  gold:    '#C4924A',
  goldL:   '#F4E1BE',
  green:   '#25D366',
  greenD:  '#128C3C',
  ig:      '#E1306C',
  blue:    '#4F9CF9',
  purple:  '#9B77FF',
  teal:    '#00D2AA',
  red:     '#FF5B5B',
  orange:  '#FF8C42',
  text:    '#E8EEFF',
  muted:   '#4A5A7A',
  mutedL:  '#7A8EBB',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts), now = new Date(), diff = now - d
  if (diff < 60000)   return 'agora'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h`
  if (diff < 604800000) return d.toLocaleDateString('pt-BR',{weekday:'short'})
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
}

function fmtFull(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
}

function fmtNum(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n/1000).toFixed(1)}k`
  return String(n)
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')
}

function channelColor(ch) {
  return ch === 'whatsapp' ? C.green : ch === 'instagram' ? C.ig : C.blue
}

function channelLabel(ch) {
  return ch === 'whatsapp' ? 'WhatsApp' : ch === 'instagram' ? 'Instagram' : (ch||'?')
}

// ─── MICRO COMPONENTES ────────────────────────────────────────────────────────
function Dot({ color, size=7, glow=false }) {
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color, flexShrink:0, boxShadow: glow ? `0 0 8px ${color}` : 'none' }}/>
}

function Badge({ label, color, size='sm' }) {
  return (
    <span style={{ fontSize: size==='xs' ? 10 : 11, padding:'2px 8px', borderRadius:20, background:`${color}22`, color, fontWeight:700, whiteSpace:'nowrap', border:`1px solid ${color}33` }}>
      {label}
    </span>
  )
}

function ChannelIcon({ channel, size=16 }) {
  if (channel === 'whatsapp') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={C.green}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
      </svg>
    )
  }
  if (channel === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={C.ig}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    )
  }
  return <span style={{ fontSize:size*0.7, color:C.blue }}>?</span>
}

function SpinnerDot() {
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
      {[0,1,2].map(i=>(
        <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:C.gold, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </div>
  )
}

function HealthBar({ score }) {
  const color = score >= 75 ? C.green : score >= 50 ? C.gold : score >= 25 ? C.orange : C.red
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:4, background:C.surf3, borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${score}%`, height:'100%', background:color, borderRadius:2, transition:'width 0.6s' }}/>
      </div>
      <span style={{ fontSize:11, color, fontWeight:700, minWidth:30 }}>{score}%</span>
    </div>
  )
}

function MiniChart({ data, color, height=36 }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d=>d.total||d.v||0), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height }}>
      {data.map((d,i)=>{
        const v = d.total||d.v||0
        return <div key={i} style={{ flex:1, minWidth:3, height:`${Math.max(6,(v/max)*100)}%`, background:color, borderRadius:'2px 2px 0 0', opacity:0.4+0.6*(v/max) }} title={`${d.date||''}: ${v}`}/>
      })}
    </div>
  )
}

function StatCard({ label, value, sub, color, chart, icon }) {
  return (
    <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 20px', position:'relative', overflow:'hidden', minWidth:0 }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color||C.gold},transparent)` }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.mutedL, letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</div>
        {icon && <span style={{ fontSize:15 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:900, color:color||C.text, lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:C.mutedL, marginBottom: chart ? 8 : 0 }}>{sub}</div>}
      {chart && <MiniChart data={chart} color={color||C.gold} height={30}/>}
    </div>
  )
}

// ─── MODAL: CHAT ──────────────────────────────────────────────────────────────
function ChatModal({ conv, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [reply, setReply]       = useState('')
  const [sending, setSending]   = useState(false)
  const [aiEnabled, setAiEnabled] = useState(conv.ai_enabled)
  const bottomRef = useRef()
  const pollRef   = useRef()

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/caro-admin/messages?conv_id=${conv.id}&limit=150`)
      const d = await r.json()
      setMessages(d.messages || [])
      setLoading(false)
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}), 80)
    } catch {}
  }, [conv.id])

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 5000)
    return () => clearInterval(pollRef.current)
  }, [load])

  async function toggleAI() {
    const next = !aiEnabled
    setAiEnabled(next)
    await fetch('/api/toggle-ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ conversation_id:conv.id, ai_enabled:next }) })
  }

  async function sendReply() {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/send-message', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ conversation_id:conv.id, content:reply, channel:conv.channel }) })
      setReply('')
      await load()
    } catch {}
    finally { setSending(false) }
  }

  const chColor = channelColor(conv.channel)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:20, width:'100%', maxWidth:600, height:'88vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:`${chColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15, color:chColor, flexShrink:0 }}>
            {initials(conv.customer_name||conv.customer_phone)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:C.text, fontWeight:800, fontSize:14 }}>{conv.customer_name||conv.customer_phone||'Desconhecido'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
              <ChannelIcon channel={conv.channel} size={12}/>
              <span style={{ fontSize:11, color:chColor }}>{channelLabel(conv.channel)}</span>
              {conv.tenant_name && <span style={{ fontSize:11, color:C.muted }}>· {conv.tenant_name}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={toggleAI} style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${aiEnabled?C.green:C.border}`, background:aiEnabled?`${C.green}22`:'transparent', color:aiEnabled?C.green:C.mutedL, cursor:'pointer', fontSize:12, fontWeight:700 }}>
              {aiEnabled ? '🤖 IA ON' : '👤 Manual'}
            </button>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:`1px solid ${C.border}`, background:'transparent', color:C.mutedL, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        </div>
        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:8 }}>
          {loading ? <div style={{ textAlign:'center', color:C.muted, paddingTop:40 }}>Carregando...</div>
          : messages.length===0 ? <div style={{ textAlign:'center', color:C.muted, paddingTop:40 }}>Nenhuma mensagem</div>
          : messages.map(m => {
            const isOut = m.direction==='outbound'
            return (
              <div key={m.id} style={{ display:'flex', justifyContent:isOut?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'76%', padding:'10px 14px', borderRadius: isOut?'18px 18px 4px 18px':'18px 18px 18px 4px', background: isOut?(aiEnabled?`${C.green}20`:`${C.blue}20`):C.surf3, border:`1px solid ${isOut?(aiEnabled?C.green+'44':C.blue+'44'):C.border}` }}>
                  <div style={{ fontSize:14, color:C.text, lineHeight:1.5, wordBreak:'break-word' }}>{m.content}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:4, textAlign:isOut?'right':'left' }}>{fmtFull(m.created_at)}</div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>
        {/* Reply */}
        <div style={{ padding:'10px 14px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, flexShrink:0 }}>
          <textarea value={reply} onChange={e=>setReply(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendReply()}}}
            placeholder="Responder como humano (Enter para enviar)..." rows={2}
            style={{ flex:1, background:C.surf3, border:`1px solid ${C.border}`, borderRadius:12, padding:'9px 13px', color:C.text, fontSize:14, resize:'none', outline:'none', fontFamily:'inherit' }}/>
          <button onClick={sendReply} disabled={sending||!reply.trim()}
            style={{ padding:'0 16px', borderRadius:12, border:'none', background:reply.trim()?chColor:C.surf3, color:reply.trim()?'#fff':C.muted, cursor:reply.trim()&&!sending?'pointer':'not-allowed', fontWeight:700, fontSize:16 }}>
            {sending?'...':'↑'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL: NOVO CLIENTE ──────────────────────────────────────────────────────
function NovoClienteModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', business_name:'', email:'', phone:'', plan:'basic' })
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  function setF(k,v) { setForm(p=>({...p,[k]:v})) }

  async function handleCreate() {
    if (!form.name||!form.business_name) return
    setLoading(true)
    try {
      const r = await fetch('/api/caro-admin/tenants', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'create_tenant',...form}) })
      const d = await r.json()
      if (d.ok) { setResult(d); onCreated?.() }
      else alert(d.error||'Erro ao criar cliente')
    } catch { alert('Erro de rede') }
    finally { setLoading(false) }
  }

  if (result) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:C.surf2, border:`1px solid ${C.green}44`, borderRadius:20, padding:32, width:420, maxWidth:'90vw' }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
          <h3 style={{ color:C.green, margin:0, fontSize:20, fontWeight:900 }}>Cliente criado!</h3>
        </div>
        <div style={{ background:C.surf3, borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>LINK DE SETUP DO CLIENTE</div>
          <div style={{ fontSize:12, color:C.gold, wordBreak:'break-all', fontFamily:'monospace' }}>
            {typeof window!=='undefined'?window.location.origin:''}/portal/{result.tenant?.id}/setup
          </div>
        </div>
        <button onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/portal/${result.tenant?.id}/setup`)}
          style={{ width:'100%', padding:'11px', borderRadius:12, border:`1px solid ${C.gold}`, background:`${C.gold}15`, color:C.gold, cursor:'pointer', fontWeight:700, fontSize:14, marginBottom:10 }}>
          📋 Copiar Link de Setup
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'11px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.mutedL, cursor:'pointer' }}>Fechar</button>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:C.surf2, border:`1px solid ${C.border}`, borderRadius:20, padding:32, width:420, maxWidth:'90vw' }}>
        <h3 style={{ color:C.text, margin:'0 0 20px', fontSize:18, fontWeight:800 }}>Novo Cliente</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[{k:'name',label:'Nome do responsável',ph:'João Silva'},{k:'business_name',label:'Nome do negócio',ph:'Salão da Maria'},{k:'email',label:'Email',ph:'joao@negocio.com'},{k:'phone',label:'Telefone',ph:'+55 11 99999-9999'}].map(({k,label,ph})=>(
            <div key={k}>
              <div style={{ fontSize:11, color:C.mutedL, marginBottom:4, fontWeight:600 }}>{label}</div>
              <input value={form[k]} onChange={e=>setF(k,e.target.value)} placeholder={ph}
                style={{ width:'100%', boxSizing:'border-box', background:C.surf3, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:14, outline:'none' }}/>
            </div>
          ))}
          <div>
            <div style={{ fontSize:11, color:C.mutedL, marginBottom:4, fontWeight:600 }}>Plano</div>
            <select value={form.plan} onChange={e=>setF('plan',e.target.value)}
              style={{ width:'100%', background:C.surf3, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', color:C.text, fontSize:14 }}>
              <option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.mutedL, cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleCreate} disabled={loading}
            style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:C.gold, color:'#000', cursor:loading?'wait':'pointer', fontWeight:800, fontSize:14 }}>
            {loading?'Criando...':'Criar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AI CONFIG PANEL ──────────────────────────────────────────────────────────
function AIConfigPanel({ tenant, onSaved }) {
  const [cfg, setCfg]     = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    fetch(`/api/caro-admin/agent?tenant_id=${tenant.id}`)
      .then(r=>r.json()).then(d=>setCfg(d.config||{})).catch(()=>setCfg({}))
  }, [tenant.id])

  function set(k,v) { setCfg(p=>({...p,[k]:v})) }

  async function save() {
    if (!cfg) return
    setSaving(true)
    try {
      await fetch('/api/caro-admin/agent', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tenant_id:tenant.id,...cfg}) })
      setSaved(true); setTimeout(()=>setSaved(false), 2000)
      onSaved?.()
    } finally { setSaving(false) }
  }

  if (!cfg) return <div style={{ color:C.muted, fontSize:13, padding:16 }}>Carregando config...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:C.text, fontWeight:800, fontSize:15 }}>Config da IA</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:cfg.ai_enabled?C.green:C.muted }}>{cfg.ai_enabled?'IA Ativa':'IA Pausada'}</span>
          <div onClick={()=>set('ai_enabled',!cfg.ai_enabled)}
            style={{ width:40, height:22, borderRadius:11, background:cfg.ai_enabled?C.green:C.surf3, border:`1px solid ${cfg.ai_enabled?C.green:C.border}`, cursor:'pointer', position:'relative', transition:'all 0.2s' }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:cfg.ai_enabled?20:2, transition:'left 0.2s' }}/>
          </div>
        </div>
      </div>
      {[{k:'assistant_name',label:'Nome da IA',ph:'Assistente Virtual'},{k:'personality',label:'Personalidade',ph:'Amigável e profissional...'}].map(({k,label,ph})=>(
        <div key={k}>
          <div style={{ fontSize:11, color:C.mutedL, marginBottom:4, fontWeight:600 }}>{label}</div>
          <input value={cfg[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph}
            style={{ width:'100%', boxSizing:'border-box', background:C.surf3, border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 13px', color:C.text, fontSize:14, outline:'none' }}/>
        </div>
      ))}
      <div>
        <div style={{ fontSize:11, color:C.mutedL, marginBottom:4, fontWeight:600 }}>System Prompt</div>
        <textarea value={cfg.system_prompt||''} onChange={e=>set('system_prompt',e.target.value)} rows={6}
          placeholder="Você é um assistente de..."
          style={{ width:'100%', boxSizing:'border-box', background:C.surf3, border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 13px', color:C.text, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }}/>
      </div>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <button onClick={save} disabled={saving}
          style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:C.gold, color:'#000', cursor:saving?'wait':'pointer', fontWeight:800, fontSize:14 }}>
          {saving?'Salvando...':saved?'✓ Salvo!':'Salvar Config'}
        </button>
      </div>
    </div>
  )
}

// ─── VIEW: INBOX (WA + IG MIRROR) ─────────────────────────────────────────────
function InboxView({ tenants }) {
  const [convs, setConvs]             = useState([])
  const [summary, setSummary]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [tenantId, setTenantId]       = useState('all')
  const [statusFilter, setStatusFilter] = useState('open')
  const [search, setSearch]           = useState('')
  const [selectedConv, setSelectedConv] = useState(null)
  const [showNova, setShowNova]       = useState(false)
  const pollRef = useRef()
  const debRef  = useRef()

  const load = useCallback(async () => {
    const p = new URLSearchParams()
    if (tenantId !== 'all') p.set('tenantId', tenantId)
    if (statusFilter !== 'all') p.set('status', statusFilter)
    if (search) p.set('search', search)
    p.set('limit', '200')
    try {
      const r = await fetch(`/api/caro-admin/inbox?${p}`)
      const d = await r.json()
      setConvs(d.conversations || [])
      setSummary(d.summary || [])
    } catch {}
    setLoading(false)
  }, [tenantId, statusFilter, search])

  useEffect(() => {
    setLoading(true)
    clearTimeout(debRef.current)
    debRef.current = setTimeout(load, search ? 400 : 0)
  }, [load, search])

  useEffect(() => {
    pollRef.current = setInterval(load, 8000)
    return () => clearInterval(pollRef.current)
  }, [load])

  const waConvs = convs.filter(c => c.channel === 'whatsapp')
  const igConvs = convs.filter(c => c.channel === 'instagram')
  const waSum = summary.find(s => s.channel === 'whatsapp') || {}
  const igSum = summary.find(s => s.channel === 'instagram') || {}

  function ConvRow({ c }) {
    const color = channelColor(c.channel)
    const hasUnread = (c.unread_count || 0) > 0
    return (
      <div onClick={() => setSelectedConv(c)}
        style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, cursor:'pointer', display:'flex', gap:10, alignItems:'center' }}
        onMouseEnter={e=>e.currentTarget.style.background=C.surf2}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <div style={{ width:42, height:42, borderRadius:'50%', background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color, flexShrink:0, position:'relative' }}>
          {initials(c.customer_name||c.customer_phone)}
          <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderRadius:'50%', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChannelIcon channel={c.channel} size={10}/>
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ color:hasUnread?C.text:C.mutedL, fontWeight:hasUnread?700:500, fontSize:13 }}>{c.customer_name||c.customer_phone||'Desconhecido'}</span>
            <span style={{ fontSize:11, color:C.muted }}>{fmtTime(c.last_message_at)}</span>
          </div>
          <div style={{ fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
            {c.last_message_direction==='outbound' && <span style={{ color:c.ai_enabled?C.green:C.blue }}>{c.ai_enabled?'🤖 ':'👤 '}</span>}
            {c.last_message||'Sem mensagens'}
          </div>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <Badge label={c.tenant_name} color={C.purple} size="xs"/>
            {!c.ai_enabled && <Badge label="Manual" color={C.orange} size="xs"/>}
            {hasUnread && <div style={{ marginLeft:'auto', minWidth:20, height:20, borderRadius:10, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', padding:'0 5px' }}>{c.unread_count}</div>}
          </div>
        </div>
      </div>
    )
  }

  function ChannelPanel({ title, ch, color, convList, sum }) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:ch==='whatsapp'?`1px solid ${C.border}`:'none', minWidth:0 }}>
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, background:C.surf2, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <ChannelIcon channel={ch} size={18}/>
          <div style={{ flex:1 }}>
            <div style={{ color, fontWeight:800, fontSize:14 }}>{title}</div>
            <div style={{ fontSize:11, color:C.muted }}>{sum.open_count||0} abertas · {sum.ai_on||0} com IA · {sum.with_unread||0} não lidas</div>
          </div>
          <Dot color={color} size={8} glow/>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? <div style={{ padding:20, textAlign:'center', color:C.muted }}>Carregando...</div>
          : convList.length===0 ? (
            <div style={{ padding:40, textAlign:'center', color:C.muted }}>
              <div style={{ fontSize:32, marginBottom:8 }}>{ch==='whatsapp'?'📱':'📸'}</div>
              <div style={{ fontSize:13 }}>Nenhuma conversa</div>
            </div>
          ) : convList.map(c => <ConvRow key={c.id} c={c}/>)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Toolbar */}
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flexShrink:0, background:C.surf }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar nome, telefone..."
          style={{ flex:1, minWidth:180, background:C.surf3, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 13px', color:C.text, fontSize:13, outline:'none' }}/>
        <select value={tenantId} onChange={e=>setTenantId(e.target.value)}
          style={{ background:C.surf3, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 11px', color:C.text, fontSize:13 }}>
          <option value="all">Todos os clientes</option>
          {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          style={{ background:C.surf3, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 11px', color:C.text, fontSize:13 }}>
          <option value="all">Todos</option>
          <option value="open">Abertas</option>
          <option value="closed">Fechadas</option>
        </select>
        <button onClick={()=>setShowNova(true)}
          style={{ padding:'8px 14px', borderRadius:10, border:'none', background:C.green, color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13, flexShrink:0 }}>
          + Nova
        </button>
      </div>
      {/* Split WA | IG */}
      <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
        <ChannelPanel title="WhatsApp"  ch="whatsapp"  color={C.green} convList={waConvs} sum={waSum}/>
        <ChannelPanel title="Instagram" ch="instagram" color={C.ig}    convList={igConvs} sum={igSum}/>
      </div>
      {selectedConv && <ChatModal conv={selectedConv} onClose={()=>setSelectedConv(null)}/>}
      {showNova && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:C.surf2, border:`1px solid ${C.border}`, borderRadius:20, padding:28, width:400, maxWidth:'90vw' }}>
            <h3 style={{ color:C.text, margin:'0 0 16px', fontSize:16, fontWeight:800 }}>Nova Conversa Manual</h3>
            <p style={{ color:C.mutedL, fontSize:13, lineHeight:1.5 }}>Para iniciar uma conversa, use o WhatsApp Business ou o Instagram direto. As respostas aparecerão automaticamente aqui.</p>
            <button onClick={()=>setShowNova(false)} style={{ width:'100%', marginTop:16, padding:'11px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.mutedL, cursor:'pointer' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── VIEW: ANALYTICS ──────────────────────────────────────────────────────────
function AnalyticsView({ tenants }) {
  const [data, setData]       = useState(null)
  const [days, setDays]       = useState(7)
  const [tenantId, setTenantId] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams({ days: String(days) })
    if (tenantId !== 'all') p.set('tenantId', tenantId)
    fetch(`/api/caro-admin/analytics?${p}`)
      .then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
      .catch(()=>setLoading(false))
  }, [days, tenantId])

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:C.muted }}>
      <SpinnerDot/><span style={{ fontSize:13 }}>Carregando analytics...</span>
    </div>
  )

  const t = data?.totals || {}
  const aiRate = t.total_messages > 0 ? Math.round((t.ai_messages/t.total_messages)*100) : 0
  const waData = data?.byChannel?.find(c=>c.channel==='whatsapp')
  const igData = data?.byChannel?.find(c=>c.channel==='instagram')

  return (
    <div style={{ flex:1, overflowY:'auto', padding:20 }}>
      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <select value={tenantId} onChange={e=>setTenantId(e.target.value)}
          style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 12px', color:C.text, fontSize:13 }}>
          <option value="all">Todos os clientes</option>
          {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {[7,30,90].map(d=>(
          <button key={d} onClick={()=>setDays(d)}
            style={{ padding:'8px 14px', borderRadius:10, border:`1px solid ${days===d?C.gold:C.border}`, background:days===d?`${C.gold}20`:C.surf, color:days===d?C.gold:C.mutedL, cursor:'pointer', fontWeight:700, fontSize:13 }}>
            {d}d
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard label="Conversas"     value={fmtNum(t.total_conversations)} color={C.blue}   icon="💬" sub={`${t.conversations_today||0} hoje`} chart={data?.byDay}/>
        <StatCard label="WhatsApp"      value={fmtNum(t.wa_conversations)}    color={C.green}  icon="📱" sub={`${waData?.open||0} abertas`}/>
        <StatCard label="Instagram"     value={fmtNum(t.ig_conversations)}    color={C.ig}     icon="📸" sub={`${igData?.open||0} abertas`}/>
        <StatCard label="Mensagens"     value={fmtNum(t.total_messages)}      color={C.purple} icon="✉️" sub={`${t.messages_today||0} hoje`} chart={data?.byDay}/>
        <StatCard label="Taxa IA"       value={`${aiRate}%`}                  color={C.teal}   icon="🤖" sub={`${fmtNum(t.ai_messages)} respostas IA`}/>
        <StatCard label="Resp. Médio"   value={data?.responseTime ? `${data.responseTime}min` : '--'} color={C.gold} icon="⚡" sub="tempo médio IA"/>
      </div>

      {/* Gráfico de volume */}
      {data?.byDay?.length > 0 && (
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ color:C.text, fontWeight:800, marginBottom:14, fontSize:14 }}>Volume por Dia — {days}d</div>
          <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:80 }}>
            {data.byDay.map((d,i)=>{
              const max = Math.max(...data.byDay.map(x=>x.total||0), 1)
              const whMax = Math.max(...data.byDay.map(x=>x.whatsapp||0), 1)
              const igMax = Math.max(...data.byDay.map(x=>x.instagram||0), 1)
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:1, height:'100%', justifyContent:'flex-end', minWidth:0 }}>
                  <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:1 }}>
                    <div title={`IG: ${d.instagram||0}`} style={{ width:'100%', height:`${Math.max(2,((d.instagram||0)/max)*60)}px`, background:C.ig, borderRadius:'2px 2px 0 0', opacity:0.85 }}/>
                    <div title={`WA: ${d.whatsapp||0}`} style={{ width:'100%', height:`${Math.max(2,((d.whatsapp||0)/max)*60)}px`, background:C.green, opacity:0.85 }}/>
                  </div>
                  <div style={{ fontSize:8, color:C.muted, transform:'rotate(-45deg)', transformOrigin:'top center', whiteSpace:'nowrap', marginTop:2 }}>{d.date}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display:'flex', gap:14, marginTop:10, fontSize:11 }}>
            <span style={{ color:C.green }}>■ WhatsApp</span>
            <span style={{ color:C.ig }}>■ Instagram</span>
          </div>
        </div>
      )}

      {/* Por canal */}
      {data?.byChannel?.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {data.byChannel.map(ch => (
            <div key={ch.channel} style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <ChannelIcon channel={ch.channel} size={20}/>
                <span style={{ fontWeight:800, color:channelColor(ch.channel), fontSize:15 }}>{channelLabel(ch.channel)}</span>
              </div>
              <div style={{ display:'flex', gap:16 }}>
                {[{l:'Conversas',v:ch.conversations},{l:'Abertas',v:ch.open},{l:'IA ON',v:ch.ai_on}].map(({l,v})=>(
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:900, color:channelColor(ch.channel) }}>{v||0}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Por cliente */}
      {data?.byTenant?.length > 0 && (
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 20px' }}>
          <div style={{ color:C.text, fontWeight:800, marginBottom:14, fontSize:14 }}>Atividade por Cliente</div>
          {data.byTenant.map(ten=>(
            <div key={ten.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', marginBottom:8, background:C.surf2, borderRadius:12, border:`1px solid ${C.border}` }}>
              <div style={{ width:34, height:34, borderRadius:9, background:C.gold+'20', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:C.gold, flexShrink:0 }}>{initials(ten.name)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{ten.business_name||ten.name}</div>
                <div style={{ fontSize:11, color:C.muted }}>{ten.conversations} convs · {ten.messages} msgs</div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ textAlign:'center' }}><div style={{ fontSize:14, fontWeight:800, color:C.green }}>{ten.wa_conversations||0}</div><div style={{ fontSize:9, color:C.muted }}>WA</div></div>
                <div style={{ textAlign:'center' }}><div style={{ fontSize:14, fontWeight:800, color:C.ig }}>{ten.ig_conversations||0}</div><div style={{ fontSize:9, color:C.muted }}>IG</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── VIEW: STATUS ──────────────────────────────────────────────────────────────
function StatusView() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/caro-admin/status')
      const d = await r.json()
      setData(d); setLastCheck(new Date())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load(); const t=setInterval(load,30000); return ()=>clearInterval(t) }, [load])

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:C.muted }}>
      <SpinnerDot/><span style={{ fontSize:13 }}>Verificando status...</span>
    </div>
  )

  const p = data?.platform || {}

  function StatusChip({ status }) {
    const map = { active:{color:C.green,label:'Ativo'}, idle:{color:C.gold,label:'Idle'}, stale:{color:C.orange,label:'Inativo'}, not_configured:{color:C.muted,label:'Não config.'} }
    const s = map[status] || { color:C.muted, label:status||'—' }
    return (
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <Dot color={s.color} size={7} glow={status==='active'}/>
        <span style={{ fontSize:11, color:s.color, fontWeight:600 }}>{s.label}</span>
      </div>
    )
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard label="Clientes Ativos"   value={p.active_tenants||0}          color={C.green}  icon="🏢"/>
        <StatCard label="Convs Abertas"     value={p.total_open_conversations||0} color={C.blue}   icon="💬"/>
        <StatCard label="Msgs Hoje"         value={fmtNum(p.messages_today||0)}  color={C.purple} icon="✉️"/>
        <StatCard label="Última 1h"         value={p.messages_last_hour||0}      color={C.teal}   icon="⚡"/>
      </div>
      {lastCheck && <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>Verificado às {lastCheck.toLocaleTimeString('pt-BR')} · Atualiza a cada 30s</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {(data?.tenants||[]).map(ten=>(
          <div key={ten.id} style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:`${C.gold}20`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, color:C.gold, flexShrink:0 }}>
                {initials(ten.name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.text, fontWeight:800, fontSize:15 }}>{ten.business_name||ten.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>{ten.slug} · Plano {ten.plan||'basic'}</div>
              </div>
              <div style={{ textAlign:'right', minWidth:100 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Saúde</div>
                <HealthBar score={ten.health_score}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {['whatsapp','instagram'].map(ch=>(
                <div key={ch} style={{ background:C.surf2, borderRadius:10, padding:'10px 13px', border:`1px solid ${C.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <ChannelIcon channel={ch} size={13}/>
                    <span style={{ fontSize:12, color:C.mutedL, fontWeight:600 }}>{channelLabel(ch)}</span>
                  </div>
                  <StatusChip status={ch==='whatsapp'?ten.wa_status:ten.ig_status}/>
                  {(ch==='whatsapp'?ten.wa_configured:ten.ig_configured) && (
                    <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>Configurado</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:14, fontSize:12, flexWrap:'wrap' }}>
              <span style={{ color:C.mutedL }}>💬 {ten.total_conversations} conversas</span>
              <span style={{ color:C.green }}>● {ten.open_conversations} abertas</span>
              <span style={{ color:ten.ai_enabled?C.teal:C.muted }}>🤖 IA {ten.ai_enabled?'ON':'OFF'}</span>
              <span style={{ color:C.muted }}>📄 {ten.knowledge_docs_count||0} docs</span>
            </div>
            {ten.last_message_at && (
              <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>Última atividade: {fmtFull(ten.last_message_at)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── VIEW: CLIENTES ───────────────────────────────────────────────────────────
function ClientesView({ tenants, onRefresh }) {
  const [selected, setSelected] = useState(null)
  const [showNovo, setShowNovo] = useState(false)

  return (
    <div style={{ flex:1, display:'flex', minHeight:0 }}>
      {/* Sidebar */}
      <div style={{ width:260, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ color:C.text, fontWeight:800, fontSize:14 }}>Clientes ({tenants.length})</span>
          <button onClick={()=>setShowNovo(true)}
            style={{ padding:'5px 11px', borderRadius:8, border:'none', background:C.gold, color:'#000', cursor:'pointer', fontWeight:700, fontSize:12 }}>
            + Novo
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {tenants.map(t=>(
            <div key={t.id} onClick={()=>setSelected(t)}
              style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, cursor:'pointer', background:selected?.id===t.id?C.surf2:'transparent' }}
              onMouseEnter={e=>e.currentTarget.style.background=C.surf2}
              onMouseLeave={e=>e.currentTarget.style.background=selected?.id===t.id?C.surf2:'transparent'}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:`${C.gold}20`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:C.gold, flexShrink:0 }}>
                  {initials(t.name)}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ color:C.text, fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize:11, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.business_name||t.slug}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Detail */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {!selected ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:C.muted, fontSize:14 }}>
            ← Selecione um cliente
          </div>
        ) : (
          <div style={{ padding:24, display:'flex', flexDirection:'column', gap:18 }}>
            {/* Info card */}
            <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ color:C.text, fontWeight:900, fontSize:20 }}>{selected.business_name||selected.name}</div>
                  <div style={{ color:C.muted, fontSize:13, marginTop:2 }}>@{selected.slug}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <Badge label={selected.plan||'basic'} color={C.gold}/>
                  <Badge label={selected.status||'active'} color={selected.status==='active'?C.green:C.muted}/>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {[{l:'Email',v:selected.email||'—'},{l:'Telefone',v:selected.phone||'—'},{l:'Desde',v:fmtFull(selected.created_at)},{l:'ID',v:(selected.id||'').slice(0,20)+'...',mono:true}].map(({l,v,mono})=>(
                  <div key={l} style={{ background:C.surf2, borderRadius:10, padding:'9px 12px' }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:2, fontWeight:600 }}>{l}</div>
                    <div style={{ fontSize:12, color:C.text, fontFamily:mono?'monospace':'inherit' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:C.surf2, borderRadius:10, padding:'10px 13px' }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Link de Setup</div>
                <div style={{ fontSize:12, color:C.gold, fontFamily:'monospace', wordBreak:'break-all' }}>
                  {typeof window!=='undefined'?window.location.origin:''}/portal/{selected.id}/setup
                </div>
                <button onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/portal/${selected.id}/setup`)}
                  style={{ marginTop:8, padding:'4px 11px', borderRadius:8, border:`1px solid ${C.gold}`, background:`${C.gold}15`, color:C.gold, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                  📋 Copiar
                </button>
              </div>
            </div>
            {/* AI Config */}
            <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px 22px' }}>
              <AIConfigPanel tenant={selected} onSaved={onRefresh}/>
            </div>
          </div>
        )}
      </div>
      {showNovo && <NovoClienteModal onClose={()=>setShowNovo(false)} onCreated={()=>{setShowNovo(false);onRefresh()}}/>}
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CaroAdmin() {
  const [view, setView]       = useState('inbox')
  const [tenants, setTenants] = useState([])
  const [quickStats, setQuickStats] = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(true)

  const loadMeta = useCallback(async () => {
    try {
      const [tR, sR] = await Promise.all([
        fetch('/api/caro-admin/tenants'),
        fetch('/api/caro-admin/analytics?days=1'),
      ])
      const [tD, sD] = await Promise.all([tR.json(), sR.json()])
      setTenants(tD.tenants || [])
      setQuickStats(sD.totals || null)
    } catch {}
    setLoadingMeta(false)
  }, [])

  useEffect(() => { loadMeta() }, [loadMeta])

  const TABS = [
    { id:'inbox',     label:'Inbox',      icon:'💬' },
    { id:'analytics', label:'Analytics',  icon:'📊' },
    { id:'status',    label:'Status',     icon:'🟢' },
    { id:'clientes',  label:'Clientes',   icon:'🏢' },
  ]

  const aiRate = quickStats && quickStats.total_messages > 0
    ? Math.round((quickStats.ai_messages / quickStats.total_messages) * 100) : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:C.bg, color:C.text, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif', overflow:'hidden' }}>
      {/* Top Bar */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 18px', height:54, borderBottom:`1px solid ${C.border}`, background:C.surf, flexShrink:0 }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:`linear-gradient(135deg,${C.gold},${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:12, color:'#000' }}>CA</div>
          <div>
            <div style={{ fontWeight:900, fontSize:13, color:C.text, lineHeight:1 }}>CA.RO Connect</div>
            <div style={{ fontSize:10, color:C.muted }}>Admin Master</div>
          </div>
        </div>
        {/* Quick stats */}
        {!loadingMeta && quickStats && (
          <div style={{ display:'flex', gap:16, marginLeft:10 }}>
            {[
              { v: quickStats.open_conversations||0,  label:'abertas',   color:C.blue  },
              { v: quickStats.messages_today||0,       label:'msgs hoje', color:C.green },
              { v: `${aiRate}%`,                       label:'IA',        color:C.teal  },
            ].map(({v,label,color})=>(
              <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:15, fontWeight:900, color }}>{v}</span>
                <span style={{ fontSize:11, color:C.muted }}>{label}</span>
              </div>
            ))}
          </div>
        )}
        {/* Nav */}
        <div style={{ display:'flex', gap:3, marginLeft:'auto' }}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setView(tab.id)}
              style={{ padding:'6px 13px', borderRadius:9, border:view===tab.id?`1px solid ${C.borderL}`:'1px solid transparent', background:view===tab.id?C.surf3:'transparent', color:view===tab.id?C.text:C.mutedL, cursor:'pointer', fontWeight:700, fontSize:13, display:'flex', gap:5, alignItems:'center', transition:'all 0.12s' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {/* Refresh */}
        <button onClick={loadMeta}
          style={{ width:32, height:32, borderRadius:9, border:`1px solid ${C.border}`, background:C.surf2, color:C.mutedL, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          title="Atualizar">
          ↻
        </button>
      </div>
      {/* Main Content */}
      <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
        {view==='inbox'     && <InboxView    tenants={tenants}/>}
        {view==='analytics' && <AnalyticsView tenants={tenants}/>}
        {view==='status'    && <StatusView/>}
        {view==='clientes'  && <ClientesView tenants={tenants} onRefresh={loadMeta}/>}
      </div>
    </div>
  )
}
