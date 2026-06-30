import axios from 'axios'

export async function sendText(phone, message, opts = {}) {
  const instanceId = opts.instanceId || process.env.ZAPI_INSTANCE_ID
  const token = opts.token || process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  await axios.post(
    `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
    { phone, message },
    { headers: { 'Client-Token': clientToken } }
  )
}
