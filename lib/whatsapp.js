// WhatsApp via Meta Cloud API (gratuito — oficial Meta)
import axios from 'axios'

const META_API_URL = 'https://graph.facebook.com/v19.0'

export async function sendText(phone, message) {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID
  const token = process.env.META_WHATSAPP_TOKEN

  await axios.post(
    `${META_API_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )
}
