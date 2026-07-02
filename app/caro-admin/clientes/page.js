'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ClientesPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/caro-admin/stats')
      .then(r => r.json())
      .then(d => { setTenants(d.tenants || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '0 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/caro-admin" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
            <span style={{ color: '#333' }}>/</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Clientes</span>
          </div>
          <Link href="/caro-admin/clientes/novo" style={{ background: '#c9a96e', color: '#000', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            + Novo Cliente
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>Carregando...</div>
        ) : tenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <div style={{ color: '#888', marginBottom: 20 }}>Nenhum cliente cadastrado ainda.</div>
            <Link href="/caro-admin/clientes/novo" style={{ background: '#c9a96e', color: '#000', padding: '12px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
              + Conectar primeiro cliente
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {tenants.map(t => (
              <div key={t.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, background: '#1a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🏢
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{t.name}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#666' }}>/{t.slug}</span>
                      {t.phone_number && (
                        <span style={{ fontSize: 12, color: '#888' }}>· {t.phone_number}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Badges */}
                  <span style={{
                    background: t.coexistence_enabled ? '#0d2818' : '#1a1a1a',
                    border: `1px solid ${t.coexistence_enabled ? '#25d366' : '#333'}`,
                    color: t.coexistence_enabled ? '#25d366' : '#555',
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600
                  }}>
                    📱 {t.coexistence_enabled ? 'Coexistence' : 'Sem celular'}
                  </span>
                  <span style={{
                    background: t.ai_enabled ? '#1a0d2e' : '#1a1a1a',
                    border: `1px solid ${t.ai_enabled ? '#667eea' : '#333'}`,
                    color: t.ai_enabled ? '#a78bfa' : '#555',
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600
                  }}>
                    🤖 {t.ai_enabled ? 'IA Ativa' : 'IA Off'}
                  </span>

                  {/* Conv count */}
                  <div style={{ textAlign: 'center', minWidth: 50 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#c9a96e' }}>{t.convs_today ?? 0}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>hoje</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/admin?tenant=${t.id}`} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '7px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>
                      Ver Painel
                    </Link>
                    <Link href={`/caro-admin/clientes/${t.id}`} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '7px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
                      ⚙️
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
