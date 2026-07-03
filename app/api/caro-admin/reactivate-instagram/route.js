import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// POST: reativa IA do Instagram em conversas paradas
export async function POST(request) {
  try {
    // Reativa todas as conversas do Instagram paradas (waiting_human ou ai_enabled=false)
    const result = await sql`
      UPDATE conversations
      SET ai_enabled = true, status = 'open'
      WHERE channel = 'instagram'
        AND (status = 'waiting_human' OR ai_enabled = false)
      RETURNING id, status, ai_enabled
    `

    console.log(`✅ Reativadas ${result.length} conversas Instagram`)

    return NextResponse.json({
      ok: true,
      reactivated: result.length,
      conversations: result
    })
  } catch (err) {
    console.error('Erro ao reativar conversas Instagram:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET: verifica status das conversas Instagram
export async function GET() {
  try {
    const paused = await sql`
      SELECT id, status, ai_enabled, created_at
      FROM conversations
      WHERE channel = 'instagram'
        AND (status = 'waiting_human' OR ai_enabled = false)
      ORDER BY created_at DESC
    `
    const active = await sql`
      SELECT COUNT(*) as total
      FROM conversations
      WHERE channel = 'instagram' AND status = 'open' AND ai_enabled = true
    `
    return NextResponse.json({
      paused_count: paused.length,
      active_count: parseInt(active[0]?.total || 0),
      paused_conversations: paused
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
