// app/api/caro-admin/instagram/route.js
// GET ?tenant_id=xxx            → lista conversas Instagram do tenant
// GET ?tenant_id=xxx&conv_id=yyy → mensagens de uma conversa
// POST { conv_id, message }     → envia DM via Instagram
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const convId   = searchParams.get('conv_id')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id obrigatório' }, { status: 400 })
    }

    // ── Mensagens de uma conversa específica ──────────────────────
    if (convId) {
      const messages = await sql(
        `SELECT
          m.id,
          m.content,
          m.direction,
          m.role,
          m.created_at,
          l.phone AS sender_id,
          l.name  AS sender_name
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        LEFT JOIN leads l ON l.id = c.lead_id
        WHERE m.conversation_id = $1
          AND c.tenant_id = $2
          AND c.channel = 'instagram'
        ORDER BY m.created_at ASC`,
        [convId, tenantId]
      )
      return NextResponse.json({ messages })
    }

    // ── Lista de conversas Instagram do tenant ────────────────────
    const conversations = await sql(
      `SELECT
        c.id,
        c.status,
        c.ai_enabled,
        c.channel_conversation_id AS ig_sender_id,
        c.created_at,
        l.phone  AS sender_id,
        l.name   AS sender_name,
        l.score  AS lead_score,
        l.stage  AS lead_stage,
        (SELECT content    FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT direction  FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_direction,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id AND direction = 'inbound'
          AND created_at > COALESCE(
            (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id AND direction = 'outbound'),
            '1970-01-01'
          )
        ) AS unread_count,
        (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id) AS message_count
      FROM conversations c
      LEFT JOIN leads l ON l.id = c.lead_id
      WHERE c.tenant_id = $1
        AND c.channel = 'instagram'
      ORDER BY last_at DESC NULLS LAST
      LIMIT 200`,
      [tenantId]
    )

    return NextResponse.json({ conversations })
  } catch (err) {
    console.error('Instagram route GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { tenant_id, conv_id, message } = await req.json()

    if (!tenant_id || !conv_id || !message) {
      return NextResponse.json({ error: 'tenant_id, conv_id e message obrigatórios' }, { status: 400 })
    }

    // Busca o ig_sender_id e configuração do tenant
    const [conv] = await sql(
      `SELECT c.channel_conversation_id, t.instagram_settings
       FROM conversations c
       JOIN tenants t ON t.id = c.tenant_id
       WHERE c.id = $1 AND c.tenant_id = $2 AND c.channel = 'instagram'`,
      [conv_id, tenant_id]
    )

    if (!conv) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    const igSenderId = conv.channel_conversation_id
    const igSettings = conv.instagram_settings
      ? (typeof conv.instagram_settings === 'string'
          ? JSON.parse(conv.instagram_settings)
          : conv.instagram_settings)
      : {}

    // Token do Instagram — via instagram_settings ou env
    const igToken = igSettings.access_token || process.env.META_INSTAGRAM_TOKEN || process.env.WHATSAPP_TOKEN
    const igUserId = igSettings.ig_user_id || process.env.META_IG_USER_ID

    if (!igToken || !igUserId || !igSenderId) {
      return NextResponse.json({ error: 'Configuração Instagram incompleta' }, { status: 400 })
    }

    // Envia DM via Meta Graph API
    const sendRes = await fetch(
      `https://graph.facebook.com/v20.0/${igUserId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${igToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: igSenderId },
          message:   { text: message },
        }),
      }
    )
    const sendData = await sendRes.json()

    if (sendData.error) {
      return NextResponse.json({ error: sendData.error.message }, { status: 400 })
    }

    // Salva no banco
    await sql(
      `INSERT INTO messages (tenant_id, conversation_id, role, content, direction)
       VALUES ($1, $2, 'assistant', $3, 'outbound')`,
      [tenant_id, conv_id, message]
    )

    return NextResponse.json({ ok: true, message_id: sendData.message_id })
  } catch (err) {
    console.error('Instagram route POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
