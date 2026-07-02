import { NextResponse } from 'next/server'
import sql from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/migrate — roda todas as migrations necessárias
// Idempotente — pode ser chamado várias vezes sem problema
export async function GET() {
  const results = []
  const errors = []

  async function run(label, fn) {
    try {
      await fn()
      results.push(`${label} ✓`)
    } catch (err) {
      errors.push(`${label} ✗ — ${err.message}`)
      console.error(`Migration [${label}] error:`, err.message)
    }
  }

  // 1. Colunas novas na tabela tenants
  await run('tenants.coexistence_enabled', () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS coexistence_enabled BOOLEAN DEFAULT false`
  )

  // 2. Colunas novas na tabela agent_configs
  await run('agent_configs.system_prompt', () =>
    sql`ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS system_prompt TEXT`
  )
  await run('agent_configs.ai_enabled', () =>
    sql`ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true`
  )
  await run('agent_configs: agent_persona → system_prompt', () =>
    sql`UPDATE agent_configs SET system_prompt = agent_persona WHERE system_prompt IS NULL AND agent_persona IS NOT NULL`
  )

  // 3. Colunas novas na tabela channels
  await run('channels.enabled', () =>
    sql`ALTER TABLE channels ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true`
  )

  // Deduplicar channels antes de criar o índice único
  await run('channels: deduplicar tenant+type', () =>
    sql`
      DELETE FROM channels a
      USING channels b
      WHERE a.id < b.id
        AND a.tenant_id = b.tenant_id
        AND a.type = b.type
    `
  )

  // Agora criar o índice único com segurança
  await run('channels: unique index tenant+type', () =>
    sql`
      CREATE UNIQUE INDEX IF NOT EXISTS channels_tenant_type_unique
      ON channels(tenant_id, type)
    `
  )

  // 4. Colunas novas na tabela messages
  await run('messages.whatsapp_message_id', () =>
    sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT`
  )
  await run('messages: index whatsapp_message_id', () =>
    sql`
      CREATE INDEX IF NOT EXISTS messages_wamid_idx
      ON messages(whatsapp_message_id)
      WHERE whatsapp_message_id IS NOT NULL
    `
  )

  // 5. Coluna channel_conversation_id nas conversations (para responder Instagram)
  await run('conversations.channel_conversation_id', () =>
    sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_conversation_id TEXT`
  )

  // 6. Criar tabela knowledge_base se não existir
  await run('knowledge_base table', () =>
    sql`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
  )

  return NextResponse.json({
    success: errors.length === 0,
    migrations: results,
    errors,
  })
}
