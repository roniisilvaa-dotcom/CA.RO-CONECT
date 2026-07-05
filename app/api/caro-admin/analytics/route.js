// app/api/caro-admin/analytics/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const days     = Math.min(parseInt(searchParams.get('days') || '7'), 90)

    const tFilter  = tenantId ? [tenantId] : []
    const tWhere   = tenantId ? `AND c.tenant_id = $1` : ''
    const tWhereM  = tenantId ? `AND m.tenant_id = $1` : ''
    const tWherePl = tenantId ? `AND tenant_id = $1`   : ''

    // ââ Totais gerais ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
    const [totals] = await sql(
      `SELECT
        (SELECT COUNT(*)::int   FROM conversations c WHERE 1=1 ${tWhere})                                          AS total_conversations,
        (SELECT COUNT(*)::int   FROM conversations c WHERE c.status = 'open' ${tWhere})                           AS open_conversations,
        (SELECT COUNT(*)::int   FROM conversations c WHERE c.channel = 'whatsapp' ${tWhere})                      AS wa_conversations,
        (SELECT COUNT(*)::int   FROM conversations c WHERE c.channel = 'instagram' ${tWhere})                     AS ig_conversations,
        (SELECT COUNT(*)::int   FROM messages m WHERE 1=1 ${tWhereM})                                             AS total_messages,
        (SELECT COUNT(*)::int   FROM messages m WHERE m.direction = 'outbound' ${tWhereM})                        AS ai_messages,
        (SELECT COUNT(*)::int   FROM messages m WHERE m.direction = 'inbound' ${tWhereM})                         AS user_messages,
        (SELECT COUNT(*)::int   FROM conversations c WHERE DATE(c.created_at) = CURRENT_DATE ${tWhere})           AS conversations_today,
        (SELECT COUNT(*)::int   FROM messages m WHERE DATE(m.created_at) = CURRENT_DATE ${tWhereM})               AS messages_today,
        (SELECT COUNT(*)::int   FROM messages m WHERE m.direction = 'outbound' AND DATE(m.created_at) = CURRENT_DATE ${tWhereM}) AS ai_messages_today,
        (SELECT COUNT(*)::int   FROM conversations c WHERE c.ai_enabled = true ${tWhere})                         AS ai_enabled_count,
        (SELECT COUNT(DISTINCT c.tenant_id)::int FROM conversations c WHERE 1=1 ${tWhere})                        AS active_tenants
      `,
      tFilter
    )

    // ââ Volume por dia âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
    const dayFilters = tenantId ? [tenantId, days] : [days]
    const dayWhere   = tenantId ? `AND m.tenant_id = $1` : ''
    const dayParam   = tenantId ? `$2` : `$1`

    const byDay = await sql(
      `SELECT
        TO_CHAR(DATE(m.created_at), 'DD/MM')              AS date,
        DATE(m.created_at)                                 AS raw_date,
        COUNT(*)::int                                      AS total,
        COUNT(*) FILTER (WHERE m.direction = 'inbound')::int  AS inbound,
        COUNT(*) FILTER (WHERE m.direction = 'outbound')::int AS outbound,
        COUNT(*) FILTER (WHERE m.channel = 'whatsapp')::int   AS whatsapp,
        COUNT(*) FILTER (WHERE m.channel = 'instagram')::int  AS instagram
      FROM messages m
      WHERE m.created_at >= NOW() - (${dayParam} || ' days')::INTERVAL
        ${dayWhere}
      GROUP BY DATE(m.created_at)
      ORDER BY DATE(m.created_at) ASC`,
      dayFilters
    )

    // ââ Por canal ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
    const chFilters = tenantId ? [tenantId] : []
    const chWhere   = tenantId ? `WHERE c.tenant_id = $1` : ''

    const byChannel = await sql(
      `SELECT
        c.channel,
        COUNT(DISTINCT c.id)::int                                AS conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'open')::int AS open,
        COUNT(DISTINCT c.id) FILTER (WHERE c.ai_enabled = true)::int AS ai_on,
        (SELECT COUNT(*)::int FROM messages m2
          WHERE m2.channel = c.channel ${tenantId ? `AND m2.tenant_id = $1` : ''}) AS messages
      FROM conversations c
      ${chWhere}
      GROUP BY c.channel`,
      chFilters
    )

    // ââ Por cliente (visÃ£o global) âââââââââââââââââââââââââââââââââââââââââââ
    const byTenant = tenantId ? [] : await sql(
      `SELECT
        t.id,
        t.name,
        t.business_name,
        t.status,
        COUNT(DISTINCT c.id)::int                                            AS conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'open')::int          AS open_conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.channel = 'whatsapp')::int     AS wa_conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.channel = 'instagram')::int    AS ig_conversations,
        COUNT(m.id)::int                                                     AS messages,
        COUNT(m.id) FILTER (WHERE m.direction = 'outbound')::int            AS ai_messages,
        MAX(m.created_at)                                                    AS last_activity
      FROM tenants t
      LEFT JOIN conversations c ON c.tenant_id = t.id
      LEFT JOIN messages m ON m.tenant_id = t.id
      GROUP BY t.id, t.name, t.business_name, t.status
      ORDER BY messages DESC
      LIMIT 30`
    )

    // ââ Taxa de resposta IA (avg response time) ââââââââââââââââââââââââââââââ
    const respFilters = tenantId ? [tenantId] : []
    const respWhere   = tenantId ? `AND m_out.tenant_id = $1` : ''

    const [responseTime] = await sql(
      `SELECT
        AVG(
          EXTRACT(EPOCH FROM (m_out.created_at - m_in.created_at)) / 60.0
        )::numeric(8,2) AS avg_response_minutes
      FROM messages m_in
      JOIN LATERAL (
        SELECT created_at FROM messages m_out
        WHERE m_out.tenant_id = m_in.tenant_id
          AND m_out.direction = 'outbound'
          AND m_out.created_at > m_in.created_at
          ${respWhere}
        ORDER BY m_out.created_at ASC
        LIMIT 1
      ) m_out ON true
      WHERE m_in.direction = 'inbound'
        AND m_in.created_at >= NOW() - INTERVAL '30 days'
        ${tenantId ? `AND m_in.tenant_id = $1` : ''}`,
      respFilters
    ).catch(() => [{ avg_response_minutes: null }])

    return Response.json({
      totals,
      byDay,
      byChannel,
      byTenant,
      responseTime: responseTime?.avg_response_minutes ?? null,
      period: days,
    })
  } catch (err) {
    console.error('[analytics] GET error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
