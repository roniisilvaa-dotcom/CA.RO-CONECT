import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// POST: Callback do Embedded Signup da Meta
// Recebe o code, troca pelo token, pega phone_number_id, salva tenant
export async function POST(request) {
  try {
    const { code, tenantName, tenantSlug, tenantEmail, systemPrompt } = await request.json()

    if (!code) return NextResponse.json({ error: 'Code ausente' }, { status: 400 })
    if (!tenantName || !tenantSlug) return NextResponse.json({ error: 'Nome e slug obrigatórios' }, { status: 400 })

    // 1. Trocar code por access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&code=${code}`,
      { method: 'GET' }
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token error:', tokenData)
      return NextResponse.json({ error: 'Falha ao obter token da Meta: ' + (tokenData.error?.message || 'desconhecido') }, { status: 400 })
    }

    const accessToken = tokenData.access_token

    // 2. Buscar WABAs e phone numbers via debug_token
    const debugRes = await fetch(
      `https://graph.facebook.com/v19.0/debug_token` +
      `?input_token=${accessToken}` +
      `&access_token=${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
    )
    const debugData = await debugRes.json()

    // Extrair WABA IDs dos scopes
    const wabaScopes = debugData.data?.granular_scopes?.find(s => s.scope === 'whatsapp_business_management')
    const wabaId = wabaScopes?.target_ids?.[0] || null

    let phoneNumberId = null
    let phoneNumber = null

    // 3. Buscar phone numbers do WABA
    if (wabaId) {
      const phonesRes = await fetch(
        `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${accessToken}`
      )
      const phonesData = await phonesRes.json()
      const firstPhone = phonesData.data?.[0]
      phoneNumberId = firstPhone?.id || null
      phoneNumber = firstPhone?.display_phone_number || null
    }

    // 4. Criar ou atualizar tenant no banco
    // Verificar se slug já existe
    const existing = await sql`SELECT id FROM tenants WHERE slug = ${tenantSlug} LIMIT 1`
    let tenantId

    if (existing.length) {
      tenantId = existing[0].id
      await sql`
        UPDATE tenants SET
          name = ${tenantName},
          coexistence_enabled = true,
          updated_at = NOW()
        WHERE id = ${tenantId}
      `
    } else {
      const [newTenant] = await sql`
        INSERT INTO tenants (name, slug, coexistence_enabled)
        VALUES (${tenantName}, ${tenantSlug}, true)
        RETURNING id
      `
      tenantId = newTenant.id
    }

    // 5. Salvar/atualizar channel
    if (phoneNumberId) {
      await sql`
        INSERT INTO channels (tenant_id, type, identifier, enabled)
        VALUES (${tenantId}, 'whatsapp_meta', ${phoneNumberId}, true)
        ON CONFLICT (tenant_id, type) DO UPDATE
          SET identifier = ${phoneNumberId}, enabled = true
      `
    }

    // 6. Salvar/atualizar agent config com system prompt
    const prompt = systemPrompt || `Você é o assistente virtual de ${tenantName}. Atenda com cordialidade e profissionalismo.`
    await sql`
      INSERT INTO agent_configs (tenant_id, system_prompt, ai_enabled)
      VALUES (${tenantId}, ${prompt}, true)
      ON CONFLICT (tenant_id) DO UPDATE
        SET system_prompt = ${prompt}, ai_enabled = true
    `

    // 7. Ativar Coexistence via Meta API (se phone_number_id disponível)
    // O endpoint correto é PATCH /v19.0/{phone-number-id} com coexistence_status=ACTIVE
    if (phoneNumberId && process.env.META_WHATSAPP_TOKEN) {
      try {
        await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coexistence_status: 'ACTIVE' }),
        })
      } catch (e) {
        console.warn('Coexistence API call failed (pode já estar ativo):', e.message)
      }
    }

    console.log(`✅ Novo cliente cadastrado: ${tenantName} (${tenantSlug}), phoneId: ${phoneNumberId}`)

    return NextResponse.json({
      success: true,
      tenantId,
      tenantSlug,
      phoneNumberId,
      phoneNumber,
      wabaId,
      coexistenceEnabled: true,
    })
  } catch (err) {
    console.error('Embedded signup error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
