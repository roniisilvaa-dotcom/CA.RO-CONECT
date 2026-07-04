import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CAMILA_AGENT_CONFIG } from '../../../lib/camila-agent'
import sql from '../../../lib/db'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

export async function POST(request) {
    const { message, tenantId = 'camila-rocha', channel = 'instagram' } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    try {
          let scripts = [], customConfig = {}
                try {
                        const rows = await sql`SELECT scripts, custom_config FROM agent_configs WHERE tenant_id = ${tenantId} LIMIT 1`
                        const row = rows[0] || {}
                                scripts = (row.scripts || []).filter(s => s.active !== false)
                        customConfig = row.custom_config || {}
                } catch {}
          const isIG = channel === 'instagram'
          let systemPrompt = isIG
            ? (customConfig.ig_personality || CAMILA_AGENT_CONFIG.system_prompt)
                  : (customConfig.wa_personality || CAMILA_AGENT_CONFIG.system_prompt)
          const instructions = isIG ? customConfig.ig_instructions : customConfig.wa_instructions
          if (instructions) systemPrompt += '\n\n' + instructions
          if (scripts.length > 0) {
                  const lines = scripts.map(s => {
                            let resp = s.response || ''
                            if (s.url) resp = resp.replace('{URL}', s.url) || s.url
                            return `- ${s.name} [gatilhos: ${s.triggers||''}]: ${resp}`
                  }).join('\n')
                  systemPrompt += `\n\nSCRIPTS ATIVOS:\n${lines}`
          }
          const response = await client.messages.create({
                  model: 'claude-haiku-4-5-20251001',
                  max_tokens: 500,
                  system: systemPrompt,
                  messages: [{ role: 'user', content: message }],
          })
          return NextResponse.json({ message: response.content[0].text })
    } catch (e) {
          return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
