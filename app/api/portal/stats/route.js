import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token obrigatorio' }, { status: 400 })

    const tenants = await sql`SELECT id FROM tenants WHERE access_token = ${token} LIMIT 1`
    if (!tenants.length) return NextResponse.json({ error: 'Token invalido' }, { status: 401 })

    const tenantId = tenants[0].id

    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId} AND status = 'open') as active_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId} AND DATE(created_at) = CURRENT_DATE) as conversations_today,
        (SELECT COUNT(*)::int FROM messages WHERE tenant_id = ${tenantId} AND DATE(created_at) = CURRENT_DATE) as messages_today,
        (SELECT COUNT(*)::int FROM messages WHERE tenant_id = ${tenantId} AND direction = 'outbound' AND DATE(created_at) = CURRENT_DATE) as ai_responses_today,
        (SELECT COUNT(*)::int FROM leads WHERE tenant_id = ${tenantId}) as total_leads,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId}) as total_conversations
    `

    const messagesByDay = await sql`
      SELECT
        TO_CHAR(DATE(created_at), 'DD/MM') as date,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE direction = 'inbound')::int as inbound,
        COUNT(*) FILTER (WHERE direction = 'outbound')::int as outbound
      FROM messages
      WHERE tenant_id = ${tenantId}
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `

    return NextResponse.json({ stats, messagesByDay })
  } catch (err) {
    console.error('Portal stats error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
