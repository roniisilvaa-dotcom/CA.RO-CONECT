import { NextResponse } from 'next/server'
import sql from '../../../lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { sendText } from '../../../lib/whatsapp'
import { sendInstagramDM } from '../../../lib/instagram'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { conversationId, tenantId, message, phone, channel, psid } = await request.json()

    if (!conversationId || !tenantId) {
      return NextResponse.json({ error: 'conversationId e tenantId obrigatórios' }, { status: 400 })
    }

    // Buscar config do agente (suporta schema antigo e novo)
    const [agentConfig] = await sql`
      SELECT system_prompt, agent_persona, ai_enabled
      FROM agent_configs WHERE tenant_id = ${tenantId} LIMIT 1
    `
    if (!agentConfig) {
      console.warn('Nenhum agent_config para tenant:', tenantId)
      return NextResponse.json({ error: 'Sem configuração de agente' }, { status: 404 })
    }

    // Se IA desativada, não responde
    if (agentConfig.ai_enabled === false) {
      return NextResponse.json({ status: 'ai_disabled' })
    }

    // system_prompt novo ou agent_persona antigo
    const systemPrompt = agentConfig.system_prompt || agentConfig.agent_persona ||
      'Você é um assistente virtual prestativo e cordial.'

    // Histórico de conversa (últimas 20 mensagens)
    const history = await sql`
      SELECT role, content FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC LIMIT 20
    `

    // Base de conhecimento do tenant
    const knowledgeDocs = await sql`
      SELECT content FROM knowledge_base
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC LIMIT 5
    `
    const knowledge = knowledgeDocs.map(d => d.content).join('\n\n---\n\n')
    const fullSystem = systemPrompt + (knowledge
      ? `\n\n## BASE DE CONHECIMENTO:\n${knowledge}`
      : '')

    // Montar array de mensagens para Claude
    const claudeMessages = history
      .reverse()
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

    // Garantir que última mensagem seja do usuário
    if (!claudeMessages.length || claudeMessages[claudeMessages.length - 1].role !== 'user') {
      claudeMessages.push({ role: 'user', content: message })
    }

    // Chamar Claude
    const aiResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: fullSystem,
      messages: claudeMessages,
    })

    const aiText = aiResponse.content[0]?.text?.trim()
    if (!aiText) {
      console.error('Resposta vazia da IA')
      return NextResponse.json({ error: 'Resposta vazia' }, { status: 500 })
    }

    // Enviar pelo canal correto
    const convChannel = channel || 'whatsapp'
    if (convChannel === 'instagram' && psid) {
      await sendInstagramDM(psid, aiText)
    } else if (phone) {
      await sendText(phone, aiText)
    }

    // Salvar resposta da IA no banco
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content)
      VALUES (${tenantId}, ${conversationId}, 'assistant', ${aiText})
    `
    await sql`UPDATE conversations SET updated_at = NOW() WHERE id = ${conversationId}`

    console.log(`🤖 IA respondeu (${convChannel}):`, aiText.slice(0, 80))
    return NextResponse.json({ ok: true, response: aiText })
  } catch (err) {
    console.error('❌ AI response error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
