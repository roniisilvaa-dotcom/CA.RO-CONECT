import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

async function getConfig() {
  try {
    const [config] = await sql`SELECT * FROM agent_configs LIMIT 1`
    const [tenant] = await sql`SELECT * FROM tenants LIMIT 1`
    return { config, tenant }
  } catch { return { config: null, tenant: null } }
}

export default async function SettingsPage() {
  const { config, tenant } = await getConfig()

  const sections = [
    {
      title: 'Configurações do Tenant',
      items: [
        { label: 'Nome', value: tenant?.name || 'Camila Rocha' },
        { label: 'Slug', value: tenant?.slug || 'camila-rocha' },
        { label: 'Status', value: tenant?.active ? '✅ Ativo' : '❌ Inativo' },
        { label: 'ID', value: tenant?.id || '-', mono: true },
      ]
    },
    {
      title: 'Configurações da IA',
      items: [
        { label: 'Nome da IA', value: config?.agent_name || 'Assistente CA.RO' },
        { label: 'Tom', value: config?.tone || 'profissional e acolhedor' },
        { label: 'Modelo', value: 'Claude Haiku (claude-haiku-4-5)' },
        { label: 'Serviços ativos', value: Array.isArray(config?.services) ? config.services.join(', ') : 'Consultoria de Imagem' },
      ]
    },
    {
      title: 'Configurações do WhatsApp',
      items: [
        { label: 'Phone Number ID', value: process.env.META_PHONE_NUMBER_ID || '-', mono: true },
        { label: 'WABA ID', value: process.env.META_WABA_ID || '-', mono: true },
        { label: 'Webhook URL', value: 'https://camilarocha.carostudio.com.br/api/webhook', mono: true },
        { label: 'Status', value: '✅ Verificado' },
      ]
    },
  ]

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Configurações</h1>
        <p style={{ color: '#6b6b80', fontSize: 13, marginTop: 4 }}>Configurações do sistema CA.RO Connect</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map(section => (
          <div key={section.title} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#e1e1e6', margin: 0 }}>{section.title}</h2>
            </div>
            <div style={{ padding: '4px 0' }}>
              {section.items.map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #0f0f1a' }}>
                  <span style={{ fontSize: 13, color: '#6b6b80', minWidth: 160 }}>{item.label}</span>
                  <span style={{
                    fontSize: 13,
                    color: '#e1e1e6',
                    fontFamily: item.mono ? 'monospace' : 'inherit',
                    background: item.mono ? '#1e1e2e' : 'transparent',
                    padding: item.mono ? '2px 8px' : 0,
                    borderRadius: item.mono ? 4 : 0,
                    maxWidth: 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* System prompt preview */}
        {config?.system_prompt && (
          <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e2e' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#e1e1e6', margin: 0 }}>System Prompt da IA</h2>
            </div>
            <div style={{ padding: 20 }}>
              <pre style={{ fontSize: 12, color: '#6b6b80', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
                {config.system_prompt.slice(0, 800)}{config.system_prompt.length > 800 ? '...' : ''}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
