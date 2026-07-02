import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// GET /api/caro-admin/client?id=X — dados completos do cliente
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const [tenant] = await sql`
      SELECT
        t.id, t.name, t.slug, t.coexistence_enabled,
        COALESCE(ch.identifier, '') AS phone_number_id,
        COALESCE(ch.enabled, false) AS channel_enabled,
        COALESCE(ac.system_prompt, '') AS system_prompt,
        COALESCE(ac.ai_enabled, true) AS ai_enabled
      FROM tenants t
      LEFT JOIN channels ch ON ch.tenant_id = t.id AND ch.type IN ('whatsapp', 'whatsapp_meta')
      LEFT JOIN agent_configs ac ON ac.tenant_id = t.id
      WHERE t.id = ${id}
    `
    if (!tenant) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    // Documentos (knowledge base)
    const docs = await sql`
      SELECT id, title, source_type, created_at
      FROM knowledge_base
      WHERE tenant_id = ${id}
      ORDER BY created_at DESC
      LIMIT 20
    `

    // Stats de conversas
    const [stats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS convs_today,
        COUNT(*) AS convs_total
      FROM conversations
      WHERE tenant_id = ${id}
    `

    // Últimas conversas
    const conversations = await sql`
      SELECT
        c.id, c.customer_phone, c.status, c.created_at,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM conversations c
      WHERE c.tenant_id = ${id}
      ORDER BY c.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({ tenant, docs, stats, conversations })
  } catch (err) {
    console.error('Client detail error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/caro-admin/client — atualiza system prompt e toggles
export async function PATCH(request) {
  try {
    const { id, system_prompt, ai_enabled } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    await sql`
      INSERT INTO agent_configs (tenant_id, system_prompt, ai_enabled)
      VALUES (${id}, ${system_prompt}, ${ai_enabled})
      ON CONFLICT (tenant_id) DO UPDATE
        SET system_prompt = ${system_prompt}, ai_enabled = ${ai_enabled}
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Client update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/caro-admin/client?id=X&docId=Y — remove documento
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('docId')
    if (!docId) return NextResponse.json({ error: 'docId obrigatório' }, { status: 400 })

    await sql`DELETE FROM knowledge_base WHERE id = ${docId}`
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
