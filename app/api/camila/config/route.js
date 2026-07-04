import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

async function ensureColumn() {
    try {
          await sql`ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS custom_config JSONB DEFAULT '{}'::jsonb`
    } catch {}
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id') || 'camila-rocha'
    await ensureColumn()
    try {
          const rows = await sql`SELECT custom_config, scripts FROM agent_configs WHERE tenant_id = ${tenantId} LIMIT 1`
          const row = rows[0] || {}
                return NextResponse.json({ config: { settings: row.custom_config || {}, scripts: row.scripts || [] } })
    } catch (e) {
          return NextResponse.json({ config: { settings: {}, scripts: [] } })
    }
}

export async function PUT(request) {
    const { tenant_id = 'camila-rocha', settings } = await request.json()
    await ensureColumn()
    try {
          const rows = await sql`SELECT id FROM agent_configs WHERE tenant_id = ${tenant_id} LIMIT 1`
          if (rows.length === 0) {
                  await sql`INSERT INTO agent_configs (tenant_id, custom_config, scripts) VALUES (${tenant_id}, ${JSON.stringify(settings)}::jsonb, '[]'::jsonb)`
          } else {
                  await sql`UPDATE agent_configs SET custom_config = ${JSON.stringify(settings)}::jsonb WHERE tenant_id = ${tenant_id}`
          }
          return NextResponse.json({ ok: true })
    } catch (e) {
          return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
    }
}
