import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// GET  /api/caro-admin/knowledge?tenant_id=...   → lista docs
// DELETE /api/caro-admin/knowledge?id=...        → apaga doc

export async function GET(req) {
  try {
    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id obrigatório' }, { status: 400 })
    }

    const docs = await sql`
      SELECT
        id,
        filename,
        size_bytes,
        created_at,
        char_length(content) AS chars,
        left(content, 400)   AS preview
      FROM knowledge_docs
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ docs })
  } catch (e) {
    console.error('Knowledge GET error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const sql = neon(process.env.DATABASE_URL)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    await sql`DELETE FROM knowledge_docs WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Knowledge DELETE error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
