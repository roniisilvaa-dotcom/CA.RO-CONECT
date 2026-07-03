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

    const conversations = await sql`
      SELECT
        c.id, c.channel, c.status, c.ai_enabled, c.created_at,
        l.phone as customer_phone, l.name as customer_name, l.score,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      LEFT JOIN leads l ON l.id = c.lead_id
      WHERE c.tenant_id = ${tenantId}
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT 50
    `

    return NextResponse.json({ conversations })
  } catch (err) {
    console.error('Portal conversations error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
