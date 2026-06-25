import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Extract authenticated user from the request.
// Web: reads the Supabase session from cookies (set by @supabase/ssr).
// Native iOS: cookies aren't sent from WKWebView across origins, so the client
// sends the access token as Authorization: Bearer. We try that first, then
// fall back to cookies so the web path is unaffected.
export async function getAuthUser(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  // Native path: Authorization: Bearer <access_token> header
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    // Pass the JWT directly to getUser() — this validates it via the Auth API
    // without needing a local session (which doesn't exist server-side).
    const sb = createClient(url, key)
    const { data: { user }, error } = await sb.auth.getUser(token)
    if (!error && user) return { id: user.id, email: user.email }
    // Fall through to cookie path if token is invalid/expired
  }

  // Web path: read from cookies (set by @supabase/ssr on the web)
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll() {}, // read-only — we don't set cookies in API routes
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return { id: user.id, email: user.email }
}
