import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function GET(req) {
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
         m.direction,
         m.content,
         m.content_type,
         m.media_url,
         m.media_type,
         m.wa_message_id,
         m.created_at,
         c.customer_name,
         c.customer_phone,
         c.channel,
         c.tenant_id
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
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
  try {
    const { conv_id, content, direction = 'outbound', content_type = 'text' } = await req.json()

    if (!conv_id || !content) {
      return Response.json({ error: 'conv_id and content required' }, { status: 400 })
    }

    const rows = await sql(
      `INSERT INTO messages (conversation_id, direction, content, content_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, conversation_id, direction, content, content_type, created_at`,
      [conv_id, direction, content, content_type]
    )

    return Response.json({ ok: true, message: rows[0] })
  } catch (e) {
    console.error('[messages] POST error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
