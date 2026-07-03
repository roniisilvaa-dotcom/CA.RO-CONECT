'use client'

import { useState, useEffect } from 'react'

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [tenants, setTenants] = useState([])
  const [filter, setFilter] = useState({ tenantId: '', days: '7' })
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ days: filter.days })
    if (filter.tenantId) params.set('tenantId', filter.tenantId)

    const [analyticsRes, tenantsRes] = await Promise.all([
      fetch(`/api/caro-admin/analytics?${params}`),
      fetch('/api/caro-admin/tenants')
    ])
    const analyticsData = await analyticsRes.json()
    if (tenantsRes.ok) {
      const t = await tenantsRes.json()
      setTenants(t.tenants || [])
    }
    setData(analyticsData)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const totals = data?.totals || {}
  const byDay = data?.byDay || []
  const byChannel = data?.byChannel || []
  const topLeads = data?.topLeads || []
  const byTenant = data?.byTenant || []
  const maxDay = Math.max(...byDay.map(d => d.total), 1)
  const aiRate = totals.total_messages > 0
    ? Math.round((totals.ai_messages / totals.total_messages) * 100) : 0

  const KPI = ({ label, value, sub, color = '#fff', icon }) => (
    <div style={{ background: '#111', borderRadius: 12, padding: '18px 20px', border: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, color: '#666', letterSpacing: '0.05em' }}>{label.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/caro-admin" style={{ color: '#555', textDecoration: 'none', fontSize: 20 }}>←</a>
        <div style={{ fontWeight: 700, fontSize: 16 }}>📈 Analytics</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select value={filter.tenantId} onChange={e => setFilter(f => ({ ...f, tenantId: e.target.value }))}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 12, fontFamily: 'inherit' }}>
            <option value="">Todos os clientes</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filter.days} onChange={e => setFilter(f => ({ ...f, days: e.target.value }))}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 12, fontFamily: 'inherit' }}>
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#555' }}>Carregando analytics...</div>
      ) : (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            <KPI icon="💬" label="Total conversas" value={totals.total_conversations} sub={`${totals.open_conversations} abertas`} color="#7C3AED" />
            <KPI icon="📨" label="Total mensagens" value={totals.total_messages} sub={`${totals.messages_today} hoje`} color="#2563EB" />
            <KPI icon="🤖" label="Enviadas pela IA" value={totals.ai_messages} sub={`${totals.ai_messages_today} hoje`} color="#D4AF37" />
            <KPI icon="⚡" label="Taxa da IA" value={`${aiRate}%`} sub="mensagens automáticas" color="#059669" />
          </div>

          <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #1a1a1a', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em' }}>
              VOLUME DE MENSAGENS — ÚLTIMOS {filter.days} DIAS
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120 }}>
              {byDay.length > 0 ? byDay.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 2 }}>{day.total}</div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ width: '100%', height: `${Math.max((day.outbound / maxDay) * 100, 2)}px`, background: '#D4AF37', borderRadius: '2px 2px 0 0' }} />
                    <div style={{ width: '100%', height: `${Math.max((day.inbound / maxDay) * 100, 2)}px`, background: '#7C3AED' }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#444' }}>{day.date}</div>
                </div>
              )) : <div style={{ color: '#444', fontSize: 13, margin: 'auto' }}>Sem dados disponíveis</div>}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666' }}>
                <div style={{ width: 10, height: 10, background: '#7C3AED', borderRadius: 2 }} /> Recebidas
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666' }}>
                <div style={{ width: 10, height: 10, background: '#D4AF37', borderRadius: 2 }} /> IA enviou
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em' }}>POR CANAL</div>
              {byChannel.map(ch => (
                <div key={ch.channel} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: ch.channel === 'instagram' ? '#E1306C' : '#25D366' }}>
                      {ch.channel === 'instagram' ? '📷' : '💬'} {ch.channel}
                    </span>
                    <span style={{ color: '#999' }}>{ch.total} conversas</span>
                  </div>
                  <div style={{ background: '#1a1a1a', height: 6, borderRadius: 3 }}>
                    <div style={{ width: `${Math.round((ch.open / Math.max(ch.total, 1)) * 100)}%`, height: '100%', background: ch.channel === 'instagram' ? '#E1306C' : '#25D366', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{ch.open} abertas · {ch.ai_on} com IA ativa</div>
                </div>
              ))}
              {byChannel.length === 0 && <div style={{ color: '#444', fontSize: 12 }}>Sem dados</div>}
            </div>

            <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em' }}>TOP LEADS (POR SCORE)</div>
              {topLeads.map(lead => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.name || lead.phone || 'Desconhecido'}
                    </div>
                    <div style={{ fontSize: 10, color: '#555' }}>{lead.tenant_name} · {lead.conv_count} conv.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: n <= lead.score ? '#D4AF37' : '#2a2a2a' }} />
                    ))}
                  </div>
                </div>
              ))}
              {topLeads.length === 0 && <div style={{ color: '#444', fontSize: 12 }}>Nenhum lead com score</div>}
            </div>
          </div>

          {byTenant.length > 0 && (
            <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em' }}>POR CLIENTE</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#555', textAlign: 'left' }}>
                    <th style={{ padding: '6px 0', fontWeight: 500 }}>Cliente</th>
                    <th style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>Conversas</th>
                    <th style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>Mensagens</th>
                    <th style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>IA enviou</th>
                    <th style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>Taxa IA</th>
                  </tr>
                </thead>
                <tbody>
                  {byTenant.map(t => {
                    const rate = t.messages > 0 ? Math.round((t.ai_messages / t.messages) * 100) : 0
                    return (
                      <tr key={t.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                        <td style={{ padding: '10px 0' }}>
                          <div style={{ fontWeight: 500 }}>{t.name}</div>
                          {t.business_name && <div style={{ fontSize: 11, color: '#555' }}>{t.business_name}</div>}
                        </td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: '#7C3AED' }}>{t.conversations}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: '#2563EB' }}>{t.messages}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: '#D4AF37' }}>{t.ai_messages}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right' }}>
                          <span style={{ color: rate > 70 ? '#059669' : rate > 40 ? '#D4AF37' : '#DC2626', fontWeight: 600 }}>{rate}%</span>
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
