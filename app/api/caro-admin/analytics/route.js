import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const days = parseInt(searchParams.get('days') || '7')

    const where = tenantId ? sql`WHERE tenant_id = ${tenantId}` : sql``
    const whereAnd = tenantId ? sql`AND tenant_id = ${tenantId}` : sql``

    const [totals] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM conversations ${where}) as total_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE status = 'open' ${whereAnd}) as open_conversations,
        (SELECT COUNT(*)::int FROM messages ${where}) as total_messages,
        (SELECT COUNT(*)::int FROM messages WHERE direction = 'outbound' ${whereAnd}) as ai_messages,
        (SELECT COUNT(*)::int FROM leads ${where}) as total_leads,
        (SELECT COUNT(*)::int FROM conversations WHERE DATE(created_at) = CURRENT_DATE ${whereAnd}) as conversations_today,
        (SELECT COUNT(*)::int FROM messages WHERE DATE(created_at) = CURRENT_DATE ${whereAnd}) as messages_today,
        (SELECT COUNT(*)::int FROM messages WHERE direction = 'outbound' AND DATE(created_at) = CURRENT_DATE ${whereAnd}) as ai_messages_today
    `

    const byDay = await sql`
      SELECT
        TO_CHAR(DATE(created_at), 'DD/MM') as date,
        DATE(created_at) as raw_date,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE direction = 'inbound')::int as inbound,
        COUNT(*) FILTER (WHERE direction = 'outbound')::int as outbound
      FROM messages
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
        ${whereAnd}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `

    const byChannel = await sql`
      SELECT
        c.channel,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE c.status = 'open')::int as open,
        COUNT(*) FILTER (WHERE c.ai_enabled = true)::int as ai_on
      FROM conversations c
      WHERE 1=1 ${whereAnd.length ? whereAnd : sql``}
      GROUP BY c.channel
    `

    const topLeads = await sql`
      SELECT
        l.id, l.name, l.phone, l.score, l.created_at,
        t.name as tenant_name,
        (SELECT COUNT(*)::int FROM conversations WHERE lead_id = l.id) as conv_count
      FROM leads l
      JOIN tenants t ON t.id = l.tenant_id
      WHERE l.score > 0
        ${tenantId ? sql`AND l.tenant_id = ${tenantId}` : sql``}
      ORDER BY l.score DESC
      LIMIT 10
    `

    const byTenant = tenantId ? [] : await sql`
      SELECT
        t.id, t.name, t.business_name,
        COUNT(DISTINCT c.id)::int as conversations,
        COUNT(m.id)::int as messages,
        COUNT(*) FILTER (WHERE m.direction = 'outbound')::int as ai_messages
      FROM tenants t
      LEFT JOIN conversations c ON c.tenant_id = t.id
      LEFT JOIN messages m ON m.tenant_id = t.id
      GROUP BY t.id, t.name, t.business_name
      ORDER BY conversations DESC
      LIMIT 20
    `

    return NextResponse.json({ totals, byDay, byChannel, topLeads, byTenant, period: days })
  } catch (err) {
    console.error('Analytics route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
