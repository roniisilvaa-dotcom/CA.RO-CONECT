import { NextResponse } from 'next/server'
import sql from '../../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const [conv] = await sql`
      SELECT c.*, l.phone, l.stage, l.score, l.name, l.created_at as lead_since
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = ${id}
    `
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const messages = await sql`
      SELECT * FROM messages WHERE conversation_id = ${id}
      ORDER BY created_at ASC
    `

    const appointments = await sql`
      SELECT * FROM appointments WHERE lead_id = ${conv.lead_id}
      ORDER BY created_at DESC LIMIT 5
    `

    return NextResponse.json({ conv, messages, appointments })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
