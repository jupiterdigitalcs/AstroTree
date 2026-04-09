import { createServerClient } from '@supabase/ssr'

// Extract authenticated user from request cookies (if signed in)
// Returns { id, email } or null if anonymous
export async function getAuthUser(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

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
