'use client'
import { useState } from 'react'

// ══════════════════════════════════════════════════
// DADOS DO PLAYBOOK — CAMILA ROCHA
// ══════════════════════════════════════════════════

const INITIAL_FAQS = [
  {
    q: 'Quanto custa a consultoria?',
    a: 'Claro 🌸 Antes de te explicar os formatos disponíveis, me conta uma coisa: hoje qual é sua maior dificuldade com sua imagem?',
    active: true,
    tag: 'Vendas',
  },
  {
    q: 'Quero saber sobre o curso',
    a: 'Que alegria te ver por aqui ✨ O Geração do Estilo já transformou a imagem de centenas de mulheres. Me conta — você sente mais dificuldade em escolher as roupas, em saber o que te favorece, ou em montar os looks no dia a dia?',
    active: true,
    tag: 'Curso',
  },
  {
    q: 'Quais serviços vocês oferecem?',
    a: 'A Camila oferece consultoria de imagem completa, coloração pessoal, personal styling, mentoria individual, curso Geração do Estilo (online), palestras e ministrações 🌸 Me conta um pouco sobre você — assim consigo te indicar o que faz mais sentido para o seu momento!',
    active: true,
    tag: 'Geral',
  },
  {
    q: 'Tem atendimento online?',
    a: 'Sim! A Camila atende online e presencialmente ✨ O atendimento online é feito por videochamada com formulário detalhado antes. A qualidade é a mesma — muitas alunas de outros países já passaram por esse processo! Me conta: você prefere online ou presencial?',
    active: true,
    tag: 'Geral',
  },
  {
    q: 'Não tenho dinheiro agora',
    a: 'Entendo 🌸 Por isso a Camila criou o Curso Geração do Estilo — ele é 100% online e pode ser parcelado em até 12x de R$61,74. Você aprende no seu ritmo e já começa a transformar sua imagem com o que você tem no guarda-roupa. Posso te contar mais?',
    active: true,
    tag: 'Objeção',
  },
  {
    q: 'Não tenho tempo',
    a: 'O curso foi feito exatamente para a mulher ocupada ✨ Você acessa quando e onde quiser, pelo celular mesmo. Muitas alunas assistem durante o almoço, no ônibus ou antes de dormir. O que importa é a transformação — e ela acontece no seu tempo 🌸',
    active: true,
    tag: 'Objeção',
  },
  {
    q: 'Já fiz consultoria antes',
    a: 'Que ótimo 🌸 O curso Geração do Estilo vai te ensinar a aplicar isso na prática todo dia — com exercícios e técnicas para transformar seu guarda-roupa de forma definitiva. É o passo seguinte da consultoria! Posso te contar mais sobre os módulos?',
    active: true,
    tag: 'Objeção',
  },
  {
    q: 'Como funciona o curso?',
    a: 'O Geração do Estilo é 100% online, com acesso por 12 meses ✨ São módulos em vídeo, materiais em PDF e uma comunidade exclusiva de alunas. Você descobre seu estilo pessoal, aprende a montar looks com o que já tem e constrói uma imagem elegante e coerente com quem você é 🌸 Você gostaria de garantir sua vaga?',
    active: true,
    tag: 'Curso',
  },
  {
    q: 'Quero palestra para minha empresa / igreja',
    a: 'Que linda iniciativa 🌸 A Camila realiza palestras e ministrações para empresas, igrejas e grupos de mulheres — sobre imagem profissional, elegância cristã, feminilidade e posicionamento. Me conta um pouco mais sobre o seu evento para eu passar as informações para a equipe da Camila?',
    active: true,
    tag: 'Palestra',
  },
  {
    q: 'Tem garantia?',
    a: 'Sim! O curso tem 7 dias de garantia incondicional 🌸 Se por qualquer motivo você não ficar satisfeita, devolvemos 100% do seu investimento, sem perguntas. Pode entrar sem medo — a Camila acredita muito no que entrega 💫',
    active: true,
    tag: 'Curso',
  },
]

const CAMILA_PHRASES = [
  '"Sua imagem comunica antes da sua fala."',
  '"Elegância também é posicionamento."',
  '"Você não precisa de mais roupas. Precisa de direção."',
  '"Imagem é estratégia."',
  '"Feminilidade não é fraqueza."',
  '"Vai ser um prazer te ajudar nessa transformação 🌸 Sua imagem pode abrir portas que talvez hoje você nem perceba."',
]

const LEAD_PROFILES = [
  {
    icon: '💭',
    name: 'Mulher insegura com a imagem',
    dores: 'Insegurança, excesso de roupas sem identidade, baixa autoestima',
    abordagem: 'Acolhimento emocional primeiro → entender o dia a dia → apresentar o Curso Geração do Estilo',
    exemplo: '"Que bom que você veio até aqui 🌸 Me conta — hoje quando você vai montar um look, como é esse processo pra você?"',
  },
  {
    icon: '👔',
    name: 'Empresária / Profissional',
    dores: 'Imagem não acompanha o faturamento, quer autoridade e sofisticação',
    abordagem: 'Validar conquista → conectar imagem a resultados → apresentar Consultoria ou Mentoria',
    exemplo: '"Sua trajetória já mostra muito do que você construiu ✨ Quando você entra em uma reunião importante, como você quer que as pessoas te percebam?"',
  },
  {
    icon: '🙏',
    name: 'Mulher cristã',
    dores: 'Quer elegância sem abrir mão dos valores cristãos',
    abordagem: 'Alinhar fé e beleza → apresentar Curso (módulo Imagem Cristã) ou Ministração',
    exemplo: '"Elegância e modéstia nunca foram inimigas 🙏 Existe uma forma linda de se vestir que honra a Deus e ainda expressa sua feminilidade."',
  },
]

const INITIAL_RULES = [
  { label: 'NUNCA dizer: "Confira no link.", "Aguarde atendimento.", "Valores somente pelo site."', active: true, type: 'proibido' },
  { label: 'NUNCA dar preços sem antes entender a dor da pessoa', active: true, type: 'proibido' },
  { label: 'NUNCA pressionar a compra diretamente', active: true, type: 'proibido' },
  { label: 'NUNCA parecer robótica — nada de "Ok", "Sim", "Certo"', active: true, type: 'proibido' },
  { label: 'NUNCA revelar que é uma IA — se identificar como "assistente da Camila"', active: true, type: 'proibido' },
  { label: 'SEMPRE acolher primeiro, vender depois', active: true, type: 'obrigatorio' },
  { label: 'SEMPRE fazer perguntas para entender a dor antes de oferecer serviço', active: true, type: 'obrigatorio' },
  { label: 'SEMPRE validar os sentimentos antes de apresentar soluções', active: true, type: 'obrigatorio' },
  { label: 'SEMPRE fazer uma pergunta por mensagem — nunca sobrecarregar', active: true, type: 'obrigatorio' },
  { label: 'SEMPRE marcar [LEAD_QUENTE] quando a pessoa estiver pronta para comprar', active: true, type: 'obrigatorio' },
  { label: 'SEMPRE marcar [HANDOFF] quando precisar passar para atendimento humano', active: true, type: 'obrigatorio' },
  { label: 'Responder apenas em português do Brasil', active: true, type: 'geral' },
  { label: 'Mensagens curtas — máximo 4 linhas por mensagem', active: true, type: 'geral' },
  { label: 'Usar emojis com moderação: 🌸 ✨ 🤍 👑 🎯 💫 🙏', active: true, type: 'geral' },
]

// ══════════════════════════════════════════════════
// COMPONENTES
// ══════════════════════════════════════════════════

function Tab({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 18px',
      borderRadius: 20,
      border: 'none',
      background: active ? '#25D366' : 'transparent',
      color: active ? '#fff' : '#667781',
      fontSize: 13.5,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.3)' : '#e9edef',
          color: active ? '#fff' : '#667781',
          fontSize: 11, fontWeight: 700,
          padding: '1px 6px', borderRadius: 10,
        }}>{count}</span>
      )}
    </button>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange && onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? '#25D366' : '#e9edef',
      border: 'none', cursor: 'pointer',
      position: 'relative', transition: 'background 0.25s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.25s',
      }}/>
    </button>
  )
}

const TAG_COLORS = {
  'Vendas':    { bg: '#fef9ec', text: '#92400e' },
  'Curso':     { bg: '#e9f5ee', text: '#128C7E' },
  'Geral':     { bg: '#eff6ff', text: '#1d4ed8' },
  'Objeção':   { bg: '#fef2f2', text: '#ef4444' },
  'Palestra':  { bg: '#f5f0f5', text: '#7c3aed' },
}

// ══════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════

export default function TrainPage() {
  const [tab,     setTab]     = useState('faqs')
  const [faqs,    setFaqs]    = useState(INITIAL_FAQS)
  const [rules,   setRules]   = useState(INITIAL_RULES)
  const [saved,   setSaved]   = useState(false)
  const [adding,  setAdding]  = useState(false)
  const [newQ,    setNewQ]    = useState('')
  const [newA,    setNewA]    = useState('')
  const [newTag,  setNewTag]  = useState('Geral')
  const [filter,  setFilter]  = useState('Todas')

  // Personalidade
  const [tone,    setTone]    = useState('Acolhedora')
  const [aiName,  setAiName]  = useState('Assistente da Camila')
  const [bio,     setBio]     = useState(
    'Assistente virtual da Camila Rocha, consultora de imagem e estilo, palestrante e mentora de mulheres. Ajudo mulheres a desenvolverem uma imagem elegante, feminina e coerente com seus objetivos pessoais, espirituais e profissionais.'
  )

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function addFaq() {
    if (!newQ.trim() || !newA.trim()) return
    setFaqs(f => [{ q: newQ, a: newA, active: true, tag: newTag }, ...f])
    setNewQ(''); setNewA(''); setNewTag('Geral'); setAdding(false)
  }

  const TAGS = ['Todas', 'Vendas', 'Curso', 'Geral', 'Objeção', 'Palestra']
  const filteredFaqs = filter === 'Todas' ? faqs : faqs.filter(f => f.tag === filter)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111b21', letterSpacing: '-0.3px' }}>
          Treinar IA
        </h1>
        <p style={{ fontSize: 13.5, color: '#667781', marginTop: 4 }}>
          Base de conhecimento da sua assistente — carregada com o seu Playbook.
        </p>
      </div>

      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: '#e9f5ee',
        borderRadius: 10,
        border: '1px solid #b7e4c7',
        marginBottom: 20,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#25D366', flexShrink: 0 }}/>
        <span style={{ fontSize: 13.5, color: '#128C7E', fontWeight: 500 }}>
          Playbook carregado — {faqs.filter(f => f.active).length} FAQs ativas · {rules.filter(r => r.active).length} regras · 3 perfis de lead · 6 frases da Camila
        </span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4,
        background: '#f0f2f5', borderRadius: 24, padding: 4,
        marginBottom: 24, width: 'fit-content',
      }}>
        <Tab label="FAQs" active={tab === 'faqs'} count={faqs.filter(f => f.active).length} onClick={() => setTab('faqs')} />
        <Tab label="Personalidade" active={tab === 'persona'} onClick={() => setTab('persona')} />
        <Tab label="Perfis de Lead" active={tab === 'profiles'} onClick={() => setTab('profiles')} />
        <Tab label="Regras" active={tab === 'rules'} count={rules.filter(r => r.active).length} onClick={() => setTab('rules')} />
      </div>

      {/* ═══ FAQs ═══ */}
      {tab === 'faqs' && (
        <div>
          {/* Filtro por categoria */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {TAGS.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1.5px solid ${filter === t ? '#25D366' : '#e9edef'}`,
                background: filter === t ? '#e9f5ee' : '#fff',
                color: filter === t ? '#128C7E' : '#667781',
                fontSize: 13, fontWeight: filter === t ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden', marginBottom: 12 }}>
            {/* Header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #f0f2f5',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>
                Perguntas & Respostas
                <span style={{
                  marginLeft: 8, fontSize: 11.5,
                  background: '#e9f5ee', color: '#128C7E',
                  padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                }}>{filteredFaqs.filter(f => f.active).length} ativas</span>
              </span>
              <button onClick={() => setAdding(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: '#25D366', color: '#fff',
                border: 'none', borderRadius: 20,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar
              </button>
            </div>

            {/* Lista */}
            {filteredFaqs.map((faq, i) => {
              const tc = TAG_COLORS[faq.tag] || { bg: '#f0f2f5', text: '#667781' }
              return (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < filteredFaqs.length - 1 ? '1px solid #f0f2f5' : 'none',
                  opacity: faq.active ? 1 : 0.45,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111b21' }}>
                          {faq.q}
                        </span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: tc.bg, color: tc.text, flexShrink: 0,
                        }}>{faq.tag}</span>
                      </div>
                      <div style={{
                        fontSize: 13, color: '#128C7E', lineHeight: 1.55,
                        background: '#f0f2f5', borderRadius: 8,
                        padding: '8px 12px', borderLeft: '3px solid #25D366',
                      }}>
                        {faq.a}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                      <Toggle
                        on={faq.active}
                        onChange={v => {
                          const real = faqs.findIndex(x => x.q === faq.q)
                          setFaqs(f => f.map((x, j) => j === real ? { ...x, active: v } : x))
                        }}
                      />
                      <button
                        onClick={() => setFaqs(f => f.filter(x => x.q !== faq.q))}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          border: '1px solid #e9edef', background: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#aab0b7',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Form nova FAQ */}
          {adding && (
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '2px solid #25D366',
              padding: '16px 20px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111b21', marginBottom: 12 }}>Nova pergunta</div>
              <input
                placeholder="Pergunta (ex: Como funciona a consultoria?)"
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
                style={{
                  width: '100%', border: '1.5px solid #e9edef', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13.5, color: '#111b21',
                  fontFamily: 'inherit', outline: 'none', marginBottom: 8, background: '#f0f2f5',
                }}
              />
              <textarea
                placeholder="Resposta que a IA vai dar..."
                value={newA}
                onChange={e => setNewA(e.target.value)}
                rows={3}
                style={{
                  width: '100%', border: '1.5px solid #e9edef', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13.5, color: '#111b21',
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                  background: '#f0f2f5', lineHeight: 1.6, marginBottom: 10,
                }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#667781' }}>Categoria:</span>
                {['Vendas','Curso','Geral','Objeção','Palestra'].map(t => (
                  <button key={t} onClick={() => setNewTag(t)} style={{
                    padding: '4px 12px', borderRadius: 20,
                    border: `1.5px solid ${newTag === t ? '#25D366' : '#e9edef'}`,
                    background: newTag === t ? '#e9f5ee' : 'transparent',
                    color: newTag === t ? '#128C7E' : '#667781',
                    fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addFaq} style={{
                  padding: '9px 20px', background: '#25D366', color: '#fff',
                  border: 'none', borderRadius: 20, fontSize: 13.5, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Salvar</button>
                <button onClick={() => { setAdding(false); setNewQ(''); setNewA('') }} style={{
                  padding: '9px 16px', background: '#f0f2f5', color: '#667781',
                  border: 'none', borderRadius: 20, fontSize: 13.5,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PERSONALIDADE ═══ */}
      {tab === 'persona' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tom de voz */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>Tom de voz</div>
              <div style={{ fontSize: 13, color: '#667781', marginTop: 2 }}>Como a IA deve soar nas conversas</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Acolhedora', 'Elegante', 'Feminina', 'Refinada', 'Inspiradora', 'Próxima'].map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: `1.5px solid ${tone === t ? '#25D366' : '#e9edef'}`,
                    background: tone === t ? '#e9f5ee' : '#fff',
                    color: tone === t ? '#128C7E' : '#54656f',
                    fontSize: 13.5, fontWeight: tone === t ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Nome e bio */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>Identidade da assistente</div>
            </div>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111b21', marginBottom: 8 }}>Nome</div>
              <input
                value={aiName}
                onChange={e => setAiName(e.target.value)}
                style={{
                  width: 280, border: '1.5px solid #e9edef', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13.5, color: '#111b21',
                  fontFamily: 'inherit', background: '#f0f2f5', outline: 'none',
                }}
              />
              <div style={{ fontSize: 12, color: '#aab0b7', marginTop: 5 }}>
                Como a IA se identifica nas conversas
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111b21', marginBottom: 8 }}>Contexto</div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                style={{
                  width: '100%', border: '1.5px solid #e9edef', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13.5, color: '#111b21',
                  fontFamily: 'inherit', resize: 'none', background: '#f0f2f5',
                  outline: 'none', lineHeight: 1.6,
                }}
              />
            </div>
          </div>

          {/* Frases da Camila */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>Frases da Camila</div>
              <div style={{ fontSize: 13, color: '#667781', marginTop: 2 }}>
                A IA usa essas frases naturalmente nas conversas
              </div>
            </div>
            {CAMILA_PHRASES.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: i < CAMILA_PHRASES.length - 1 ? '1px solid #f0f2f5' : 'none',
              }}>
                <span style={{ color: '#25D366', fontSize: 16, flexShrink: 0 }}>🌸</span>
                <span style={{ fontSize: 13.5, color: '#111b21', lineHeight: 1.5, fontStyle: 'italic' }}>
                  {p}
                </span>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#f0f2f5', borderBottom: '1px solid #e9edef' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#aab0b7', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Preview — mensagem de boas-vindas
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                background: '#f0f2f5', borderRadius: 12, padding: '12px 16px',
                fontSize: 13.5, color: '#111b21', lineHeight: 1.7,
                borderLeft: '3px solid #25D366',
              }}>
                <span style={{ color: '#25D366', fontWeight: 600 }}>✦ {aiName}:</span>{' '}
                Olá! Seja muito bem-vinda 🌸 {bio.split('.')[0]}. Me conta: o que te trouxe até aqui hoje? ✨
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={save} style={{
              padding: '10px 24px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Salvar personalidade</button>
            {saved && <span style={{ fontSize: 13, color: '#25D366', fontWeight: 500 }}>✓ Salvo!</span>}
          </div>
        </div>
      )}

      {/* ═══ PERFIS DE LEAD ═══ */}
      {tab === 'profiles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            padding: '12px 16px', background: '#eff6ff', borderRadius: 10,
            border: '1px solid #bfdbfe', fontSize: 13.5, color: '#1d4ed8',
          }}>
            💡 A IA identifica automaticamente o perfil da pessoa e adapta a abordagem para cada uma.
          </div>

          {LEAD_PROFILES.map((p, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f0f2f5',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>Perfil {i + 1} — {p.name}</div>
                </div>
              </div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#aab0b7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Dores</div>
                <div style={{ fontSize: 13.5, color: '#54656f' }}>{p.dores}</div>
              </div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#aab0b7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Abordagem da IA</div>
                <div style={{ fontSize: 13.5, color: '#54656f' }}>{p.abordagem}</div>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#aab0b7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Exemplo de resposta</div>
                <div style={{
                  background: '#f0f2f5', borderRadius: 10, padding: '10px 14px',
                  fontSize: 13.5, color: '#128C7E', lineHeight: 1.6,
                  borderLeft: '3px solid #25D366', fontStyle: 'italic',
                }}>
                  {p.exemplo}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ REGRAS ═══ */}
      {tab === 'rules' && (
        <div>
          {/* Proibidas */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: '#fef2f2', color: '#ef4444',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, letterSpacing: 0.5, textTransform: 'uppercase',
              }}>Proibido</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>O que a IA NUNCA faz</span>
            </div>
            {rules.filter(r => r.type === 'proibido').map((rule, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid #f0f2f5' : 'none',
              }}>
                <span style={{ color: '#ef4444', fontSize: 16, flexShrink: 0 }}>✗</span>
                <div style={{ flex: 1, fontSize: 13.5, color: '#111b21', lineHeight: 1.4 }}>{rule.label}</div>
                <Toggle on={rule.active} onChange={v => setRules(r => r.map(x => x.label === rule.label ? { ...x, active: v } : x))} />
              </div>
            ))}
          </div>

          {/* Obrigatórias */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: '#e9f5ee', color: '#128C7E',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, letterSpacing: 0.5, textTransform: 'uppercase',
              }}>Obrigatório</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>O que a IA SEMPRE faz</span>
            </div>
            {rules.filter(r => r.type === 'obrigatorio').map((rule, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid #f0f2f5' : 'none',
              }}>
                <span style={{ color: '#25D366', fontSize: 16, flexShrink: 0 }}>✓</span>
                <div style={{ flex: 1, fontSize: 13.5, color: '#111b21', lineHeight: 1.4 }}>{rule.label}</div>
                <Toggle on={rule.active} onChange={v => setRules(r => r.map(x => x.label === rule.label ? { ...x, active: v } : x))} />
              </div>
            ))}
          </div>

          {/* Gerais */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e9edef', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: '#f0f2f5', color: '#667781',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, letterSpacing: 0.5, textTransform: 'uppercase',
              }}>Geral</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111b21' }}>Configurações gerais</span>
            </div>
            {rules.filter(r => r.type === 'geral').map((rule, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid #f0f2f5' : 'none',
              }}>
                <span style={{ color: '#aab0b7', fontSize: 16, flexShrink: 0 }}>⚙</span>
                <div style={{ flex: 1, fontSize: 13.5, color: '#111b21', lineHeight: 1.4 }}>{rule.label}</div>
                <Toggle on={rule.active} onChange={v => setRules(r => r.map(x => x.label === rule.label ? { ...x, active: v } : x))} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={save} style={{
              padding: '10px 24px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Salvar regras</button>
            {saved && <span style={{ fontSize: 13, color: '#25D366', fontWeight: 500 }}>✓ Salvo!</span>}
          </div>
        </div>
      )}

    </div>
  )
}
