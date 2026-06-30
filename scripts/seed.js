require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)

async function seed() {
  console.log('🌱 Configurando Camila Rocha...')

  const [tenant] = await sql`
    INSERT INTO tenants (slug, name, plan)
    VALUES ('camila-rocha', 'Camila Rocha | Modéstia & Feminilidade', 'pro')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `
  const tenantId = tenant.id

  await sql`
    INSERT INTO agent_configs (
      tenant_id, agent_name, agent_persona, business_description,
      services, knowledge_base, greeting_message, away_message,
      zapi_instance_id, zapi_token
    ) VALUES (
      ${tenantId},
      'Camila',
      ${'Você é a Camila Rocha, consultora de imagem cristã especializada em modéstia e feminilidade. Seu tom é acolhedor, elegante e encorajador. Fale como uma amiga próxima — calorosa, mas profissional. Use palavras como "amada" e "linda". Você vê cada cliente como uma mulher em jornada de autoconhecimento e fé.'},
      ${'Camila Rocha é consultora de imagem cristã com foco em modéstia e feminilidade. Atende mulheres que querem se vestir com elegância, intenção e alinhamento com seus valores. Opera em Alphaville/SP e atende online. Fundadora do projeto Geração do Estilo.'},
      ${JSON.stringify([
        { name: 'Consultoria de Imagem', description: 'Análise completa de estilo, tipo físico, coloração e guarda-roupa. Presencial ou online.', price: 'A partir de R$ 350', duration: '2h' },
        { name: 'Análise de Coloração Pessoal', description: 'Descubra sua estação de cores e quais tons valorizam sua beleza natural.', price: 'R$ 250', duration: '1h30' },
        { name: 'Mentoria Geração do Estilo', description: 'Programa de 4 semanas para transformar seu estilo com propósito e identidade cristã.', price: 'R$ 897', duration: '4 semanas' },
        { name: 'Personal Stylist (Compras)', description: 'Acompanhamento em compras para montar looks que combinam com você.', price: 'R$ 200/hora', duration: 'Variável' }
      ])},
      ${'P: Você atende online?\nR: Sim, atendo online e presencialmente em Alphaville/SP.\n\nP: Tem parcelamento?\nR: Sim, cartão em até 3x sem juros.\n\nP: Como agendar?\nR: Me diga o serviço de interesse, data preferida e seu nome — confirmo na hora!'},
      ${'Olá, linda! 🌸 Seja bem-vinda! Sou a Camila, consultora de imagem especializada em modéstia e feminilidade. Como posso te ajudar hoje? ✨'},
      ${'Olá! 🌸 No momento estou fora do horário, mas já vi sua mensagem! Retorno em breve. Enquanto isso, me siga no Instagram @eusoucamilarocha 💕'},
      ${process.env.ZAPI_INSTANCE_ID || 'PREENCHER'},
      ${process.env.ZAPI_TOKEN || 'PREENCHER'}
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      agent_persona = EXCLUDED.agent_persona,
      services = EXCLUDED.services,
      updated_at = NOW()
  `

  await sql`
    INSERT INTO channels (tenant_id, type, identifier, status)
    VALUES (${tenantId}, 'whatsapp', ${process.env.ZAPI_INSTANCE_ID || 'PREENCHER'}, 'pending')
    ON CONFLICT DO NOTHING
  `

  console.log(`✅ Camila Rocha configurada! Tenant ID: ${tenantId}`)
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
