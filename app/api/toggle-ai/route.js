import { NextResponse } from 'next/server'
import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { conversationId, enabled } = await request.json()

    if (conversationId === undefined || enabled === undefined) {
      return NextResponse.json({ error: 'conversationId e enabled são obrigatórios' }, { status: 400 })
    }

    const newStatus = enabled ? 'open' : 'waiting_human'

    const [updated] = await sql`
      UPDATE conversations
      SET ai_enabled = ${enabled}, status = ${newStatus}, updated_at = NOW()
      WHERE id = ${conversationId}
      RETURNING id, ai_enabled, status
    `

    if (!updated) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, ai_enabled: updated.ai_enabled, status: updated.status })
  } catch (err) {
    console.error('❌ Erro ao alternar IA:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
