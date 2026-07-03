import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'
import { processMessage } from '../../../../lib/ai'
import { sendInstagramDM, replyToComment } from '../../../../lib/instagram'

export const dynamic = 'force-dynamic'

// GET: verificação de webhook pela Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Webhook Instagram verificado')
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST: recebe eventos do Instagram (DMs, novos seguidores, comentários)
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  if (body.object !== 'instagram') {
    return NextResponse.json({ ok: true })
  }

  try {
    for (const entry of body.entry || []) {
      // ── DMs (messaging[]) ─────────────────────────────────────
      for (const event of entry.messaging || []) {
        if (event.message?.is_echo) continue
        const text = event.message?.text
        if (!text) continue
        const senderId = event.sender?.id
        if (!senderId) continue

        await handleInstagramDM(senderId, text)
      }

      // ── Eventos de changes (novos seguidores, comentários) ────
      for (const change of entry.changes || []) {
        const field = change.field
        const value = change.value

        if (field === 'follows' || field === 'follow') {
          const followerId = value?.from?.id || value?.follower_id
          if (followerId) {
            await handleNewFollower(followerId, value)
          }
        }

        if (field === 'comments') {
          const commentId = value?.id
          const commentText = value?.text
          const commenterId = value?.from?.id
          const mediaId = value?.media?.id
          if (commentId && commentText && commenterId && mediaId) {
            const igUserId = process.env.META_IG_USER_ID
            if (commenterId !== igUserId) {
              await handleNewComment(commenterId, commentText, commentId, mediaId, value)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Erro no webhook Instagram:', err.message)
  }

  return NextResponse.json({ ok: true })
}

// ── Handlers ────────────────────────────────────────────────

async function getTenantConfig() {
  const channels = await sql`
    SELECT c.tenant_id, ac.*, t.instagram_settings
    FROM channels c
    JOIN agent_configs ac ON ac.tenant_id = c.tenant_id
    JOIN tenants t ON t.id = c.tenant_id
    WHERE c.type = 'instagram'
    LIMIT 1
  `
  if (!channels.length) return null
  const { tenant_id, instagram_settings, ...agentConfig } = channels[0]
  const igSettings = instagram_settings
    ? (typeof instagram_settings === 'string' ? JSON.parse(instagram_settings) : instagram_settings)
    : {}
  agentConfig.services = agentConfig.services || []
  return { tenant_id, agentConfig, igSettings }
}

async function ensureLeadAndConversation(tenantId, igSenderId, channel = 'instagram') {
  const igId = `ig_${igSenderId}`
  const existing = await sql`SELECT id FROM leads WHERE tenant_id = ${tenantId} AND phone = ${igId}`
  let leadId
  if (!existing.length) {
    const [lead] = await sql`
      INSERT INTO leads (tenant_id, phone, stage, last_contact_at)
      VALUES (${tenantId}, ${igId}, 'new', NOW())
      RETURNING id
    `
    leadId = lead.id
  } else {
    leadId = existing[0].id
    await sql`UPDATE leads SET last_contact_at = NOW() WHERE id = ${leadId}`
  }

  const convs = await sql`
    SELECT id, ai_enabled FROM conversations
    WHERE tenant_id = ${tenantId} AND lead_id = ${leadId}
      AND channel = ${channel} AND status = 'open'
    ORDER BY created_at DESC LIMIT 1
  `
  let conversationId, aiEnabled
  if (!convs.length) {
    const [conv] = await sql`
      INSERT INTO conversations (tenant_id, lead_id, channel, channel_conversation_id)
      VALUES (${tenantId}, ${leadId}, ${channel}, ${igSenderId})
      RETURNING id, ai_enabled
    `
    conversationId = conv.id
    aiEnabled = true
  } else {
    conversationId = convs[0].id
    aiEnabled = convs[0].ai_enabled
  }

  return { leadId, conversationId, aiEnabled, igId }
}

async function handleInstagramDM(senderId, text) {
  console.log(`📩 Instagram DM de ${senderId}: ${text}`)

  const config = await getTenantConfig()
  if (!config) return console.warn('⚠️ Nenhum tenant Instagram configurado')

  const { tenant_id, agentConfig, igSettings } = config

  if (igSettings.dm_ai_enabled === false) {
    console.log(`⏸ DM AI desativada para este tenant`)
    return
  }

  const { leadId, conversationId, aiEnabled, igId } = await ensureLeadAndConversation(tenant_id, senderId)

  await sql`
    INSERT INTO messages (tenant_id, conversation_id, role, content, direction)
    VALUES (${tenant_id}, ${conversationId}, 'user', ${text}, 'inbound')
  `

  if (!aiEnabled) return

  const result = await processMessage({
    tenantId: tenant_id,
    phone: igId,
    userMessage: text,
    agentConfig,
    conversationId,
  })

  if (!result.message || !result.message.trim()) {
    console.warn(`Mensagem vazia da IA para ${senderId} - pulando envio`)
    return
  }

  await sendInstagramDM(senderId, result.message)
  console.log(`✅ DM enviada para ${senderId}`)

  await sql`
    INSERT INTO messages (tenant_id, conversation_id, role, content, direction)
    VALUES (${tenant_id}, ${conversationId}, 'assistant', ${result.message}, 'outbound')
  `

  if (result.signals?.isHotLead) {
    await sql`UPDATE leads SET score = LEAST(score+30,100), stage='hot' WHERE id=${leadId}`
    await sql`
      INSERT INTO notifications (tenant_id, lead_id, conversation_id, type, message)
      VALUES (${tenant_id}, ${leadId}, ${conversationId}, 'hot_lead', ${'🔥 Lead quente via Instagram DM: ' + senderId})
    `
  }
  if (result.signals?.needsHandoff) {
    await sql`UPDATE conversations SET ai_enabled=false, status='waiting_human' WHERE id=${conversationId}`
  }
}

async function handleNewFollower(followerId, value) {
  console.log(`👥 Novo seguidor Instagram: ${followerId}`)

  const config = await getTenantConfig()
  if (!config) return

  const { tenant_id, igSettings } = config

  if (!igSettings.welcome_followers_enabled) return

  const welcomeMsg = igSettings.welcome_message ||
    'Olá! Que bom ter você por aqui 🤍 Se quiser conhecer mais sobre o meu trabalho, estou à disposição!'

  try {
    const igId = `ig_${followerId}`
    const existing = await sql`SELECT id FROM leads WHERE tenant_id = ${tenant_id} AND phone = ${igId}`
    if (existing.length) {
      console.log(`ℹ️ Seguidor ${followerId} já é lead — não enviando boas-vindas`)
      return
    }

    await sendInstagramDM(followerId, welcomeMsg)
    console.log(`✅ Boas-vindas enviadas para novo seguidor ${followerId}`)

    const { conversationId } = await ensureLeadAndConversation(tenant_id, followerId)
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content, direction)
      VALUES (${tenant_id}, ${conversationId}, 'assistant', ${welcomeMsg}, 'outbound')
    `
  } catch (err) {
    console.error(`❌ Erro ao enviar boas-vindas para ${followerId}:`, err.message)
  }
}

async function handleNewComment(commenterId, commentText, commentId, mediaId, value) {
  console.log(`💬 Comentário no post ${mediaId} de ${commenterId}: ${commentText}`)

  const config = await getTenantConfig()
  if (!config) return

  const { tenant_id, agentConfig, igSettings } = config

  if (!igSettings.comment_reply_enabled) return

  const mode = igSettings.comment_reply_mode || 'invite_dm'

  try {
    if (mode === 'invite_dm') {
      const inviteMsg = 'Oi! 💛 Manda uma mensagem no Direct pra eu te responder melhor 📩'
      await replyToComment(commentId, inviteMsg)
      console.log(`✅ Convite para DM enviado no comentário ${commentId}`)
    } else if (mode === 'direct_reply') {
      const igId = `ig_${commenterId}`
      const { conversationId } = await ensureLeadAndConversation(tenant_id, commenterId, 'instagram_comment')

      await sql`
        INSERT INTO messages (tenant_id, conversation_id, role, content, direction)
        VALUES (${tenant_id}, ${conversationId}, 'user', ${commentText}, 'inbound')
      `

      const result = await processMessage({
        tenantId: tenant_id,
        phone: igId,
        userMessage: commentText,
        agentConfig,
        conversationId,
      })

      if (result.message && result.message.trim()) {
        const reply = result.message.length > 997 ? result.message.substring(0, 997) + '...' : result.message
        await replyToComment(commentId, reply)
        console.log(`✅ Resposta da IA no comentário ${commentId}`)

        await sql`
          INSERT INTO messages (tenant_id, conversation_id, role, content, direction)
          VALUES (${tenant_id}, ${conversationId}, 'assistant', ${reply}, 'outbound')
        `
      }
    }
  } catch (err) {
    console.error(`❌ Erro ao processar comentário ${commentId}:`, err.message)
  }
}
