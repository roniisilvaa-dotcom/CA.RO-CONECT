import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// POST /api/caro-admin/instagram-channel
// Body: { tenantId, igUserId }
export async function POST(request) {
  try {
    const { tenantId, igUserId } = await request.json()
    if (!tenantId || !igUserId) {
      return NextResponse.json({ error: 'tenantId e igUserId são obrigatórios' }, { status: 400 })
    }

    // Remove prefixo ig_ se o usuário colou com ele
    const cleanId = igUserId.replace(/^ig_/, '').trim()

    await sql`
      INSERT INTO channels (tenant_id, type, identifier, enabled)
      VALUES (${tenantId}, 'instagram', ${cleanId}, true)
      ON CONFLICT (tenant_id, type) DO UPDATE
        SET identifier = ${cleanId}, enabled = true
    `

    return NextResponse.json({ success: true, tenantId, igUserId: cleanId })
  } catch (err) {
    console.error('Instagram channel error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
