import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/coexistence — verifica status atual do Coexistence
export async function GET() {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID
  const token = process.env.META_WHATSAPP_TOKEN

  if (!phoneNumberId || !token) {
    return NextResponse.json({ error: 'META_PHONE_NUMBER_ID ou META_WHATSAPP_TOKEN ausentes' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=coexistence_status,display_phone_number,verified_name,quality_rating`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    return NextResponse.json({ phoneNumberId, ...data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/admin/coexistence — ativa Coexistence (WhatsApp Business app + Cloud API simultâneos)
export async function POST(request) {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID
  const token = process.env.META_WHATSAPP_TOKEN

  if (!phoneNumberId || !token) {
    return NextResponse.json({ error: 'META_PHONE_NUMBER_ID ou META_WHATSAPP_TOKEN ausentes' }, { status: 500 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const status = body.status || 'ACTIVE' // ACTIVE ou INACTIVE

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coexistence_status: status }),
      }
    )
    const data = await res.json()

    if (data.error) {
      console.error('Meta API Coexistence error:', data.error)
      return NextResponse.json({ success: false, error: data.error, phoneNumberId }, { status: 400 })
    }

    console.log(`✅ Coexistence ${status} para phoneNumberId ${phoneNumberId}`)
    return NextResponse.json({ success: true, coexistence_status: status, phoneNumberId, ...data })
  } catch (err) {
    console.error('Coexistence error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
