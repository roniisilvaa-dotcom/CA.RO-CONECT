'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('prompt') // prompt | docs | convs
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [prompt, setPrompt] = useState('')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (!id) return
    fetch(`/api/caro-admin/client?id=${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setPrompt(d.tenant?.system_prompt || '')
        setAiEnabled(d.tenant?.ai_enabled ?? true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function handleSavePrompt() {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/caro-admin/client', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, system_prompt: prompt, ai_enabled: aiEnabled }),
      })
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setSaveMsg('✅ Salvo!')
    } catch (e) {
      setSaveMsg('❌ ' + e.message)
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('tenant_id', id)
      const res = await fetch('/api/train/knowledge', { method: 'POST', body: form })
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setUploadMsg(`✅ "${file.name}" adicionado — ${d.chunks} trechos indexados`)
      // Recarregar docs
      fetch(`/api/caro-admin/client?id=${id}`)
        .then(r => r.json())
        .then(d => setData(d))
    } catch (err) {
      setUploadMsg('❌ ' + err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDeleteDoc(docId) {
    if (!confirm('Remover este documento da base de conhecimento?')) return
    await fetch(`/api/caro-admin/client?docId=${docId}`, { method: 'DELETE' })
    setData(prev => ({ ...prev, docs: prev.docs.filter(d => d.id !== docId) }))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
      Carregando...
    </div>
  )

  if (!data?.tenant) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
      Cliente não encontrado.
    </div>
  )

  const { tenant, docs, stats, conversations } = data

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '0 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/caro-admin/clientes" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Clientes</Link>
            <span style={{ color: '#333' }}>/</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{tenant.name}</span>
            {/* Badges */}
            <span style={{
              background: tenant.coexistence_enabled ? '#0d2818' : '#1a1a1a',
              border: `1px solid ${tenant.coexistence_enabled ? '#25d366' : '#333'}`,
              color: tenant.coexistence_enabled ? '#25d366' : '#555',
              fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
            }}>
              📱 {tenant.coexistence_enabled ? 'Coexistence' : 'Sem celular'}
            </span>
            <span style={{
              background: aiEnabled ? '#1a0d2e' : '#1a1a1a',
              border: `1px solid ${aiEnabled ? '#667eea' : '#333'}`,
              color: aiEnabled ? '#a78bfa' : '#555',
              fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
            }}>
              🤖 {aiEnabled ? 'IA Ativa' : 'IA Off'}
            </span>
          </div>
          <Link href={`/admin?tenant=${id}`} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
            Ver painel →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 32px' }}>
        {/* Stats rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          <StatCard label="Conversas hoje" value={stats?.convs_today ?? 0} />
          <StatCard label="Total de conversas" value={stats?.convs_total ?? 0} />
          <StatCard label="Documentos IA" value={docs?.length ?? 0} color="#c9a96e" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111', borderRadius: 10, padding: 4 }}>
          {[
            { key: 'prompt', label: '🤖 Prompt da IA' },
            { key: 'docs', label: `📄 Documentos (${docs?.length ?? 0})` },
            { key: 'convs', label: `💬 Conversas (${stats?.convs_total ?? 0})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 16px', background: tab === t.key ? '#1a1a1a' : 'transparent',
              border: tab === t.key ? '1px solid #333' : '1px solid transparent',
              borderRadius: 8, color: tab === t.key ? '#fff' : '#666', fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROMPT ─────────────────────── */}
        {tab === 'prompt' && (
          <div>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Instruções da IA</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Como a IA deve se comportar, tom, informações do negócio, regras de atendimento.</div>
                </div>
                {/* Toggle IA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>IA</span>
                  <button onClick={() => setAiEnabled(!aiEnabled)} style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: aiEnabled ? '#667eea' : '#333',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}>
                    <span style={{
                      position: 'absolute', top: 2, left: aiEnabled ? 22 : 2,
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={14}
                placeholder="Você é a assistente virtual de [Nome do Negócio]. Atenda com cordialidade...&#10;&#10;Informações:&#10;- Horário: Segunda a sexta, 9h às 18h&#10;- Serviços: ...&#10;- Agendamentos: ..."
                style={{
                  width: '100%', background: '#0a0a0a', border: '1px solid #333',
                  color: '#fff', borderRadius: 10, padding: '14px 16px',
                  fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                  fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{prompt.length} caracteres · ~{Math.ceil(prompt.length / 4)} tokens</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{saveMsg}</span>}
                  <button onClick={handleSavePrompt} disabled={saving} style={{
                    background: '#c9a96e', color: '#000', border: 'none',
                    padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                  }}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Dicas */}
            <div style={{ background: '#0d1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>💡 Dicas para um bom prompt</div>
              <div style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.7 }}>
                • Defina o nome da IA e o negócio. Ex: "Você é a Fernanda, assistente da Clínica Mariah Zibetti."<br/>
                • Informe horários, serviços e preços disponíveis.<br/>
                • Diga o que fazer ao receber pedidos de agendamento.<br/>
                • Use os documentos da aba "Documentos" para complementar com PDFs detalhados.<br/>
                • A IA combina este prompt + os documentos enviados para responder.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: DOCUMENTOS ─────────────────── */}
        {tab === 'docs' && (
          <div>
            {/* Upload */}
            <div style={{ background: '#111', border: '2px dashed #333', borderRadius: 14, padding: 32, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Adicionar documento à base da IA</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
                PDF, TXT, ou MD. A IA vai aprender o conteúdo e usar nas respostas.
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleUpload}
                style={{ display: 'none' }}
                id="doc-upload"
              />
              <label htmlFor="doc-upload" style={{
                background: uploading ? '#333' : '#c9a96e', color: uploading ? '#666' : '#000',
                padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-block',
              }}>
                {uploading ? '⏳ Processando...' : '+ Enviar documento'}
              </label>

              {uploadMsg && (
                <div style={{
                  marginTop: 16, fontSize: 13, padding: '10px 16px', borderRadius: 8,
                  background: uploadMsg.startsWith('✅') ? '#0d2818' : '#2d1010',
                  color: uploadMsg.startsWith('✅') ? '#4ade80' : '#f87171',
                }}>
                  {uploadMsg}
                </div>
              )}
            </div>

            {/* Lista de docs */}
            {docs?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                Nenhum documento ainda. Envie um PDF ou TXT para treinar a IA deste cliente.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {docs.map(doc => (
                  <div key={doc.id} style={{
                    background: '#111', border: '1px solid #222', borderRadius: 10,
                    padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{doc.source_type === 'pdf' ? '📄' : '📝'}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{doc.title}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                          {doc.source_type?.toUpperCase()} · {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{ background: 'transparent', border: '1px solid #333', color: '#f87171', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CONVERSAS ─────────────────── */}
        {tab === 'convs' && (
          <div>
            {conversations?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
                Nenhuma conversa ainda para este cliente.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {conversations.map(c => (
                  <Link key={c.id} href={`/admin/conversations/${c.id}?tenant=${id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#111', border: '1px solid #222', borderRadius: 10,
                      padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                          📱 {c.customer_phone}
                        </div>
                        {c.last_message && (
                          <div style={{ fontSize: 12, color: '#888', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.last_message}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <StatusBadge status={c.status} />
                        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href={`/admin/conversations?tenant=${id}`} style={{ color: '#c9a96e', fontSize: 13, textDecoration: 'none' }}>
                Ver todas as conversas →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componentes auxiliares ──────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#fff' }}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    open: { label: 'Aberta', color: '#25d366', bg: '#0d2818' },
    waiting_human: { label: 'Aguardando', color: '#fbbf24', bg: '#2d2010' },
    closed: { label: 'Fechada', color: '#555', bg: '#1a1a1a' },
  }
  const s = map[status] || { label: status, color: '#888', bg: '#1a1a1a' }
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.color}`, color: s.color,
      fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
    }}>
      {s.label}
    </span>
  )
}
