import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Stats globais
    const [statsRow] = await sql`
      SELECT
        (SELECT COUNT(*) FROM tenants) AS total_tenants,
        (SELECT COUNT(*) FROM conversations WHERE DATE(created_at) = CURRENT_DATE) AS convs_today,
        (SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURRENT_DATE) AS msgs_today,
        (SELECT COUNT(*) FROM messages WHERE role = 'assistant' AND DATE(created_at) = CURRENT_DATE) AS ai_today
    `

    // Lista de tenants com stats
    const tenants = await sql`
      SELECT
        t.id,
        t.name,
        t.slug,
        t.coexistence_enabled,
        COALESCE(ch.identifier, '') AS phone_number,
        COALESCE(ch.type, 'whatsapp') AS channel_type,
        COALESCE(ac.ai_enabled, true) AS ai_enabled,
        (
          SELECT COUNT(*) FROM conversations c
          WHERE c.tenant_id = t.id AND DATE(c.created_at) = CURRENT_DATE
        ) AS convs_today
      FROM tenants t
      LEFT JOIN channels ch ON ch.tenant_id = t.id AND ch.type IN ('whatsapp', 'whatsapp_meta')
      LEFT JOIN agent_configs ac ON ac.tenant_id = t.id
      ORDER BY t.name
    `

    return NextResponse.json({
      stats: {
        totalTenants: Number(statsRow.total_tenants),
        convsToday: Number(statsRow.convs_today),
        msgsToday: Number(statsRow.msgs_today),
        aiToday: Number(statsRow.ai_today),
      },
      tenants,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
