'use client'
import { useState } from 'react'

const GREEN = '#25D366'
const DARK_GREEN = '#128C7E'
const LIGHT_GREEN = '#e9f5ee'

function Toggle({ value, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 50, height: 28, borderRadius: 14,
        background: value ? GREEN : '#d1d7db',
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff',
        position: 'absolute', top: 3,
        left: value ? 25 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </div>
  )
}

function ChannelCard({ icon, name, platform, color, aiEnabled, onAiToggle, connected, status, stats, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden', marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '18px 20px',
        borderBottom: '1px solid #f0f2f5',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: color + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111b21' }}>{name}</div>
          <div style={{ fontSize: 12.5, color: '#667781', marginTop: 2 }}>{platform}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? GREEN : '#d1d7db',
          }}/>
          <span style={{ fontSize: 12, color: connected ? GREEN : '#aab0b7', fontWeight: 500 }}>
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* AI Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #f0f2f5',
        background: aiEnabled ? '#f7fdf9' : '#fff',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111b21', display: 'flex', alignItems: 'center', gap: 8 }}>
            🤖 IA Ativa neste canal
            {aiEnabled && <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 10,
              background: LIGHT_GREEN, color: DARK_GREEN, fontWeight: 500,
            }}>Respondendo automaticamente</span>}
          </div>
          <div style={{ fontSize: 12.5, color: '#667781', marginTop: 3 }}>
            {aiEnabled
              ? 'A IA está respondendo as mensagens neste canal'
              : 'Ativar para a IA responder automaticamente'}
          </div>
        </div>
        <Toggle value={aiEnabled} onChange={onAiToggle} disabled={!connected} />
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '14px 20px', gap: 12, borderBottom: '1px solid #f0f2f5',
        }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: color }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: '#667781', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Extra content */}
      {children && (
        <div style={{ padding: '16px 20px' }}>{children}</div>
      )}
    </div>
  )
}

export default function ChannelsPage() {
  const [waAI, setWaAI] = useState(true)
  const [igAI, setIgAI] = useState(false)
  const [waGreeting, setWaGreeting] = useState('Olá! Sou a assistente virtual da Camila Rocha 💚 Como posso te ajudar hoje?')
  const [igGreeting, setIgGreeting] = useState('Oi! Obrigada por me chamar no Instagram 🌸 Sou a IA da Camila. Como posso ajudar?')
  const [saved, setSaved] = useState(null)

  function save(channel) {
    setSaved(channel)
    setTimeout(() => setSaved(null), 2500)
  }

  const waStats = [
    { label: 'Mensagens hoje', value: '—' },
    { label: 'Respondidas pela IA', value: '—' },
    { label: 'Taxa de resposta', value: '—' },
  ]

  const igStats = [
    { label: 'DMs hoje', value: '—' },
    { label: 'Respondidas pela IA', value: '—' },
    { label: 'Novos seguidores', value: '—' },
  ]

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Header */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '18px 22px',
        marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111b21' }}>📡 Canais</h1>
          <p style={{ fontSize: 13, color: '#667781', marginTop: 2 }}>
            Controle a IA do WhatsApp e Instagram aqui
          </p>
        </div>
        <div style={{
          padding: '8px 16px', borderRadius: 20,
          background: '#f0f2f5', fontSize: 12.5, color: '#667781',
        }}>
          2 canais configurados
        </div>
      </div>

      {/* WhatsApp Card */}
      <ChannelCard
        icon="💬"
        name="WhatsApp"
        platform="WhatsApp Business API · CA.RO Studio"
        color={GREEN}
        aiEnabled={waAI}
        onAiToggle={setWaAI}
        connected={true}
        stats={waStats}
      >
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#667781', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Mensagem de boas-vindas
          </label>
          <textarea
            value={waGreeting}
            onChange={e => setWaGreeting(e.target.value)}
            rows={3}
            style={{
              width: '100%', border: '1px solid #e9edef', borderRadius: 8,
              padding: '10px 14px', fontSize: 13.5, color: '#111b21',
              resize: 'none', outline: 'none', lineHeight: 1.5,
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#aab0b7' }}>Enviada quando alguém manda a primeira mensagem</span>
            <button onClick={() => save('wa')} style={{
              padding: '7px 20px', borderRadius: 20,
              background: saved === 'wa' ? LIGHT_GREEN : GREEN,
              color: saved === 'wa' ? DARK_GREEN : '#fff',
              border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {saved === 'wa' ? '✓ Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Quick settings */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f2f5' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#667781', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Comportamento da IA
          </div>
          {[
            { label: 'Responder fora do horário comercial', val: true },
            { label: 'Qualificar leads automaticamente', val: true },
            { label: 'Alertar Camila para leads quentes', val: true },
            { label: 'Enviar link de agendamento', val: false },
          ].map((opt, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: i < 3 ? '1px solid #f0f2f5' : 'none',
            }}>
              <span style={{ fontSize: 13.5, color: '#111b21' }}>{opt.label}</span>
              <Toggle value={opt.val} onChange={() => {}} />
            </div>
          ))}
        </div>
      </ChannelCard>

      {/* Instagram Card */}
      <ChannelCard
        icon="📸"
        name="Instagram Direct"
        platform="Instagram Business · @camilarocha"
        color="#E1306C"
        aiEnabled={igAI}
        onAiToggle={setIgAI}
        connected={false}
        stats={igStats}
      >
        {/* Connection banner */}
        <div style={{
          background: '#fff8f0', border: '1px solid #fde68a',
          borderRadius: 10, padding: '14px 16px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#92400e', marginBottom: 3 }}>
              Instagram aguardando verificação Meta
            </div>
            <div style={{ fontSize: 12.5, color: '#b45309', lineHeight: 1.5 }}>
              A verificação da conta business (CR IMAGE LTDA) está em andamento no Meta. Assim que aprovada, a IA do Instagram será ativada automaticamente aqui.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#667781', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Mensagem de boas-vindas (Instagram)
          </label>
          <textarea
            value={igGreeting}
            onChange={e => setIgGreeting(e.target.value)}
            rows={3}
            style={{
              width: '100%', border: '1px solid #e9edef', borderRadius: 8,
              padding: '10px 14px', fontSize: 13.5, color: '#111b21',
              resize: 'none', outline: 'none', lineHeight: 1.5,
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#aab0b7' }}>Preparada para quando a integração for aprovada</span>
            <button onClick={() => save('ig')} style={{
              padding: '7px 20px', borderRadius: 20,
              background: saved === 'ig' ? '#fdf2f8' : '#E1306C',
              color: saved === 'ig' ? '#be185d' : '#fff',
              border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              {saved === 'ig' ? '✓ Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        <div style={{ paddingTop: 14, borderTop: '1px solid #f0f2f5' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#667781', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
            O que a IA vai fazer no Instagram
          </div>
          {[
            { label: 'Responder DMs automáticos', val: true },
            { label: 'Responder comentários com convite para DM', val: true },
            { label: 'Identificar interesse em consultoria', val: true },
            { label: 'Enviar link da bio ao responder', val: false },
          ].map((opt, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: i < 3 ? '1px solid #f0f2f5' : 'none',
            }}>
              <span style={{ fontSize: 13.5, color: '#111b21' }}>{opt.label}</span>
              <Toggle value={opt.val} onChange={() => {}} disabled={!false} />
            </div>
          ))}
        </div>
      </ChannelCard>
    </div>
  )
}
