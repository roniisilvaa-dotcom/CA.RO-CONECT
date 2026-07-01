require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)

async function seed() {
  console.log('🌱 Configurando Camila Rocha no CA.RO Connect...')

  // Criar tenant
  const [tenant] = await sql`
    INSERT INTO tenants (slug, name, plan)
    VALUES ('camila-rocha', 'Camila Rocha — Consultoria de Imagem', 'pro')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `
  const tenantId = tenant.id
  console.log(`✅ Tenant criado: ${tenantId}`)

  // Configurar agente com persona completa
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
      ${'P: Atende online?\nR: Sim, presencial e online.\nP: Quanto custa?\nR: Depende do serviço. Primeiro me conta sua maior dificuldade com a imagem para eu indicar o melhor caminho.\nP: Como agendar?\nR: Me conta o serviço que deseja, data preferida e seu nome!'},
      ${'Olá! Seja muito bem-vinda 🌸\n\nSou a assistente da Camila Rocha. A Camila ajuda mulheres a desenvolverem uma imagem elegante, feminina e com propósito.\n\nMe conta: o que te trouxe até aqui hoje? ✨'},
      ${'Olá! 🌸 No momento estou fora do horário de atendimento, mas já vi sua mensagem! Retorno em breve. Enquanto isso, me siga no Instagram @eusoucamilarocha 💕'}
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      agent_persona = EXCLUDED.agent_persona,
      services = EXCLUDED.services,
      greeting_message = EXCLUDED.greeting_message,
      updated_at = NOW()
  `
  console.log('✅ Agente configurado com personalidade completa do Playbook')

  // Registrar canal WhatsApp
  await sql`
    INSERT INTO channels (tenant_id, type, identifier, status)
    VALUES (${tenantId}, 'whatsapp_meta', '11942173633775334', 'connected')
    ON CONFLICT DO NOTHING
  `
  console.log('✅ Canal WhatsApp Meta registrado')

  // Registrar canal Instagram
  await sql`
    INSERT INTO channels (tenant_id, type, identifier, status)
    VALUES (${tenantId}, 'instagram', 'eusoucamilarocha', 'pending')
    ON CONFLICT DO NOTHING
  `
  console.log('✅ Canal Instagram registrado (pendente conexão)')

  console.log('')
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ✅ Camila Rocha configurada no CA.RO Connect!   ║')
  console.log(`║  Tenant ID: ${tenantId}  ║`)
  console.log('║                                                  ║')
  console.log('║  WhatsApp: conectado (número de teste Meta)      ║')
  console.log('║  Instagram: pendente (configurar na Meta)        ║')
  console.log('╚══════════════════════════════════════════════════╝')
  process.exit(0)
}

seed().catch((e) => { console.error('❌ Erro:', e.message); process.exit(1) })
