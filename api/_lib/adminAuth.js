import crypto from 'node:crypto'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD
}

export function createAdminToken() {
  const payload = { exp: Date.now() + TOKEN_TTL_MS }
  const data = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64')
}

export function verifyAdminToken(token) {
  try {
    const { data, sig } = JSON.parse(Buffer.from(token, 'base64').toString())
    const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
    if (sig !== expected) return false
    const { exp } = JSON.parse(data)
    return Date.now() < exp
  } catch {
    return false
  }
}

export function requireAdmin(req) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  return verifyAdminToken(auth.slice(7))
}
