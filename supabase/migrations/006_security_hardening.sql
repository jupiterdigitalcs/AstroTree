-- Migration 006: Security hardening
-- Fixes Supabase security advisor findings:
-- 1. Enable RLS on page_views (was fully exposed via PostgREST)
-- 2. Fix v_admin_charts SECURITY DEFINER view
-- 3. Revoke EXECUTE from PUBLIC/anon/authenticated on all server-side-only functions
-- 4. Fix mutable search_path on all SECURITY DEFINER functions

-- ─── 1. Enable RLS on page_views ─────────────────────────────────────────────
-- Service role key (used by all API routes) bypasses RLS, so this only blocks
-- direct anon/authenticated PostgREST access — which should never happen.
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- ─── 2. Fix v_admin_charts: use SECURITY INVOKER ─────────────────────────────
ALTER VIEW public.v_admin_charts SET (security_invoker = true);

-- ─── 3. Revoke EXECUTE from PUBLIC (and anon/authenticated) ──────────────────
-- All functions below are called exclusively through server-side Next.js API
-- routes using the service role key. Must revoke from PUBLIC — not just
-- anon/authenticated — because those roles inherit EXECUTE via the PUBLIC role.
-- service_role retains its explicit grant and is unaffected.

-- Admin-only functions
REVOKE EXECUTE ON FUNCTION public.admin_get_charts(text, text, timestamptz, timestamptz, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_devices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_engagement_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_purchases(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_research_raw() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_paywall_config(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_trees_per_day() FROM PUBLIC, anon, authenticated;

-- App functions — server-side only via /api routes
REVOKE EXECUTE ON FUNCTION public.device_ping(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_device_entitlements(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_device_to_user(text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_charts_by_email(text, text) FROM PUBLIC, anon, authenticated;

-- ─── 4. Fix mutable search_path on all SECURITY DEFINER functions ─────────────
-- Without a fixed search_path, a superuser could create a shadow schema to
-- hijack table lookups inside SECURITY DEFINER functions.
ALTER FUNCTION public.admin_get_charts(text, text, timestamptz, timestamptz, integer, integer) SET search_path = public;
ALTER FUNCTION public.admin_get_devices() SET search_path = public;
ALTER FUNCTION public.admin_get_engagement_stats() SET search_path = public;
ALTER FUNCTION public.admin_get_purchases(integer) SET search_path = public;
ALTER FUNCTION public.admin_get_stats() SET search_path = public;
ALTER FUNCTION public.admin_research_raw() SET search_path = public;
ALTER FUNCTION public.admin_set_paywall_config(text, jsonb) SET search_path = public;
ALTER FUNCTION public.admin_trees_per_day() SET search_path = public;
ALTER FUNCTION public.device_ping(text) SET search_path = public;
ALTER FUNCTION public.get_device_entitlements(text) SET search_path = public;
ALTER FUNCTION public.link_device_to_user(text, uuid, text) SET search_path = public;
ALTER FUNCTION public.restore_charts_by_email(text, text) SET search_path = public;
ALTER FUNCTION public.increment_save_count() SET search_path = public;
