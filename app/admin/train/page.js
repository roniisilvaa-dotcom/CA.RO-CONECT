'use client'
import { useState } from 'react'

// ══════════════════════════════════════════════════
// DADOS DO PLAYBOOK — CAMILA ROCHA
// ══════════════════════════════════════════════════

const INITIAL_FAQS = [
  { q: 'Quanto custa a consultoria?', a: 'Claro 🌸 Antes de te explicar os formatos disponíveis, me conta uma coisa: hoje qual é sua maior dificuldade com sua imagem?', active: true, tag: 'Vendas' },
  { q: 'Quero saber sobre o curso', a: 'Que alegria te ver por aqui ✨ O Geração do Estilo já transformou a imagem de centenas de mulheres. Me conta — você sente mais dificuldade em escolher as roupas, em saber o que te favorece, ou em montar os looks no dia a dia?', active: true, tag: 'Curso' },
  { q: 'Quais serviços vocês oferecem?', a: 'A Camila oferece consultoria de imagem completa, coloração pessoal, personal styling, mentoria individual, curso Geração do Estilo (online), palestras e ministrações 🌸 Me conta um pouco sobre você — assim consigo te indicar o que faz mais sentido para o seu momento!', active: true, tag: 'Geral' },
  { q: 'Tem atendimento online?', a: 'Sim! A Camila atende online e presencialmente ✨ O atendimento online é feito por videochamada com formulário detalhado antes. A qualidade é a mesma — muitas alunas de outros países já passaram por esse processo! Me conta: você prefere online ou presencial?', active: true, tag: 'Geral' },
  { q: 'Não tenho dinheiro agora', a: 'Entendo 🌸 Por isso a Camila criou o Curso Geração do Estilo — ele é 100% online e pode ser parcelado em até 12x de R$61,74. Você aprende no seu ritmo e já começa a transformar sua imagem com o que você tem no guarda-roupa. Posso te contar mais?', active: true, tag: 'Objeção' },
  { q: 'Não tenho tempo', a: 'O curso foi feito exatamente para a mulher ocupada ✨ Você acessa quando e onde quiser, pelo celular mesmo. Muitas alunas assistem durante o almoço, no ônibus ou antes de dormir. O que importa é a transformação — e ela acontece no seu tempo 🌸', active: true, tag: 'Objeção' },
  { q: 'Já fiz consultoria antes', a: 'Que ótimo 🌸 O curso Geração do Estilo vai te ensinar a aplicar isso na prática todo dia — com exercícios e técnicas para transformar seu guarda-roupa de forma definitiva. É o passo seguinte da consultoria! Posso te contar mais sobre os módulos?', active: true, tag: 'Objeção' },
  { q: 'Como funciona o curso?', a: 'O Geração do Estilo é 100% online, com acesso por 12 meses ✨ São módulos em vídeo, materiais em PDF e uma comunidade exclusiva de alunas. Você descobre seu estilo pessoal, aprende a montar looks com o que já tem e constrói uma imagem elegante e coerente com quem você é 🌸 Você gostaria de garantir sua vaga?', active: true, tag: 'Curso' },
  { q: 'Quero palestra para minha empresa / igreja', a: 'Que linda iniciativa 🌸 A Camila realiza palestras e ministrações para empresas, igrejas e grupos de mulheres — sobre imagem profissional, elegância cristã, feminilidade e posicionamento. Me conta um pouco mais sobre o seu evento para eu passar as informações para a equipe da Camila?', active: true, tag: 'Palestra' },
  { q: 'Tem garantia?', a: 'Sim! O curso tem 7 dias de garantia incondicional 🌸 Se por qualquer motivo você não ficar satisfeita, devolvemos 100% do seu investimento, sem perguntas. Pode entrar sem medo — a Camila acredita muito no que entrega 💫', active: true, tag: 'Curso' },
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
  { icon: '💭', name: 'Mulher insegura com a imagem', dores: 'Insegurança, excesso de roupas sem identidade, baixa autoestima', abordagem: 'Acolhimento emocional primeiro → entender o dia a dia → apresentar o Curso Geração do Estilo', exemplo: '"Que bom que você veio até aqui 🌸 Me conta — hoje quando você vai montar um look, como é esse processo pra você?"' },
  { icon: '👔', name: 'Empresária / Profissional', dores: 'Imagem não acompanha o faturamento, quer autoridade e sofisticação', abordagem: 'Validar conquista → conectar imagem a resultados → apresentar Consultoria ou Mentoria', exemplo: '"Sua trajetória já mostra muito do que você construiu ✨ Quando você entra em uma reunião importante, como você quer que as pessoas te percebam?"' },
  { icon: '🙏', name: 'Mulher cristã', dores: 'Quer elegância sem abrir mão dos valores cristãos', abordagem: 'Alinhar fé e beleza → apresentar Curso (módulo Imagem Cristã) ou Ministração', exemplo: '"Elegância e modéstia nunca foram inimigas 🙏 Existe uma forma linda de se vestir que honra a Deus e ainda expressa sua feminilidade."' },
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
// ESTILOS BASE
// ══════════════════════════════════════════════════

const INPUT_STYLE = {
  width: '100%',
  border: '1.5px solid #d1d5db',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13.5,
  color: '#111b21',
  fontFamily: 'inherit',
  outline: 'none',
  background: '#f9fafb',
  lineHeight: 1.6,
}

const TAG_COLORS = {
  'Vendas':   { bg: '#fef9ec', text: '#92400e' },
  'Curso':    { bg: '#e9f5ee', text: '#128C7E' },
  'Geral':    { bg: '#eff6ff', text: '#1d4ed8' },
  'Objeção':  { bg: '#fef2f2', text: '#dc2626' },
  'Palestra': { bg: '#f5f0f5', text: '#7c3aed' },
}

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
      color: active ? '#fff' : '#374151',
      fontSize: 13.5,
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
          color: active ? '#fff' : '#374151',
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
      background: on ? '#25D366' : '#d1d5db',
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

// Ícone de lápis
function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

// Ícone de lixo
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function ActionBtn({ onClick, title, children, color = '#4b5563', bg = '#f3f4f6', hoverBg = '#e5e7eb' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 7,
        border: '1px solid #e5e7eb',
        background: bg,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
      onMouseLeave={e => { e.currentTarget.style.background = bg }}
    >
      {children}
    </button>
  )
}

// ══════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════

export default function TrainPage() {
  const [tab,    setTab]    = useState('faqs')
  const [faqs,   setFaqs]   = useState(INITIAL_FAQS)
  const [rules,  setRules]  = useState(INITIAL_RULES)
  const [saved,  setSaved]  = useState(false)
  const [adding, setAdding] = useState(false)
  const [newQ,   setNewQ]   = useState('')
  const [newA,   setNewA]   = useState('')
  const [newTag, setNewTag] = useState('Geral')
  const [filter, setFilter] = useState('Todas')

  // Edição de FAQ
  const [editIdx,  setEditIdx]  = useState(null)  // índice global na lista filtrada
  const [editQ,    setEditQ]    = useState('')
  const [editA,    setEditA]    = useState('')
  const [editTag,  setEditTag]  = useState('Geral')

  // Edição de Regra
  const [editRuleIdx,   setEditRuleIdx]   = useState(null)
  const [editRuleLabel, setEditRuleLabel] = useState('')

  // Personalidade
  const [tone,   setTone]   = useState('Acolhedora')
  const [aiName, setAiName] = useState('Assistente da Camila')
  const [bio,    setBio]    = useState('Assistente virtual da Camila Rocha, consultora de imagem e estilo, palestrante e mentora de mulheres. Ajudo mulheres a desenvolverem uma imagem elegante, feminina e coerente com seus objetivos pessoais, espirituais e profissionais.')

  // Frases editáveis
  const [phrases, setPhrases] = useState(CAMILA_PHRASES)
  const [editPhraseIdx, setEditPhraseIdx] = useState(null)
  const [editPhraseVal, setEditPhraseVal] = useState('')

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function addFaq() {
    if (!newQ.trim() || !newA.trim()) return
    setFaqs(f => [{ q: newQ, a: newA, active: true, tag: newTag }, ...f])
    setNewQ(''); setNewA(''); setNewTag('Geral'); setAdding(false)
  }

  function startEditFaq(faq, globalIdx) {
    setEditIdx(globalIdx)
    setEditQ(faq.q)
    setEditA(faq.a)
    setEditTag(faq.tag)
  }

  function saveEditFaq(globalIdx) {
    setFaqs(f => f.map((x, i) => i === globalIdx ? { ...x, q: editQ, a: editA, tag: editTag } : x))
    setEditIdx(null)
  }

  function startEditRule(idx) {
    setEditRuleIdx(idx)
    setEditRuleLabel(rules[idx].label)
  }

  function saveEditRule(idx) {
    setRules(r => r.map((x, i) => i === idx ? { ...x, label: editRuleLabel } : x))
    setEditRuleIdx(null)
  }

  function startEditPhrase(idx) {
    setEditPhraseIdx(idx)
    setEditPhraseVal(phrases[idx])
  }

  function saveEditPhrase(idx) {
    setPhrases(p => p.map((x, i) => i === idx ? editPhraseVal : x))
    setEditPhraseIdx(null)
  }

  const TAGS = ['Todas', 'Vendas', 'Curso', 'Geral', 'Objeção', 'Palestra']
  const filteredFaqs = filter === 'Todas' ? faqs : faqs.filter(f => f.tag === filter)

  // Mapa de índice filtrado → global
  function getGlobalIdx(faq) {
    return faqs.findIndex(x => x === faq)
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111b21', letterSpacing: '-0.3px' }}>
          Treinar IA
        </h1>
        <p style={{ fontSize: 13.5, color: '#4b5563', marginTop: 4 }}>
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
        <span style={{ fontSize: 13.5, color: '#0a5c44', fontWeight: 500 }}>
          Playbook carregado — {faqs.filter(f => f.active).length} FAQs ativas · {rules.filter(r => r.active).length} regras · 3 perfis de lead · {phrases.length} frases da Camila
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
          {/* Filtro */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {TAGS.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1.5px solid ${filter === t ? '#25D366' : '#d1d5db'}`,
                background: filter === t ? '#e9f5ee' : '#fff',
                color: filter === t ? '#0a5c44' : '#374151',
                fontSize: 13, fontWeight: filter === t ? 600 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
            {/* Header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>
                Perguntas & Respostas
                <span style={{
                  marginLeft: 8, fontSize: 11.5,
                  background: '#e9f5ee', color: '#0a5c44',
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

            {/* Lista de FAQs */}
            {filteredFaqs.map((faq, fi) => {
              const globalIdx = getGlobalIdx(faq)
              const isEditing = editIdx === globalIdx
              const tc = TAG_COLORS[faq.tag] || { bg: '#f3f4f6', text: '#374151' }
              return (
                <div key={globalIdx} style={{
                  padding: '14px 20px',
                  borderBottom: fi < filteredFaqs.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: isEditing ? '#fafffe' : 'transparent',
                  opacity: faq.active ? 1 : 0.5,
                }}>
                  {isEditing ? (
                    /* ── MODO EDIÇÃO ── */
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7a85', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Editando</div>
                      <input
                        value={editQ}
                        onChange={e => setEditQ(e.target.value)}
                        placeholder="Pergunta"
                        style={{ ...INPUT_STYLE, marginBottom: 8, fontWeight: 600 }}
                        onFocus={e => e.target.style.borderColor = '#25D366'}
                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                        autoFocus
                      />
                      <textarea
                        value={editA}
                        onChange={e => setEditA(e.target.value)}
                        placeholder="Resposta da IA"
                        rows={3}
                        style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: 10 }}
                        onFocus={e => e.target.style.borderColor = '#25D366'}
                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                      />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Categoria:</span>
                        {['Vendas','Curso','Geral','Objeção','Palestra'].map(t => (
                          <button key={t} onClick={() => setEditTag(t)} style={{
                            padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                            border: `1.5px solid ${editTag === t ? '#25D366' : '#d1d5db'}`,
                            background: editTag === t ? '#e9f5ee' : 'transparent',
                            color: editTag === t ? '#0a5c44' : '#374151',
                            fontSize: 12.5, fontWeight: editTag === t ? 600 : 500,
                          }}>{t}</button>
                        ))}
                        <div style={{ flex: 1 }} />
                        <button onClick={() => saveEditFaq(globalIdx)} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 16px', background: '#25D366', color: '#fff',
                          border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}><IconCheck /> Salvar</button>
                        <button onClick={() => setEditIdx(null)} style={{
                          padding: '7px 14px', background: '#f3f4f6', color: '#374151',
                          border: '1px solid #d1d5db', borderRadius: 20, fontSize: 13,
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                        }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    /* ── MODO VISUALIZAÇÃO ── */
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111b21' }}>{faq.q}</span>
                          <span style={{
                            fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: tc.bg, color: tc.text, flexShrink: 0,
                          }}>{faq.tag}</span>
                        </div>
                        <div style={{
                          fontSize: 13.5, color: '#1a6b5a', lineHeight: 1.6,
                          background: '#f0faf6', borderRadius: 8,
                          padding: '9px 12px', borderLeft: '3px solid #25D366',
                        }}>
                          {faq.a}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                        <Toggle on={faq.active} onChange={v => setFaqs(f => f.map((x, i) => i === globalIdx ? { ...x, active: v } : x))} />
                        <ActionBtn onClick={() => startEditFaq(faq, globalIdx)} title="Editar" color="#128C7E" bg="#e9f5ee" hoverBg="#d1f0e5">
                          <IconEdit />
                        </ActionBtn>
                        <ActionBtn onClick={() => setFaqs(f => f.filter((_, i) => i !== globalIdx))} title="Excluir" color="#dc2626" bg="#fef2f2" hoverBg="#fee2e2">
                          <IconTrash />
                        </ActionBtn>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Form nova FAQ */}
          {adding && (
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '2px solid #25D366', padding: '16px 20px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111b21', marginBottom: 12 }}>Nova pergunta</div>
              <input
                placeholder="Pergunta (ex: Como funciona a consultoria?)"
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
                style={{ ...INPUT_STYLE, marginBottom: 8 }}
                onFocus={e => e.target.style.borderColor = '#25D366'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                autoFocus
              />
              <textarea
                placeholder="Resposta que a IA vai dar..."
                value={newA}
                onChange={e => setNewA(e.target.value)}
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: 10 }}
                onFocus={e => e.target.style.borderColor = '#25D366'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Categoria:</span>
                {['Vendas','Curso','Geral','Objeção','Palestra'].map(t => (
                  <button key={t} onClick={() => setNewTag(t)} style={{
                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                    border: `1.5px solid ${newTag === t ? '#25D366' : '#d1d5db'}`,
                    background: newTag === t ? '#e9f5ee' : 'transparent',
                    color: newTag === t ? '#0a5c44' : '#374151',
                    fontSize: 12.5, fontWeight: newTag === t ? 600 : 500,
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
                  padding: '9px 16px', background: '#f3f4f6', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: 20, fontSize: 13.5, fontWeight: 500,
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
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>Tom de voz</div>
              <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>Como a IA deve soar nas conversas</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Acolhedora', 'Elegante', 'Feminina', 'Refinada', 'Inspiradora', 'Próxima'].map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: `1.5px solid ${tone === t ? '#25D366' : '#d1d5db'}`,
                    background: tone === t ? '#e9f5ee' : '#fff',
                    color: tone === t ? '#0a5c44' : '#374151',
                    fontSize: 13.5, fontWeight: tone === t ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Identidade */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>Identidade da assistente</div>
            </div>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Nome</div>
              <input
                value={aiName}
                onChange={e => setAiName(e.target.value)}
                style={{ ...INPUT_STYLE, width: 280 }}
                onFocus={e => e.target.style.borderColor = '#25D366'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>Como a IA se identifica nas conversas</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Contexto</div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                style={{ ...INPUT_STYLE, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#25D366'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>

          {/* Frases da Camila — editáveis */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>Frases da Camila</div>
                <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>A IA usa essas frases naturalmente nas conversas</div>
              </div>
            </div>
            {phrases.map((p, i) => (
              <div key={i} style={{
                padding: '12px 20px',
                borderBottom: i < phrases.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                {editPhraseIdx === i ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#25D366', fontSize: 16, paddingTop: 8, flexShrink: 0 }}>🌸</span>
                    <input
                      value={editPhraseVal}
                      onChange={e => setEditPhraseVal(e.target.value)}
                      style={{ ...INPUT_STYLE, flex: 1, fontStyle: 'italic' }}
                      onFocus={e => e.target.style.borderColor = '#25D366'}
                      onBlur={e => e.target.style.borderColor = '#d1d5db'}
                      autoFocus
                    />
                    <ActionBtn onClick={() => saveEditPhrase(i)} title="Salvar" color="#128C7E" bg="#e9f5ee" hoverBg="#d1f0e5"><IconCheck /></ActionBtn>
                    <ActionBtn onClick={() => setEditPhraseIdx(null)} title="Cancelar" color="#374151" bg="#f3f4f6" hoverBg="#e5e7eb"><IconX /></ActionBtn>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#25D366', fontSize: 16, flexShrink: 0 }}>🌸</span>
                    <span style={{ fontSize: 13.5, color: '#1f2937', lineHeight: 1.5, fontStyle: 'italic', flex: 1 }}>{p}</span>
                    <ActionBtn onClick={() => startEditPhrase(i)} title="Editar" color="#128C7E" bg="#e9f5ee" hoverBg="#d1f0e5"><IconEdit /></ActionBtn>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Preview */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7a85', letterSpacing: 0.5, textTransform: 'uppercase' }}>Preview — mensagem de boas-vindas</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ background: '#f0faf6', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, color: '#111b21', lineHeight: 1.7, borderLeft: '3px solid #25D366' }}>
                <span style={{ color: '#0a5c44', fontWeight: 700 }}>✦ {aiName}:</span>{' '}
                Olá! Seja muito bem-vinda 🌸 {bio.split('.')[0]}. Me conta: o que te trouxe até aqui hoje? ✨
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={save} style={{
              padding: '10px 24px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Salvar personalidade</button>
            {saved && <span style={{ fontSize: 13.5, color: '#0a5c44', fontWeight: 600 }}>✓ Salvo!</span>}
          </div>
        </div>
      )}

      {/* ═══ PERFIS DE LEAD ═══ */}
      {tab === 'profiles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 13.5, color: '#1d4ed8', fontWeight: 500 }}>
            💡 A IA identifica automaticamente o perfil da pessoa e adapta a abordagem para cada uma.
          </div>
          {LEAD_PROFILES.map((p, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>Perfil {i + 1} — {p.name}</div>
              </div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7a85', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Dores</div>
                <div style={{ fontSize: 13.5, color: '#374151' }}>{p.dores}</div>
              </div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7a85', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Abordagem da IA</div>
                <div style={{ fontSize: 13.5, color: '#374151' }}>{p.abordagem}</div>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7a85', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Exemplo de resposta</div>
                <div style={{ background: '#f0faf6', borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: '#1a6b5a', lineHeight: 1.6, borderLeft: '3px solid #25D366', fontStyle: 'italic' }}>
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
          {[
            { type: 'proibido', label: 'Proibido', desc: 'O que a IA NUNCA faz', icon: '✗', iconColor: '#dc2626', tagBg: '#fef2f2', tagColor: '#dc2626' },
            { type: 'obrigatorio', label: 'Obrigatório', desc: 'O que a IA SEMPRE faz', icon: '✓', iconColor: '#16a34a', tagBg: '#dcfce7', tagColor: '#16a34a' },
            { type: 'geral', label: 'Geral', desc: 'Configurações gerais', icon: '⚙', iconColor: '#4b5563', tagBg: '#f3f4f6', tagColor: '#4b5563' },
          ].map(section => (
            <div key={section.type} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: section.tagBg, color: section.tagColor, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {section.label}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>{section.desc}</span>
              </div>
              {rules.filter(r => r.type === section.type).map((rule, ri) => {
                const globalRuleIdx = rules.findIndex(x => x === rule)
                const isEditingRule = editRuleIdx === globalRuleIdx
                return (
                  <div key={ri} style={{
                    padding: '12px 20px',
                    borderBottom: ri < rules.filter(r => r.type === section.type).length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: isEditingRule ? '#fafffe' : 'transparent',
                  }}>
                    {isEditingRule ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: section.iconColor, fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
                        <input
                          value={editRuleLabel}
                          onChange={e => setEditRuleLabel(e.target.value)}
                          style={{ ...INPUT_STYLE, flex: 1 }}
                          onFocus={e => e.target.style.borderColor = '#25D366'}
                          onBlur={e => e.target.style.borderColor = '#d1d5db'}
                          autoFocus
                        />
                        <ActionBtn onClick={() => saveEditRule(globalRuleIdx)} title="Salvar" color="#128C7E" bg="#e9f5ee" hoverBg="#d1f0e5"><IconCheck /></ActionBtn>
                        <ActionBtn onClick={() => setEditRuleIdx(null)} title="Cancelar" color="#374151" bg="#f3f4f6" hoverBg="#e5e7eb"><IconX /></ActionBtn>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: section.iconColor, fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
                        <div style={{ flex: 1, fontSize: 13.5, color: '#1f2937', lineHeight: 1.4, fontWeight: 500 }}>{rule.label}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Toggle on={rule.active} onChange={v => setRules(r => r.map(x => x === rule ? { ...x, active: v } : x))} />
                          <ActionBtn onClick={() => startEditRule(globalRuleIdx)} title="Editar" color="#128C7E" bg="#e9f5ee" hoverBg="#d1f0e5"><IconEdit /></ActionBtn>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={save} style={{
              padding: '10px 24px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Salvar regras</button>
            {saved && <span style={{ fontSize: 13.5, color: '#0a5c44', fontWeight: 600 }}>✓ Salvo!</span>}
          </div>
        </div>
      )}
    </div>
  )
}
