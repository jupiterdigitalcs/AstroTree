import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_description = searchParams.get('error_description')

  // OAuth error from provider (e.g. user denied consent)
  if (error_description) {
    console.error('[auth callback] provider error:', error_description)
    return NextResponse.redirect(`${origin}?auth=error`)
  }

  if (!code) {
    // No code — redirect to client to handle hash-based or implicit flow
    return NextResponse.redirect(`${origin}?auth=pending`)
  }

  try {
    const response = NextResponse.redirect(`${origin}?auth=success`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth callback] exchange error:', error.message)
      // Server-side exchange failed (PKCE cookie likely lost on mobile redirect).
      // Pass the code to the client so the browser client can exchange it —
      // the browser has the code_verifier in its own storage.
      return NextResponse.redirect(`${origin}?auth=code&code=${encodeURIComponent(code)}`)
    }

    return response
  } catch (err) {
    console.error('[auth callback] unexpected error:', err)
    return NextResponse.redirect(`${origin}?auth=code&code=${encodeURIComponent(code)}`)
  }
}
