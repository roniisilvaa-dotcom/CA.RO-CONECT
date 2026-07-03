import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatorio' }, { status: 400 })

    const [tenant] = await sql`
      SELECT instagram_settings FROM tenants WHERE id = ${tenantId} LIMIT 1
    `
    return NextResponse.json({ settings: tenant?.instagram_settings || {} })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { tenantId, settings } = await request.json()
    if (!tenantId || !settings) return NextResponse.json({ error: 'tenantId e settings obrigatorios' }, { status: 400 })

    await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram_settings JSONB DEFAULT '{}'`

    await sql`
      UPDATE tenants
      SET instagram_settings = ${JSON.stringify(settings)}::jsonb
      WHERE id = ${tenantId}
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Instagram settings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
