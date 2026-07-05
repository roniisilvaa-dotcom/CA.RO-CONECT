// app/api/caro-admin/status/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const filters = ['1=1']
    const params  = []
    if (tenantId) { params.push(tenantId); filters.push(`t.id = $${params.length}`) }
    const whereClause = filters.join(' AND ')

    // Status por tenant
    const tenants = await sql(
      `SELECT
        t.id,
        t.name,
        t.business_name,
        t.slug,
        t.status,
        t.plan,
        t.created_at,
        -- WhatsApp
        t.wa_phone_number_id IS NOT NULL                       AS wa_configured,
        t.wa_phone_number_id                                   AS wa_phone_id,
        -- Instagram
        t.ig_page_id IS NOT NULL                               AS ig_configured,
        t.ig_page_id,
        -- Agent config
        (SELECT ai_enabled FROM agent_config WHERE tenant_id = t.id LIMIT 1)          AS ai_enabled,
        (SELECT assistant_name FROM agent_config WHERE tenant_id = t.id LIMIT 1)      AS assistant_name,
        -- Conversations
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id)              AS total_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND status = 'open') AS open_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND channel = 'whatsapp') AS wa_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND channel = 'instagram') AS ig_conversations,
        -- Activity
        (SELECT MAX(created_at) FROM messages WHERE tenant_id = t.id)                AS last_message_at,
        (SELECT MAX(created_at) FROM messages WHERE tenant_id = t.id AND direction = 'inbound')  AS last_inbound_at,
        (SELECT MAX(created_at) FROM messages WHERE tenant_id = t.id AND direction = 'outbound') AS last_outbound_at,
        -- Messages today
        (SELECT COUNT(*)::int FROM messages WHERE tenant_id = t.id AND DATE(created_at) = CURRENT_DATE) AS messages_today,
        -- Knowledge docs
        (SELECT COUNT(*)::int FROM knowledge_docs WHERE tenant_id = t.id) AS knowledge_docs_count
      FROM tenants t
      WHERE ${whereClause}
      ORDER BY t.created_at ASC`,
      params
    )

    // Saúde geral da plataforma
    const [platform] = await sql(
      `SELECT
        (SELECT COUNT(*)::int FROM tenants WHERE status = 'active')                   AS active_tenants,
        (SELECT COUNT(*)::int FROM tenants WHERE status != 'active')                  AS inactive_tenants,
        (SELECT COUNT(*)::int FROM conversations WHERE status = 'open')               AS total_open_conversations,
        (SELECT COUNT(*)::int FROM messages WHERE DATE(created_at) = CURRENT_DATE)   AS messages_today,
        (SELECT COUNT(*)::int FROM messages WHERE created_at >= NOW() - INTERVAL '1 hour') AS messages_last_hour,
        NOW() AS checked_at`
    )

    // Enriquecer cada tenant com status calculado
    const enriched = tenants.map(t => {
      const lastActivity = t.last_message_at ? new Date(t.last_message_at) : null
      const minutesSinceActivity = lastActivity
        ? (Date.now() - lastActivity.getTime()) / 60000
        : Infinity

      const waStatus = t.wa_configured
        ? (minutesSinceActivity < 60 ? 'active' : minutesSinceActivity < 1440 ? 'idle' : 'stale')
        : 'not_configured'

      const igStatus = t.ig_configured
        ? (minutesSinceActivity < 60 ? 'active' : minutesSinceActivity < 1440 ? 'idle' : 'stale')
        : 'not_configured'

      const healthScore =
        (t.wa_configured ? 25 : 0) +
        (t.ig_configured ? 25 : 0) +
        (t.ai_enabled ? 25 : 0) +
        (minutesSinceActivity < 1440 ? 25 : 0)

      return {
        ...t,
        wa_status: waStatus,
        ig_status: igStatus,
        health_score: healthScore,
        minutes_since_activity: Math.round(minutesSinceActivity),
      }
    })

    return Response.json({ tenants: enriched, platform, checked_at: new Date().toISOString() })
  } catch (err) {
    console.error('[status] GET error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
