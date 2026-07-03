'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NovoClientePage() {
  const router = useRouter()
  const [step, setStep] = useState('info') // info → connect → done
  const [form, setForm] = useState({ name: '', slug: '', email: '', systemPrompt: '' })
  const [connecting, setConnecting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [fbLoaded, setFbLoaded] = useState(false)

  // Instagram state
  const [igUserId, setIgUserId] = useState('')
  const [igSaving, setIgSaving] = useState(false)
  const [igSaved, setIgSaved] = useState(false)
  const [igError, setIgError] = useState('')

  // Carregar Meta SDK
  useEffect(() => {
    if (window.FB) { setFbLoaded(true); return }
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v19.0',
      })
      setFbLoaded(true)
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  function handleInfoSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.slug) { setError('Nome e identificador são obrigatórios'); return }
    setError('')
    setStep('connect')
  }

  async function handleEmbeddedSignup() {
    if (!fbLoaded || !window.FB) {
      setError('SDK do Meta ainda carregando. Aguarde um momento.')
      return
    }
    setConnecting(true)
    setError('')

    window.FB.login(
      async function (response) {
        if (!response.authResponse?.code) {
          setConnecting(false)
          setError('Conexão cancelada ou negada. Tente novamente.')
          return
        }

        try {
          const res = await fetch('/api/embedded-signup/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: response.authResponse.code,
              tenantName: form.name,
              tenantSlug: form.slug,
              tenantEmail: form.email,
              systemPrompt: form.systemPrompt,
            }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          setResult(data)
          setStep('done')
        } catch (err) {
          setError(err.message)
        } finally {
          setConnecting(false)
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          featuretype: 'coexistence',
          sessioninfoversion: 2,
          setup: {},
        },
      }
    )
  }

  async function handleConnectInstagram() {
    if (!igUserId.trim()) { setIgError('Digite o ID numérico do Instagram Business'); return }
    setIgSaving(true)
    setIgError('')
    try {
      const res = await fetch('/api/caro-admin/instagram-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: result?.tenantId, igUserId: igUserId.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setIgSaved(true)
    } catch (err) {
      setIgError(err.message)
    } finally {
      setIgSaving(false)
    }
  }

  // ── Passo 1: Informações do cliente ──
  if (step === 'info') {
    return (
      <PageLayout title="Novo Cliente" subtitle="Preencha os dados do cliente">
        <form onSubmit={handleInfoSubmit}>
          <Field label="Nome do cliente *" hint="Ex: Clínica Camila Rocha">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Clínica Dr. João Silva"
              style={inputStyle}
            />
          </Field>
          <Field label="Identificador (slug) *" hint="Usado na URL. Sem espaços. Ex: drjoao">
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              placeholder="drjoao"
              style={inputStyle}
            />
          </Field>
          <Field label="E-mail do cliente" hint="Para notificações">
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="contato@clinica.com"
              style={inputStyle}
            />
          </Field>
          <Field label="Prompt da IA" hint="Instruções do assistente para este cliente. Pode editar depois.">
            <textarea
              value={form.systemPrompt}
              onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
              placeholder="Você é o assistente virtual da Clínica Dr. João Silva. Atenda com cordialidade, tire dúvidas sobre agendamentos e serviços..."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button type="submit" style={btnPrimaryStyle}>
            Próximo: Conectar WhatsApp →
          </button>
        </form>
      </PageLayout>
    )
  }

  // ── Passo 2: Embedded Signup ──
  if (step === 'connect') {
    return (
      <PageLayout title={`Conectar WhatsApp — ${form.name}`} subtitle="O cliente mantém o WhatsApp no celular">
        <div style={{ background: '#0d1f0d', border: '1px solid #1e4d1e', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>✅ Coexistence Ativado</div>
          <div style={{ color: '#86efac', fontSize: 14, lineHeight: 1.6 }}>
            Com este método, o WhatsApp Business do cliente <strong>continua funcionando normalmente no celular</strong>. A plataforma e o celular ficam sincronizados em tempo real.
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#ccc', fontSize: 14, marginBottom: 12 }}>Como funciona:</h3>
          {[
            { n: '1', t: 'O cliente abre o WhatsApp Business no celular' },
            { n: '2', t: 'Clica no botão abaixo e faz login com o Facebook da empresa' },
            { n: '3', t: 'Escaneia o QR code com o WhatsApp Business' },
            { n: '4', t: 'Pronto — número conectado, IA ativada, celular funcionando' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, background: '#25d366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                {s.n}
              </div>
              <div style={{ color: '#ccc', fontSize: 14, paddingTop: 2 }}>{s.t}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#888' }}>
          ⚠️ O número precisa estar no <strong style={{ color: '#ccc' }}>WhatsApp Business</strong> (não pessoal). Se for pessoal, migre primeiro no app.
        </div>

        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16, background: '#2d1010', padding: 12, borderRadius: 8 }}>{error}</div>}

        <button
          onClick={handleEmbeddedSignup}
          disabled={connecting || !fbLoaded}
          style={{
            ...btnPrimaryStyle,
            background: connecting ? '#333' : '#25d366',
            color: connecting ? '#666' : '#000',
            cursor: connecting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          {connecting ? (
            <>
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #666', borderTopColor: '#25d366', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Conectando...
            </>
          ) : (
            <>📱 Conectar WhatsApp Business com Coexistence</>
          )}
        </button>

        <button onClick={() => setStep('info')} style={{ ...btnSecondaryStyle, marginTop: 12 }}>
          ← Voltar
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </PageLayout>
    )
  }

  // ── Passo 3: Sucesso + Instagram opcional ──
  if (step === 'done') {
    return (
      <PageLayout title="Cliente conectado! 🎉" subtitle={form.name}>
        <div style={{ textAlign: 'center', padding: '20px 0 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <div style={{ color: '#86efac', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>WhatsApp conectado com Coexistence</div>
          <div style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>
            O celular e a plataforma estão sincronizados. A IA já está respondendo.
          </div>

          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Detalhes do cliente:</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <Row label="Nome" value={form.name} />
              <Row label="Slug" value={form.slug} />
              <Row label="Phone Number ID" value={result?.phoneNumberId} mono />
              <Row label="WABA ID" value={result?.wabaId} mono />
              <Row label="Coexistence" value="✅ Ativo" />
              <Row label="IA" value="✅ Ativa" />
            </div>
          </div>
        </div>

        {/* ── Conectar Instagram (opcional) ── */}
        <div style={{ background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>📸</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#c084fc' }}>Conectar Instagram (opcional)</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>A IA também responderá mensagens diretas do Instagram</div>
            </div>
            {igSaved && (
              <span style={{ marginLeft: 'auto', background: '#1e1a2e', border: '1px solid #7c3aed', color: '#c084fc', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                ✅ Conectado
              </span>
            )}
          </div>

          {!igSaved ? (
            <>
              <div style={{ background: '#13131f', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 14px', marginTop: 16, marginBottom: 14, fontSize: 12, color: '#888', lineHeight: 1.7 }}>
                <strong style={{ color: '#a78bfa' }}>Como encontrar o ID numérico:</strong><br />
                1. Acesse <strong style={{ color: '#ccc' }}>business.facebook.com</strong><br />
                2. Vá em <strong style={{ color: '#ccc' }}>Configurações → Contas Instagram</strong><br />
                3. Clique na conta → o ID numérico aparece na URL ou nas configurações
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={igUserId}
                  onChange={e => setIgUserId(e.target.value)}
                  placeholder="Ex: 17841400123456789"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={handleConnectInstagram}
                  disabled={igSaving}
                  style={{
                    background: igSaving ? '#333' : 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                    color: '#fff', border: 'none', padding: '10px 20px',
                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: igSaving ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {igSaving ? 'Salvando...' : 'Conectar IG'}
                </button>
              </div>

              {igError && <div style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{igError}</div>}
            </>
          ) : (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#1a1a2e', borderRadius: 8, fontSize: 13, color: '#a78bfa' }}>
              📸 Instagram Business ID <span style={{ fontFamily: 'monospace', color: '#c084fc' }}>{igUserId}</span> salvo. A IA responderá DMs automaticamente.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => router.push('/caro-admin/clientes')} style={btnSecondaryStyle}>
            Ver todos os clientes
          </button>
          <button onClick={() => router.push(`/admin?tenant=${result?.tenantId}`)} style={btnPrimaryStyle}>
            Abrir painel do cliente →
          </button>
        </div>
      </PageLayout>
    )
  }
}

// ── Componentes auxiliares ─────────────────────────────────────

function PageLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: '#c9a96e', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>CA.RO TECH · Novo Cliente</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>
          {subtitle && <div style={{ color: '#888', marginTop: 6, fontSize: 14 }}>{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: '#ccc', fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 12 : 13 }}>{value || '—'}</span>
    </div>
  )
}

const inputStyle = {
  width: '100%', background: '#111', border: '1px solid #333', color: '#fff',
  borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
}
const btnPrimaryStyle = {
  width: '100%', background: '#c9a96e', color: '#000', border: 'none',
  padding: '13px 24px', borderRadius: 10, fontSize: 15, fontWeight: 700,
  cursor: 'pointer',
}
const btnSecondaryStyle = {
  width: '100%', background: 'transparent', color: '#888', border: '1px solid #333',
  padding: '12px 24px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
}
