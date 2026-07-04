// app/api/caro-admin/inbox/route.js
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const channel  = searchParams.get('channel')
    const status   = searchParams.get('status')
    const limit    = parseInt(searchParams.get('limit') || '100')

    // Build WHERE dynamically (Neon tagged template doesn't support nested sql fragments)
    const filters = ['1=1']
    const params  = []

    if (tenantId) {
      params.push(tenantId)
      filters.push(`c.tenant_id = $${params.length}`)
    }
    if (channel) {
      params.push(channel)
      filters.push(`c.channel = $${params.length}`)
    }
    if (status) {
      params.push(status)
      filters.push(`c.status = $${params.length}`)
    }

    params.push(limit)
    const limitIdx = params.length

    const whereClause = filters.join(' AND ')

    const conversations = await sql(
      `SELECT
        c.id,
        c.tenant_id,
        c.channel,
        c.status,
        c.ai_enabled,
        c.created_at,
        t.name        AS tenant_name,
        t.business_name,
        l.phone       AS customer_phone,
        l.name        AS customer_name,
        l.score       AS lead_score,
        l.stage       AS lead_stage,
        (SELECT content    FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT direction  FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_direction,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
        (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id)                              AS message_count,
        (SELECT COUNT(*)::int FROM messages
          WHERE conversation_id = c.id
            AND direction = 'inbound'
            AND created_at > COALESCE(
              (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id AND direction = 'outbound'),
              '1970-01-01'
            )
        ) AS unread_count
      FROM conversations c
      JOIN tenants t  ON t.id = c.tenant_id
      LEFT JOIN leads l ON l.id = c.lead_id
      WHERE ${whereClause}
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT $${limitIdx}`,
      params
    )

    // Summary by channel — same dynamic approach
    const summaryFilters = []
    const summaryParams  = []
    if (tenantId) {
      summaryParams.push(tenantId)
      summaryFilters.push(`c.tenant_id = $${summaryParams.length}`)
    }
    const summaryWhere = summaryFilters.length
      ? `WHERE ${summaryFilters.join(' AND ')}`
      : ''

    const summary = await sql(
      `SELECT
        c.channel,
        COUNT(*)::int                                              AS total,
        COUNT(*) FILTER (WHERE c.status = 'open')::int            AS open_count,
        COUNT(*) FILTER (WHERE c.ai_enabled = true)::int          AS ai_on
      FROM conversations c
      ${summaryWhere}
      GROUP BY c.channel`,
      summaryParams
    )

    return NextResponse.json({ conversations, summary })
  } catch (err) {
    console.error('Inbox route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
