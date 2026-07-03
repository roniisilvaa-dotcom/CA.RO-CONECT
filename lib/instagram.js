import axios from 'axios'

const META_IG_API_URL = 'https://graph.instagram.com/v21.0'

export async function sendInstagramDM(recipientId, message) {
  const igUserId = process.env.META_IG_USER_ID
  const token = process.env.META_IG_ACCESS_TOKEN
  if (!igUserId || !token) throw new Error('META_IG_USER_ID ou META_IG_ACCESS_TOKEN nao configurado')

  // Instagram: limite de 1000 caracteres por mensagem
  const truncated = message && message.length > 1000
    ? message.substring(0, 997) + '...'
    : message

  if (!truncated || !truncated.trim()) {
    throw new Error('Mensagem vazia - nao enviada ao Instagram')
  }

  try {
    await axios.post(
      `${META_IG_API_URL}/${igUserId}/messages`,
      {
        recipient: { id: recipientId },
        message: { text: truncated }
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('Instagram API erro (DM):', JSON.stringify(detail))
    throw new Error(`Instagram API ${err.response?.status}: ${JSON.stringify(detail)}`)
  }
}

export async function replyToComment(commentId, message) {
  const token = process.env.META_IG_ACCESS_TOKEN
  if (!token) throw new Error('META_IG_ACCESS_TOKEN nao configurado')

  // Comentários também têm limite de 1000 chars
  const truncated = message && message.length > 1000
    ? message.substring(0, 997) + '...'
    : message

  if (!truncated || !truncated.trim()) {
    throw new Error('Mensagem vazia - comentario nao enviado')
  }

  try {
    await axios.post(
      `${META_IG_API_URL}/${commentId}/replies`,
      { message: truncated },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const detail = err.response?.data || err.message
    console.error('Instagram API erro (comment reply):', JSON.stringify(detail))
    throw new Error(`Instagram Comment API ${err.response?.status}: ${JSON.stringify(detail)}`)
  }
}
