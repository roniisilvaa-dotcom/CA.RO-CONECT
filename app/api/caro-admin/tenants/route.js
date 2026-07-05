// app/api/caro-admin/tenants/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active' | 'inactive' | null = todos

    const filters = ['1=1']
    const params  = []
    if (status) { params.push(status); filters.push(`t.status = $${params.length}`) }
    const whereClause = filters.join(' AND ')

    const tenants = await sql(
      `SELECT
        t.id,
        t.name,
        t.slug,
        t.status,
        t.plan,
        t.created_at,
        t.coexistence_enabled,
        -- canais
        EXISTS(SELECT 1 FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'whatsapp_meta')  AS wa_configured,
        (SELECT ch.identifier FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'whatsapp_meta' LIMIT 1) AS wa_phone_id,
        EXISTS(SELECT 1 FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'instagram')      AS ig_configured,
        (SELECT ch.identifier FROM channels ch
          WHERE ch.tenant_id = t.id AND ch.type = 'instagram' LIMIT 1) AS ig_page_id,
        -- configuração do agente
        (SELECT ac.ai_enabled  FROM agent_configs ac WHERE ac.tenant_id = t.id LIMIT 1) AS ai_enabled,
        (SELECT ac.agent_name  FROM agent_configs ac WHERE ac.tenant_id = t.id LIMIT 1) AS agent_name,
        -- contadores de conversas
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id)                   AS total_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND status = 'open') AS open_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND channel = 'whatsapp') AS wa_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND channel = 'instagram') AS ig_conversations,
        -- última atividade
        (SELECT MAX(created_at) FROM messages WHERE tenant_id = t.id) AS last_activity
      FROM tenants t
      WHERE ${whereClause}
      ORDER BY t.created_at ASC`,
      params
    )

    return Response.json({ tenants, total: tenants.length })
  } catch (err) {
    console.error('[tenants] GET error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const body = await request.json()
    const { name, slug, plan = 'starter' } = body

    if (!name || !slug) {
      return Response.json({ error: 'name e slug são obrigatórios' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

    const [existing] = await sql(`SELECT id FROM tenants WHERE slug = $1 LIMIT 1`, [cleanSlug])
    if (existing) {
      return Response.json({ error: 'Slug já em uso' }, { status: 409 })
    }

    const [tenant] = await sql(
      `INSERT INTO tenants (name, slug, plan, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       RETURNING *`,
      [name, cleanSlug, plan]
    )

    await sql(
      `INSERT INTO agent_configs (tenant_id, agent_name, ai_enabled, created_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW())
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id, `Assistente ${name}`]
    )

    return Response.json({ tenant }, { status: 201 })
  } catch (err) {
    console.error('[tenants] POST error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const body = await request.json()
    const { id, status, plan, name, coexistence_enabled } = body

    if (!id) return Response.json({ error: 'id é obrigatório' }, { status: 400 })

    const sets   = []
    const params = [id]

    if (status !== undefined) { params.push(status); sets.push(`status = $${params.length}`) }
    if (plan !== undefined) { params.push(plan); sets.push(`plan = $${params.length}`) }
    if (name !== undefined) { params.push(name); sets.push(`name = $${params.length}`) }
    if (coexistence_enabled !== undefined) { params.push(coexistence_enabled); sets.push(`coexistence_enabled = $${params.length}`) }

    if (sets.length === 0) {
      return Response.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const [tenant] = await sql(
      `UPDATE tenants SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      params
    )

    return Response.json({ tenant })
  } catch (err) {
    console.error('[tenants] PATCH error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
