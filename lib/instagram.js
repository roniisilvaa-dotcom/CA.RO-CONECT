// Instagram Messaging via Instagram Platform API
import axios from 'axios'

const META_IG_API_URL = 'https://graph.instagram.com/v21.0'

export async function sendInstagramDM(recipientId, message) {
  const igUserId = process.env.META_IG_USER_ID
  const token = process.env.META_IG_ACCESS_TOKEN

  if (!igUserId || !token) {
    throw new Error('META_IG_USER_ID ou META_IG_ACCESS_TOKEN não configurado')
  }

  await axios.post(
    `${META_IG_API_URL}/${igUserId}/messages`,
    {
      recipient: { id: recipientId },
      message: { text: message },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )
}
