import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    const conversations = await sql`
      SELECT
        c.id,
        c.tenant_id,
        c.channel,
        c.status,
        c.ai_enabled,
        c.created_at,
        t.name as tenant_name,
        t.business_name,
        l.phone as customer_phone,
        l.name as customer_name,
        l.score as lead_score,
        (
          SELECT content FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT direction FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_direction,
        (
          SELECT created_at FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_at,
        (
          SELECT COUNT(*)::int FROM messages
          WHERE conversation_id = c.id
        ) as message_count,
        (
          SELECT COUNT(*)::int FROM messages
          WHERE conversation_id = c.id
            AND direction = 'inbound'
            AND created_at > COALESCE(
              (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id AND direction = 'outbound'),
              '1970-01-01'
            )
        ) as unread_count
      FROM conversations c
      JOIN tenants t ON t.id = c.tenant_id
      LEFT JOIN leads l ON l.id = c.lead_id
      WHERE 1=1
        ${tenantId ? sql`AND c.tenant_id = ${tenantId}` : sql``}
        ${channel ? sql`AND c.channel = ${channel}` : sql``}
        ${status ? sql`AND c.status = ${status}` : sql``}
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT ${limit}
    `

    const summary = await sql`
      SELECT
        c.channel,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE c.status = 'open')::int as open_count,
        COUNT(*) FILTER (WHERE c.ai_enabled = true)::int as ai_on
      FROM conversations c
      ${tenantId ? sql`WHERE c.tenant_id = ${tenantId}` : sql``}
      GROUP BY c.channel
    `

    return NextResponse.json({ conversations, summary })
  } catch (err) {
    console.error('Inbox route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
