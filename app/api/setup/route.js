import { NextResponse } from 'next/server'
import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (token !== process.env.META_VERIFY_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
        ${'Você é a assistente virtual da Camila Rocha. Tom: acolhedor, feminino, refinado, inspirador, elegante. Frases: "Sua imagem comunica antes da sua fala." / "Elegância também é posicionamento." / "Você não precisa de mais roupas. Precisa de direção." Nunca robótica. Sempre acolhe antes de vender. Uma pergunta por vez.'},
        ${'Camila Rocha é consultora de imagem e estilo, palestrante e mentora de mulheres. Formada em duas escolas francesas de moda. Atende em mais de 15 países. Missão: ensinar mulheres a se vestirem com elegância, feminilidade e modéstia alinhada com valores cristãos.'},
        ${JSON.stringify([
          { name: 'Consultoria de Imagem', description: 'Análise completa de coloração, biotipo, estilo e guarda-roupa. Presencial ou online.', price: 'Sob consulta' },
          { name: 'Curso Geração do Estilo', description: 'Curso online completo para descobrir seu estilo pessoal com elegância cristã.', price: 'R$597 à vista ou 12x R$61,74', link: 'https://pay.kiwify.com.br/UDzj8bK' },
          { name: 'Mentoria de Estilo', description: 'Acompanhamento individual e contínuo para transformação completa da imagem.', price: 'Sob consulta' },
          { name: 'Coloração Pessoal', description: 'Descubra as cores que mais te favorecem.', price: 'Sob consulta' },
          { name: 'Personal Styling', description: 'Montagem de looks para eventos, viagens ou guarda-roupa.', price: 'Sob consulta' },
          { name: 'Palestras e Ministrações', description: 'Apresentações para empresas, igrejas e eventos sobre imagem cristã e feminilidade.', price: 'Sob consulta' }
        ])},
        ${'P: Atende online?\nR: Sim, presencial e online.\nP: Quanto custa?\nR: Depende do serviço. Me conta sua maior dificuldade com a imagem para eu indicar o melhor caminho.\nP: Como agendar?\nR: Me conta o serviço que deseja, data preferida e seu nome!'},
        ${'Olá! Seja muito bem-vinda 🌸\n\nSou a assistente da Camila Rocha. A Camila ajuda mulheres a desenvolverem uma imagem elegante, feminina e com propósito.\n\nMe conta: o que te trouxe até aqui hoje? ✨'},
        ${'Olá! 🌸 No momento estou fora do horário de atendimento, mas já vi sua mensagem! Retorno em breve. Enquanto isso, me siga no Instagram @eusoucamilarocha 💕'}
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        agent_persona = EXCLUDED.agent_persona,
        services = EXCLUDED.services,
        greeting_message = EXCLUDED.greeting_message,
        updated_at = NOW()
    `
    results.agentConfig = 'ok'

    // 4. Canal WhatsApp — com phone_number_id correto
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID || '1251650848022372'

    // Remove canais antigos e recria com identifier correto
    await sql`DELETE FROM channels WHERE tenant_id = ${tenantId} AND type = 'whatsapp_meta'`
    await sql`
      INSERT INTO channels (tenant_id, type, identifier, status)
      VALUES (${tenantId}, 'whatsapp_meta', ${phoneNumberId}, 'connected')
    `
    results.channel = `whatsapp_meta:${phoneNumberId}`

    // 5. Verificar estado final
    const channels = await sql`SELECT type, identifier, status FROM channels WHERE tenant_id = ${tenantId}`
    results.channels = channels

    const tenants = await sql`SELECT slug, name, plan FROM tenants WHERE id = ${tenantId}`
    results.tenant = tenants[0]

    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
