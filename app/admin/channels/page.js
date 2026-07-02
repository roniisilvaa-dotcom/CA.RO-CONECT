'use client'
import { useState } from 'react'

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange && onChange(!on)}
      style={{
        width: 48, height: 26,
        borderRadius: 13,
        background: on ? '#25D366' : '#e9edef',
        border: 'none',
        cursor: onChange ? 'pointer' : 'not-allowed',
        position: 'relative',
        transition: 'background 0.25s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: on ? 25 : 3,
        width: 20, height: 20,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.25s',
      }}/>
    </button>
  )
}

function ConfigRow({ label, desc, children, last }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '14px 20px',
      borderBottom: last ? 'none' : '1px solid #f0f2f5',
    }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111b21' }}>{label}</div>
        {desc && <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

export default function ChannelsPage() {
  const [waAI,     setWaAI]     = useState(true)
  const [waGreet,  setWaGreet]  = useState(true)
  const [waAuto,   setWaAuto]   = useState(true)
  const [waLead,   setWaLead]   = useState(true)
  const [saved,    setSaved]    = useState(false)
  const [greeting, setGreeting] = useState(
    'Olá! 👋 Aqui é a Camila Rocha, consultora de imagem. Como posso te ajudar hoje?'
  )

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111b21', letterSpacing: '-0.3px' }}>
          Canais
        </h1>
        <p style={{ fontSize: 13.5, color: '#667781', marginTop: 4 }}>
          Configure seus canais de atendimento e o comportamento da IA.
        </p>
      </div>

      {/* ═══ WHATSAPP ═══ */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e9edef',
        overflow: 'hidden',
        marginBottom: 16,
      }}>

        {/* Header do canal */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e9edef',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: '#e9f5ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>WhatsApp Business</div>
            <div style={{ fontSize: 12.5, color: '#25D366', fontWeight: 500, marginTop: 1 }}>✓ Conectado</div>
          </div>
          {/* IA toggle principal */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: waAI ? '#e9f5ee' : '#f0f2f5',
            borderRadius: 20,
            padding: '6px 14px',
            transition: 'background 0.2s',
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: waAI ? '#128C7E' : '#aab0b7',
            }}>
              IA {waAI ? 'ativa' : 'pausada'}
            </span>
            <Toggle on={waAI} onChange={setWaAI} />
          </div>
        </div>

        {/* Saudação */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#111b21', marginBottom: 8 }}>
            Mensagem de boas-vindas
          </div>
          <textarea
            value={greeting}
            onChange={e => setGreeting(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              background: '#f0f2f5',
              border: '1.5px solid #e9edef',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13.5,
              color: '#111b21',
              fontFamily: 'Inter, -apple-system, sans-serif',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.6,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#25D366'}
            onBlur={e => e.target.style.borderColor = '#e9edef'}
          />
          <div style={{ fontSize: 12, color: '#4b5563', marginTop: 5 }}>
            Enviada automaticamente ao primeiro contato
          </div>
        </div>

        {/* Configurações de comportamento */}
        <ConfigRow label="Resposta automática" desc="IA responde sem intervenção manual">
          <Toggle on={waAuto} onChange={setWaAuto} />
        </ConfigRow>
        <ConfigRow label="Saudação automática" desc="Enviar boas-vindas ao primeiro contato">
          <Toggle on={waGreet} onChange={setWaGreet} />
        </ConfigRow>
        <ConfigRow label="Captura de leads" desc="Salvar novos contatos automaticamente" last>
          <Toggle on={waLead} onChange={setWaLead} />
        </ConfigRow>

        {/* Salvar */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #f0f2f5',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            onClick={save}
            style={{
              padding: '10px 24px',
              background: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
          >
            Salvar configurações
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: '#25D366', fontWeight: 500 }}>
              ✓ Salvo!
            </span>
          )}
        </div>

      </div>

      {/* ═══ INSTAGRAM ═══ */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e9edef',
        overflow: 'hidden',
      }}>

        {/* Header do canal */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e9edef',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f5f0f5 0%, #fce4f0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c13584" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>Instagram</div>
            <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 1 }}>
              Verificação Meta em andamento
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#f0f2f5',
            borderRadius: 20,
            padding: '6px 14px',
            opacity: 0.55,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#aab0b7' }}>IA pausada</span>
            <Toggle on={false} onChange={null} />
          </div>
        </div>

        {/* Aviso */}
        <div style={{
          margin: '16px 20px',
          padding: '14px 16px',
          background: '#fef9ec',
          borderRadius: 10,
          border: '1px solid #fde68a',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.4 }}>⏳</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
              Verificação Meta em andamento
            </div>
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.55 }}>
              A <strong>CR IMAGE LTDA</strong> está sendo verificada pela Meta. Prazo: 2–10 dias úteis.
              Quando aprovado, a IA do Instagram ativa automaticamente com a saudação configurada abaixo.
            </div>
          </div>
        </div>

        {/* Saudação pré-configurada */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Saudação pré-configurada (ativa após aprovação)
          </div>
          <div style={{
            background: '#f0f2f5',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13.5,
            color: '#2d3748',
            lineHeight: 1.6,
            border: '1px solid #e9edef',
          }}>
            Oi! 🌟 Que bom te ver por aqui! Sou a assistente da Camila Rocha, consultora de imagem.
            Quer saber mais sobre consultoria de estilo ou shopping pessoal? Me conta! 💫
          </div>
        </div>

      </div>

    </div>
  )
}
