import sql from '../../../../lib/db'
import { notFound } from 'next/navigation'
import ChatClient from './ChatClient'

export const dynamic = 'force-dynamic'

async function getConversation(id) {
  try {
    const [conv] = await sql`
      SELECT c.*, l.phone, l.stage, l.score, l.name, l.created_at as lead_since
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = ${id}
    `
    if (!conv) return null
    const messages = await sql`
      SELECT * FROM messages WHERE conversation_id = ${id}
      ORDER BY created_at ASC
    `
    const appointments = await sql`
      SELECT * FROM appointments WHERE lead_id = (
        SELECT lead_id FROM conversations WHERE id = ${id}
      ) ORDER BY created_at DESC LIMIT 5
    `
    return { conv, messages, appointments }
  } catch { return null }
}

export default async function ConversationPage({ params }) {
  const data = await getConversation(params.id)
  if (!data) notFound()
  return (
    <ChatClient
      conv={data.conv}
      messages={data.messages}
      appointments={data.appointments}
    />
  )
}
