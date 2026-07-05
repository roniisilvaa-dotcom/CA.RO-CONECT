import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function GET(req) {
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
         ac.assistant_name,
         ac.system_prompt,
         ac.personality,
         ac.max_response_length,
         ac.ai_enabled,
         ac.created_at,
         ac.updated_at,
         t.name         AS tenant_name,
         t.business_name,
         t.slug,
         t.status       AS tenant_status,
         t.plan
       FROM agent_config ac
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
  try {
    const {
      tenant_id,
      assistant_name,
      system_prompt,
      personality,
      max_response_length,
      ai_enabled,
    } = await req.json()

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 })
    }

    await sql(
      `UPDATE agent_config
       SET
         assistant_name      = COALESCE($2, assistant_name),
         system_prompt       = COALESCE($3, system_prompt),
         personality         = COALESCE($4, personality),
         max_response_length = COALESCE($5, max_response_length),
         ai_enabled          = COALESCE($6, ai_enabled),
         updated_at          = NOW()
       WHERE tenant_id = $1`,
      [tenant_id, assistant_name ?? null, system_prompt ?? null, personality ?? null, max_response_length ?? null, ai_enabled ?? null]
    )

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[agent] PUT error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
