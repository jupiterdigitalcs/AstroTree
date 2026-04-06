-- Migration 004: Implicit engagement tracking
-- Run in Supabase SQL editor (Dashboard → SQL Editor)

-- 1. Add visit_count to devices (tracks how many times each device has opened the app)
alter table devices add column if not exists visit_count integer not null default 1;

-- 2. New table: device_events (lightweight event log for implicit signals)
create table if not exists device_events (
  id          bigint generated always as identity primary key,
  device_id   text references devices(id) on delete cascade,
  event_name  text not null,              -- 'insights_seen' | 'export' | 'share_viewed'
  created_at  timestamptz not null default now()
);

create index if not exists device_events_device_id_idx  on device_events(device_id);
create index if not exists device_events_event_name_idx on device_events(event_name);
create index if not exists device_events_created_at_idx on device_events(created_at);

-- 3. RPC: increment visit_count + update last_seen (called on return visits)
create or replace function device_ping(p_device_id text)
returns void language sql security definer as $$
  update devices
  set last_seen   = now(),
      visit_count = coalesce(visit_count, 0) + 1
  where id = p_device_id;
$$;

-- 4. RPC: engagement stats for admin panel
create or replace function admin_get_engagement_stats()
returns json language sql security definer as $$
  select json_build_object(
    'returnVisitPct', (
      select round(100.0 * count(*) filter (where visit_count > 1) / nullif(count(*), 0), 1)
      from devices
    ),
    'insightsReachPct', (
      select round(
        100.0 * count(distinct device_id) / nullif((select count(*) from devices), 0), 1
      )
      from device_events
      where event_name = 'insights_seen'
    ),
    'shareViewCount', (
      select count(*)
      from device_events
      where event_name = 'share_viewed'
    ),
    'avgMembersPerChart', (
      select round(avg(jsonb_array_length(nodes::jsonb))::numeric, 1)
      from charts
      where nodes is not null
        and nodes::text != '[]'
        and is_sample is not true
    )
  );
$$;
