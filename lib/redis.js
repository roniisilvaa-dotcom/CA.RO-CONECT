// Histórico de conversa via PostgreSQL (sem Redis — mais simples, sem custo extra)
// Usa a tabela messages já existente no Neon
import sql from './db'

const MAX_MESSAGES = 20

export async function getHistory(tenantId, phone, conversationId) {
  if (!conversationId) return []
  const rows = await sql`
    SELECT role, content FROM messages
    WHERE tenant_id = ${tenantId} AND conversation_id = ${conversationId}
    ORDER BY created_at ASC
    LIMIT ${MAX_MESSAGES}
  `
  return rows.map((r) => ({ role: r.role, content: r.content }))
}

export async function addMessage(tenantId, phone, role, content, conversationId) {
  if (!conversationId) return
  await sql`
    INSERT INTO messages (tenant_id, conversation_id, role, content)
    VALUES (${tenantId}, ${conversationId}, ${role}, ${content})
  `
}

// Compatibilidade — exporta objeto redis simulado (não usado)
export default { getHistory, addMessage }
