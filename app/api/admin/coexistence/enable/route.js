import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/coexistence/enable — ativa Coexistence via GET (para chamar pelo browser)
export async function GET() {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID
  const token = process.env.META_WHATSAPP_TOKEN

  if (!phoneNumberId || !token) {
    return NextResponse.json({ error: 'META_PHONE_NUMBER_ID ou META_WHATSAPP_TOKEN ausentes' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coexistence_status: 'ACTIVE' }),
      }
    )
    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error, phoneNumberId }, { status: 400 })
    }

    return NextResponse.json({ success: true, coexistence_status: 'ACTIVE', phoneNumberId, ...data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
