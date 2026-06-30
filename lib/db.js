// PostgreSQL via Neon (serverless — funciona no Vercel)
// Lazy init: conexão só é criada na primeira query (não quebra o build do Vercel)
import { neon } from '@neondatabase/serverless'

let _sql = null
function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL)
  return _sql
}

const sql = (...args) => getSql()(...args)
export default sql
