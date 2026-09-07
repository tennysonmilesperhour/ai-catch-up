-- Newsletter capture lives alongside Vibe Check, Campground, and Dialogue.
create table public.aicu_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(email) <= 320 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  created_at timestamptz not null default now()
);
create unique index aicu_subscribers_email on public.aicu_subscribers(lower(email));
alter table public.aicu_subscribers enable row level security;
revoke all on public.aicu_subscribers from public, anon, authenticated;
grant insert (email) on public.aicu_subscribers to anon;
create policy "newsletter signup" on public.aicu_subscribers for insert to anon
  with check (length(email) <= 320 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
