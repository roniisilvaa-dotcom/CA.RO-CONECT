// app/api/caro-admin/status/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const tParams  = []
    const tFilters = ['1=1']
    if (tenantId) { tParams.push(tenantId); tFilters.push(`t.id = $${tParams.length}`) }
    const tWhere = tFilters.join(' AND ')

    const tenants = await sql(
      `SELECT
        t.id,
        t.name,
        t.slug,
        t.plan,
        t.status,
        t.created_at,
        t.coexistence_enabled,
        -- canal WhatsApp
        (SELECT ch.identifier FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'whatsapp_meta' LIMIT 1)            AS wa_identifier,
        (SELECT ch.status FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'whatsapp_meta' LIMIT 1)            AS wa_channel_status,
        EXISTS(SELECT 1 FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'whatsapp_meta')                    AS wa_configured,
        -- canal Instagram
        (SELECT ch.identifier FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'instagram' LIMIT 1)                AS ig_identifier,
        (SELECT ch.status FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'instagram' LIMIT 1)                AS ig_channel_status,
        EXISTS(SELECT 1 FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'instagram')                        AS ig_configured,
        -- config do agente
        (SELECT ac.ai_enabled    FROM agent_configs ac WHERE ac.tenant_id = t.id LIMIT 1) AS ai_enabled,
        (SELECT ac.agent_name    FROM agent_configs ac WHERE ac.tenant_id = t.id LIMIT 1) AS agent_name,
        -- conversas
        (SELECT COUNT(*)::int   FROM conversations c WHERE c.tenant_id = t.id)         AS total_conversations,
        (SELECT COUNT(*)::int   FROM conversations c WHERE c.tenant_id = t.id AND c.status = 'open') AS open_conversations,
        -- mensagens
        (SELECT COUNT(*)::int   FROM messages m WHERE m.tenant_id = t.id)              AS total_messages,
        (SELECT COUNT(*)::int   FROM messages m WHERE m.tenant_id = t.id AND m.role = 'user')      AS received_messages,
        (SELECT COUNT(*)::int   FROM messages m WHERE m.tenant_id = t.id AND m.role = 'assistant') AS sent_messages,
        (SELECT MAX(m.created_at) FROM messages m WHERE m.tenant_id = t.id)            AS last_message_at,
        (SELECT MAX(m.created_at) FROM messages m WHERE m.tenant_id = t.id AND m.role = 'user')      AS last_inbound_at,
        (SELECT MAX(m.created_at) FROM messages m WHERE m.tenant_id = t.id AND m.role = 'assistant') AS last_outbound_at,
        -- mensagens últimas 24h
        (SELECT COUNT(*)::int FROM messages m
          WHERE m.tenant_id = t.id
            AND m.created_at >= NOW() - INTERVAL '24 hours')                           AS messages_24h,
        -- conversas abertas sem resposta (última msg é de usuário)
        (SELECT COUNT(*)::int FROM conversations c
          WHERE c.tenant_id = t.id AND c.status = 'open'
            AND EXISTS (
              SELECT 1 FROM messages m
              WHERE m.conversation_id = c.id AND m.role = 'user'
                AND m.created_at > COALESCE(
                  (SELECT MAX(created_at) FROM messages
                   WHERE conversation_id = c.id AND role = 'assistant'),
                  '1970-01-01'
                )
            ))                                                                         AS pending_conversations
      FROM tenants t
      WHERE ${tWhere}
      ORDER BY t.created_at ASC`,
      tParams
    )

    // Estatísticas da plataforma (global)
    const [platform] = await sql(
      `SELECT
        (SELECT COUNT(*)::int FROM tenants)           AS total_tenants,
        (SELECT COUNT(*)::int FROM tenants WHERE status = 'active') AS active_tenants,
        (SELECT COUNT(*)::int FROM conversations)     AS total_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE status = 'open') AS open_conversations,
        (SELECT COUNT(*)::int FROM messages)          AS total_messages,
        (SELECT COUNT(*)::int FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours') AS messages_24h,
        (SELECT COUNT(*)::int FROM leads)             AS total_leads`,
      []
    )

    return Response.json({
      tenants,
      platform,
      checked_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[status] GET error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
