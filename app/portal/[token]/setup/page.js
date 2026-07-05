'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  bg: '#F7F5F2',
  white: '#FFFFFF',
  card: '#FFFFFF',
  gold: '#B8874A',
  goldLight: '#F0E4D0',
  goldDark: '#8A5E2A',
  text: '#1A1512',
  sub: '#6B6259',
  border: '#E5DDD5',
  green: '#22C55E',
  greenBg: '#F0FDF4',
  red: '#EF4444',
  redBg: '#FEF2F2',
  blue: '#3B82F6',
  blueBg: '#EFF6FF',
}

const STEPS = [
  { id: 1, label: 'Configurar IA',   icon: '🤖', desc: 'Nome, persona e estilo de comunicação' },
  { id: 2, label: 'Conhecimento',    icon: '📚', desc: 'Suba documentos para a IA responder' },
  { id: 3, label: 'Testar',          icon: '💬', desc: 'Veja como sua IA se comporta' },
  { id: 4, label: 'Ativar',          icon: '🚀', desc: 'Pronto para atender seus clientes' },
]

const PERSONALITY_OPTIONS = [
  { value: 'professional', label: '💼 Profissional', desc: 'Formal, objetivo, técnico' },
  { value: 'friendly',     label: '😊 Amigável',     desc: 'Caloroso, próximo, empático' },
  { value: 'luxury',       label: '✨ Premium',       desc: 'Sofisticado, exclusivo, elegante' },
  { value: 'casual',       label: '🤙 Casual',        desc: 'Descontraído, jovial, informal' },
]

/* ─── Helpers ────────────────────────────────────────────────── */
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((s, i) => {
        const done = s.id < current
        const active = s.id === current
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: done ? C.gold : active ? C.goldLight : C.border,
                border: `2px solid ${done || active ? C.gold : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 18 : 20, fontWeight: 700, color: done ? C.white : active ? C.goldDark : C.sub,
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? C.goldDark : C.sub, marginTop: 6, whiteSpace: 'nowrap' }}>
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 0.5, background: done ? C.gold : C.border, transition: 'background 0.3s', marginBottom: 20 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Step 1: Configurar IA ─────────────────────────────────── */
function Step1({ config, onChange, onNext, saving }) {
  const [form, setForm] = useState({
    assistant_name: config.assistant_name || '',
    business_desc: '',
    can_help: '',
    cant_help: '',
    personality: config.personality || 'professional',
    working_hours: '08:00–18:00, Seg–Sex',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleNext = () => {
    const sys = buildSystemPrompt(form)
    onChange({ assistant_name: form.assistant_name, personality: form.personality, system_prompt: sys })
    onNext()
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Configure sua IA</h2>
      <p style={{ color: C.sub, margin: '0 0 28px', fontSize: 14 }}>Essas informações definem como sua IA vai se apresentar e responder.</p>

      {/* Nome da IA */}
      <label style={labelStyle}>Nome da IA</label>
      <input
        value={form.assistant_name}
        onChange={e => set('assistant_name', e.target.value)}
        placeholder="Ex: Sofia, Bella, Caro, Nina..."
        style={inputStyle}
      />

      {/* Descrição do negócio */}
      <label style={labelStyle}>Descreva seu negócio em 1–2 frases</label>
      <textarea
        value={form.business_desc}
        onChange={e => set('business_desc', e.target.value)}
        placeholder="Ex: Sou consultora de moda e imagem para mulheres executivas. Ajudo minhas clientes a construírem um guarda-roupa estratégico e autêntico."
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />

      {/* O que a IA pode ajudar */}
      <label style={labelStyle}>O que a IA pode ajudar seus clientes?</label>
      <textarea
        value={form.can_help}
        onChange={e => set('can_help', e.target.value)}
        placeholder="Ex: tirar dúvidas sobre pacotes e preços, agendar consultoria, enviar catálogos, responder perguntas sobre serviços..."
        rows={2}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />

      {/* O que a IA NÃO deve fazer */}
      <label style={labelStyle}>O que a IA NÃO deve fazer?</label>
      <textarea
        value={form.cant_help}
        onChange={e => set('cant_help', e.target.value)}
        placeholder="Ex: fazer diagnósticos médicos, dar descontos sem minha aprovação, confirmar pagamentos..."
        rows={2}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />

      {/* Horário de atendimento */}
      <label style={labelStyle}>Horário de atendimento da IA</label>
      <input
        value={form.working_hours}
        onChange={e => set('working_hours', e.target.value)}
        placeholder="Ex: 08:00–18:00, Seg–Sex"
        style={inputStyle}
      />

      {/* Personalidade */}
      <label style={labelStyle}>Estilo de comunicação</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {PERSONALITY_OPTIONS.map(p => (
          <div
            key={p.value}
            onClick={() => set('personality', p.value)}
            style={{
              padding: '12px 14px', borderRadius: 10,
              border: `2px solid ${form.personality === p.value ? C.gold : C.border}`,
              background: form.personality === p.value ? C.goldLight : C.white,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: form.personality === p.value ? C.goldDark : C.text }}>{p.label}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!form.assistant_name || saving}
        style={btnPrimary}
      >
        Próximo: Adicionar conhecimento →
      </button>
    </div>
  )
}

function buildSystemPrompt(form) {
  const personalityMap = {
    professional: 'profissional, objetivo e técnico',
    friendly: 'caloroso, próximo e empático',
    luxury: 'sofisticado, exclusivo e elegante',
    casual: 'descontraído, jovial e informal',
  }

  return `Você é ${form.assistant_name}, uma assistente virtual inteligente.

SOBRE O NEGÓCIO:
${form.business_desc || 'Assistente virtual de atendimento ao cliente.'}

SEU ESTILO:
Seja ${personalityMap[form.personality] || 'profissional e objetivo'} em todas as respostas.

VOCÊ PODE AJUDAR COM:
${form.can_help || 'Responder dúvidas gerais, fornecer informações sobre serviços e produtos.'}

VOCÊ NÃO DEVE:
${form.cant_help || 'Tomar decisões que necessitem aprovação humana ou fornecer informações que não estejam em sua base de conhecimento.'}

HORÁRIO DE ATENDIMENTO:
${form.working_hours || '08:00–18:00, segunda a sexta-feira.'}

Se receber uma pergunta fora do seu escopo, responda educadamente que vai encaminhar para a equipe humana.
Sempre seja concisa nas respostas (máximo 3 parágrafos).`
}

/* ─── Step 2: Conhecimento ──────────────────────────────────── */
function Step2({ tenantId, onNext, onBack }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState([])
  const dropRef = useRef(null)

  const handleDrop = async (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer?.files || e.target.files || [])
      .filter(f => f.type === 'application/pdf')
    if (!dropped.length) return
    await uploadFiles(dropped)
  }

  const uploadFiles = async (newFiles) => {
    setUploading(true)
    for (const file of newFiles) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tenant_id', tenantId)
      try {
        const r = await fetch('/api/caro-admin/knowledge/upload', { method: 'POST', body: fd })
        if (r.ok) {
          setUploaded(prev => [...prev, file.name])
        }
      } catch (_) {}
    }
    setUploading(false)
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Base de Conhecimento</h2>
      <p style={{ color: C.sub, margin: '0 0 8px', fontSize: 14 }}>
        Suba PDFs com informações sobre seus serviços, preços, políticas, catálogos...
      </p>
      <p style={{ color: C.sub, margin: '0 0 24px', fontSize: 13, fontStyle: 'italic' }}>
        Opcional — você pode pular e adicionar depois.
      </p>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('pdf-input').click()}
        style={{
          border: `2px dashed ${C.gold}`,
          borderRadius: 16,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: C.goldLight,
          marginBottom: 20,
          transition: 'background 0.2s',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
        <div style={{ fontWeight: 700, color: C.goldDark, fontSize: 15, marginBottom: 4 }}>
          {uploading ? 'Fazendo upload...' : 'Arraste PDFs aqui'}
        </div>
        <div style={{ fontSize: 13, color: C.sub }}>ou clique para selecionar</div>
        <input id="pdf-input" type="file" accept=".pdf" multiple hidden onChange={handleDrop} />
      </div>

      {/* Lista de arquivos */}
      {uploaded.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 10 }}>✅ Arquivos enviados</div>
          {uploaded.map((name, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, background: C.greenBg,
              border: `1px solid ${C.green}20`, marginBottom: 6,
            }}>
              <span>📋</span>
              <span style={{ fontSize: 13, color: C.text }}>{name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: C.green }}>Enviado</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={btnSecondary}>← Voltar</button>
        <button onClick={onNext} style={{ ...btnPrimary, flex: 1 }}>
          {uploaded.length > 0 ? 'Próximo: Testar IA →' : 'Pular por enquanto →'}
        </button>
      </div>
    </div>
  )
}

/* ─── Step 3: Testar IA ─────────────────────────────────────── */
function Step3({ config, tenantId, onNext, onBack }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Olá! Sou ${config.assistant_name || 'sua IA'}. Como posso ajudar?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const msgRef = useRef(null)

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, message: userMsg, test_mode: true })
      })
      const data = await r.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || 'Desculpe, não consegui processar sua mensagem.' }])
    } catch (_) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Erro ao conectar com a IA. Verifique a configuração.' }])
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Testar sua IA</h2>
      <p style={{ color: C.sub, margin: '0 0 20px', fontSize: 14 }}>
        Simule uma conversa e veja como {config.assistant_name || 'sua IA'} responde.
      </p>

      {/* Chat preview */}
      <div style={{
        height: 340, overflowY: 'auto',
        background: '#F0EDE8',
        borderRadius: 16, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
        marginBottom: 14,
        scrollbarWidth: 'thin',
      }} ref={msgRef}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? C.gold : C.white,
              color: m.role === 'user' ? C.white : C.text,
              fontSize: 14, lineHeight: 1.5,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: C.white, color: C.sub, fontSize: 14 }}>
              <span style={{ animation: 'pulse 1s infinite' }}>Digitando...</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Digite uma mensagem de teste..."
          style={{ ...inputStyle, margin: 0, flex: 1 }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading} style={{
          ...btnPrimary, width: 'auto', padding: '0 20px', margin: 0,
        }}>→</button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={btnSecondary}>← Voltar</button>
        <button onClick={onNext} style={{ ...btnPrimary, flex: 1 }}>Ativar minha IA 🚀</button>
      </div>
    </div>
  )
}

/* ─── Step 4: Ativar ────────────────────────────────────────── */
function Step4({ config, tenantData }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>
        {config.assistant_name || 'Sua IA'} está pronta!
      </h2>
      <p style={{ color: C.sub, fontSize: 14, margin: '0 0 32px' }}>
        Sua assistente virtual já está configurada e pronta para atender.
      </p>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32, textAlign: 'left' }}>
        <div style={statusCard('#22C55E')}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>IA Configurada</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Persona, estilo e instruções definidos</div>
        </div>
        <div style={statusCard(C.gold)}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📱</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>WhatsApp</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Aguardando conexão do número</div>
        </div>
        <div style={statusCard(C.blue)}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📸</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Instagram</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Configurar conta profissional</div>
        </div>
        <div style={statusCard('#8B5CF6')}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Base de dados</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Adicione documentos quando quiser</div>
        </div>
      </div>

      {/* Próximos passos */}
      <div style={{
        background: C.goldLight,
        border: `1px solid ${C.gold}40`,
        borderRadius: 16, padding: 20, textAlign: 'left', marginBottom: 24,
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.goldDark, marginBottom: 12 }}>📋 Próximos passos</div>
        {[
          'Sua equipe Caro Studio vai conectar seu número de WhatsApp Business',
          'Você receberá uma confirmação quando tudo estiver ativo',
          'A partir daí a IA responderá automaticamente as mensagens',
          'Você pode ajustar as configurações a qualquer momento aqui',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{
              minWidth: 22, height: 22, borderRadius: '50%',
              background: C.gold, color: C.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, marginTop: 1,
            }}>{i + 1}</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{step}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, color: C.sub }}>
        Dúvidas? Fale com a equipe Caro Studio via WhatsApp.
      </div>
    </div>
  )
}

function statusCard(color) {
  return {
    padding: '16px',
    borderRadius: 12,
    border: `2px solid ${color}30`,
    background: `${color}08`,
  }
}

/* ─── Shared styles ──────────────────────────────────────────── */
const labelStyle = {
  display: 'block',
  fontSize: 13, fontWeight: 700,
  color: C.sub, marginBottom: 6, marginTop: 0,
}

const inputStyle = {
  display: 'block',
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  fontSize: 14, color: C.text,
  background: C.white,
  outline: 'none',
  marginBottom: 18,
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}

const btnPrimary = {
  display: 'block',
  width: '100%',
  padding: '14px',
  borderRadius: 12,
  border: 'none',
  background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
  color: C.white,
  fontSize: 15, fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
}

const btnSecondary = {
  padding: '14px 20px',
  borderRadius: 12,
  border: `1.5px solid ${C.border}`,
  background: C.white,
  color: C.sub,
  fontSize: 14, fontWeight: 600,
  cursor: 'pointer',
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function ClientSetupPortal() {
  const params = useParams()
  const tenantId = params?.token

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState({
    assistant_name: '',
    personality: 'professional',
    system_prompt: '',
    ai_enabled: false,
  })
  const [tenantData, setTenantData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    loadConfig()
  }, [tenantId])

  async function loadConfig() {
    setLoading(true)
    try {
      const r = await fetch(`/api/caro-admin/agent?tenant_id=${tenantId}`)
      if (!r.ok) throw new Error('Tenant não encontrado')
      const data = await r.json()
      setConfig(data.config)
      setTenantData({ name: data.config.tenant_name, business_name: data.config.business_name })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig(updates) {
    setSaving(true)
    try {
      await fetch('/api/caro-admin/agent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, ...updates })
      })
      setConfig(prev => ({ ...prev, ...updates }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (_) {}
    setSaving(false)
  }

  async function activateAndNext() {
    await saveConfig({ ai_enabled: true })
    setStep(4)
  }

  if (!tenantId || error) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ color: C.text }}>Link inválido</h2>
          <p style={{ color: C.sub }}>Este link de configuração é inválido ou expirou.</p>
          <p style={{ color: C.sub, fontSize: 13 }}>Entre em contato com a Caro Studio.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</div>
          <p style={{ color: C.sub }}>Carregando sua configuração...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '40px 16px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: C.white, borderRadius: 16, padding: '10px 20px',
          border: `1px solid ${C.border}`, marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.white, fontWeight: 800, fontSize: 14,
          }}>
            {initials(tenantData?.name || 'CS')}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{tenantData?.name || 'Caro Studio'}</div>
            <div style={{ fontSize: 11, color: C.sub }}>{tenantData?.business_name || 'Configuração da IA'}</div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
          Configure sua Assistente Virtual
        </h1>
        <p style={{ color: C.sub, fontSize: 13, margin: 0 }}>
          Em poucos minutos sua IA estará pronta para atender seus clientes
        </p>
      </div>

      {/* Card principal */}
      <div style={{
        maxWidth: 560,
        margin: '0 auto',
        background: C.white,
        borderRadius: 20,
        padding: '28px 28px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: `1px solid ${C.border}`,
      }}>
        <StepBar current={step} />

        {saved && (
          <div style={{
            background: C.greenBg, border: `1px solid ${C.green}40`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: C.green, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ✅ Configuração salva!
          </div>
        )}

        {step === 1 && (
          <Step1
            config={config}
            onChange={updates => setConfig(p => ({ ...p, ...updates }))}
            onNext={async () => {
              await saveConfig({ assistant_name: config.assistant_name, personality: config.personality, system_prompt: config.system_prompt })
              setStep(2)
            }}
            saving={saving}
          />
        )}
        {step === 2 && (
          <Step2
            tenantId={tenantId}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3
            config={config}
            tenantId={tenantId}
            onNext={activateAndNext}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4 config={config} tenantData={tenantData} />
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: C.sub }}>
        Powered by <strong style={{ color: C.gold }}>Caro Studio</strong> · IA de Atendimento
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        input:focus, textarea:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px ${C.goldLight}; }
      `}</style>
    </div>
  )
}
