'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('prompt')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [prompt, setPrompt] = useState('')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef()

  // Portal state
  const [portalToken, setPortalToken] = useState(null)
  const [portalUrl, setPortalUrl] = useState(null)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [tokenMsg, setTokenMsg] = useState('')
  const [copied, setCopied] = useState(false)

  // Instagram automation settings
  const [igSettings, setIgSettings] = useState({
    dm_ai_enabled: true,
    welcome_followers_enabled: false,
    welcome_message: 'Olá! Que bom ter você aqui 🤍 Se quiser conhecer mais sobre o meu trabalho, estou à disposição!',
    comment_reply_enabled: false,
    comment_reply_mode: 'invite_dm', // 'invite_dm' | 'direct_reply'
  })
  const [savingIg, setSavingIg] = useState(false)
  const [igMsg, setIgMsg] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/caro-admin/client?id=${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setPrompt(d.tenant?.system_prompt || '')
        setAiEnabled(d.tenant?.ai_enabled ?? true)
        if (d.tenant?.access_token) {
          setPortalToken(d.tenant.access_token)
          const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://caro-connect-next.vercel.app'
          setPortalUrl(`${base}/portal/${d.tenant.access_token}`)
        }
        if (d.tenant?.instagram_settings) {
          try {
            const s = typeof d.tenant.instagram_settings === 'string'
              ? JSON.parse(d.tenant.instagram_settings)
              : d.tenant.instagram_settings
            setIgSettings(prev => ({ ...prev, ...s }))
          } catch {}
        }
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
      fetch(`/api/caro-admin/client?id=${id}`).then(r => r.json()).then(d => setData(d))
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

  async function handleGenerateToken() {
    setGeneratingToken(true)
    setTokenMsg('')
    try {
      const res = await fetch('/api/caro-admin/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: id }),
      })
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setPortalToken(d.token)
      setPortalUrl(d.portalUrl)
      setTokenMsg('✅ Token gerado! Compartilhe o link abaixo com a cliente.')
    } catch (e) {
      setTokenMsg('❌ ' + e.message)
    } finally {
      setGeneratingToken(false)
    }
  }

  async function handleCopyUrl() {
    if (!portalUrl) return
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveIgSettings() {
    setSavingIg(true)
    setIgMsg('')
    try {
      const res = await fetch('/api/caro-admin/instagram-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: id, settings: igSettings }),
      })
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setIgMsg('✅ Configurações salvas!')
    } catch (e) {
      setIgMsg('❌ ' + e.message)
    } finally {
      setSavingIg(false)
      setTimeout(() => setIgMsg(''), 3000)
    }
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

  const TABS = [
    { key: 'prompt', label: '🤖 Prompt da IA' },
    { key: 'docs', label: `📄 Docs (${docs?.length ?? 0})` },
    { key: 'instagram', label: '📷 Instagram' },
    { key: 'convs', label: `💬 Conversas (${stats?.convs_total ?? 0})` },
    { key: 'portal', label: '🔗 Portal' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '0 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/caro-admin/clientes" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Clientes</Link>
            <span style={{ color: '#333' }}>/</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{tenant.name}</span>
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
            {portalToken && (
              <span style={{ background: '#1a1000', border: '1px solid #D4AF37', color: '#D4AF37', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                🔗 Portal Ativo
              </span>
            )}
          </div>
          <Link href={`/admin?tenant=${id}`} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
            Ver painel →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 32px' }}>
        {/* Stats rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          <StatCard label="Conversas hoje" value={stats?.convs_today ?? 0} />
          <StatCard label="Total de conversas" value={stats?.convs_total ?? 0} />
          <StatCard label="Documentos IA" value={docs?.length ?? 0} color="#c9a96e" />
          <StatCard label="Portal" value={portalToken ? 'Ativo' : 'Inativo'} color={portalToken ? '#D4AF37' : '#555'} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111', borderRadius: 10, padding: 4, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 14px', background: tab === t.key ? '#1a1a1a' : 'transparent',
              border: tab === t.key ? '1px solid #333' : '1px solid transparent',
              borderRadius: 8, color: tab === t.key ? '#fff' : '#666', fontSize: 12,
              fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: PROMPT */}
        {tab === 'prompt' && (
          <div>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Instruções da IA</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Tom, regras, informações do negócio e protocolo de atendimento.</div>
                </div>
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
            <div style={{ background: '#0d1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>💡 Dicas para um bom prompt</div>
              <div style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.7 }}>
                • Defina o nome da IA e o negócio. Ex: "Você é a Fernanda, assistente da Clínica Mariah."<br/>
                • Informe horários, serviços e preços disponíveis.<br/>
                • Diga o que fazer ao receber pedidos de agendamento.<br/>
                • Use a aba "Docs" para complementar com PDFs detalhados.
              </div>
            </div>
          </div>
        )}

        {/* TAB: DOCUMENTOS */}
        {tab === 'docs' && (
          <div>
            <div style={{ background: '#111', border: '2px dashed #333', borderRadius: 14, padding: 32, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Adicionar documento à base da IA</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>PDF, TXT, ou MD. A IA vai aprender o conteúdo e usar nas respostas.</div>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.md" onChange={handleUpload} style={{ display: 'none' }} id="doc-upload" />
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
            {docs?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>Nenhum documento ainda.</div>
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
                    <button onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'transparent', border: '1px solid #333', color: '#f87171', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: INSTAGRAM */}
        {tab === 'instagram' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📷 Automação Instagram</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 24 }}>Configure como a IA vai atuar no Instagram deste cliente.</div>

              <ToggleRow
                icon="💬"
                title="Responder Direct Messages (DMs)"
                desc="A IA responde automaticamente toda mensagem recebida no Direct do Instagram."
                value={igSettings.dm_ai_enabled}
                onChange={v => setIgSettings(s => ({ ...s, dm_ai_enabled: v }))}
              />

              <div style={{ height: 1, background: '#1a1a1a', margin: '16px 0' }} />

              <ToggleRow
                icon="👥"
                title="Mensagem de boas-vindas para novos seguidores"
                desc="Quando alguém seguir o perfil, a IA envia uma DM de boas-vindas automaticamente."
                value={igSettings.welcome_followers_enabled}
                onChange={v => setIgSettings(s => ({ ...s, welcome_followers_enabled: v }))}
              />
              {igSettings.welcome_followers_enabled && (
                <div style={{ marginTop: 12, marginLeft: 52 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Mensagem enviada:</div>
                  <textarea
                    value={igSettings.welcome_message}
                    onChange={e => setIgSettings(s => ({ ...s, welcome_message: e.target.value }))}
                    rows={3}
                    maxLength={900}
                    style={{
                      width: '100%', background: '#0a0a0a', border: '1px solid #333',
                      color: '#fff', borderRadius: 8, padding: '10px 12px',
                      fontSize: 13, lineHeight: 1.5, resize: 'vertical',
                      fontFamily: 'system-ui, sans-serif', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{igSettings.welcome_message?.length}/900 caracteres</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>⚠️ Requer permissão <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: 3 }}>instagram_manage_messages</code> + webhook <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: 3 }}>follows</code> ativado no app Meta.</div>
                </div>
              )}

              <div style={{ height: 1, background: '#1a1a1a', margin: '16px 0' }} />

              <ToggleRow
                icon="💬"
                title="Interagir nos comentários dos posts"
                desc="A IA responde comentários nos posts do Instagram."
                value={igSettings.comment_reply_enabled}
                onChange={v => setIgSettings(s => ({ ...s, comment_reply_enabled: v }))}
              />
              {igSettings.comment_reply_enabled && (
                <div style={{ marginTop: 12, marginLeft: 52 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Como a IA responde:</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setIgSettings(s => ({ ...s, comment_reply_mode: 'invite_dm' }))}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid',
                        borderColor: igSettings.comment_reply_mode === 'invite_dm' ? '#E1306C' : '#333',
                        background: igSettings.comment_reply_mode === 'invite_dm' ? '#2d0d17' : '#1a1a1a',
                        color: igSettings.comment_reply_mode === 'invite_dm' ? '#E1306C' : '#666',
                        cursor: 'pointer', fontSize: 12, fontFamily: 'inherit'
                      }}
                    >
                      📩 Convidar para o Direct
                    </button>
                    <button
                      onClick={() => setIgSettings(s => ({ ...s, comment_reply_mode: 'direct_reply' }))}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid',
                        borderColor: igSettings.comment_reply_mode === 'direct_reply' ? '#E1306C' : '#333',
                        background: igSettings.comment_reply_mode === 'direct_reply' ? '#2d0d17' : '#1a1a1a',
                        color: igSettings.comment_reply_mode === 'direct_reply' ? '#E1306C' : '#666',
                        cursor: 'pointer', fontSize: 12, fontFamily: 'inherit'
                      }}
                    >
                      💬 Responder no comentário
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>⚠️ Requer permissão <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: 3 }}>instagram_manage_comments</code></div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {igMsg && <span style={{ fontSize: 13, color: igMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{igMsg}</span>}
              <button onClick={handleSaveIgSettings} disabled={savingIg} style={{
                background: '#E1306C', color: '#fff', border: 'none',
                padding: '11px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: savingIg ? 'not-allowed' : 'pointer', opacity: savingIg ? 0.7 : 1,
              }}>
                {savingIg ? 'Salvando...' : '💾 Salvar configurações Instagram'}
              </button>
            </div>

            <div style={{ background: '#1a1000', border: '1px solid #D4AF3740', borderRadius: 10, padding: 16, fontSize: 12, color: '#D4AF37', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>📋 Checklist de permissões Meta</div>
              <div>☐ webhook field <code style={{ background: '#2a1a00', padding: '1px 4px', borderRadius: 3 }}>messages</code> ativado (DMs)</div>
              <div>☐ Para seguidores: webhook <code style={{ background: '#2a1a00', padding: '1px 4px', borderRadius: 3 }}>follows</code> + permissão <code style={{ background: '#2a1a00', padding: '1px 4px', borderRadius: 3 }}>instagram_manage_messages</code></div>
              <div>☐ Para comentários: webhook <code style={{ background: '#2a1a00', padding: '1px 4px', borderRadius: 3 }}>comments</code> + permissão <code style={{ background: '#2a1a00', padding: '1px 4px', borderRadius: 3 }}>instagram_manage_comments</code></div>
            </div>
          </div>
        )}

        {/* TAB: CONVERSAS */}
        {tab === 'convs' && (
          <div>
            {conversations?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>Nenhuma conversa ainda para este cliente.</div>
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
                          {c.channel?.includes('instagram') ? '📷' : '💬'} {c.customer_phone || c.customer_name || 'Contato'}
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

        {/* TAB: PORTAL */}
        {tab === 'portal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🔗 Portal do Cliente</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 24 }}>
                Gere um link exclusivo para {tenant.name} acessar o painel de BI com dados de conversas, leads e performance da IA.
              </div>

              {portalToken ? (
                <div>
                  <div style={{ background: '#0d1a00', border: '1px solid #25D366', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#25D366', fontWeight: 600, marginBottom: 8 }}>✅ Portal ativo — link de acesso:</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ flex: 1, fontSize: 12, color: '#aaa', background: '#0a0a0a', padding: '8px 12px', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {portalUrl}
                      </code>
                      <button onClick={handleCopyUrl} style={{
                        background: copied ? '#25D366' : '#1a1a1a', color: copied ? '#000' : '#ccc',
                        border: '1px solid #333', padding: '8px 14px', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit'
                      }}>
                        {copied ? '✅ Copiado!' : '📋 Copiar'}
                      </button>
                    </div>
                  </div>

                  <div style={{ background: '#1a1a1a', borderRadius: 10, padding: 14, fontSize: 12, color: '#777', lineHeight: 1.7, marginBottom: 16 }}>
                    <strong style={{ color: '#999' }}>Como funciona:</strong><br/>
                    • O link não expira — mas você pode gerar um novo a qualquer momento<br/>
                    • Ao gerar um novo token, o link anterior para de funcionar<br/>
                    • {tenant.name} acessa o painel com dados em tempo real sem precisar de login
                  </div>

                  <button onClick={handleGenerateToken} disabled={generatingToken} style={{
                    background: 'transparent', color: '#888', border: '1px solid #333',
                    padding: '9px 18px', borderRadius: 8, fontSize: 13,
                    cursor: generatingToken ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
                  }}>
                    {generatingToken ? '⏳ Gerando...' : '🔄 Gerar novo token (invalida o atual)'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{tenant.name} ainda não tem acesso ao portal</div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
                      Gere um link exclusivo para ela ver os dados de desempenho da IA.
                    </div>
                    <button onClick={handleGenerateToken} disabled={generatingToken} style={{
                      background: '#D4AF37', color: '#000', border: 'none',
                      padding: '13px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                      cursor: generatingToken ? 'not-allowed' : 'pointer', opacity: generatingToken ? 0.7 : 1,
                    }}>
                      {generatingToken ? '⏳ Gerando...' : '✨ Gerar link de acesso'}
                    </button>
                  </div>
                </div>
              )}

              {tokenMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 13,
                  background: tokenMsg.startsWith('✅') ? '#0d2818' : '#2d1010',
                  color: tokenMsg.startsWith('✅') ? '#4ade80' : '#f87171',
                }}>
                  {tokenMsg}
                </div>
              )}
            </div>

            {portalUrl && (
              <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Preview do portal do cliente</div>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#D4AF37', textDecoration: 'none' }}>
                    Abrir portal →
                  </a>
                </div>
                <iframe
                  src={portalUrl}
                  style={{ width: '100%', height: 400, border: 'none', display: 'block' }}
                  title="Portal do cliente"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ icon, title, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? '#E1306C' : '#333',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          flexShrink: 0
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

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
