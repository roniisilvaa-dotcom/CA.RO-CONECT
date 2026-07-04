import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id') || 'camila-rocha'
    const rows = await sql`SELECT scripts FROM agent_configs WHERE tenant_id = ${tenantId} LIMIT 1`
    return NextResponse.json({ scripts: rows[0]?.scripts || [] })
}

export async function POST(request) {
    const { tenant_id = 'camila-rocha', script } = await request.json()
    if (!script.id) script.id = `s_${Date.now()}`
    const rows = await sql`SELECT scripts FROM agent_configs WHERE tenant_id = ${tenant_id} LIMIT 1`
    const current = rows[0]?.scripts || []
        const idx = current.findIndex(s => s.id === script.id)
    const updated = idx >= 0 ? current.map((s, i) => i === idx ? script : s) : [...current, script]
    await sql`UPDATE agent_configs SET scripts = ${JSON.stringify(updated)}::jsonb WHERE tenant_id = ${tenant_id}`
    return NextResponse.json({ ok: true, scripts: updated })
}

export async function DELETE(request) {
    const { tenant_id = 'camila-rocha', script_id } = await request.json()
    const rows = await sql`SELECT scripts FROM agent_configs WHERE tenant_id = ${tenant_id} LIMIT 1`
    const current = rows[0]?.scripts || []
        const updated = current.filter(s => s.id !== script_id)
    await sql`UPDATE agent_configs SET scripts = ${JSON.stringify(updated)}::jsonb WHERE tenant_id = ${tenant_id}`
    return NextResponse.json({ ok: true, scripts: updated })
}
