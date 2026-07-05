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
        t.business_name,
        t.slug,
        t.status,
        t.plan,
        t.email,
        t.phone,
        t.created_at,
        t.wa_phone_number_id IS NOT NULL AS wa_configured,
        t.wa_phone_number_id             AS wa_phone_id,
        t.ig_page_id IS NOT NULL         AS ig_configured,
        t.ig_page_id,
        (SELECT ai_enabled FROM agent_config WHERE tenant_id = t.id LIMIT 1)     AS ai_enabled,
        (SELECT assistant_name FROM agent_config WHERE tenant_id = t.id LIMIT 1) AS assistant_name,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id)         AS total_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND status = 'open') AS open_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND channel = 'whatsapp') AS wa_conversations,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = t.id AND channel = 'instagram') AS ig_conversations,
        (SELECT MAX(created_at) FROM messages WHERE tenant_id = t.id)            AS last_activity
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
    const { name, business_name, slug, email, phone, plan = 'starter' } = body

    if (!name || !slug) {
      return Response.json({ error: 'name e slug são obrigatórios' }, { status: 400 })
    }

    // Verifica se slug já existe
    const [existing] = await sql(
      `SELECT id FROM tenants WHERE slug = $1 LIMIT 1`,
      [slug]
    )
    if (existing) {
      return Response.json({ error: 'Slug já em uso' }, { status: 409 })
    }

    const [tenant] = await sql(
      `INSERT INTO tenants (name, business_name, slug, email, phone, plan, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
       RETURNING *`,
      [name, business_name || name, slug, email || null, phone || null, plan]
    )

    // Cria config padrão do agente
    await sql(
      `INSERT INTO agent_config (tenant_id, ai_enabled, assistant_name, created_at)
       VALUES ($1, true, $2, NOW())
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id, `IA ${name}`]
    )

    return Response.json({ tenant }, { status: 201 })
  } catch (err) {
    console.error('[tenants] POST error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
