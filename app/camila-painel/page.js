'use client'
import { useState, useEffect } from 'react'

const B = { burgundy:'#3D1826', gold:'#C4924A', goldL:'#F4E1BE', cream:'#FDF8F0', muted:'#9B7B8A', dark:'#1A0D12' }

function Toggle({ value, onChange, label, desc, accent }) {
  const a = accent || B.gold
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid #f0e8e0'}}>
      <div>
        <div style={{fontSize:14,fontWeight:600,color:B.dark}}>{label}</div>
        {desc && <div style={{fontSize:12,color:B.muted,marginTop:2}}>{desc}</div>}
      </div>
      <button onClick={()=>onChange(!value)} style={{width:46,height:25,borderRadius:13,border:'none',cursor:'pointer',background:value?a:'#d1c4be',position:'relative',transition:'background .25s',flexShrink:0}}>
        <div style={{position:'absolute',top:3,left:value?24:3,width:19,height:19,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
      </button>
    </div>
  )
}

function Card({ children, style }) {
  return <div style={{background:'#fff',borderRadius:14,padding:22,boxShadow:'0 1px 4px rgba(61,24,38,.08)',...style}}>{children}</div>
}

function SHdr({ icon, title, sub }) {
  return (
    <div style={{marginBottom:22}}>
      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
      <h2 style={{margin:0,fontSize:20,fontWeight:700,color:B.burgundy}}>{title}</h2>
      {sub && <p style={{margin:'5px 0 0',fontSize:13,color:B.muted}}>{sub}</p>}
    </div>
  )
}

function Inp({ label, value, onChange, placeholder, hint, type }) {
  const [f, setF] = useState(false)
  return (
    <div style={{marginBottom:16}}>
      {label && <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a3540',marginBottom:5}}>{label}</label>}
      <input type={type||'text'} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:'100%',padding:'10px 13px',borderRadius:10,border:`1.5px solid ${f?B.gold:'#e8d8cf'}`,fontSize:14,color:B.dark,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
      {hint && <div style={{fontSize:11,color:B.muted,marginTop:3}}>{hint}</div>}
    </div>
  )
}

function Txt({ label, value, onChange, placeholder, rows, hint }) {
  const [f, setF] = useState(false)
  return (
    <div style={{marginBottom:16}}>
      {label && <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a3540',marginBottom:5}}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows||4}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:'100%',padding:'10px 13px',borderRadius:10,border:`1.5px solid ${f?B.gold:'#e8d8cf'}`,fontSize:14,color:B.dark,outline:'none',fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}/>
      {hint && <div style={{fontSize:11,color:B.muted,marginTop:3}}>{hint}</div>}
    </div>
  )
}

function Sel({ label, value, onChange, options }) {
  return (
    <div style={{marginBottom:16}}>
      {label && <label style={{display:'block',fontSize:13,fontWeight:600,color:'#4a3540',marginBottom:5}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:'100%',padding:'10px 13px',borderRadius:10,border:'1.5px solid #e8d8cf',fontSize:14,color:B.dark,background:'#fff',fontFamily:'inherit',outline:'none'}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SaveBtn({ onClick, saving, saved }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{background:saving?'#d1c4be':B.gold,color:'#fff',border:'none',borderRadius:10,padding:'11px 26px',fontSize:14,fontWeight:700,cursor:saving?'wait':'pointer',boxShadow:saving?'none':'0 2px 8px rgba(196,146,74,.35)'}}>
      {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alteracoes'}
    </button>
  )
}

const TYPE_CFG = {
  link:     { label:'Link de Compra', color:'#10b981' },
  booking:  { label:'Agendamento',    color:'#6366f1' },
  script:   { label:'Ensinamento',    color:B.gold    },
  objection:{ label:'Objecao',        color:'#ef4444' },
}

function ScriptModal({ script, onClose, onSave }) {
  const [form, setForm] = useState(script || { type:'link', active:true })
  const [saving, setSaving] = useState(false)
  async function save() {
    if (!form.name) return
    setSaving(true)
    await fetch('/api/admin/scripts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tenant_id:'camila-rocha', script:form }) })
    onSave()
    setSaving(false)
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
      <div style={{background:'#fff',borderRadius:18,padding:26,width:'100%',maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:B.burgundy}}>{form.id ? 'Editar Script' : 'Novo Script'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:B.muted}}>X</button>
        </div>
        <Sel label="Tipo" value={form.type||'link'} onChange={v=>setForm(f=>({...f,type:v}))}
          options={[{value:'link',label:'Link de Compra'},{value:'booking',label:'Agendamento'},{value:'script',label:'Ensinamento'},{value:'objection',label:'Objecao'}]}/>
        <Inp label="Nome" value={form.name||''} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="Ex: Link do curso Geracao do Estilo"/>
        <Inp label="Gatilhos (separados por virgula)" value={form.triggers||''} onChange={v=>setForm(f=>({...f,triggers:v}))} placeholder="curso, preco, link, quanto custa" hint="Palavras que ativam este script"/>
        {(form.type==='link'||form.type==='booking') && <Inp label="URL" value={form.url||''} onChange={v=>setForm(f=>({...f,url:v}))} placeholder="https://..."/>}
        <Txt label="Resposta da IA" value={form.response||''} onChange={v=>setForm(f=>({...f,response:v}))} placeholder="Ex: Aqui esta o link: {URL}" rows={4} hint="Use {URL} para incluir o link automaticamente"/>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <button onClick={onClose} style={{padding:'10px 18px',borderRadius:10,border:'1px solid #e8d8cf',background:'#fff',color:B.muted,fontSize:14,cursor:'pointer'}}>Cancelar</button>
          <button onClick={save} disabled={saving||!form.name} style={{padding:'10px 22px',borderRadius:10,border:'none',background:B.gold,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>{saving?'Salvando...':'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

function Overview({ cfg, onToggle }) {
  const [stats, setStats] = useState({ wa:0, ig:0, today:0, conv:0 })
  useEffect(() => {
    fetch('/api/admin/conversations').then(r=>r.json()).then(d => {
      const cs = d.conversations || []
      const today = new Date().toDateString()
      setStats({
        wa:    cs.filter(c=>(c.channel||'whatsapp')==='whatsapp').length,
        ig:    cs.filter(c=>c.channel==='instagram').length,
        today: cs.filter(c=>new Date(c.created_at).toDateString()===today).length,
        conv:  cs.filter(c=>c.stage==='converted').length,
      })
    }).catch(()=>{})
  }, [])

  return (
    <div>
      <SHdr icon="[casa]" title="Visao Geral" sub="Resumo da sua IA em tempo real"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:22}}>
        {[
          {l:'WhatsApp',  v:stats.wa,    c:'#25D366'},
          {l:'Instagram', v:stats.ig,    c:'#bc1888'},
          {l:'Hoje',      v:stats.today, c:B.gold  },
          {l:'Convertidos',v:stats.conv, c:'#128C7E'},
        ].map(s=>(
          <Card key={s.l} style={{padding:'16px 18px'}}>
            <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:B.muted,fontWeight:500,marginTop:2}}>{s.l}</div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 style={{margin:'0 0 3px',fontSize:15,fontWeight:700,color:B.burgundy}}>Status da IA</h3>
        <p style={{margin:'0 0 6px',fontSize:12,color:B.muted}}>Ative ou pause para cada canal</p>
        <Toggle label="IA do Instagram" desc="Responde automaticamente DMs" value={cfg.ig_ai_enabled??true} onChange={v=>onToggle('ig_ai_enabled',v)} accent="#bc1888"/>
        <Toggle label="IA do WhatsApp"  desc="Responde automaticamente mensagens" value={cfg.wa_ai_enabled??true} onChange={v=>onToggle('wa_ai_enabled',v)} accent="#25D366"/>
      </Card>
    </div>
  )
}

function IGSection({ cfg, setCfg }) {
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false)
  async function save() {
    setSaving(true)
    await fetch('/api/camila/config', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tenant_id:'camila-rocha', settings:cfg }) })
    setSaved(true); setTimeout(()=>setSaved(false), 2500); setSaving(false)
  }
  return (
    <div>
      <SHdr icon="[IG]" title="IA do Instagram" sub="Configure como sua IA responde as DMs e interage com seguidores"/>
      <Card style={{marginBottom:14}}>
        <Toggle label="IA ativa para Instagram" desc="A IA responde automaticamente todas as DMs" value={cfg.ig_ai_enabled??true} onChange={v=>setCfg(c=>({...c,ig_ai_enabled:v}))} accent="#bc1888"/>
        <Txt label="Personalidade da IA no Instagram" value={cfg.ig_personality||''} onChange={v=>setCfg(c=>({...c,ig_personality:v}))} rows={5}
          placeholder="Ex: Voce e a Camila, consultora de estilo com 10 anos de experiencia. Voce fala de forma calorosa e inspiradora. Voce ajuda mulheres a descobrirem seu estilo pessoal..."/>
        <Txt label="Instrucoes de resposta" value={cfg.ig_instructions||''} onChange={v=>setCfg(c=>({...c,ig_instructions:v}))} rows={3}
          placeholder="Ex: Sempre responda em portugues. Seja calorosa. Quando alguem pedir o link do curso, envie o link configurado nos Scripts..."/>
        <Sel label="Tom de voz" value={cfg.ig_tone||'caloroso'} onChange={v=>setCfg(c=>({...c,ig_tone:v}))}
          options={[{value:'caloroso',label:'Caloroso e proximo'},{value:'profissional',label:'Profissional e direto'},{value:'animado',label:'Animado e divertido'},{value:'inspirador',label:'Inspirador e motivador'}]}/>
      </Card>
      <Card style={{marginBottom:14}}>
        <h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:700,color:B.burgundy}}>Links dos Cursos</h3>
        <Inp label="Link do curso principal" value={cfg.ig_course_url||''} onChange={v=>setCfg(c=>({...c,ig_course_url:v}))} placeholder="https://kiwify.com.br/seu-curso" hint="Enviado quando alguem pergunta sobre o curso"/>
        <Inp label="Link de agendamento de consultoria" value={cfg.ig_booking_url||''} onChange={v=>setCfg(c=>({...c,ig_booking_url:v}))} placeholder="https://calendly.com/camila"/>
        <Inp label="Preco do curso (exibido pela IA)" value={cfg.ig_course_price||''} onChange={v=>setCfg(c=>({...c,ig_course_price:v}))} placeholder="Ex: R$ 297,00"/>
      </Card>
      <div style={{display:'flex',justifyContent:'flex-end'}}><SaveBtn onClick={save} saving={saving} saved={saved}/></div>
    </div>
  )
}

function WASection({ cfg, setCfg }) {
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false)
  async function save() {
    setSaving(true)
    await fetch('/api/camila/config', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tenant_id:'camila-rocha', settings:cfg }) })
    setSaved(true); setTimeout(()=>setSaved(false), 2500); setSaving(false)
  }
  return (
    <div>
      <SHdr icon="[WA]" title="IA do WhatsApp" sub="Configure como sua IA responde no WhatsApp"/>
      <Card style={{marginBottom:14}}>
        <Toggle label="IA ativa para WhatsApp" desc="A IA responde automaticamente todas as mensagens" value={cfg.wa_ai_enabled??true} onChange={v=>setCfg(c=>({...c,wa_ai_enabled:v}))} accent="#25D366"/>
        <Txt label="Personalidade da IA no WhatsApp" value={cfg.wa_personality||''} onChange={v=>setCfg(c=>({...c,wa_personality:v}))} rows={5}
          placeholder="Ex: Voce e a Camila, consultora de estilo pessoal. Voce fala de forma proxima e consultiva, ajudando mulheres a descobrirem seu estilo unico..."/>
        <Txt label="Instrucoes de resposta" value={cfg.wa_instructions||''} onChange={v=>setCfg(c=>({...c,wa_instructions:v}))} rows={3}
          placeholder="Ex: Responda de forma rapida. Quando perguntarem sobre cursos, apresente os beneficios antes de enviar o link..."/>
        <Sel label="Tom de voz" value={cfg.wa_tone||'caloroso'} onChange={v=>setCfg(c=>({...c,wa_tone:v}))}
          options={[{value:'caloroso',label:'Caloroso e proximo'},{value:'profissional',label:'Profissional e direto'},{value:'animado',label:'Animado e divertido'},{value:'inspirador',label:'Inspirador e motivador'}]}/>
      </Card>
      <Card style={{marginBottom:14}}>
        <h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:700,color:B.burgundy}}>Links dos Cursos</h3>
        <Inp label="Link do curso principal" value={cfg.wa_course_url||''} onChange={v=>setCfg(c=>({...c,wa_course_url:v}))} placeholder="https://kiwify.com.br/seu-curso"/>
        <Inp label="Link de agendamento" value={cfg.wa_booking_url||''} onChange={v=>setCfg(c=>({...c,wa_booking_url:v}))} placeholder="https://calendly.com/camila"/>
        <Inp label="Preco do curso" value={cfg.wa_course_price||''} onChange={v=>setCfg(c=>({...c,wa_course_price:v}))} placeholder="Ex: R$ 297,00"/>
      </Card>
      <div style={{display:'flex',justifyContent:'flex-end'}}><SaveBtn onClick={save} saving={saving} saved={saved}/></div>
    </div>
  )
}

function Scripts() {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [activeType, setActiveType] = useState('all')

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/scripts?tenant_id=camila-rocha')
    const d = await r.json()
    setScripts(d.scripts || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const del = async id => {
    await fetch('/api/admin/scripts', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tenant_id:'camila-rocha', script_id:id }) })
    load()
  }
  const tog = async s => {
    await fetch('/api/admin/scripts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tenant_id:'camila-rocha', script:{...s, active:!s.active} }) })
    load()
  }

  const types = ['all','link','booking','script','objection']
  const filtered = scripts.filter(s => activeType === 'all' || s.type === activeType)

  return (
    <div>
      <SHdr icon="[Link]" title="Scripts e Links" sub="Ensine a IA a enviar os links certos na hora certa"/>
      <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
        {types.map(t => (
          <button key={t} onClick={()=>setActiveType(t)} style={{padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',background:activeType===t?B.gold:'#f0e8e0',color:activeType===t?'#fff':B.muted,fontSize:12.5,fontWeight:activeType===t?700:500}}>
            {t === 'all' ? 'Todos' : TYPE_CFG[t]?.label || t}
          </button>
        ))}
        <button onClick={()=>setModal({type:'link',active:true})} style={{marginLeft:'auto',padding:'7px 16px',borderRadius:20,border:'none',cursor:'pointer',background:B.burgundy,color:'#fff',fontSize:12.5,fontWeight:700}}>
          + Novo Script
        </button>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:B.muted}}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card style={{textAlign:'center',padding:36}}>
          <div style={{fontSize:32,marginBottom:10}}>[ ]</div>
          <div style={{color:B.muted}}>Nenhum script. Adicione um!</div>
        </Card>
      ) : filtered.map(s => {
        const tc = TYPE_CFG[s.type] || TYPE_CFG.script
        return (
          <Card key={s.id} style={{marginBottom:10,opacity:s.active===false?.55:1}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                  <span style={{fontSize:14,fontWeight:700,color:B.dark}}>{s.name}</span>
                  <span style={{fontSize:11,padding:'2px 7px',borderRadius:10,background:tc.color+'20',color:tc.color,fontWeight:600}}>{tc.label}</span>
                </div>
                {s.triggers && <div style={{fontSize:12,color:B.muted,marginBottom:2}}>Gatilhos: {s.triggers}</div>}
                {s.url && <div style={{fontSize:12,color:'#6366f1',marginBottom:2}}>{s.url}</div>}
                {s.response && <div style={{fontSize:13,color:'#4a3540',lineHeight:1.4}}>{s.response.slice(0,90)}{s.response.length>90?'...':''}</div>}
              </div>
              <div style={{display:'flex',gap:5,flexShrink:0}}>
                <button onClick={()=>tog(s)} style={{padding:'5px 9px',borderRadius:7,border:`1px solid ${s.active!==false?'#10b981':'#e8d8cf'}`,background:s.active!==false?'#e8f9f1':'#fdf6ec',color:s.active!==false?'#10b981':B.muted,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  {s.active !== false ? 'Ativo' : 'Inativo'}
                </button>
                <button onClick={()=>setModal(s)} style={{padding:'5px 9px',borderRadius:7,border:'1px solid #e8d8cf',background:'#fdf6ec',color:B.muted,fontSize:12,cursor:'pointer'}}>Editar</button>
                <button onClick={()=>del(s.id)} style={{padding:'5px 9px',borderRadius:7,border:'1px solid #fee2e2',background:'#fff5f5',color:'#ef4444',fontSize:12,cursor:'pointer'}}>Deletar</button>
              </div>
            </div>
          </Card>
        )
      })}
      {modal && <ScriptModal script={modal} onClose={()=>setModal(null)} onSave={()=>{setModal(null);load()}}/>}
    </div>
  )
}

function Followers({ cfg, setCfg }) {
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false)
  async function save() {
    setSaving(true)
    await fetch('/api/camila/config', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tenant_id:'camila-rocha', settings:cfg }) })
    setSaved(true); setTimeout(()=>setSaved(false), 2500); setSaving(false)
  }
  return (
    <div>
      <SHdr icon="[*]" title="Novos Seguidores" sub="Mensagem automatica para quem comeca a te seguir no Instagram"/>
      <Card style={{marginBottom:14}}>
        <Toggle label="Mensagem automatica para novos seguidores" desc="A IA envia uma DM quando alguem comeca a te seguir" value={cfg.auto_follow_enabled??false} onChange={v=>setCfg(c=>({...c,auto_follow_enabled:v}))} accent="#bc1888"/>
        <Txt label="Mensagem de boas-vindas" value={cfg.follow_welcome||''} onChange={v=>setCfg(c=>({...c,follow_welcome:v}))} rows={5}
          placeholder="Oiiii! Que alegria ter voce aqui! Sou a Camila, consultora de estilo pessoal. Se quiser saber como posso te ajudar, e so me chamar!"/>
        <Sel label="Quando enviar" value={cfg.follow_delay||'0'} onChange={v=>setCfg(c=>({...c,follow_delay:v}))}
          options={[{value:'0',label:'Imediatamente'},{value:'5',label:'Apos 5 minutos'},{value:'30',label:'Apos 30 minutos'},{value:'60',label:'Apos 1 hora'}]}/>
      </Card>
      <Card style={{marginBottom:14}}>
        <h3 style={{margin:'0 0 3px',fontSize:15,fontWeight:700,color:B.burgundy}}>Follow-up</h3>
        <p style={{margin:'0 0 8px',fontSize:12,color:B.muted}}>Mensagem enviada se o seguidor nao responder apos 24h</p>
        <Toggle label="Enviar follow-up automatico" value={cfg.followup_enabled??false} onChange={v=>setCfg(c=>({...c,followup_enabled:v}))} accent="#bc1888"/>
        <Txt label="Mensagem de follow-up" value={cfg.followup_msg||''} onChange={v=>setCfg(c=>({...c,followup_msg:v}))} rows={3}
          placeholder="Oi! So passando para lembrar que estou por aqui se quiser bater um papo sobre estilo!"/>
      </Card>
      <div style={{display:'flex',justifyContent:'flex-end'}}><SaveBtn onClick={save} saving={saving} saved={saved}/></div>
    </div>
  )
}

function TestAI() {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ch, setCh] = useState('instagram')

  async function send() {
    if (!input.trim() || sending) return
    const txt = input.trim()
    setInput(''); setSending(true)
    setMsgs(m => [...m, { role:'user', content:txt }])
    try {
      const r = await fetch('/api/test-ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:txt, channel:ch }) })
      const d = await r.json()
      setMsgs(m => [...m, { role:'assistant', content:d.message||d.error||'Erro' }])
    } catch {
      setMsgs(m => [...m, { role:'assistant', content:'Erro ao conectar com a IA' }])
    }
    setSending(false)
  }

  return (
    <div>
      <SHdr icon="[Teste]" title="Testar IA" sub="Simule uma conversa para ver como sua IA vai responder"/>
      <Card>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {['instagram','whatsapp'].map(c => (
            <button key={c} onClick={()=>setCh(c)} style={{flex:1,padding:'9px',borderRadius:10,border:'none',cursor:'pointer',background:ch===c?(c==='instagram'?'#bc1888':'#25D366'):'#f0e8e0',color:ch===c?'#fff':B.muted,fontSize:13.5,fontWeight:ch===c?700:500}}>
              {c === 'instagram' ? 'Instagram' : 'WhatsApp'}
            </button>
          ))}
        </div>
        <div style={{minHeight:280,maxHeight:380,overflowY:'auto',display:'flex',flexDirection:'column',gap:10,padding:'8px 0'}}>
          {msgs.length === 0 ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:B.muted,fontSize:14}}>
              Digite uma mensagem para testar sua IA
            </div>
          ) : msgs.map((m, i) => (
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{maxWidth:'75%',padding:'10px 13px',borderRadius:'14px',background:m.role==='user'?B.gold+'28':'#f0e8e0',fontSize:14,color:B.dark,lineHeight:1.5}}>
                {m.role === 'assistant' && <div style={{fontSize:11,color:B.muted,marginBottom:3,fontWeight:600}}>Camila IA</div>}
                <div style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
              </div>
            </div>
          ))}
          {sending && (
            <div style={{display:'flex',justifyContent:'flex-start'}}>
              <div style={{padding:'10px 14px',borderRadius:'14px',background:'#f0e8e0',color:B.muted,fontSize:14}}>digitando...</div>
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:8,marginTop:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
            placeholder="Digite uma mensagem de teste..."
            style={{flex:1,padding:'10px 13px',borderRadius:10,border:'1.5px solid #e8d8cf',fontSize:14,fontFamily:'inherit',outline:'none'}}/>
          <button onClick={send} disabled={!input.trim()||sending}
            style={{padding:'10px 18px',borderRadius:10,border:'none',background:input.trim()&&!sending?B.gold:'#e8d8cf',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
            Enviar
          </button>
        </div>
        <button onClick={()=>setMsgs([])} style={{marginTop:8,fontSize:12,color:B.muted,background:'none',border:'none',cursor:'pointer'}}>Limpar conversa</button>
      </Card>
    </div>
  )
}

const NAV = [
  { id:'overview',   label:'Visao Geral'       },
  { id:'instagram',  label:'IA do Instagram'    },
  { id:'whatsapp',   label:'IA do WhatsApp'     },
  { id:'scripts',    label:'Scripts e Links'    },
  { id:'followers',  label:'Novos Seguidores'   },
  { id:'test',       label:'Testar IA'          },
]

export default function CamilaPainel() {
  const [active, setActive] = useState('overview')
  const [cfg, setCfg] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/camila/config?tenant_id=camila-rocha')
      .then(r => r.json())
      .then(d => { setCfg(d.config?.settings || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function onToggle(key, val) {
    const nc = { ...cfg, [key]:val }
    setCfg(nc)
    fetch('/api/camila/config', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tenant_id:'camila-rocha', settings:nc }) }).catch(()=>{})
  }

  const screens = {
    overview:  <Overview   cfg={cfg} onToggle={onToggle}/>,
    instagram: <IGSection  cfg={cfg} setCfg={setCfg}/>,
    whatsapp:  <WASection  cfg={cfg} setCfg={setCfg}/>,
    scripts:   <Scripts/>,
    followers: <Followers  cfg={cfg} setCfg={setCfg}/>,
    test:      <TestAI/>,
  }

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'Inter,-apple-system,sans-serif',background:B.cream}}>
      <style>{`* { box-sizing: border-box } ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-thumb { background: #d1c4be; border-radius: 2px } input::placeholder, textarea::placeholder { color: #c4b0bc }`}</style>

      {/* SIDEBAR */}
      <div style={{width:230,background:B.burgundy,display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto'}}>
        <div style={{padding:'22px 18px 16px'}}>
          <div style={{fontSize:19,fontWeight:800,color:B.gold,letterSpacing:-.5}}>CA.RO</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.45)',marginTop:1}}>Painel da Camila</div>
        </div>
        <div style={{padding:'0 14px 16px',display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${B.gold},#F4E1BE)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:B.burgundy,flexShrink:0}}>CR</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>Camila Rocha</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.45)'}}>Consultora de Estilo</div>
          </div>
        </div>
        <div style={{height:1,background:'rgba(255,255,255,.1)',margin:'0 14px 10px'}}/>
        <nav style={{flex:1,padding:'0 8px'}}>
          {NAV.map(item => (
            <button key={item.id} onClick={()=>setActive(item.id)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'10px 11px',borderRadius:11,border:'none',cursor:'pointer',background:active===item.id?'rgba(196,146,74,.18)':'transparent',color:active===item.id?B.gold:'rgba(255,255,255,.6)',fontSize:13,fontWeight:active===item.id?600:400,textAlign:'left',marginBottom:2,transition:'all .15s'}}>
              {item.label}
              {active === item.id && <div style={{marginLeft:'auto',width:4,height:4,borderRadius:'50%',background:B.gold}}/>}
            </button>
          ))}
        </nav>
        <div style={{padding:14,borderTop:'1px solid rgba(255,255,255,.1)'}}>
          <a href="/admin/conversations" style={{display:'flex',alignItems:'center',gap:7,padding:'9px 11px',borderRadius:9,background:'rgba(255,255,255,.07)',textDecoration:'none',color:'rgba(255,255,255,.65)',fontSize:12.5,fontWeight:500}}>
            Ver conversas
          </a>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:'auto',padding:'28px 28px 60px'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:B.muted}}>
            Carregando configuracoes...
          </div>
        ) : screens[active]}
      </div>
    </div>
  )
}
