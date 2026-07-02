'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CaroAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/caro-admin/stats')
      const data = await res.json()
      setStats(data.stats)
      setTenants(data.tenants)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #c9a96e, #8b6914)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>C</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.5px' }}>CA.RO TECH</div>
              <div style={{ fontSize: 11, color: '#888' }}>Painel da Agência</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/caro-admin/clientes" style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
              Clientes
            </Link>
            <Link href="/caro-admin/clientes/novo" style={{ background: '#c9a96e', color: '#000', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              + Novo Cliente
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Clientes Ativos', value: stats?.totalTenants ?? '—', icon: '🏢', color: '#c9a96e' },
            { label: 'Conversas Hoje', value: stats?.convsToday ?? '—', icon: '💬', color: '#25d366' },
            { label: 'Mensagens Hoje', value: stats?.msgsToday ?? '—', icon: '📨', color: '#667eea' },
            { label: 'IA Respondeu Hoje', value: stats?.aiToday ?? '—', icon: '🤖', color: '#f093fb' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Clients List */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Clientes</h2>
            <Link href="/caro-admin/clientes/novo" style={{ fontSize: 13, color: '#c9a96e', textDecoration: 'none' }}>
              + Conectar novo
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Carregando...</div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🏢</div>
              <div style={{ color: '#888', marginBottom: 8 }}>Nenhum cliente ainda</div>
              <Link href="/caro-admin/clientes/novo" style={{ color: '#c9a96e', textDecoration: 'none' }}>
                Conectar primeiro cliente →
              </Link>
            </div>
          ) : (
            <div>
              {tenants.map((t, i) => (
                <div key={t.id} style={{ padding: '16px 24px', borderBottom: i < tenants.length - 1 ? '1px solid #1a1a1a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, background: '#1a1a1a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {t.avatar || '🏢'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        {t.phone_number || 'Número não configurado'} · {t.channel_type || 'WhatsApp'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Coexistence badge */}
                    <div style={{
                      background: t.coexistence_enabled ? '#0d2818' : '#1a1a1a',
                      border: `1px solid ${t.coexistence_enabled ? '#25d366' : '#333'}`,
                      color: t.coexistence_enabled ? '#25d366' : '#555',
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600
                    }}>
                      📱 {t.coexistence_enabled ? 'Coexistence ON' : 'Sem celular'}
                    </div>
                    {/* IA badge */}
                    <div style={{
                      background: t.ai_enabled ? '#1a0d2e' : '#1a1a1a',
                      border: `1px solid ${t.ai_enabled ? '#667eea' : '#333'}`,
                      color: t.ai_enabled ? '#a78bfa' : '#555',
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600
                    }}>
                      🤖 {t.ai_enabled ? 'IA ON' : 'IA OFF'}
                    </div>
                    {/* Stats */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.convs_today ?? 0} conv.</div>
                      <div style={{ fontSize: 11, color: '#666' }}>hoje</div>
                    </div>
                    {/* Actions */}
                    <Link href={`/admin?tenant=${t.id}`} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 12 }}>
                      Ver Painel
                    </Link>
                    <Link href={`/caro-admin/clientes/${t.id}`} style={{ color: '#888', fontSize: 12, textDecoration: 'none' }}>
                      ⚙️
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
