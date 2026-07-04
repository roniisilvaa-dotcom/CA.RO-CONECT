// app/api/caro-admin/clients/route.js
// GET  → lista todos os tenants
// POST → cria novo tenant/cliente
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const tenants = await sql`
      SELECT
        t.id,
        t.name,
        t.business_name,
        t.created_at,
        t.instagram_settings,
        (SELECT COUNT(*)::int FROM conversations c WHERE c.tenant_id = t.id)                          AS total_conversations,
        (SELECT COUNT(*)::int FROM conversations c WHERE c.tenant_id = t.id AND c.status = 'open')    AS open_conversations,
        (SELECT COUNT(*)::int FROM leads l WHERE l.tenant_id = t.id)                                  AS total_leads,
        (SELECT COUNT(*)::int FROM messages m WHERE m.tenant_id = t.id)                               AS total_messages,
        (SELECT MAX(m.created_at) FROM messages m WHERE m.tenant_id = t.id)                           AS last_activity,
        ARRAY(
          SELECT DISTINCT ch.type FROM channels ch WHERE ch.tenant_id = t.id
        ) AS channels
      FROM tenants t
      ORDER BY t.created_at DESC
    `

    return NextResponse.json({ tenants })
  } catch (err) {
    console.error('Clients GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const body = await req.json()
    const {
      name,
      business_name,
      whatsapp_phone,
      instagram_handle,
      plan = 'starter',
    } = body

    if (!name || !business_name) {
      return NextResponse.json({ error: 'name e business_name são obrigatórios' }, { status: 400 })
    }

    // Gera slug único baseado no nome
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Cria o tenant
    const [tenant] = await sql`
      INSERT INTO tenants (name, business_name, slug, plan)
      VALUES (${name}, ${business_name}, ${slug}, ${plan})
      RETURNING id, name, business_name, slug, plan, created_at
    `

    // Cria agent_config padrão
    await sql`
      INSERT INTO agent_configs (
        tenant_id,
        agent_name,
        agent_role,
        business_context,
        services,
        tone,
        language
      ) VALUES (
        ${tenant.id},
        ${'Assistente ' + name},
        ${'Assistente Virtual'},
        ${'Assistente virtual de ' + business_name},
        ${'[]'}::jsonb,
        ${'professional'},
        ${'pt-BR'}
      )
      ON CONFLICT (tenant_id) DO NOTHING
    `

    // Cria registro de canal WhatsApp se fornecido
    if (whatsapp_phone) {
      await sql`
        INSERT INTO channels (tenant_id, type, config)
        VALUES (
          ${tenant.id},
          ${'whatsapp'},
          ${JSON.stringify({ phone: whatsapp_phone })}::jsonb
        )
        ON CONFLICT DO NOTHING
      `
    }

    // Cria registro de canal Instagram se fornecido
    if (instagram_handle) {
      const igSettings = { instagram_handle, dm_ai_enabled: true }
      await sql`
        UPDATE tenants
        SET instagram_settings = ${JSON.stringify(igSettings)}::jsonb
        WHERE id = ${tenant.id}
      `
      await sql`
        INSERT INTO channels (tenant_id, type, config)
        VALUES (
          ${tenant.id},
          ${'instagram'},
          ${JSON.stringify({ handle: instagram_handle })}::jsonb
        )
        ON CONFLICT DO NOTHING
      `
    }

    return NextResponse.json({
      ok: true,
      tenant,
      next_steps: [
        whatsapp_phone ? null : 'Configure o número WhatsApp em Canais',
        instagram_handle ? null : 'Conecte o Instagram em Canais',
        'Adicione o system prompt da IA em Treinar IA',
        `Acesse o painel em /${slug}`,
      ].filter(Boolean),
    })
  } catch (err) {
    console.error('Clients POST error:', err)
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'Já existe um cliente com esse nome' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
