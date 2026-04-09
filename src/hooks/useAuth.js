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

  // Primary: Google OAuth sign-in (redirects to Google → callback → back)
  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return { ok: false, error: 'Auth not configured' }
    // Force-save draft before redirect so user data survives the round-trip
    try {
      const { saveDraft } = await import('../utils/storage.js')
      const draft = JSON.parse(localStorage.getItem('astrotree_draft') || 'null')
      if (draft) saveDraft(draft.nodes, draft.edges, draft.counter, draft.savedChartId)
    } catch {}
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
    const supabase = getSupabaseBrowser()
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }, [])

  return { user, loading, signInWithGoogle, signInWithEmail, signOut }
}
