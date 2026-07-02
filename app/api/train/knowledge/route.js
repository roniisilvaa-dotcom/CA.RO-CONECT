import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// POST — adiciona texto extraído de PDF ao knowledge_base
export async function POST(request) {
  try {
    const { text, filename } = await request.json()

    if (!text || !filename) {
      return NextResponse.json({ error: 'text e filename sao obrigatorios' }, { status: 400 })
    }

    const rows = await sql`
      SELECT ac.id, ac.knowledge_base
      FROM agent_configs ac
      JOIN tenants t ON t.id = ac.tenant_id
      WHERE t.slug = 'camila-rocha'
    `

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Configuracao nao encontrada. Rode /api/setup primeiro.' }, { status: 404 })
    }

    const config = rows[0]
    const timestamp = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const divider = '\n\n' + '='.repeat(60) + '\nDOCUMENTO: ' + filename + '\nAdicionado: ' + timestamp + '\n' + '='.repeat(60) + '\n\n'
    const updated = (config.knowledge_base || '') + divider + text.trim()

    await sql`
      UPDATE agent_configs
      SET knowledge_base = ${updated}, updated_at = NOW()
      WHERE id = ${config.id}
    `

    return NextResponse.json({
      success: true,
      message: 'Documento "' + filename + '" adicionado com sucesso!',
      chars_added: text.length,
      total_chars: updated.length,
    })
  } catch (err) {
    console.error('[knowledge POST]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — limpa todo o knowledge_base
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (token !== process.env.META_VERIFY_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await sql`
      SELECT ac.id FROM agent_configs ac
      JOIN tenants t ON t.id = ac.tenant_id
      WHERE t.slug = 'camila-rocha'
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
    }

    await sql`
      UPDATE agent_configs
      SET knowledge_base = NULL, updated_at = NOW()
      WHERE id = ${rows[0].id}
    `

    return NextResponse.json({ success: true, message: 'Base de conhecimento limpa.' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
