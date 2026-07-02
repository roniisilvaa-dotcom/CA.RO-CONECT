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

    if (!value?.messages?.length) {
      return NextResponse.json({ status: 'no_messages' })
    }

    const message = value.messages[0]
    const phoneNumberId = value.metadata?.phone_number_id
    const fromPhone = message.from
    const messageId = message.id

    // Ignorar mensagens de status (não são mensagens novas)
    if (message.type === 'reaction' || message.status) {
      return NextResponse.json({ status: 'ignored' })
    }

    // Extrair conteúdo
    let content = ''
    if (message.type === 'text') {
      content = message.text?.body || ''
    } else if (message.type === 'audio') {
      content = '🎤 [Áudio recebido]'
    } else if (message.type === 'image') {
      content = '📷 [Imagem recebida]'
    } else if (message.type === 'video') {
      content = '🎥 [Vídeo recebido]'
    } else if (message.type === 'document') {
      content = `📎 [Documento: ${message.document?.filename || 'arquivo'}]`
    } else if (message.type === 'sticker') {
      content = '🎨 [Sticker]'
    } else if (message.type === 'location') {
      content = `📍 [Localização: ${message.location?.latitude}, ${message.location?.longitude}]`
    } else {
      content = `[${message.type}]`
    }

    // Buscar tenant pelo phoneNumberId
    let channels = await sql`
      SELECT c.tenant_id, ac.*
      FROM channels c
      JOIN agent_configs ac ON ac.tenant_id = c.tenant_id
      WHERE c.identifier = ${phoneNumberId}
        AND c.type IN ('whatsapp', 'whatsapp_meta')
      LIMIT 1
    `

    // Fallback: qualquer canal whatsapp
    if (!channels.length) {
      channels = await sql`
        SELECT c.tenant_id, ac.*
        FROM channels c
        JOIN agent_configs ac ON ac.tenant_id = c.tenant_id
        WHERE c.type IN ('whatsapp', 'whatsapp_meta')
        LIMIT 1
      `
    }

    if (!channels.length) {
      console.error('Nenhum tenant encontrado para phoneNumberId:', phoneNumberId)
      return NextResponse.json({ status: 'tenant_not_found' })
    }

    const { tenant_id, ...agentConfig } = channels[0]

    // Buscar ou criar lead
    let leads = await sql`
      SELECT * FROM leads WHERE tenant_id = ${tenant_id} AND phone = ${fromPhone} LIMIT 1
    `
    let lead
    if (!leads.length) {
      const [newLead] = await sql`
        INSERT INTO leads (tenant_id, phone, stage, score)
        VALUES (${tenant_id}, ${fromPhone}, 'new', 0)
        RETURNING *
      `
      lead = newLead
    } else {
      lead = leads[0]
    }

    // ── CORREÇÃO: Buscar conversa mais recente (qualquer status, exceto 'closed') ──
    // Isso previne a criação de conversas duplicadas quando status = 'waiting_human'
    const convs = await sql`
      SELECT id, ai_enabled, status FROM conversations
      WHERE tenant_id = ${tenant_id}
        AND lead_id = ${lead.id}
        AND channel = 'whatsapp'
        AND status != 'closed'
      ORDER BY created_at DESC
      LIMIT 1
    `

    let convId, aiEnabled

    if (convs.length) {
      convId = convs[0].id
      aiEnabled = convs[0].ai_enabled
      // Se estava waiting_human, volta para open ao receber nova mensagem
      if (convs[0].status === 'waiting_human') {
        await sql`
          UPDATE conversations SET status = 'open', updated_at = NOW()
          WHERE id = ${convId}
        `
      }
    } else {
      const [newConv] = await sql`
        INSERT INTO conversations (tenant_id, lead_id, channel, status, ai_enabled)
        VALUES (${tenant_id}, ${lead.id}, 'whatsapp', 'open', true)
        RETURNING id, ai_enabled
      `
      convId = newConv.id
      aiEnabled = newConv.ai_enabled
    }

    // Verificar se mensagem já foi processada (idempotência)
    const existing = await sql`
      SELECT id FROM messages WHERE whatsapp_message_id = ${messageId} LIMIT 1
    `
    if (existing.length) {
      return NextResponse.json({ status: 'duplicate' })
    }

    // Salvar mensagem
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content, whatsapp_message_id)
      VALUES (${tenant_id}, ${convId}, 'user', ${content}, ${messageId})
    `

    // Atualizar data da conversa
    await sql`
      UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}
    `

    // Resposta da IA (se habilitada e tem conteúdo de texto)
    if (aiEnabled && message.type === 'text' && content.trim()) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
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

// ── Instagram handler ──────────────────────────────────────────
async function handleInstagram(body) {
  try {
    const entry = body.entry?.[0]
    const messaging = entry?.messaging?.[0]
    if (!messaging?.message) return NextResponse.json({ status: 'no_ig_message' })

    const senderId = messaging.sender?.id
    const messageId = messaging.message?.mid
    const content = messaging.message?.text || '[Mensagem do Instagram]'

    if (!senderId) return NextResponse.json({ status: 'no_sender' })

    // Buscar tenant por canal instagram
    const channels = await sql`
      SELECT c.tenant_id FROM channels c
      WHERE c.type = 'instagram' LIMIT 1
    `
    if (!channels.length) return NextResponse.json({ status: 'no_ig_tenant' })

    const { tenant_id } = channels[0]
    const igPhone = `ig_${senderId}`

    let leads = await sql`
      SELECT * FROM leads WHERE tenant_id = ${tenant_id} AND phone = ${igPhone} LIMIT 1
    `
    let lead
    if (!leads.length) {
      const [newLead] = await sql`
        INSERT INTO leads (tenant_id, phone, stage, score)
        VALUES (${tenant_id}, ${igPhone}, 'new', 0)
        RETURNING *
      `
      lead = newLead
    } else {
      lead = leads[0]
    }

    const convs = await sql`
      SELECT id, ai_enabled, status FROM conversations
      WHERE tenant_id = ${tenant_id}
        AND lead_id = ${lead.id}
        AND channel = 'instagram'
        AND status != 'closed'
      ORDER BY created_at DESC LIMIT 1
    `

    let convId, aiEnabled
    if (convs.length) {
      convId = convs[0].id
      aiEnabled = convs[0].ai_enabled
    } else {
      const [newConv] = await sql`
        INSERT INTO conversations (tenant_id, lead_id, channel, status, ai_enabled)
        VALUES (${tenant_id}, ${lead.id}, 'instagram', 'open', true)
        RETURNING id, ai_enabled
      `
      convId = newConv.id
      aiEnabled = newConv.ai_enabled
    }

    const existing = await sql`
      SELECT id FROM messages WHERE whatsapp_message_id = ${messageId} LIMIT 1
    `
    if (existing.length) return NextResponse.json({ status: 'duplicate' })

    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content, whatsapp_message_id)
      VALUES (${tenant_id}, ${convId}, 'user', ${content}, ${messageId})
    `

    await sql`
      UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}
    `

    return NextResponse.json({ status: 'ok', conversationId: convId })
  } catch (err) {
    console.error('Instagram webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
