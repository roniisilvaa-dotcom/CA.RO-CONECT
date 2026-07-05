'use client'

import { useState, useEffect } from 'react'

const WA_COLOR = '#25D366'
const IG_COLOR = '#E1306C'

export default function AnalyticsPage() {
  const [data, setData]       = useState(null)
  const [tenants, setTenants] = useState([])
  const [filter, setFilter]   = useState({ tenantId: '', days: '7' })
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ days: filter.days })
    if (filter.tenantId) params.set('tenantId', filter.tenantId)

    const [aRes, tRes] = await Promise.all([
      fetch(`/api/caro-admin/analytics?${params}`),
      fetch('/api/caro-admin/tenants')
    ])
    const aData = await aRes.json()
    if (tRes.ok) {
      const tData = await tRes.json()
      setTenants(tData.tenants || [])
    }
    setData(aData)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  // ─── derived values ───
  const totals    = data?.totals    || {}
  const byDay     = data?.byDay     || []
  const byChannel = data?.byChannel || []
  const byTenant  = data?.byTenant  || []
  const respTime  = data?.responseTime || {}

  // API returns: total_messages, user_messages, ai_messages, active_conversations, active_days
  const totalMsgs = totals.total_messages       || 0
  const userMsgs  = totals.user_messages        || 0
  const aiMsgs    = totals.ai_messages          || 0
  const activeCvs = totals.active_conversations || 0
  const aiRate    = totalMsgs > 0 ? Math.round((aiMsgs / totalMsgs) * 100) : 0

  // byDay: date, total, received, sent
  const maxDay = Math.max(...byDay.map(d => d.total || 0), 1)

  const sStyle = {
    background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6,
    color:'#fff', padding:'6px 10px', fontSize:12, fontFamily:'inherit', outline:'none'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', color:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Top bar */}
      <div style={{ padding:'14px 24px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:12, background:'#0d0d0d' }}>
        <a href="/caro-admin" style={{ color:'#555', textDecoration:'none', fontSize:18 }}>←</a>
        <div style={{ fontWeight:700, fontSize:15 }}>📈 Analytics</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <select value={filter.tenantId} onChange={e => setFilter(f => ({ ...f, tenantId: e.target.value }))} style={sStyle}>
            <option value="">Todos os clientes</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filter.days} onChange={e => setFilter(f => ({ ...f, days: e.target.value }))} style={sStyle}>
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <button onClick={load} style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6, color:'#888', padding:'6px 14px', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>↺</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#555', fontSize:14 }}>Carregando analytics...</div>
      ) : (
        <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>

          {/* KPI cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <KPI icon="💬" label="Mensagens (período)" value={totalMsgs}       sub={`${userMsgs} recebidas`}           color="#7C3AED" />
            <KPI icon="🤖" label="Enviadas pela IA"     value={aiMsgs}          sub={`${aiRate}% de automação`}          color="#D4AF37" />
            <KPI icon="🗂️" label="Conversas ativas"     value={activeCvs}       sub={`${totals.active_days||0} dias ativos`} color="#2563EB" />
            <KPI icon="⚡" label="Tempo médio resposta"  value={respTime.avg_minutes != null ? `${respTime.avg_minutes}min` : '—'} sub="IA → usuário" color="#059669" />
          </div>

          {/* Bar chart - mensagens por dia */}
          <div style={{ background:'#111', borderRadius:12, padding:20, border:'1px solid #1a1a1a', marginBottom:24 }}>
            <div style={{ fontSize:11, color:'#666', fontWeight:600, marginBottom:16, letterSpacing:'0.06em' }}>
              VOLUME DE MENSAGENS — ÚLTIMOS {filter.days} DIAS
            </div>
            {byDay.length === 0 ? (
              <div style={{ color:'#333', fontSize:13, textAlign:'center', padding:24 }}>Sem dados para o período</div>
            ) : (
              <>
                <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:140 }}>
                  {byDay.map((day, i) => (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <div style={{ fontSize:9, color:'#444', marginBottom:2 }}>{day.total || 0}</div>
                      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:1 }}>
                        {/* sent = IA (assistant), received = user */}
                        <div style={{ width:'100%', height:`${Math.max(((day.sent||0)/maxDay)*110, day.sent ? 3 : 0)}px`, background:'#D4AF37', borderRadius:'2px 2px 0 0', transition:'height 0.3s' }} />
                        <div style={{ width:'100%', height:`${Math.max(((day.received||0)/maxDay)*110, day.received ? 3 : 0)}px`, background:'#7C3AED', transition:'height 0.3s' }} />
                      </div>
                      <div style={{ fontSize:9, color:'#444', marginTop:2 }}>
                        {new Date(day.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:16, marginTop:12 }}>
                  <LegendItem color="#7C3AED" label="Recebidas (usuário)" />
                  <LegendItem color="#D4AF37" label="Enviadas pela IA" />
                </div>
              </>
            )}
          </div>

          {/* By channel + By tenant */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>

            {/* Channels */}
            <div style={{ background:'#111', borderRadius:12, padding:20, border:'1px solid #1a1a1a' }}>
              <div style={{ fontSize:11, color:'#666', fontWeight:600, marginBottom:16, letterSpacing:'0.06em' }}>POR CANAL</div>
              {byChannel.length === 0 ? (
                <div style={{ color:'#333', fontSize:13 }}>Sem dados</div>
              ) : byChannel.map(ch => {
                const clr   = ch.channel === 'instagram' ? IG_COLOR : WA_COLOR
                const total = ch.conversations || 0
                const open  = ch.open || 0
                const msgs  = ch.messages || 0
                return (
                  <div key={ch.channel} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                      <span style={{ color: clr, fontWeight:600 }}>
                        {ch.channel === 'instagram' ? '📷' : '💬'} {ch.channel === 'instagram' ? 'Instagram' : 'WhatsApp'}
                      </span>
                      <span style={{ color:'#888' }}>{total} conv. · {msgs} msgs</span>
                    </div>
                    <div style={{ background:'#1a1a1a', height:6, borderRadius:3 }}>
                      <div style={{ width: total > 0 ? `${Math.round((open/total)*100)}%` : '0%', height:'100%', background: clr, borderRadius:3, transition:'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize:10, color:'#555', marginTop:3 }}>{open} abertas de {total}</div>
                  </div>
                )
              })}
            </div>

            {/* Response time & stats */}
            <div style={{ background:'#111', borderRadius:12, padding:20, border:'1px solid #1a1a1a' }}>
              <div style={{ fontSize:11, color:'#666', fontWeight:600, marginBottom:16, letterSpacing:'0.06em' }}>ESTATÍSTICAS DO PERÍODO</div>
              <StatRow label="Total de mensagens"       value={totalMsgs} color="#fff" />
              <StatRow label="Recebidas (usuários)"     value={userMsgs}  color="#7C3AED" />
              <StatRow label="Enviadas pela IA"          value={aiMsgs}    color="#D4AF37" />
              <StatRow label="Taxa de automação"         value={`${aiRate}%`} color={aiRate > 70 ? '#059669' : aiRate > 40 ? '#D4AF37' : '#DC2626'} />
              <StatRow label="Conversas ativas"          value={activeCvs} color="#2563EB" />
              <StatRow label="Dias com atividade"        value={totals.active_days || 0} color="#888" />
              <StatRow label="Tempo médio de resposta"   value={respTime.avg_minutes != null ? `${respTime.avg_minutes}min` : '—'} color="#059669" />
            </div>
          </div>

          {/* By tenant table */}
          {byTenant.length > 0 && (
            <div style={{ background:'#111', borderRadius:12, padding:20, border:'1px solid #1a1a1a' }}>
              <div style={{ fontSize:11, color:'#666', fontWeight:600, marginBottom:16, letterSpacing:'0.06em' }}>POR CLIENTE</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ color:'#555', textAlign:'left' }}>
                    <th style={{ padding:'6px 0', fontWeight:500 }}>Cliente</th>
                    <th style={{ padding:'6px 0', fontWeight:500, textAlign:'right' }}>Conversas</th>
                    <th style={{ padding:'6px 0', fontWeight:500, textAlign:'right' }}>Mensagens</th>
                    <th style={{ padding:'6px 0', fontWeight:500, textAlign:'right' }}>Recebidas</th>
                    <th style={{ padding:'6px 0', fontWeight:500, textAlign:'right' }}>IA enviou</th>
                    <th style={{ padding:'6px 0', fontWeight:500, textAlign:'right' }}>Taxa IA</th>
                  </tr>
                </thead>
                <tbody>
                  {byTenant.map(t => {
                    // API returns: id, name, slug, status, conversations, messages, received, sent
                    const rate = (t.messages || 0) > 0 ? Math.round(((t.sent||0) / t.messages) * 100) : 0
                    return (
                      <tr key={t.id} style={{ borderTop:'1px solid #1a1a1a' }}>
                        <td style={{ padding:'10px 0' }}>
                          <div style={{ fontWeight:500 }}>{t.name}</div>
                          <div style={{ fontSize:11, color: t.status === 'active' ? '#059669' : '#DC2626' }}>● {t.status}</div>
                        </td>
                        <td style={{ padding:'10px 0', textAlign:'right', color:'#7C3AED' }}>{t.conversations || 0}</td>
                        <td style={{ padding:'10px 0', textAlign:'right', color:'#2563EB' }}>{t.messages || 0}</td>
                        <td style={{ padding:'10px 0', textAlign:'right', color:'#888' }}>{t.received || 0}</td>
                        <td style={{ padding:'10px 0', textAlign:'right', color:'#D4AF37' }}>{t.sent || 0}</td>
                        <td style={{ padding:'10px 0', textAlign:'right' }}>
                          <span style={{ color: rate > 70 ? '#059669' : rate > 40 ? '#D4AF37' : '#DC2626', fontWeight:600 }}>{rate}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KPI({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:'#111', borderRadius:12, padding:'18px 20px', border:'1px solid #1a1a1a' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ fontSize:10, color:'#666', letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize:34, fontWeight:800, color, lineHeight:1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize:11, color:'#555', marginTop:6 }}>{sub}</div>}
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#666' }}>
      <div style={{ width:10, height:10, background: color, borderRadius:2 }} />
      {label}
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #1a1a1a' }}>
      <span style={{ fontSize:12, color:'#666' }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:700, color }}>{value}</span>
    </div>
  )
}
