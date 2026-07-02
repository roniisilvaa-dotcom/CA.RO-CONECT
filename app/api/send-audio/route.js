import { NextResponse } from 'next/server'
import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio')
    const conversationId = formData.get('conversationId')

    if (!audio || !conversationId) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const [conv] = await sql`
      SELECT c.*, l.phone FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = ${conversationId}
    `
    if (!conv) return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })

    const phoneNumberId = process.env.META_PHONE_NUMBER_ID
    const token = process.env.META_WHATSAPP_TOKEN

    // 1. Upload áudio para Meta
    const uploadFormData = new FormData()
    uploadFormData.append('file', audio, 'voice.webm')
    uploadFormData.append('messaging_product', 'whatsapp')

    const uploadRes = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      }
    )
    const uploadData = await uploadRes.json()
    if (!uploadRes.ok) {
      throw new Error(uploadData.error?.message || 'Erro ao fazer upload do áudio')
    }
    const mediaId = uploadData.id

    // 2. Enviar mensagem de áudio
    const sendRes = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: conv.phone,
          type: 'audio',
          audio: { id: mediaId },
        }),
      }
    )
    const sendData = await sendRes.json()
    if (!sendRes.ok) {
      throw new Error(sendData.error?.message || 'Erro ao enviar áudio')
    }

    // 3. Salvar no banco
    const [msg] = await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content)
      VALUES (${conv.tenant_id}, ${conversationId}, 'assistant', '🎤 [Áudio da Camila]')
      RETURNING id, created_at
    `

    return NextResponse.json({ success: true, messageId: msg.id, created_at: msg.created_at })
  } catch (err) {
    console.error('Erro send-audio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
