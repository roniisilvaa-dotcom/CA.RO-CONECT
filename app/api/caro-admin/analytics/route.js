// app/api/caro-admin/analytics/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const days     = Math.min(parseInt(searchParams.get('days') || '7'), 90)

    const tParams  = []
    const tFilters = ['1=1']
    if (tenantId) { tParams.push(tenantId); tFilters.push(`m.tenant_id = $${tParams.length}`) }
    const tWhere = tFilters.join(' AND ')

    // Totais gerais
    tParams.push(days)
    const totals = await sql(
      `SELECT
        COUNT(*)::int                                         AS total_messages,
        COUNT(*) FILTER (WHERE m.role = 'user')::int         AS user_messages,
        COUNT(*) FILTER (WHERE m.role = 'assistant')::int    AS ai_messages,
        COUNT(DISTINCT m.conversation_id)::int               AS active_conversations,
        COUNT(DISTINCT DATE(m.created_at))::int              AS active_days
       FROM messages m
       WHERE ${tWhere}
         AND m.created_at >= NOW() - ($${tParams.length} || ' days')::interval`,
      tParams
    )

    // Por dia
    const dParams  = []
    const dFilters = ['1=1']
    if (tenantId) { dParams.push(tenantId); dFilters.push(`m.tenant_id = $${dParams.length}`) }
    dParams.push(days)
    const byDay = await sql(
      `SELECT
        DATE(m.created_at)                                   AS date,
        COUNT(*)::int                                        AS total,
        COUNT(*) FILTER (WHERE m.role = 'user')::int        AS received,
        COUNT(*) FILTER (WHERE m.role = 'assistant')::int   AS sent
       FROM messages m
       WHERE ${dFilters.join(' AND ')}
         AND m.created_at >= NOW() - ($${dParams.length} || ' days')::interval
       GROUP BY DATE(m.created_at)
       ORDER BY date ASC`,
      dParams
    )

    // Por canal
    const cParams  = []
    const cFilters = ['1=1']
    if (tenantId) { cParams.push(tenantId); cFilters.push(`c.tenant_id = $${cParams.length}`) }
    cParams.push(days)
    const byChannel = await sql(
      `SELECT
        c.channel,
        COUNT(DISTINCT c.id)::int                           AS conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status='open')::int AS open,
        COUNT(m.id)::int                                    AS messages
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
         AND m.created_at >= NOW() - ($${cParams.length} || ' days')::interval
       WHERE ${cFilters.join(' AND ')}
       GROUP BY c.channel`,
      cParams
    )

    // Por tenant (se não filtrado por tenant)
    let byTenant = []
    if (!tenantId) {
      const btParams = [days]
      byTenant = await sql(
        `SELECT
          t.id,
          t.name,
          t.slug,
          t.status,
          COUNT(DISTINCT c.id)::int                               AS conversations,
          COUNT(m.id)::int                                        AS messages,
          COUNT(m.id) FILTER (WHERE m.role = 'user')::int        AS received,
          COUNT(m.id) FILTER (WHERE m.role = 'assistant')::int   AS sent
         FROM tenants t
         LEFT JOIN conversations c ON c.tenant_id = t.id
         LEFT JOIN messages m ON m.conversation_id = c.id
           AND m.created_at >= NOW() - ($1 || ' days')::interval
         GROUP BY t.id, t.name, t.slug, t.status
         ORDER BY messages DESC`,
        btParams
      )
    }

    // Tempo médio de resposta (delta entre mensagem user e próxima assistant)
    const rtParams  = []
    const rtFilters = ['1=1']
    if (tenantId) { rtParams.push(tenantId); rtFilters.push(`m1.tenant_id = $${rtParams.length}`) }
    rtParams.push(days)
    const [responseTime] = await sql(
      `SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) / 60)::numeric, 1) AS avg_minutes
       FROM messages m1
       JOIN messages m2
         ON m2.conversation_id = m1.conversation_id
         AND m2.role = 'assistant'
         AND m2.created_at > m1.created_at
         AND m2.id = (
           SELECT id FROM messages
           WHERE conversation_id = m1.conversation_id
             AND role = 'assistant'
             AND created_at > m1.created_at
           ORDER BY created_at ASC LIMIT 1
         )
       WHERE m1.role = 'user'
         AND ${rtFilters.join(' AND ')}
         AND m1.created_at >= NOW() - ($${rtParams.length} || ' days')::interval`,
      rtParams
    )

    return Response.json({
      period: days,
      totals:       totals[0] || {},
      byDay,
      byChannel,
      byTenant,
      responseTime: responseTime || {},
    })
  } catch (err) {
    console.error('[analytics] GET error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
