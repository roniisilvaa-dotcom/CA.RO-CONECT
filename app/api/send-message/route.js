import { NextResponse } from 'next/server'
import sql from '../../../lib/db'
import { sendText } from '../../../lib/whatsapp'
import { sendInstagramDM } from '../../../lib/instagram'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { conversationId, message } = await request.json()

    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ error: 'conversationId e message são obrigatórios' }, { status: 400 })
    }

    // Busca conversa + lead
    const [conv] = await sql`
      SELECT c.*, l.phone, l.tenant_id
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = ${conversationId}
    `
    if (!conv) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    const channel = conv.channel || 'whatsapp'
    const trimmed = message.trim()

    // Envia pela plataforma certa
    if (channel === 'instagram') {
      // channel_conversation_id guarda o PSID do Instagram
      const psid = conv.channel_conversation_id
      await sendInstagramDM(psid, trimmed)
    } else {
      // WhatsApp — phone pode ser "ig_xxx" para Instagram ou número direto
      const phone = conv.phone?.startsWith('ig_') ? conv.channel_conversation_id : conv.phone
      await sendText(phone, trimmed)
    }

    // Salva no banco como mensagem do assistente (enviada pela Camila manualmente)
    const [saved] = await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content)
      VALUES (${conv.tenant_id}, ${conversationId}, 'assistant', ${trimmed})
      RETURNING id, created_at
    `

    // Garante que a conversa fica aberta
    await sql`
      UPDATE conversations SET status = 'open', updated_at = NOW()
      WHERE id = ${conversationId}
    `

    return NextResponse.json({ ok: true, messageId: saved.id, created_at: saved.created_at })
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
