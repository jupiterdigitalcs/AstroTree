import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GSI redirect callback — Google POSTs the credential here when using
 * ux_mode: 'redirect' on mobile. We exchange it for a Supabase session
 * and redirect the user back to the app with session tokens in the URL
 * hash, which the Supabase browser client automatically picks up.
 *
 * This keeps Google showing "astrodig.com" instead of the Supabase URL.
 */
export async function POST(request) {
  const referer = request.headers.get('referer')
  const origin = referer ? new URL(referer).origin : 'https://astrodig.com'

  try {
    const formData = await request.formData()
    const credential = formData.get('credential')

    if (!credential) {
      console.error('[gsi] No credential in POST body')
      return NextResponse.redirect(`${origin}?auth=error`, 303)
    }

    // Exchange the Google ID token for a Supabase session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })

    if (error) {
      console.error('[gsi] signInWithIdToken failed:', error.message)
      return NextResponse.redirect(`${origin}?auth=error`, 303)
    }

    if (!data.session) {
      console.error('[gsi] No session returned')
      return NextResponse.redirect(`${origin}?auth=error`, 303)
    }

    // Redirect with session tokens in the URL hash — the Supabase browser
    // client's onAuthStateChange detects these automatically and sets up
    // the session without any extra client-side code.
    const { access_token, refresh_token, expires_in, token_type } = data.session
    const hash = `#access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}&token_type=${token_type}&type=recovery`

    return NextResponse.redirect(`${origin}/${hash}`, 303)
  } catch (err) {
    console.error('[gsi] unexpected error:', err)
    return NextResponse.redirect(
      `${new URL(request.url).origin}?auth=error`,
      303
    )
  }
}
