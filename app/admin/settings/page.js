'use client'
import { useState } from 'react'

const INPUT = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', fontSize: 14,
  border: '1.5px solid #e9edef', borderRadius: 8,
  color: '#111b21', background: '#fff',
  outline: 'none',
}

const LABEL = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }
const HINT  = { fontSize: 12, color: '#667781', marginTop: 4 }

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e9edef', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5', background: '#f9fafb' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111b21' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'flex-start' }}>
      <div>
        <div style={LABEL}>{label}</div>
        {hint && <div style={HINT}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
      background: checked ? '#25D366' : '#d1d5db',
      position: 'relative', transition: 'background 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}

export default function SettingsPage() {
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notifLead, setNotifLead] = useState(true)
  const [notifHuman, setNotifHuman] = useState(true)
  const [agentName, setAgentName] = useState('Assistente da Camila')
  const [greeting, setGreeting] = useState('Olá! 👋 Sou a assistente virtual da Camila Rocha. Como posso te ajudar hoje?')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 780 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111b21', margin: 0, letterSpacing: '-0.3px' }}>Configurações</h1>
        <p style={{ color: '#4b5563', fontSize: 13.5, marginTop: 4 }}>Personalize como a IA e o painel funcionam</p>
      </div>

      {/* IA */}
      <Section title="🤖 Inteligência Artificial">
        <Row label="IA ativa" hint="A IA responde automaticamente no WhatsApp">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Toggle checked={aiEnabled} onChange={() => setAiEnabled(v => !v)} />
            <span style={{ fontSize: 13, color: aiEnabled ? '#16a34a' : '#667781', fontWeight: 600 }}>
              {aiEnabled ? 'Ligada' : 'Desligada'}
            </span>
          </div>
        </Row>
        <Row label="Nome do assistente" hint="Como a IA se apresenta nas conversas">
          <input
            style={INPUT}
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            placeholder="Ex: Assistente da Camila"
          />
        </Row>
        <Row label="Mensagem de boas-vindas" hint="Enviada automaticamente na primeira mensagem">
          <textarea
            style={{ ...INPUT, height: 80, resize: 'vertical', lineHeight: 1.5 }}
            value={greeting}
            onChange={e => setGreeting(e.target.value)}
          />
        </Row>
      </Section>

      {/* Notificações */}
      <Section title="🔔 Notificações">
        <Row label="Lead quente" hint="Avisar quando um lead atingir score alto">
          <Toggle checked={notifLead} onChange={() => setNotifLead(v => !v)} />
        </Row>
        <Row label="Atendimento humano" hint="Avisar quando lead pedir para falar com você">
          <Toggle checked={notifHuman} onChange={() => setNotifHuman(v => !v)} />
        </Row>
      </Section>

      {/* Conta */}
      <Section title="👤 Conta">
        <Row label="Nome" hint="Seu nome no painel">
          <input style={INPUT} defaultValue="Camila Rocha" />
        </Row>
        <Row label="E-mail">
          <input style={INPUT} defaultValue="camila@carostudio.com.br" type="email" />
        </Row>
        <Row label="Senha" hint="Deixe em branco para não alterar">
          <input style={INPUT} placeholder="••••••••" type="password" />
        </Row>
      </Section>

      {/* Botão salvar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} style={{
          padding: '10px 28px', borderRadius: 24, fontSize: 14, fontWeight: 700,
          background: saved ? '#16a34a' : '#25D366',
          color: '#fff', border: 'none', cursor: 'pointer',
          transition: 'background 0.2s',
        }}>
          {saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
