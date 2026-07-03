import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { tenantId } = await request.json()
    if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatorio' }, { status: 400 })

    // Garante que a coluna existe
    await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS access_token TEXT`

    const token = crypto.randomUUID()
    await sql`UPDATE tenants SET access_token = ${token} WHERE id = ${tenantId}`

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://caro-connect-next.vercel.app'
    const portalUrl = `${baseUrl}/portal/${token}`

    return NextResponse.json({ token, portalUrl })
  } catch (err) {
    console.error('Generate token error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
