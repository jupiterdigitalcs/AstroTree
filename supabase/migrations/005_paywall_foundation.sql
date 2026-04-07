-- Migration 005: Paywall foundation
-- Run in Supabase SQL editor (Dashboard → SQL Editor)
-- Additive only — safe to run on live data, no existing rows affected.

-- ─── 1. Extend devices table with tier + Stripe linkage ─────────────────────

alter table devices add column if not exists tier text not null default 'free';
alter table devices add column if not exists stripe_customer_id text;
alter table devices add column if not exists tier_updated_at timestamptz;

-- ─── 2. Purchases table (immutable payment ledger) ──────────────────────────

create table if not exists purchases (
  id                    bigint generated always as identity primary key,
  device_id             text references devices(id) on delete set null,
  stripe_session_id     text unique not null,
  stripe_payment_intent text,
  product_key           text not null,          -- 'premium_upgrade', 'pdf_report', etc.
  amount_cents          integer not null,
  currency              text not null default 'usd',
  status                text not null default 'pending',  -- pending | completed | refunded
  metadata              jsonb default '{}',
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

create index if not exists purchases_device_id_idx       on purchases(device_id);
create index if not exists purchases_stripe_session_idx  on purchases(stripe_session_id);
create index if not exists purchases_product_key_idx     on purchases(product_key);

-- ─── 3. Paywall config table (admin-editable feature flags) ─────────────────

create table if not exists paywall_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Seed with defaults — everything stays free until admin enables the paywall.
insert into paywall_config (key, value) values
  ('paywall_enabled',     'false'::jsonb),
  ('chart_limit_free',    '3'::jsonb),
  ('chart_limit_premium', '50'::jsonb),
  ('gated_features',      '[]'::jsonb),
  ('products',            '[]'::jsonb)
on conflict (key) do nothing;

-- ─── 4. RPC: fetch device tier + paywall config in one call ─────────────────

create or replace function get_device_entitlements(p_device_id text)
returns json language sql security definer as $$
  select json_build_object(
    'tier', coalesce((select tier from devices where id = p_device_id), 'free'),
    'config', (select coalesce(json_object_agg(key, value), '{}'::json) from paywall_config)
  );
$$;

-- ─── 5. RPC: admin upsert paywall config ────────────────────────────────────

create or replace function admin_set_paywall_config(p_key text, p_value jsonb)
returns void language sql security definer as $$
  insert into paywall_config (key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
$$;

-- ─── 6. RPC: admin view purchases ──────────────────────────────────────────

create or replace function admin_get_purchases(p_limit integer default 200)
returns json language sql security definer as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select
      p.id, p.device_id, p.stripe_session_id, p.product_key,
      p.amount_cents, p.currency, p.status, p.metadata,
      p.created_at, p.completed_at,
      d.email
    from purchases p
    left join devices d on d.id = p.device_id
    order by p.created_at desc
    limit p_limit
  ) t;
$$;

-- ─── 7. Update restore_charts_by_email to carry over tier + stripe ──────────
-- This replaces the existing RPC. When a user restores on a new device,
-- their premium tier and Stripe linkage transfer with their charts.

create or replace function restore_charts_by_email(p_email text, p_new_device_id text)
returns json language plpgsql security definer as $$
declare
  v_old_device_id text;
  v_old_tier text;
  v_old_stripe text;
  v_count integer;
begin
  -- Find the most recent device with this email (that isn't the new one)
  select id, tier, stripe_customer_id into v_old_device_id, v_old_tier, v_old_stripe
  from devices
  where email = p_email and id != p_new_device_id
  order by last_seen desc nulls last
  limit 1;

  if v_old_device_id is null then
    return json_build_object('ok', false, 'error', 'No account found for that email', 'count', 0);
  end if;

  -- Move charts to new device
  update charts set device_id = p_new_device_id where device_id = v_old_device_id;
  get diagnostics v_count = row_count;

  -- Carry over tier and stripe customer to new device
  update devices
  set tier = coalesce(v_old_tier, 'free'),
      stripe_customer_id = coalesce(v_old_stripe, stripe_customer_id),
      tier_updated_at = case when v_old_tier = 'premium' then now() else tier_updated_at end
  where id = p_new_device_id;

  return json_build_object('ok', true, 'count', v_count);
end;
$$;
