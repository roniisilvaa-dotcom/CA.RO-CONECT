// app/api/caro-admin/agent/route.js
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL)
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant_id')

  if (!tenantId) {
    return Response.json({ error: 'tenant_id required' }, { status: 400 })
  }

  try {
    const rows = await sql(
      `SELECT
         ac.id,
         ac.tenant_id,
         ac.agent_name,
         ac.system_prompt,
         ac.ai_enabled,
         ac.agent_persona,
         ac.business_description,
         ac.created_at,
         ac.updated_at,
         t.name         AS tenant_name,
         t.slug,
         t.status       AS tenant_status,
         t.plan
       FROM agent_configs ac
       JOIN tenants t ON t.id = ac.tenant_id
       WHERE ac.tenant_id = $1
       LIMIT 1`,
      [tenantId]
    )

    if (!rows.length) {
      return Response.json({ error: 'agent_config not found for tenant' }, { status: 404 })
    }

    return Response.json({ config: rows[0] })
  } catch (e) {
    console.error('[agent] GET error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req) {
  const sql = neon(process.env.DATABASE_URL)
  try {
    const {
      tenant_id,
      agent_name,
      system_prompt,
      ai_enabled,
      agent_persona,
      business_description,
    } = await req.json()

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 })
    }

    await sql(
      `UPDATE agent_configs
       SET
         agent_name           = COALESCE($2, agent_name),
         system_prompt        = COALESCE($3, system_prompt),
         ai_enabled           = COALESCE($4, ai_enabled),
         agent_persona        = COALESCE($5, agent_persona),
         business_description = COALESCE($6, business_description),
         updated_at           = NOW()
       WHERE tenant_id = $1`,
      [tenant_id, agent_name ?? null, system_prompt ?? null, ai_enabled ?? null, agent_persona ?? null, business_description ?? null]
    )

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[agent] PUT error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
