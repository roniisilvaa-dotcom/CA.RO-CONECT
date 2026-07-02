import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')

    let rows
    if (stage && stage !== 'all') {
      rows = await sql`
        SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
          l.phone, l.stage, l.score,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND role = 'user') as unread
        FROM conversations c
        JOIN leads l ON l.id = c.lead_id
        WHERE l.stage = ${stage}
        ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC
      `
    } else if (status && status !== 'all') {
      rows = await sql`
        SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
          l.phone, l.stage, l.score,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND role = 'user') as unread
        FROM conversations c
        JOIN leads l ON l.id = c.lead_id
        WHERE c.status = ${status}
        ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC
      `
    } else {
      rows = await sql`
        SELECT c.id, c.status, c.ai_enabled, c.created_at, c.channel,
          l.phone, l.stage, l.score,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg_at,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND role = 'user') as unread
        FROM conversations c
        JOIN leads l ON l.id = c.lead_id
        ORDER BY last_msg_at DESC NULLS LAST, c.created_at DESC
      `
    }

    return NextResponse.json({ conversations: rows })
  } catch (err) {
    return NextResponse.json({ error: err.message, conversations: [] }, { status: 500 })
  }
}
