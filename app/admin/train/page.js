'use client'
import { useState } from 'react'

const GOLD = '#c9a96e'
const CARD_BG = 'rgba(255,255,255,0.025)'
const BORDER = 'rgba(201,169,110,0.08)'

const INITIAL_EXAMPLES = [
  { id: 1, question: 'Qual é o preço da consultoria?', answer: 'A consultoria pessoal começa em R$ 350 e pode variar conforme a modalidade escolhida. Posso te passar todos os detalhes!', active: true },
  { id: 2, question: 'Você atende online?', answer: 'Sim! Atendo de forma online via videoconferência, com a mesma qualidade da consultoria presencial.', active: true },
  { id: 3, question: 'Qual a duração da consultoria?', answer: 'A consultoria presencial dura em média 2 horas. A online, cerca de 1h30.', active: true },
]

export default function TrainPage() {
  const [faqs, setFaqs] = useState(INITIAL_EXAMPLES)
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [personality, setPersonality] = useState('profissional e acolhedora')
  const [tone, setTone] = useState('formal-friendly')
  const [greeting, setGreeting] = useState('Olá! Sou a IA da Camila Rocha. Como posso te ajudar hoje?')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('faqs')

  function addFaq() {
    if (!newQ.trim() || !newA.trim()) return
    setFaqs(f => [...f, { id: Date.now(), question: newQ, answer: newA, active: true }])
    setNewQ('')
    setNewA('')
  }

  function removeFaq(id) {
    setFaqs(f => f.filter(x => x.id !== id))
  }

  function toggleFaq(id) {
    setFaqs(f => f.map(x => x.id === id ? { ...x, active: !x.active } : x))
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'faqs', label: 'Perguntas & Respostas', icon: '◈' },
    { id: 'personality', label: 'Personalidade da IA', icon: '✦' },
    { id: 'rules', label: 'Regras de Comportamento', icon: '◌' },
  ]

  return (
    <div style={{ padding: '36px 40px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: 36,
            color: '#f0ead8',
            letterSpacing: 1,
            lineHeight: 1,
          }}>Treinar IA</h1>
          <span style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(201,169,110,0.4)', fontWeight: 300 }}>
            Assistente da Camila
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: 'rgba(200,192,173,0.4)', maxWidth: 480 }}>
          Ensine a IA como se comportar, quais perguntas responder e qual tom usar nas conversas.
        </p>
        <div style={{ width: 32, height: 1, background: 'linear-gradient(to right, #c9a96e, transparent)', marginTop: 14 }}/>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '7px 16px',
            borderRadius: 4,
            border: 'none',
            background: activeTab === tab.id ? 'rgba(201,169,110,0.12)' : 'transparent',
            color: activeTab === tab.id ? GOLD : 'rgba(200,192,173,0.4)',
            fontSize: 12,
            fontWeight: activeTab === tab.id ? 500 : 300,
            cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ fontSize: 9 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          {/* List */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 8.5, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(201,169,110,0.4)', marginBottom: 12 }}>
                Respostas cadastradas ({faqs.filter(f => f.active).length} ativas)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {faqs.map(faq => (
                  <div key={faq.id} style={{
                    background: CARD_BG,
                    border: `1px solid ${faq.active ? BORDER : 'rgba(255,255,255,0.03)'}`,
                    borderRadius: 6,
                    padding: '16px 18px',
                    opacity: faq.active ? 1 : 0.45,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#f0ead8', fontWeight: 500, marginBottom: 6 }}>
                          P: {faq.question}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'rgba(200,192,173,0.55)', lineHeight: 1.5 }}>
                          R: {faq.answer}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => toggleFaq(faq.id)} style={{
                          padding: '4px 10px',
                          borderRadius: 3,
                          border: `1px solid ${faq.active ? 'rgba(125,197,165,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          background: 'transparent',
                          color: faq.active ? '#7dc9a5' : 'rgba(200,192,173,0.3)',
                          fontSize: 10,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{faq.active ? 'Ativa' : 'Pausada'}</button>
                        <button onClick={() => removeFaq(faq.id)} style={{
                          padding: '4px 10px',
                          borderRadius: 3,
                          border: '1px solid rgba(201,120,110,0.2)',
                          background: 'transparent',
                          color: 'rgba(201,120,110,0.5)',
                          fontSize: 10,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>Remover</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add new FAQ */}
          <div>
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '20px 20px', position: 'sticky', top: 24 }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 17,
                color: '#f0ead8',
                letterSpacing: 0.5,
                marginBottom: 16,
              }}>Adicionar Resposta</div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 6 }}>
                  Pergunta do cliente
                </label>
                <textarea
                  value={newQ}
                  onChange={e => setNewQ(e.target.value)}
                  placeholder="Ex: Qual é o preço?"
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid rgba(201,169,110,0.12)`,
                    borderRadius: 4,
                    padding: '10px 12px',
                    color: '#f0ead8',
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 6 }}>
                  Resposta da IA
                </label>
                <textarea
                  value={newA}
                  onChange={e => setNewA(e.target.value)}
                  placeholder="Como a IA deve responder..."
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid rgba(201,169,110,0.12)`,
                    borderRadius: 4,
                    padding: '10px 12px',
                    color: '#f0ead8',
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <button onClick={addFaq} style={{
                width: '100%',
                padding: '11px',
                background: 'rgba(201,169,110,0.12)',
                border: `1px solid rgba(201,169,110,0.25)`,
                borderRadius: 4,
                color: GOLD,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.3,
              }}>Adicionar →</button>

              <button onClick={handleSave} style={{
                width: '100%',
                marginTop: 8,
                padding: '11px',
                background: saving ? 'rgba(125,197,165,0.08)' : saved ? 'rgba(125,197,165,0.15)' : 'transparent',
                border: `1px solid ${saved ? 'rgba(125,197,165,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 4,
                color: saved ? '#7dc9a5' : 'rgba(200,192,173,0.4)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
              }}>
                {saving ? 'Salvando...' : saved ? '✓ Salvo com sucesso' : 'Salvar todas as respostas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personality Tab */}
      {activeTab === 'personality' && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '24px 26px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: '#f0ead8', letterSpacing: 0.5, marginBottom: 20 }}>
              Como a IA deve se comunicar
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 8 }}>
                Tom de voz
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { val: 'formal', label: 'Formal' },
                  { val: 'formal-friendly', label: 'Formal & Amigável' },
                  { val: 'casual', label: 'Descontraído' },
                  { val: 'luxury', label: 'Sofisticado' },
                ].map(t => (
                  <button key={t.val} onClick={() => setTone(t.val)} style={{
                    padding: '7px 14px',
                    borderRadius: 4,
                    border: `1px solid ${tone === t.val ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    background: tone === t.val ? 'rgba(201,169,110,0.1)' : 'transparent',
                    color: tone === t.val ? GOLD : 'rgba(200,192,173,0.4)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.15s',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 6 }}>
                Personalidade em poucas palavras
              </label>
              <input
                value={personality}
                onChange={e => setPersonality(e.target.value)}
                placeholder="Ex: acolhedora, profissional, elegante"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(201,169,110,0.12)`,
                  borderRadius: 4,
                  padding: '10px 12px',
                  color: '#f0ead8',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 6 }}>
                Mensagem de saudação inicial
              </label>
              <textarea
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(201,169,110,0.12)`,
                  borderRadius: 4,
                  padding: '10px 12px',
                  color: '#f0ead8',
                  fontSize: 13,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Preview */}
            <div style={{ background: 'rgba(201,169,110,0.04)', border: `1px solid rgba(201,169,110,0.1)`, borderRadius: 4, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,169,110,0.5)', marginBottom: 8 }}>Prévia</div>
              <div style={{ fontSize: 13, color: 'rgba(200,192,173,0.7)', lineHeight: 1.6 }}>"{greeting}"</div>
              <div style={{ fontSize: 11, color: 'rgba(201,169,110,0.4)', marginTop: 8 }}>
                Tom: {tone} · Estilo: {personality}
              </div>
            </div>

            <button onClick={handleSave} style={{
              padding: '11px 24px',
              background: 'rgba(201,169,110,0.12)',
              border: `1px solid rgba(201,169,110,0.25)`,
              borderRadius: 4,
              color: GOLD,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar configurações →'}
            </button>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '24px 26px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: '#f0ead8', letterSpacing: 0.5, marginBottom: 6 }}>
              Regras da IA
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(200,192,173,0.4)', marginBottom: 22 }}>
              Defina o que a IA pode e não pode fazer nas conversas.
            </p>

            {[
              { label: 'Nunca fornecer preços sem antes qualificar o cliente', icon: '✦', on: true },
              { label: 'Sempre perguntar o nome do cliente no início', icon: '◎', on: true },
              { label: 'Encaminhar para Camila quando o cliente pedir', icon: '◈', on: true },
              { label: 'Não falar sobre outras consultorias ou concorrentes', icon: '▪', on: true },
              { label: 'Confirmar agendamentos via mensagem automática', icon: '◌', on: false },
            ].map((rule, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 0',
                borderBottom: `1px solid rgba(201,169,110,0.05)`,
              }}>
                <span style={{ fontSize: 9, color: GOLD, opacity: 0.6 }}>{rule.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'rgba(200,192,173,0.7)' }}>{rule.label}</span>
                <div style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: rule.on ? 'rgba(125,197,165,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${rule.on ? 'rgba(125,197,165,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 3px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: rule.on ? '#7dc9a5' : 'rgba(255,255,255,0.2)',
                    marginLeft: rule.on ? 'auto' : 0,
                    transition: 'all 0.2s',
                  }}/>
                </div>
              </div>
            ))}

            <button onClick={handleSave} style={{
              marginTop: 20,
              padding: '11px 24px',
              background: 'rgba(201,169,110,0.12)',
              border: `1px solid rgba(201,169,110,0.25)`,
              borderRadius: 4,
              color: GOLD,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar regras →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
