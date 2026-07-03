import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token nao fornecido' }, { status: 400 })

    const tenants = await sql`
      SELECT id, name, business_name, ai_enabled, status, phone_number_id
      FROM tenants
      WHERE access_token = ${token}
      LIMIT 1
    `

    if (!tenants.length) {
      return NextResponse.json({ error: 'Token invalido ou expirado' }, { status: 401 })
    }

    return NextResponse.json({ tenant: tenants[0] })
  } catch (err) {
    console.error('Portal auth error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
