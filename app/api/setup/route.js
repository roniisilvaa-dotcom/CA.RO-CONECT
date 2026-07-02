import { NextResponse } from 'next/server'
import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const results = {}

  try {
    // 1. Criar tabelas se não existem
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
    results.tables = 'ok'

    // 2. Criar/atualizar tenant Camila
    const [tenant] = await sql`
      INSERT INTO tenants (slug, name, plan)
      VALUES ('camila-rocha', 'Camila Rocha — Consultoria de Imagem', 'pro')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `
    const tenantId = tenant.id
    results.tenantId = tenantId

    // 3. Configurar agent
    await sql`
      INSERT INTO agent_configs (
        tenant_id, agent_name, agent_persona, business_description,
        services, knowledge_base, greeting_message, away_message
      ) VALUES (
        ${tenantId},
        'Assistente da Camila',
        ${'Voce e a assistente virtual da Camila Rocha. Tom: acolhedor, feminino, refinado, inspirador, elegante. Nunca robotica. Sempre acolhe antes de vender. Uma pergunta por vez.'},
        ${'Camila Rocha e consultora de imagem e estilo, palestrante e mentora de mulheres.'},
        ${JSON.stringify([
          { name: 'Curso Geracao do Estilo', price: 'R$597 ou 12x R$61,74', link: 'https://pay.kiwify.com.br/UDzj8bK' },
          { name: 'Consultoria de Imagem', price: 'Sob consulta' }
        ])},
        ${''},
        ${'Ola! Seja muito bem-vinda! Sou a assistente da Camila Rocha. Me conta: o que te trouxe ate aqui hoje?'},
        ${'Ola! No momento estou fora do horario de atendimento. Retorno em breve!'}
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        agent_persona = EXCLUDED.agent_persona,
        updated_at = NOW()
    `
    results.agentConfig = 'ok'

    // 4. Canal WhatsApp
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID || '1251650848022372'
    await sql`DELETE FROM channels WHERE tenant_id = ${tenantId} AND type = 'whatsapp_meta'`
    await sql`
      INSERT INTO channels (tenant_id, type, identifier, status)
      VALUES (${tenantId}, 'whatsapp_meta', ${phoneNumberId}, 'connected')
    `
    results.channelWhatsapp = 'whatsapp_meta:' + phoneNumberId

    // 5. Canal Instagram
    await sql`
      INSERT INTO channels (tenant_id, type, identifier, status)
      VALUES (${tenantId}, 'instagram', 'eusoucamilarocha', 'connected')
      ON CONFLICT DO NOTHING
    `
    results.channelInstagram = 'instagram:eusoucamilarocha'

    const channels = await sql`SELECT type, identifier, status FROM channels WHERE tenant_id = ${tenantId}`
    results.channels = channels

    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
