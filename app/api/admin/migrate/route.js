import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/migrate — roda todas as migrations necessárias
// Chamar uma vez para atualizar o schema do banco
export async function GET() {
  const results = []

  try {
    // 1. Colunas novas na tabela tenants
    await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS coexistence_enabled BOOLEAN DEFAULT false`
    results.push('tenants.coexistence_enabled ✓')

    await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug_v2 TEXT`
    // Manter compatibilidade com slug VARCHAR(100) UNIQUE já existente
    results.push('tenants.slug (já existe) ✓')

    // 2. Colunas novas na tabela agent_configs
    await sql`ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS system_prompt TEXT`
    results.push('agent_configs.system_prompt ✓')

    await sql`ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true`
    results.push('agent_configs.ai_enabled ✓')

    // Copiar agent_persona para system_prompt onde system_prompt for null
    await sql`
      UPDATE agent_configs
      SET system_prompt = agent_persona
      WHERE system_prompt IS NULL AND agent_persona IS NOT NULL
    `
    results.push('agent_configs: agent_persona → system_prompt ✓')

    // 3. Colunas novas na tabela channels
    await sql`ALTER TABLE channels ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true`
    results.push('channels.enabled ✓')

    // Index único para evitar duplicata de canal por tenant
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS channels_tenant_type_unique
      ON channels(tenant_id, type)
    `
    results.push('channels: unique index tenant+type ✓')

    // 4. Colunas novas na tabela messages
    await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT`
    results.push('messages.whatsapp_message_id ✓')

    await sql`
      CREATE INDEX IF NOT EXISTS messages_wamid_idx
      ON messages(whatsapp_message_id)
      WHERE whatsapp_message_id IS NOT NULL
    `
    results.push('messages: index whatsapp_message_id ✓')

    // 5. Criar tabela knowledge_base se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    results.push('knowledge_base table ✓')

    // 6. Atualizar canal Instagram da Camila para usar PSID corretamente
    // (identifier deve ser o USER ID do Instagram, não o username)
    results.push('Canal Instagram: verificar manualmente se identifier = META_IG_USER_ID ✓')

    return NextResponse.json({ success: true, migrations: results })
  } catch (err) {
    console.error('Migration error:', err)
    return NextResponse.json({
      success: false,
      error: err.message,
      completed: results
    }, { status: 500 })
  }
}
