
create table public.daily_feeling_records (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null,
  feeling text not null,
  intensity int,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);
create index idx_dfr_entry on public.daily_feeling_records(daily_entry_id);
alter table public.daily_feeling_records enable row level security;

create policy "Users insert own feeling records" on public.daily_feeling_records
  for insert with check (exists (select 1 from public.daily_entries de where de.id = daily_entry_id and de.user_id = auth.uid()));
create policy "Users view own feeling records" on public.daily_feeling_records
  for select using (exists (select 1 from public.daily_entries de where de.id = daily_entry_id and de.user_id = auth.uid()));
create policy "Users delete own feeling records" on public.daily_feeling_records
  for delete using (exists (select 1 from public.daily_entries de where de.id = daily_entry_id and de.user_id = auth.uid()));
create policy "Admins view all feeling records" on public.daily_feeling_records
  for select using (public.has_role(auth.uid(), 'admin'::public.app_role));

create table public.guanxin_feeling_practices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  guanxin_entry_id uuid,
  feeling text not null,
  note text,
  is_practiced boolean not null default false,
  practiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_gfp_user on public.guanxin_feeling_practices(user_id);
alter table public.guanxin_feeling_practices enable row level security;

create policy "Users manage own feeling practices" on public.guanxin_feeling_practices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view all feeling practices" on public.guanxin_feeling_practices
  for select using (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_gfp_updated before update on public.guanxin_feeling_practices
  for each row execute function public.update_updated_at_column();
