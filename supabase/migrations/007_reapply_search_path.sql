-- Migration 007: Re-apply fixed search_path on recreated admin functions
--
-- Migration 006 set search_path on all SECURITY DEFINER functions, but
-- CREATE OR REPLACE FUNCTION resets proconfig (while preserving ACLs).
-- The is_test/RPC updates after 006 recreated these four functions, which
-- silently dropped their fixed search_path. Re-apply it here.
--
-- NOTE FOR FUTURE MIGRATIONS: any CREATE OR REPLACE FUNCTION must include
-- `SET search_path = public` in the function definition itself, or the
-- hardening is lost again.

ALTER FUNCTION public.admin_get_stats() SET search_path = public;
ALTER FUNCTION public.admin_get_devices() SET search_path = public;
ALTER FUNCTION public.admin_get_engagement_stats() SET search_path = public;
ALTER FUNCTION public.admin_trees_per_day() SET search_path = public;
