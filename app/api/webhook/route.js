import { NextResponse } from 'next/server'
import sql from '../../../lib/db'
import { processMessage } from '../../../lib/ai'
import { sendText } from '../../../lib/whatsapp'

export const dynamic = 'force-dynamic'

// GET: verificação de webhook da Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const isValid =
    mode === 'subscribe' &&
    (token === process.env.META_VERIFY_TOKEN || token === 'caroconnect2024')

  if (isValid) {
    console.log('✅ Webhook Meta verificado')
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST: recebe mensagens da Meta
export async function POST(request) {
  const body = await request.json()

  if (body.object !== 'whatsapp_business_account') {
    return NextResponse.json({ ok: true })
  }

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value
        if (!value?.messages?.length) continue

        const phoneNumberId = value.metadata?.phone_number_id
        const msg = value.messages[0]

        if (msg.type !== 'text') continue
        if (value.statuses?.length) continue

        const phone = msg.from
        const text = msg.text?.body || ''
        if (!phone || !text) continue

        console.log(`📩 ${phone}: ${text}`)

        // Identifica tenant pelo phone_number_id
        let channels = await sql`
          SELECT c.tenant_id, ac.*
          FROM channels c
          JOIN agent_configs ac ON ac.tenant_id = c.tenant_id
          WHERE c.identifier = ${phoneNumberId} AND c.type IN ('whatsapp', 'whatsapp_meta')
          LIMIT 1
        `

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
          console.warn('⚠️ Nenhum tenant configurado')
          continue
        }

        const { tenant_id, ...agentConfig } = channels[0]
        agentConfig.services = agentConfig.services || []

        // Lead
        const existingLeads = await sql`
          SELECT id FROM leads WHERE tenant_id = ${tenant_id} AND phone = ${phone}
        `
        let leadId
        if (!existingLeads.length) {
          const [newLead] = await sql`
            INSERT INTO leads (tenant_id, phone, stage, last_contact_at)
            VALUES (${tenant_id}, ${phone}, 'new', NOW())
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
            AND channel = 'whatsapp' AND status = 'open'
          ORDER BY created_at DESC LIMIT 1
        `
        let conversationId, aiEnabled
        if (!convs.length) {
          const [conv] = await sql`
            INSERT INTO conversations (tenant_id, lead_id, channel, channel_conversation_id)
            VALUES (${tenant_id}, ${leadId}, 'whatsapp', ${phone})
            RETURNING id, ai_enabled
          `
          conversationId = conv.id
          aiEnabled = true
        } else {
          conversationId = convs[0].id
          aiEnabled = convs[0].ai_enabled
        }

        if (!aiEnabled) continue

        // IA
        const result = await processMessage({
          tenantId: tenant_id,
          phone,
          userMessage: text,
          agentConfig,
          conversationId,
        })

        await sendText(phone, result.message)
        console.log(`✅ Resposta para ${phone}`)

        // Salva mensagens
        await sql`
          INSERT INTO messages (tenant_id, conversation_id, role, content)
          VALUES (${tenant_id}, ${conversationId}, 'user', ${text})
        `
        await sql`
          INSERT INTO messages (tenant_id, conversation_id, role, content)
          VALUES (${tenant_id}, ${conversationId}, 'assistant', ${result.message})
        `

        // Sinais
        if (result.signals.isHotLead) {
          await sql`UPDATE leads SET score = LEAST(score+30,100), stage='hot' WHERE id=${leadId}`
          await sql`
            INSERT INTO notifications (tenant_id, lead_id, conversation_id, type, message)
            VALUES (${tenant_id}, ${leadId}, ${conversationId}, 'hot_lead', ${'🔥 Lead quente: ' + phone})
          `
        }
        if (result.signals.needsHandoff) {
          await sql`UPDATE conversations SET ai_enabled=false, status='waiting_human' WHERE id=${conversationId}`
        }
        if (result.signals.hasAppointment && result.appointmentData) {
          const { service, date, time } = result.appointmentData
          await sql`
            INSERT INTO appointments (tenant_id, lead_id, service_name, scheduled_at)
            VALUES (${tenant_id}, ${leadId}, ${service}, ${new Date(`${date} ${time}`)})
          `
        }
      }
    }
  } catch (err) {
    console.error('❌ Erro no webhook:', err.message)
  }

  return NextResponse.json({ ok: true })
}
