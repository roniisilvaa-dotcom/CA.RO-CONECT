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

// Todos os clientes configurados na plataforma
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

// Micro componentes
function Dot({ color, size=7, glow=false }) {
  return (
    <span style={{
      display:'inline-block', width:size, height:size, borderRadius:'50%',
      background:color, flexShrink:0,
      boxShadow: glow ? `0 0 8px ${color}` : 'none',
    }}/>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color||C.gold},transparent)`}}/>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:10}}>{label}</div>
      <div style={{fontSize:28,fontWeight:900,color:color||C.text,lineHeight:1,marginBottom:4}}>{value}</div>
      {sub && <div style={{fontSize:12,color:C.mutedL}}>{sub}</div>}
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
    <span style={{fontSize:11,padding:'2px 9px',borderRadius:20,background:color+'22',color,fontWeight:700,whiteSpace:'nowrap'}}>
      {label}
    </span>
  )
}

function MiniBar({ data, color }) {
  if (!data || !data.length) return <div style={{height:44,display:'flex',alignItems:'center',color:C.muted,fontSize:12}}>Sem dados</div>
  const max = Math.max(...data.map(d=>d.v), 1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:3,height:44}}>
      {data.map((d,i) => (
        <div key={i} title={`${d.l}: ${d.v}`}
          style={{flex:1,height:`${Math.max(4,(d.v/max)*100)}%`,background:color||C.gold,borderRadius:'2px 2px 0 0',opacity:0.5+0.5*(d.v/max),minWidth:4}}/>
      ))}
    </div>
  )
}

// Modal Novo Cliente
function NovoClienteModal({ onClose }) {
  const opts = [
    {
      icon: 'WA', color: '#25D366',
      title: 'Conectar WhatsApp',
      desc: 'Embedded Signup — conecta numero e ativa IA em minutos',
      href: '/caro-admin/onboarding/whatsapp',
    },
    {
      icon: 'IG', color: '#E1306C',
      title: 'Conectar Instagram',
      desc: 'Vincula conta do Instagram e ativa respostas automaticas',
      href: '/caro-admin/onboarding/instagram',
    },
    {
      icon: '+', color: C.gold,
      title: 'Configuracao Manual',
      desc: 'Cadastra o cliente manualmente e define canais depois',
      href: '/caro-admin/onboarding/manual',
    },
  ]

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onClose}>
      <div style={{background:C.surf,border:`1px solid ${C.borderL}`,borderRadius:20,padding:32,width:460,maxWidth:'90vw'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:C.text}}>Novo Cliente</div>
            <div style={{fontSize:12,color:C.muted,marginTop:3}}>Escolha como conectar</div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,borderRadius:'50%',border:`1px solid ${C.border}`,background:'transparent',color:C.muted,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>
            x
          </button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {opts.map(o => (
            <a key={o.title} href={o.href}
              style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,border:`1px solid ${C.border}`,background:C.surf2,textDecoration:'none',cursor:'pointer',transition:'border-color .15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=o.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{width:42,height:42,borderRadius:12,background:`${o.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:o.color,flexShrink:0}}>
                {o.icon}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.text}}>{o.title}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{o.desc}</div>
              </div>
              <div style={{marginLeft:'auto',fontSize:18,color:C.muted}}>›</div>
            </a>
          ))}
        </div>
        <div style={{marginTop:20,padding:'12px 14px',borderRadius:10,background:C.surf3,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Clientes cadastrados</div>
          {KNOWN_CLIENTS.map(cl => (
            <div key={cl.id} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
              <Dot color={cl.color} size={6}/>
              <span style={{fontSize:12,color:C.mutedL}}>{cl.name}</span>
              <span style={{fontSize:10,color:C.muted,marginLeft:'auto'}}>{cl.channels.join(' · ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- OVERVIEW ---
function Overview({ clients, convos, loading, lastRefresh, tick }) {
  const today = new Date().toDateString()
  const todayCount = convos.filter(c => new Date(c.created_at || c.last_message_at || 0).toDateString() === today).length
  const waCount    = convos.filter(c => (c.channel || 'whatsapp') === 'whatsapp').length
  const igCount    = convos.filter(c => c.channel === 'instagram').length
  const converted  = convos.filter(c => c.stage === 'converted').length
  const convRate   = convos.length > 0 ? ((converted / convos.length) * 100).toFixed(1) : '0.0'

  const days7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    const v = convos.filter(c => new Date(c.created_at || c.last_message_at || 0).toDateString() === d.toDateString()).length
    return { l: label, v }
  })

  const stageBreakdown = ['new','contacted','interested','converted'].map(s => ({
    s, count: convos.filter(c => (c.stage||'new') === s).length,
  }))

  return (
    <div>
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{margin:0,fontSize:24,fontWeight:900,color:C.text,letterSpacing:'-0.5px'}}>Visao Geral</h2>
            <p style={{margin:'5px 0 0',fontSize:13,color:C.muted}}>Metricas em tempo real — todos os clientes</p>
          </div>
          {lastRefresh && (
            <div style={{fontSize:11,color:C.muted,textAlign:'right'}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <Dot color={C.green} size={6} glow={true}/>
                <span style={{color:C.green,fontWeight:600}}>Ao vivo</span>
              </div>
              <div>Atualizado {lastRefresh.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <StatCard label="Clientes Ativos"  value={loading?'—':clients.length}       sub="na plataforma"                   color={C.gold}/>
        <StatCard label="Conversas Hoje"   value={loading?'—':todayCount}            sub="novos contatos"                  color={C.green}/>
        <StatCard label="Total Conversas"  value={loading?'—':convos.length}         sub={`WA ${waCount} · IG ${igCount}`} color={C.blue}/>
        <StatCard label="Taxa Conversao"   value={loading?'—':`${convRate}%`}        sub={`${converted} convertidos`}      color={C.purple}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
        <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px'}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>Atividade — Ultimos 7 dias</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14}}>Conversas abertas por dia</div>
          <MiniBar data={days7} color={C.gold}/>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
            {days7.map((d,i) => <div key={i} style={{fontSize:10,color:C.muted,textAlign:'center',flex:1}}>{d.l}</div>)}
          </div>
        </div>

        <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px'}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>Funil de Conversao</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Distribuicao por stage</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {stageBreakdown.map(({ s, count }) => {
              const colors = { new:C.blue, contacted:C.purple, interested:C.gold, converted:C.green }
              const labels = { new:'Novo', contacted:'Contactado', interested:'Interessado', converted:'Convertido' }
              const pct = convos.length ? (count / convos.length) * 100 : 0
              return (
                <div key={s}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:12,color:C.mutedL}}>{labels[s]}</span>
                    <span style={{fontSize:12,fontWeight:700,color:colors[s]}}>{count}</span>
                  </div>
                  <div style={{height:5,background:C.surf3,borderRadius:3}}>
                    <div style={{height:'100%',width:`${pct}%`,background:colors[s],borderRadius:3}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px'}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Clientes Ativos</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
          {clients.map(cl => {
            const meta = getMeta(cl.id)
            const clToday = convos.filter(c => c.tenant_id === cl.id && new Date(c.created_at || c.last_message_at || 0).toDateString() === today).length
            return (
              <div key={cl.id} style={{background:C.surf2,borderRadius:12,padding:'12px 14px',border:`1px solid ${C.borderL}`}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${meta.color},${meta.color}77)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>
                    {meta.init}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,lineHeight:1.2}}>{meta.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{cl.count} conv · +{clToday} hoje</div>
                  </div>
                  <Dot color={C.green} size={6} glow={true}/>
                </div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {cl.hasWA && <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#25D36622',color:'#25D366',fontWeight:600}}>WA</span>}
                  {cl.hasIG && <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'#E1306C22',color:'#E1306C',fontWeight:600}}>IG</span>}
                  {meta.painel && (
                    <a href={meta.painel} style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:`${meta.color}22`,color:meta.color,fontWeight:600,textDecoration:'none'}}>
                      Painel
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- CLIENTES ---
function Clientes({ clients, convos, onSelectClient, onGoTo, onNovoCliente }) {
  const [search, setSearch] = useState('')
  const today = new Date().toDateString()

  const allClients = [
    ...clients,
    ...KNOWN_CLIENTS.filter(k => !clients.find(c => c.id === k.id)).map(k => ({
      id: k.id, count: 0, hasWA: k.channels.includes('whatsapp'), hasIG: k.channels.includes('instagram'),
    })),
  ].filter(cl => {
    const meta = getMeta(cl.id)
    const q = search.toLowerCase()
    return !q || meta.name.toLowerCase().includes(q) || cl.id.toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
        <div>
          <h2 style={{margin:0,fontSize:24,fontWeight:900,color:C.text,letterSpacing:'-0.5px'}}>Clientes</h2>
          <p style={{margin:'5px 0 0',fontSize:13,color:C.muted}}>{allClients.length} clientes na plataforma</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
            style={{padding:'9px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surf2,color:C.text,fontSize:13,outline:'none',width:210}}/>
          <button onClick={onNovoCliente}
            style={{padding:'9px 18px',borderRadius:10,border:'none',background:C.gold,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
            + Novo Cliente
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
        {allClients.map(cl => {
          const meta = getMeta(cl.id)
          const todayC = convos.filter(c => c.tenant_id === cl.id && new Date(c.created_at || c.last_message_at || 0).toDateString() === today).length
          const conv = convos.filter(c => c.tenant_id === cl.id && c.stage === 'converted').length
          const rate = cl.count > 0 ? ((conv / cl.count) * 100).toFixed(0) : 0

          return (
            <div key={cl.id}
              style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:16,padding:'20px 22px',transition:'border-color .2s,box-shadow .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=meta.color;e.currentTarget.style.boxShadow=`0 0 0 1px ${meta.color}33`}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow='none'}}>

              <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:16}}>
                <div style={{width:50,height:50,borderRadius:'50%',background:`linear-gradient(135deg,${meta.color},${meta.color}66)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:900,color:'#fff',flexShrink:0,boxShadow:`0 0 0 3px ${meta.color}22`}}>
                  {meta.init}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:C.text}}>{meta.name}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:1}}>{meta.role}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:1,opacity:0.5,fontFamily:'monospace'}}>{cl.id}</div>
                </div>
                <div style={{display:'flex',gap:4,alignItems:'center',paddingTop:2}}>
                  {cl.hasWA && <Dot color="#25D366" size={7}/>}
                  {cl.hasIG && <Dot color="#E1306C" size={7}/>}
                  <Dot color={C.green} size={7} glow={true}/>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
                {[
                  { l:'Total',     v: cl.count,   c: C.text  },
                  { l:'Hoje',      v: todayC,      c: C.green },
                  { l:'Conversao', v: `${rate}%`,  c: C.gold  },
                ].map(s => (
                  <div key={s.l} style={{background:C.surf2,borderRadius:9,padding:'9px 10px',textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:6}}>
                <button onClick={() => { onSelectClient(cl.id); onGoTo('conversas') }}
                  style={{flex:1,padding:'9px',borderRadius:9,border:'none',background:meta.color,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Ver Conversas
                </button>
                {meta.painel ? (
                  <a href={meta.painel}
                    style={{flex:1,padding:'9px',borderRadius:9,border:`1px solid ${C.borderL}`,background:'transparent',color:C.mutedL,fontSize:12,fontWeight:600,cursor:'pointer',textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    Painel Proprio
                  </a>
                ) : (
                  <button onClick={() => { onSelectClient(cl.id); onGoTo('analytics') }}
                    style={{flex:1,padding:'9px',borderRadius:9,border:`1px solid ${C.borderL}`,background:'transparent',color:C.mutedL,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    Analytics
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Card Novo Cliente */}
        <div onClick={onNovoCliente}
          style={{background:'transparent',border:`2px dashed ${C.borderL}`,borderRadius:16,padding:'20px 22px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,cursor:'pointer',transition:'border-color .2s,background .2s',minHeight:200}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.background=`${C.gold}08`}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderL;e.currentTarget.style.background='transparent'}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:`${C.gold}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:C.gold,fontWeight:300}}>+</div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:14,fontWeight:700,color:C.mutedL}}>Adicionar Cliente</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>WhatsApp, Instagram ou manual</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- CONVERSAS ---
function Conversas({ convos, loading, filterClient, clients }) {
  const [ch,     setCh]     = useState('all')
  const [client, setClient] = useState(filterClient || 'all')
  const [stage,  setStage]  = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { if (filterClient) setClient(filterClient) }, [filterClient])

  const allKnown = [
    ...clients,
    ...KNOWN_CLIENTS.filter(k => !clients.find(c => c.id === k.id)).map(k => ({
      id: k.id, count: 0, hasWA: false, hasIG: false,
    })),
  ]

  const filtered = convos.filter(c => {
    if (ch !== 'all' && (c.channel || 'whatsapp') !== ch) return false
    if (client !== 'all' && c.tenant_id !== client) return false
    if (stage !== 'all' && (c.stage || 'new') !== stage) return false
    if (search) {
      const q = search.toLowerCase()
      return (c.contact_name||'').toLowerCase().includes(q) || (c.phone||'').includes(q) || (c.instagram_id||'').toLowerCase().includes(q)
    }
    return true
  })

  const btnSt = (active) => ({
    padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight: active ? 700 : 500,
    background: active ? C.gold : C.surf2, color: active ? '#fff' : C.muted,
  })

  const selSt = {
    padding:'7px 12px', borderRadius:20, border:`1px solid ${C.border}`,
    background:C.surf2, color:C.muted, fontSize:12, outline:'none', cursor:'pointer',
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h2 style={{margin:0,fontSize:24,fontWeight:900,color:C.text,letterSpacing:'-0.5px'}}>Inbox Universal</h2>
          <p style={{margin:'5px 0 0',fontSize:13,color:C.muted}}>{filtered.length} de {convos.length} conversas</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contato..."
          style={{padding:'9px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surf2,color:C.text,fontSize:13,outline:'none',width:230}}/>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {['all','whatsapp','instagram'].map(f => (
          <button key={f} onClick={() => setCh(f)} style={btnSt(ch === f)}>
            {f === 'all' ? 'Todos' : f === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
          </button>
        ))}
        <div style={{width:1,height:20,background:C.border,margin:'0 4px'}}/>
        <select value={client} onChange={e => setClient(e.target.value)} style={selSt}>
          <option value="all">Todos os clientes</option>
          {allKnown.map(cl => <option key={cl.id} value={cl.id}>{getMeta(cl.id).name}</option>)}
        </select>
        <select value={stage} onChange={e => setStage(e.target.value)} style={selSt}>
          <option value="all">Todos os stages</option>
          <option value="new">Novo</option>
          <option value="contacted">Contactado</option>
          <option value="interested">Interessado</option>
          <option value="converted">Convertido</option>
        </select>
        {(client !== 'all' || stage !== 'all' || ch !== 'all' || search) && (
          <button onClick={() => { setCh('all'); setClient('all'); setStage('all'); setSearch('') }}
            style={{padding:'7px 12px',borderRadius:20,border:`1px solid ${C.red}44`,background:'transparent',color:C.red,fontSize:11,cursor:'pointer',fontWeight:600}}>
            Limpar filtros
          </button>
        )}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {loading ? (
          <div style={{padding:80,textAlign:'center',color:C.muted}}>Carregando conversas...</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:80,textAlign:'center',color:C.muted}}>Nenhuma conversa encontrada</div>
        ) : filtered.slice(0,100).map(c => {
          const meta   = getMeta(c.tenant_id)
          const isIG   = c.channel === 'instagram'
          const chColor = isIG ? '#E1306C' : '#25D366'
          const contact = c.contact_name || (isIG ? (c.instagram_id ? '@'+c.instagram_id : 'Sem nome') : (c.phone || 'Desconhecido'))
          const time    = c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''

          return (
            <div key={c.id}
              style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:12,padding:'11px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:'border-color .15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=meta.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{width:38,height:38,borderRadius:'50%',background:`linear-gradient(135deg,${meta.color},${meta.color}55)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',flexShrink:0}}>
                {meta.init}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <span style={{fontSize:14,fontWeight:600,color:C.text}}>{contact}</span>
                  <Dot color={chColor} size={6}/>
                  <span style={{fontSize:11,color:C.muted}}>{meta.name}</span>
                </div>
                <div style={{fontSize:12,color:C.muted,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {c.last_message || 'Sem mensagens recentes'}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                <StageChip stage={c.stage}/>
                {time && <span style={{fontSize:10,color:C.muted}}>{time}</span>}
              </div>
            </div>
          )
        })}
        {filtered.length > 100 && (
          <div style={{padding:14,textAlign:'center',color:C.muted,fontSize:12}}>
            Mostrando 100 de {filtered.length}. Use os filtros para refinar.
          </div>
        )}
      </div>
    </div>
  )
}

// --- ANALYTICS ---
function Analytics({ clients, convos, filterClient }) {
  const [sel, setSel] = useState(filterClient || 'all')
  const allKnown = [
    ...clients,
    ...KNOWN_CLIENTS.filter(k => !clients.find(c => c.id === k.id)).map(k => ({
      id: k.id, count: 0, hasWA: false, hasIG: false,
    })),
  ]
  const maxConvos = Math.max(...allKnown.map(cl => cl.count), 1)
  const focus = sel === 'all' ? allKnown : allKnown.filter(cl => cl.id === sel)

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
        <div>
          <h2 style={{margin:0,fontSize:24,fontWeight:900,color:C.text,letterSpacing:'-0.5px'}}>Analytics</h2>
          <p style={{margin:'5px 0 0',fontSize:13,color:C.muted}}>Performance por cliente</p>
        </div>
        <select value={sel} onChange={e => setSel(e.target.value)}
          style={{padding:'9px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.surf2,color:C.text,fontSize:13,outline:'none'}}>
          <option value="all">Todos os clientes</option>
          {allKnown.map(cl => <option key={cl.id} value={cl.id}>{getMeta(cl.id).name}</option>)}
        </select>
      </div>

      {sel === 'all' && (
        <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:14,padding:'20px 22px',marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16}}>Volume por Cliente</div>
          <div style={{display:'flex',flexDirection:'column',gap:11}}>
            {allKnown.sort((a,b) => b.count - a.count).map(cl => {
              const meta = getMeta(cl.id)
              const pct = allKnown.length === 0 ? 0 : (cl.count / maxConvos) * 100
              const conv = convos.filter(c => c.tenant_id === cl.id && c.stage === 'converted').length
              const rate = cl.count > 0 ? ((conv/cl.count)*100).toFixed(0) : 0
              const today = convos.filter(c => c.tenant_id === cl.id && new Date(c.created_at||c.last_message_at||0).toDateString()===new Date().toDateString()).length
              return (
                <div key={cl.id}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${meta.color},${meta.color}66)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>
                        {meta.init}
                      </div>
                      <span style={{fontSize:13,color:C.text,fontWeight:600}}>{meta.name}</span>
                    </div>
                    <div style={{display:'flex',gap:14}}>
                      <span style={{fontSize:12,color:C.muted}}>{cl.count} conv.</span>
                      <span style={{fontSize:12,color:C.green,fontWeight:700}}>{rate}% conv.</span>
                      <span style={{fontSize:12,color:C.blue}}>+{today} hoje</span>
                    </div>
                  </div>
                  <div style={{height:7,background:C.surf3,borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.max(pct,cl.count===0?0:2)}%`,background:`linear-gradient(90deg,${meta.color},${meta.color}88)`,borderRadius:4}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
        {focus.map(cl => {
          const meta  = getMeta(cl.id)
          const clC   = convos.filter(c => c.tenant_id === cl.id)
          const waC   = clC.filter(c => (c.channel||'whatsapp')==='whatsapp').length
          const igC   = clC.filter(c => c.channel==='instagram').length
          const conv  = clC.filter(c => c.stage==='converted').length
          const inter = clC.filter(c => c.stage==='interested').length
          const cont  = clC.filter(c => c.stage==='contacted').length
          const newC  = clC.filter(c => (c.stage||'new')==='new').length
          const today = clC.filter(c => new Date(c.created_at||c.last_message_at||0).toDateString()===new Date().toDateString()).length
          const rate  = cl.count > 0 ? ((conv/cl.count)*100).toFixed(1) : '0.0'

          return (
            <div key={cl.id} style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${meta.color},transparent)`}}/>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <div style={{width:42,height:42,borderRadius:'50%',background:`linear-gradient(135deg,${meta.color},${meta.color}66)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:'#fff',boxShadow:`0 0 0 3px ${meta.color}22`}}>
                  {meta.init}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>{meta.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{cl.count} conversas total</div>
                </div>
                {meta.painel && (
                  <a href={meta.painel} style={{fontSize:11,padding:'4px 10px',borderRadius:20,background:`${meta.color}22`,color:meta.color,textDecoration:'none',fontWeight:600}}>
                    Painel
                  </a>
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:14}}>
                {[
                  {l:'Taxa Conv.',   v:`${rate}%`,  c:C.gold},
                  {l:'Hoje',         v:today,        c:C.green},
                  {l:'Convertidos',  v:conv,          c:C.green},
                  {l:'Interessados', v:inter,         c:C.gold},
                  {l:'WhatsApp',     v:waC,           c:'#25D366'},
                  {l:'Instagram',    v:igC,           c:'#E1306C'},
                ].map(s => (
                  <div key={s.l} style={{background:C.surf2,borderRadius:8,padding:'8px 10px'}}>
                    <div style={{fontSize:16,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2,lineHeight:1.2}}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                {[
                  {l:'Novos',       v:newC, c:C.blue},
                  {l:'Contactados', v:cont, c:C.purple},
                  {l:'Interessados',v:inter,c:C.gold},
                  {l:'Convertidos', v:conv, c:C.green},
                ].map(s => (
                  <div key={s.l} style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{fontSize:11,color:C.muted,width:82,flexShrink:0}}>{s.l}</div>
                    <div style={{flex:1,height:4,background:C.surf3,borderRadius:2}}>
                      <div style={{height:'100%',width:cl.count?`${(s.v/cl.count)*100}%`:'0%',background:s.c,borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:s.c,width:24,textAlign:'right',flexShrink:0}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const NAV = [
  { id:'overview',   label:'Visao Geral' },
  { id:'clientes',   label:'Clientes'    },
  { id:'conversas',  label:'Conversas'   },
  { id:'analytics',  label:'Analytics'   },
]

const REFRESH_INTERVAL = 30000

export default function CaroAdmin() {
  const [active,       setActive]       = useState('overview')
  const [convos,       setConvos]       = useState([])
  const [clients,      setClients]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filterClient, setFilterClient] = useState(null)
  const [lastRefresh,  setLastRefresh]  = useState(null)
  const [countdown,    setCountdown]    = useState(REFRESH_INTERVAL/1000)
  const [showModal,    setShowModal]    = useState(false)
  const [tick,         setTick]         = useState(0)
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
        if (!map[tid]) map[tid] = { id: tid, count: 0, hasWA: false, hasIG: false }
        map[tid].count++
        if (c.channel === 'instagram') map[tid].hasIG = true
        else map[tid].hasWA = true
      })
      KNOWN_CLIENTS.forEach(k => {
        if (!map[k.id]) map[k.id] = {
          id: k.id, count: 0,
          hasWA: k.channels.includes('whatsapp'),
          hasIG: k.channels.includes('instagram'),
        }
      })
      setClients(Object.values(map))
      setLastRefresh(new Date())
      setTick(t => t + 1)
    } catch (e) {
      console.error('CaroAdmin load error', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      load(true)
      setCountdown(REFRESH_INTERVAL/1000)
    }, REFRESH_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [load])

  useEffect(() => {
    setCountdown(REFRESH_INTERVAL/1000)
    countRef.current = setInterval(() => {
      setCountdown(c => c > 0 ? c - 1 : REFRESH_INTERVAL/1000)
    }, 1000)
    return () => clearInterval(countRef.current)
  }, [lastRefresh])

  const today = new Date().toDateString()
  const todayCount = convos.filter(c => new Date(c.created_at||c.last_message_at||0).toDateString()===today).length

  const navBtnSt = (isActive) => ({
    width:'100%', display:'flex', alignItems:'center', padding:'10px 12px',
    borderRadius:10, border:'none', cursor:'pointer',
    background: isActive ? `${C.gold}18` : 'transparent',
    color: isActive ? C.gold : C.muted,
    fontSize:13, fontWeight: isActive ? 700 : 500,
    textAlign:'left', marginBottom:2, gap:8,
  })

  return (
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:'Inter,-apple-system,BlinkMacSystemFont,sans-serif',color:C.text}}>
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

      {showModal && <NovoClienteModal onClose={() => setShowModal(false)}/>}

      {/* SIDEBAR */}
      <div style={{width:224,background:C.surf,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
        <div style={{padding:'22px 18px 18px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:22,fontWeight:900,background:`linear-gradient(135deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-1.5px',lineHeight:1}}>
            CA.RO
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:3,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:600}}>Connect Admin</div>
        </div>

        <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,background:C.surf2}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <Dot color={loading ? C.muted : C.green} size={7} glow={!loading}/>
            <span style={{fontSize:11,color:loading?C.muted:C.green,fontWeight:600}}>
              {loading ? 'Atualizando...' : 'Ao vivo'}
            </span>
            {!loading && (
              <span style={{fontSize:10,color:C.muted,marginLeft:'auto'}}>
                {countdown}s
              </span>
            )}
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>
            {clients.length} clientes · {convos.length} conv · {todayCount} hoje
          </div>
          <div style={{height:2,background:C.surf3,borderRadius:1,marginTop:6}}>
            <div style={{height:'100%',width:`${(countdown/(REFRESH_INTERVAL/1000))*100}%`,background:C.green,borderRadius:1,transition:'width 1s linear'}}/>
          </div>
        </div>

        <nav style={{flex:1,padding:'10px 8px'}}>
          {NAV.map(item => {
            const isActive = active === item.id
            return (
              <button key={item.id} onClick={() => { setActive(item.id); setFilterClient(null) }} style={navBtnSt(isActive)}>
                <div style={{width:7,height:7,borderRadius:'50%',background:isActive?C.gold:'transparent',border:`1px solid ${isActive?C.gold:C.muted+'44'}`,flexShrink:0}}/>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:600,marginBottom:8}}>Clientes</div>
          {clients.map(cl => {
            const meta = getMeta(cl.id)
            const clToday = convos.filter(c => c.tenant_id === cl.id && new Date(c.created_at||c.last_message_at||0).toDateString()===today).length
            return (
              <div key={cl.id} style={{display:'flex',alignItems:'center',gap:7,marginBottom:7,cursor:'pointer',padding:'4px 6px',borderRadius:8,transition:'background .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background=C.surf3}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                onClick={()=>{setFilterClient(cl.id);setActive('conversas')}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:`linear-gradient(135deg,${meta.color},${meta.color}66)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#fff',flexShrink:0}}>
                  {meta.init}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{meta.name}</div>
                </div>
                {clToday > 0 && (
                  <div style={{fontSize:10,fontWeight:700,color:C.green}}>+{clToday}</div>
                )}
              </div>
            )
          })}
          <button onClick={() => setShowModal(true)}
            style={{width:'100%',padding:'7px',borderRadius:8,border:`1px dashed ${C.borderL}`,background:'transparent',color:C.muted,fontSize:11,cursor:'pointer',marginTop:4,fontWeight:600}}>
            + Novo Cliente
          </button>
        </div>

        <div style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`}}>
          <button onClick={() => load(true)} disabled={loading}
            style={{width:'100%',padding:'9px',borderRadius:9,border:`1px solid ${C.borderL}`,background:'transparent',color:loading?C.muted:C.mutedL,fontSize:12,cursor:loading?'default':'pointer',fontWeight:600}}>
            {loading ? 'Atualizando...' : 'Atualizar agora'}
          </button>
          {lastRefresh && (
            <div style={{fontSize:10,color:C.muted,textAlign:'center',marginTop:6}}>
              {lastRefresh.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,overflowY:'auto',padding:'36px 36px 80px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          {active === 'overview'  && <Overview  clients={clients} convos={convos} loading={loading} lastRefresh={lastRefresh} tick={tick}/>}
          {active === 'clientes'  && <Clientes  clients={clients} convos={convos} onSelectClient={id=>setFilterClient(id)} onGoTo={s=>setActive(s)} onNovoCliente={()=>setShowModal(true)}/>}
          {active === 'conversas' && <Conversas convos={convos} loading={loading} filterClient={filterClient} clients={clients}/>}
          {active === 'analytics' && <Analytics clients={clients} convos={convos} filterClient={filterClient}/>}
        </div>
      </div>
    </div>
  )
}
