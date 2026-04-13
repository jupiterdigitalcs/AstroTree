import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowser } from '../utils/supabaseClient.js'
import { getDeviceId } from '../utils/identity.js'

export function useAuth() {
  const [user, setUser] = useState(null)       // Supabase auth user object
  const [loading, setLoading] = useState(true)  // Initial session check

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase) { setLoading(false); return }

    // Link device to auth user (called on sign-in and session restore)
    async function linkDevice(authUser) {
      try {
        const deviceId = getDeviceId()
        const res = await fetch('/api/device?action=link-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId,
            authUserId: authUser.id,
            email: authUser.email,
          }),
        })
        const result = await res.json()
        if (result.ok) {
          localStorage.setItem('astrotree_user_email', authUser.email)
          localStorage.setItem('astrotree_email_asked', '1')
        }
      } catch (e) {
        console.error('[auth] link device error:', e)
      }
    }

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      setLoading(false)
      // Link device if signed in (covers page reload after OAuth redirect)
      if (sessionUser) linkDevice(sessionUser)
    })

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)

        // On sign-in or session restore, link device
        if (newUser && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
          linkDevice(newUser)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Initialize GSI and render Google's sign-in button into a container element.
  // Called by EmailCapture to place the button in the dialog.
  const initGoogleButton = useCallback((containerEl, onResult) => {
    const supabase = getSupabaseBrowser()
    if (!supabase || !containerEl) return
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) { onResult?.({ ok: false, error: 'Google client ID not configured' }); return }

    function tryInit() {
      if (!window.google?.accounts?.id) return false
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: async (response) => {
          try {
            // Sign out any existing session first to avoid conflicts
            // when switching between Google accounts
            const { data: { session: existing } } = await supabase.auth.getSession()
            if (existing) await supabase.auth.signOut()
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
            })
            onResult?.({ ok: !error, error: error?.message })
          } catch (err) {
            console.error('[auth] Google sign-in error:', err)
            onResult?.({ ok: false, error: err.message })
          }
        },
        itp_support: true,
      })
      window.google.accounts.id.renderButton(containerEl, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        width: Math.min(containerEl.offsetWidth || 280, 400),
      })
      return true
    }

    if (!tryInit()) {
      // GSI script still loading — poll briefly
      let attempts = 0
      const interval = setInterval(() => {
        if (tryInit() || ++attempts > 20) clearInterval(interval)
      }, 200)
    }
  }, [])

  // INTENTIONAL FALLBACK — do not delete.
  // The primary sign-in path is GSI popup via initGoogleButton (above).
  // This OAuth redirect flow is the belt-and-suspenders fallback used when
  // GSI fails to load (script blocked, third-party cookies disabled in some
  // older Safari builds, network race). EmailCapture wires this in as a backup
  // button so we never strand a user who can't get the GSI button to render.
  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return { ok: false, error: 'Auth not configured' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { ok: !error, error: error?.message }
  }, [])

  // Fallback: magic link for non-Google users
  const signInWithEmail = useCallback(async (email) => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return { ok: false, error: 'Auth not configured' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { ok: !error, error: error?.message }
  }, [])

  const signOut = useCallback(async () => {
    // Unlink device from auth user so entitlements reset to free
    try {
      const res = await fetch('/api/device?action=unlink-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId() }),
      })
      const result = await res.json()
      console.log('[auth] unlink-auth response:', result)
    } catch (e) {
      console.error('[auth] unlink-auth failed:', e)
    }
    const supabase = getSupabaseBrowser()
    if (supabase) await supabase.auth.signOut()
    // Clear local data so next user doesn't see this user's charts
    try {
      localStorage.removeItem('astrotree_charts')
      localStorage.removeItem('astrotree_draft')
      localStorage.removeItem('astrotree_user_email')
    } catch {}
    setUser(null)
  }, [])

  return { user, loading, signInWithGoogle, signInWithEmail, signOut, initGoogleButton }
}
