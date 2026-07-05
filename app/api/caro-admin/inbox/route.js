// app/api/caro-admin/inbox/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const channel  = searchParams.get('channel')   // 'whatsapp' | 'instagram' | null
    const status   = searchParams.get('status')    // 'open' | 'closed' | null
    const search   = searchParams.get('search')    // busca por nome/telefone
    const limit    = Math.min(parseInt(searchParams.get('limit') || '150'), 500)
    const offset   = parseInt(searchParams.get('offset') || '0')

    const filters = ['1=1']
    const params  = []

    if (tenantId) { params.push(tenantId);  filters.push(`c.tenant_id = $${params.length}`) }
    if (channel)  { params.push(channel);   filters.push(`c.channel = $${params.length}`) }
    if (status)   { params.push(status);    filters.push(`c.status = $${params.length}`) }
    if (search)   {
      params.push(`%${search}%`)
      filters.push(`(l.name ILIKE $${params.length} OR l.phone ILIKE $${params.length})`)
    }

    const whereClause = filters.join(' AND ')
    params.push(limit);  const limitIdx  = params.length
    params.push(offset); const offsetIdx = params.length

    const conversations = await sql(
      `SELECT
        c.id,
        c.tenant_id,
        c.channel,
        c.status,
        c.ai_enabled,
        c.created_at,
        l.name     AS customer_name,
        l.phone    AS customer_phone,
        l.stage    AS lead_stage,
        l.score    AS lead_score,
        t.name          AS tenant_name,
        t.slug          AS tenant_slug,
        t.status        AS tenant_status,
        (SELECT content    FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT role       FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_direction,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
        (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id)                               AS message_count,
        (SELECT COUNT(*)::int FROM messages
          WHERE conversation_id = c.id
            AND role = 'user'
            AND created_at > COALESCE(
              (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id AND role = 'assistant'),
              '1970-01-01'
            )
        ) AS unread_count
      FROM conversations c
      JOIN tenants t ON t.id = c.tenant_id
      LEFT JOIN leads l ON l.id = c.lead_id
      WHERE ${whereClause}
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    // Resumo por canal
    const sfParams  = []
    const sfFilters = ['1=1']
    if (tenantId) { sfParams.push(tenantId); sfFilters.push(`c.tenant_id = $${sfParams.length}`) }
    const sfWhere = sfFilters.join(' AND ')

    const summary = await sql(
      `SELECT
        c.channel,
        COUNT(*)::int                                              AS total,
        COUNT(*) FILTER (WHERE c.status = 'open')::int            AS open_count,
        COUNT(*) FILTER (WHERE c.ai_enabled = true)::int          AS ai_on,
        COUNT(*) FILTER (WHERE c.status = 'open'
          AND EXISTS (
            SELECT 1 FROM messages m
            WHERE m.conversation_id = c.id
              AND m.role = 'user'
              AND m.created_at > COALESCE(
                (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id AND role = 'assistant'),
                '1970-01-01'
              )
          ))::int AS with_unread
      FROM conversations c
      WHERE ${sfWhere}
      GROUP BY c.channel`,
      sfParams
    )

    // Total para paginação
    const countParams  = []
    const countFilters = ['1=1']
    if (tenantId) { countParams.push(tenantId); countFilters.push(`c.tenant_id = $${countParams.length}`) }
    if (channel)  { countParams.push(channel);  countFilters.push(`c.channel = $${countParams.length}`) }
    if (status)   { countParams.push(status);   countFilters.push(`c.status = $${countParams.length}`) }
    const [countRow] = await sql(
      `SELECT COUNT(*)::int AS total FROM conversations c WHERE ${countFilters.join(' AND ')}`,
      countParams
    )

    return Response.json({ conversations, summary, total: countRow?.total || 0 })
  } catch (err) {
    console.error('[inbox] GET error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
