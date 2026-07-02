import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'
import { processMessage } from '../../../../lib/ai'
import { sendInstagramDM } from '../../../../lib/instagram'

export const dynamic = 'force-dynamic'

// GET: verificação de webhook pela Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'caroconnect2024')) {    console.log('✅ Webhook Instagram verificado')
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST: recebe DMs do Instagram
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
      for (const event of entry.messaging || []) {
        // Ignora echo (mensagens enviadas pela própria conta)
        if (event.message?.is_echo) continue
        // Ignora se não tiver texto
        const text = event.message?.text
        if (!text) continue

        const senderId = event.sender?.id
        if (!senderId) continue

        console.log(`📩 Instagram ${senderId}: ${text}`)

        // Identifica tenant pelo canal Instagram
        let channels = await sql`
          SELECT c.tenant_id, ac.*
          FROM channels c
          JOIN agent_configs ac ON ac.tenant_id = c.tenant_id
          WHERE c.type = 'instagram'
          LIMIT 1
        `

        if (!channels.length) {
          console.warn('⚠️ Nenhum tenant com canal Instagram configurado')
          continue
        }

        const { tenant_id, ...agentConfig } = channels[0]
        agentConfig.services = agentConfig.services || []

        // Lead — usa o PSID do Instagram como identificador
        const igId = `ig_${senderId}`
        const existingLeads = await sql`
          SELECT id FROM leads WHERE tenant_id = ${tenant_id} AND phone = ${igId}
        `
        let leadId
        if (!existingLeads.length) {
          const [newLead] = await sql`
            INSERT INTO leads (tenant_id, phone, stage, last_contact_at)
            VALUES (${tenant_id}, ${igId}, 'new', NOW())
            RETURNING id
          `
          leadId = newLead.id
        } else {
          leadId = existingLeads[0].id
          await sql`UPDATE leads SET last_contact_at = NOW() WHERE id = ${leadId}`
        }

        // Conversa
        const convs = await sql`
          SELECT id, ai_enabled FROM conversations
          WHERE tenant_id = ${tenant_id} AND lead_id = ${leadId}
            AND channel = 'instagram' AND status = 'open'
          ORDER BY created_at DESC LIMIT 1
        `
        let conversationId, aiEnabled
        if (!convs.length) {
          const [conv] = await sql`
            INSERT INTO conversations (tenant_id, lead_id, channel, channel_conversation_id)
            VALUES (${tenant_id}, ${leadId}, 'instagram', ${senderId})
            RETURNING id, ai_enabled
          `
          conversationId = conv.id
          aiEnabled = true
        } else {
          conversationId = convs[0].id
          aiEnabled = convs[0].ai_enabled
        }

        // Salva mensagem do usuário
        await sql`
          INSERT INTO messages (tenant_id, conversation_id, role, content)
          VALUES (${tenant_id}, ${conversationId}, 'user', ${text})
        `

        if (!aiEnabled) continue

        // IA responde
        const result = await processMessage({
          tenantId: tenant_id,
          phone: igId,
          userMessage: text,
          agentConfig,
          conversationId,
        })

        // Envia resposta pelo Instagram
        await sendInstagramDM(senderId, result.message)
        console.log(`✅ Resposta Instagram para ${senderId}`)

        // Salva resposta da IA
        await sql`
          INSERT INTO messages (tenant_id, conversation_id, role, content)
          VALUES (${tenant_id}, ${conversationId}, 'assistant', ${result.message})
        `

        // Sinais de lead
        if (result.signals?.isHotLead) {
          await sql`UPDATE leads SET score = LEAST(score+30,100), stage='hot' WHERE id=${leadId}`
          await sql`
            INSERT INTO notifications (tenant_id, lead_id, conversation_id, type, message)
            VALUES (${tenant_id}, ${leadId}, ${conversationId}, 'hot_lead', ${'🔥 Lead quente via Instagram: ' + senderId})
          `
        }
        if (result.signals?.needsHandoff) {
          await sql`UPDATE conversations SET ai_enabled=false, status='waiting_human' WHERE id=${conversationId}`
        }
      }
    }
  } catch (err) {
    console.error('❌ Erro no webhook Instagram:', err.message)
  }

  return NextResponse.json({ ok: true })
}
