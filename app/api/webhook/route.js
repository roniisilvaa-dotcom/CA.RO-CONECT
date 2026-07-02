import { NextResponse } from 'next/server'
import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

// ── GET: Verificação Meta ──────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && (token === process.env.META_VERIFY_TOKEN || token === 'caroconnect2024')) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// ── POST: Receber mensagens ────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json()

    // Instagram
    if (body.object === 'instagram') {
      return handleInstagram(body)
    }

    // WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' })
    }

    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const field = change?.field

    if (!value?.messages?.length) {
      return NextResponse.json({ status: 'no_messages' })
    }

    const message = value.messages[0]
    const phoneNumberId = value.metadata?.phone_number_id

    // ── COEXISTENCE: Mensagem enviada pelo celular do cliente ─────
    // Quando Coexistence está ativo, mensagens enviadas pelo app WhatsApp Business
    // chegam com field = 'smb_message_echoes'. Salvamos como human_agent.
    if (field === 'smb_message_echoes') {
      return handlePhoneEcho(message, phoneNumberId, value)
    }

    // Também pode chegar com from = número do negócio (echo alternativo)
    // Detectamos pelo campo 'to' (mensagem de saída tem 'to' com o destinatário)
    if (message.to) {
      return handlePhoneEcho(message, phoneNumberId, value)
    }

    const fromPhone = message.from
    const messageId = message.id

    // Ignorar status/reactions
    if (message.type === 'reaction' || message.status) {
      return NextResponse.json({ status: 'ignored' })
    }

    // Extrair conteúdo
    const content = extractContent(message)

    // Buscar tenant pelo phoneNumberId
    const tenant_id = await findTenantId(phoneNumberId)
    if (!tenant_id) {
      console.error('Nenhum tenant para phoneNumberId:', phoneNumberId)
      return NextResponse.json({ status: 'tenant_not_found' })
    }

    // Buscar agent config
    const [agentConfig] = await sql`
      SELECT * FROM agent_configs WHERE tenant_id = ${tenant_id} LIMIT 1
    `

    // Buscar ou criar lead
    const lead = await findOrCreateLead(tenant_id, fromPhone)

    // Buscar ou criar conversa (evita duplicatas com status != 'closed')
    const { convId, aiEnabled } = await findOrCreateConversation(tenant_id, lead.id, 'whatsapp')

    // Idempotência
    const existing = await sql`
      SELECT id FROM messages WHERE whatsapp_message_id = ${messageId} LIMIT 1
    `
    if (existing.length) {
      return NextResponse.json({ status: 'duplicate' })
    }

    // Salvar mensagem do cliente
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content, whatsapp_message_id)
      VALUES (${tenant_id}, ${convId}, 'user', ${content}, ${messageId})
    `
    await sql`UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}`

    // Resposta da IA (se habilitada e texto)
    if (aiEnabled && message.type === 'text' && content.trim()) {
      try {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000'

        await fetch(`${baseUrl}/api/ai-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            tenantId: tenant_id,
            message: content,
            phone: fromPhone,
          }),
        })
      } catch (aiErr) {
        console.error('Erro ao acionar IA:', aiErr)
      }
    }

    return NextResponse.json({ status: 'ok', conversationId: convId })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── COEXISTENCE: Mensagem enviada pelo celular do atendente ───
async function handlePhoneEcho(message, phoneNumberId, value) {
  try {
    // Em echo: 'from' é o número do negócio, 'to' é o cliente
    const customerPhone = message.to || value.contacts?.[0]?.wa_id
    const messageId = message.id

    if (!customerPhone) return NextResponse.json({ status: 'echo_no_customer' })

    const tenant_id = await findTenantId(phoneNumberId)
    if (!tenant_id) return NextResponse.json({ status: 'tenant_not_found' })

    const content = extractContent(message)

    // Buscar ou criar lead do cliente
    const lead = await findOrCreateLead(tenant_id, customerPhone)

    // Buscar conversa ativa
    const convs = await sql`
      SELECT id, status FROM conversations
      WHERE tenant_id = ${tenant_id}
        AND lead_id = ${lead.id}
        AND channel = 'whatsapp'
        AND status != 'closed'
      ORDER BY created_at DESC LIMIT 1
    `

    let convId
    if (convs.length) {
      convId = convs[0].id
    } else {
      const [newConv] = await sql`
        INSERT INTO conversations (tenant_id, lead_id, channel, status, ai_enabled)
        VALUES (${tenant_id}, ${lead.id}, 'whatsapp', 'waiting_human', false)
        RETURNING id
      `
      convId = newConv.id
    }

    // Idempotência
    const existing = await sql`
      SELECT id FROM messages WHERE whatsapp_message_id = ${messageId} LIMIT 1
    `
    if (existing.length) return NextResponse.json({ status: 'duplicate' })

    // Salvar como mensagem do atendente humano
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content, whatsapp_message_id)
      VALUES (${tenant_id}, ${convId}, 'human_agent', ${content}, ${messageId})
    `

    // Marcar conversa como waiting_human (atendente tomou o controle)
    await sql`
      UPDATE conversations
      SET status = 'waiting_human', updated_at = NOW()
      WHERE id = ${convId}
    `

    console.log(`📱 Coexistence echo: atendente respondeu via celular (conv ${convId})`)
    return NextResponse.json({ status: 'echo_saved', conversationId: convId })
  } catch (err) {
    console.error('Echo handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Instagram ──────────────────────────────────────────────────
async function handleInstagram(body) {
  try {
    const entry = body.entry?.[0]
    const messaging = entry?.messaging?.[0]
    if (!messaging?.message) return NextResponse.json({ status: 'no_ig_message' })

    const senderId = messaging.sender?.id
    const messageId = messaging.message?.mid
    const content = messaging.message?.text || '[Mensagem do Instagram]'
    if (!senderId) return NextResponse.json({ status: 'no_sender' })

    const channels = await sql`
      SELECT c.tenant_id FROM channels c
      WHERE c.type = 'instagram' LIMIT 1
    `
    if (!channels.length) return NextResponse.json({ status: 'no_ig_tenant' })

    const { tenant_id } = channels[0]
    const igPhone = `ig_${senderId}`

    const lead = await findOrCreateLead(tenant_id, igPhone)
    const { convId } = await findOrCreateConversation(tenant_id, lead.id, 'instagram')

    const existing = await sql`
      SELECT id FROM messages WHERE whatsapp_message_id = ${messageId} LIMIT 1
    `
    if (existing.length) return NextResponse.json({ status: 'duplicate' })

    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content, whatsapp_message_id)
      VALUES (${tenant_id}, ${convId}, 'user', ${content}, ${messageId})
    `
    await sql`UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}`

    return NextResponse.json({ status: 'ok', conversationId: convId })
  } catch (err) {
    console.error('Instagram webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────

function extractContent(message) {
  if (message.type === 'text') return message.text?.body || ''
  if (message.type === 'audio') return '🎤 [Áudio]'
  if (message.type === 'image') return '📷 [Imagem]'
  if (message.type === 'video') return '🎥 [Vídeo]'
  if (message.type === 'document') return `📎 [Documento: ${message.document?.filename || 'arquivo'}]`
  if (message.type === 'sticker') return '🎨 [Sticker]'
  if (message.type === 'location') return `📍 [Localização: ${message.location?.latitude}, ${message.location?.longitude}]`
  return `[${message.type}]`
}

async function findTenantId(phoneNumberId) {
  let rows = await sql`
    SELECT c.tenant_id FROM channels c
    WHERE c.identifier = ${phoneNumberId}
      AND c.type IN ('whatsapp', 'whatsapp_meta')
    LIMIT 1
  `
  if (!rows.length) {
    rows = await sql`
      SELECT c.tenant_id FROM channels c
      WHERE c.type IN ('whatsapp', 'whatsapp_meta')
      LIMIT 1
    `
  }
  return rows[0]?.tenant_id || null
}

async function findOrCreateLead(tenant_id, phone) {
  const rows = await sql`
    SELECT * FROM leads WHERE tenant_id = ${tenant_id} AND phone = ${phone} LIMIT 1
  `
  if (rows.length) return rows[0]
  const [newLead] = await sql`
    INSERT INTO leads (tenant_id, phone, stage, score)
    VALUES (${tenant_id}, ${phone}, 'new', 0)
    RETURNING *
  `
  return newLead
}

async function findOrCreateConversation(tenant_id, leadId, channel) {
  const convs = await sql`
    SELECT id, ai_enabled, status FROM conversations
    WHERE tenant_id = ${tenant_id}
      AND lead_id = ${leadId}
      AND channel = ${channel}
      AND status != 'closed'
    ORDER BY created_at DESC LIMIT 1
  `

  if (convs.length) {
    const conv = convs[0]
    if (conv.status === 'waiting_human') {
      await sql`UPDATE conversations SET status = 'open', updated_at = NOW() WHERE id = ${conv.id}`
    }
    return { convId: conv.id, aiEnabled: conv.ai_enabled }
  }

  const [newConv] = await sql`
    INSERT INTO conversations (tenant_id, lead_id, channel, status, ai_enabled)
    VALUES (${tenant_id}, ${leadId}, ${channel}, 'open', true)
    RETURNING id, ai_enabled
  `
  return { convId: newConv.id, aiEnabled: newConv.ai_enabled }
}
