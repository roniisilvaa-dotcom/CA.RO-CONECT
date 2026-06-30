import Anthropic from '@anthropic-ai/sdk'
import { getHistory, addMessage } from './redis'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(config) {
  const services = (config.services || [])
    .map((s) => `• ${s.name}: ${s.description}${s.price ? ` — ${s.price}` : ''}`)
    .join('\n')

  return `
Você é ${config.agent_name}, assistente virtual do negócio abaixo.

══ NEGÓCIO ══
${config.business_description}

══ PERSONALIDADE ══
${config.agent_persona}

══ SERVIÇOS ══
${services}

══ BASE DE CONHECIMENTO ══
${config.knowledge_base || ''}

══ REGRAS ══
1. Responda em português, de forma natural e humanizada
2. Mensagens curtas — máximo 3 parágrafos curtos
3. Use emojis com moderação
4. Quando o lead estiver QUENTE (quer comprar agora), adicione ao final: [LEAD_QUENTE]
5. Quando precisar de humano, adicione ao final: [HANDOFF]
6. Para confirmar agendamento, adicione: [AGENDAMENTO: serviço | data | hora]
7. Nunca invente preços ou informações que não estão aqui
8. Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
`.trim()
}

export async function processMessage({ tenantId, phone, userMessage, agentConfig }) {
  const history = await getHistory(tenantId, phone)
  await addMessage(tenantId, phone, 'user', userMessage)

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: buildSystemPrompt(agentConfig),
    messages: [...history, { role: 'user', content: userMessage }],
  })

  const raw = response.content[0].text
  await addMessage(tenantId, phone, 'assistant', raw)

  const signals = {
    isHotLead: raw.includes('[LEAD_QUENTE]'),
    needsHandoff: raw.includes('[HANDOFF]'),
    hasAppointment: raw.includes('[AGENDAMENTO:'),
  }

  let appointmentData = null
  if (signals.hasAppointment) {
    const match = raw.match(/\[AGENDAMENTO:\s*(.+?)\]/)
    if (match) {
      const [service, date, time] = match[1].split('|').map((s) => s.trim())
      appointmentData = { service, date, time }
    }
  }

  const message = raw
    .replace(/\[LEAD_QUENTE\]/g, '')
    .replace(/\[HANDOFF\]/g, '')
    .replace(/\[AGENDAMENTO:[^\]]+\]/g, '')
    .trim()

  return { message, signals, appointmentData }
}
