// Redis via Upstash (serverless — funciona no Vercel)
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const MAX_MESSAGES = 20
const TTL = 60 * 60 * 24 // 24h

export async function getHistory(tenantId, phone) {
  const key = `caro:${tenantId}:${phone}`
  const raw = await redis.lrange(key, 0, -1)
  return (raw || []).map((m) => (typeof m === 'string' ? JSON.parse(m) : m))
}

export async function addMessage(tenantId, phone, role, content) {
  const key = `caro:${tenantId}:${phone}`
  await redis.rpush(key, JSON.stringify({ role, content }))
  await redis.ltrim(key, -MAX_MESSAGES, -1)
  await redis.expire(key, TTL)
}

export default redis
