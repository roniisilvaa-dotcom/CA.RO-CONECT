// app/api/caro-admin/messages/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL)
  const { searchParams } = new URL(req.url)
  const convId = searchParams.get('conv_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '150'), 500)

  if (!convId) {
    return Response.json({ error: 'conv_id required' }, { status: 400 })
  }

  try {
    const rows = await sql(
      `SELECT
         m.id,
         m.conversation_id,
         m.role,
         m.content,
         m.created_at,
         l.name   AS customer_name,
         l.phone  AS customer_phone,
         c.channel,
         c.tenant_id
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       LEFT JOIN leads l ON l.id = c.lead_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2`,
      [convId, limit]
    )

    return Response.json({ messages: rows, total: rows.length })
  } catch (e) {
    console.error('[messages] GET error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { conv_id, content, role = 'assistant' } = await req.json()

    if (!conv_id || !content) {
      return Response.json({ error: 'conv_id and content required' }, { status: 400 })
    }

    const rows = await sql(
      `INSERT INTO messages (conversation_id, role, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, conversation_id, role, content, created_at`,
      [conv_id, role, content]
    )

    return Response.json({ ok: true, message: rows[0] })
  } catch (e) {
    console.error('[messages] POST error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
