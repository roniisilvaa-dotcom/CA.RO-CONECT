import { NextResponse } from 'next/server'
import sql from '../../../lib/db'
import { processMessage } from '../../../lib/ai'
import { sendText } from '../../../lib/whatsapp'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const payload = await request.json()

  // Ignora mensagens enviadas pelo próprio bot
  if (payload.isFromMe) return NextResponse.json({ ok: true })

  const phone = payload.phone?.replace(/\D/g, '')
  const text = payload.text?.message || payload.text || ''
  if (!phone || !text) return NextResponse.json({ ok: true })

  console.log(`📩 ${phone}: ${text}`)

  try {
    // ── Identifica tenant pelo instanceId do Z-API ──
    const instanceId = request.headers.get('z-api-instance') || process.env.ZAPI_INSTANCE_ID

    const channels = await sql`
      SELECT c.tenant_id, ac.*
      FROM channels c
      JOIN agent_configs ac ON ac.tenant_id = c.tenant_id
      WHERE c.identifier = ${instanceId} AND c.type = 'whatsapp'
      LIMIT 1
    `
    if (!channels.length) {
      console.warn('⚠️ Tenant não encontrado para instância:', instanceId)
      return NextResponse.json({ ok: true })
    }

    const { tenant_id, ...agentConfig } = channels[0]
    agentConfig.services = agentConfig.services || []

    // ── Lead ──
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

    // ── Conversa ──
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

    if (!aiEnabled) return NextResponse.json({ ok: true })

    // ── Processa com IA ──
    const result = await processMessage({
      tenantId: tenant_id,
      phone,
      userMessage: text,
      agentConfig,
      conversationId,
    })

    // ── Envia resposta ──
    await sendText(phone, result.message)
    console.log(`✅ Resposta enviada para ${phone}`)

    // ── Salva mensagens ──
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content)
      VALUES (${tenant_id}, ${conversationId}, 'user', ${text})
    `
    await sql`
      INSERT INTO messages (tenant_id, conversation_id, role, content)
      VALUES (${tenant_id}, ${conversationId}, 'assistant', ${result.message})
    `

    // ── Sinais ──
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

  } catch (err) {
    console.error('❌ Erro no webhook:', err.message)
  }

  return NextResponse.json({ ok: true })
}
