require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log('🔧 Criando tabelas no Neon...')
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`
  await sql`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      plan VARCHAR(50) DEFAULT 'starter',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS agent_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      agent_name VARCHAR(100) NOT NULL,
      agent_persona TEXT NOT NULL,
      business_description TEXT NOT NULL,
      services JSONB DEFAULT '[]',
      knowledge_base TEXT,
      greeting_message TEXT,
      away_message TEXT,
      business_hours JSONB,
      zapi_instance_id VARCHAR(255),
      zapi_token VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tenant_id)
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      identifier VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'connected',
      created_at TIMESTAMP DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      phone VARCHAR(50),
      name VARCHAR(255),
      email VARCHAR(255),
      score INTEGER DEFAULT 0,
      stage VARCHAR(50) DEFAULT 'new',
      tags TEXT[] DEFAULT '{}',
      last_contact_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      channel VARCHAR(50) NOT NULL,
      channel_conversation_id VARCHAR(255),
      status VARCHAR(50) DEFAULT 'open',
      ai_enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      service_name VARCHAR(255) NOT NULL,
      scheduled_at TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  console.log('✅ Todas as tabelas criadas no Neon!')
  process.exit(0)
}

migrate().catch((e) => { console.error(e); process.exit(1) })
