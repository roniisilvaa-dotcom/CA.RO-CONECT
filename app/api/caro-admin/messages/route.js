import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId obrigatorio' }, { status: 400 })
    }

    const messages = await sql`
      SELECT
        m.id,
        m.conversation_id,
        m.direction,
        m.content,
        m.created_at,
        m.metadata
      FROM messages m
      WHERE m.conversation_id = ${conversationId}
      ORDER BY m.created_at ASC
      LIMIT 200
    `

    const [conversation] = await sql`
      SELECT
        c.id, c.channel, c.status, c.ai_enabled, c.tenant_id,
        l.name as customer_name, l.phone as customer_phone, l.score as lead_score,
        t.name as tenant_name
      FROM conversations c
      LEFT JOIN leads l ON l.id = c.lead_id
      LEFT JOIN tenants t ON t.id = c.tenant_id
      WHERE c.id = ${conversationId}
    `

    return NextResponse.json({ messages, conversation })
  } catch (err) {
    console.error('Messages route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
