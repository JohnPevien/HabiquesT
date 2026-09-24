-- HabiquesT RLS baseline — run once per database before app migrations.
-- Identity: neon_auth.users_raw(id) is the authoritative user id.
-- Every app_public table filters on user_id = auth.uid()::uuid.

create extension if not exists "pgcrypto"; -- gen_random_uuid fallback

create schema if not exists app_public;

-- Row Level Security: every table is player-private (ADR: sharing boundary).
alter table app_public.profiles      enable row level security;
alter table app_public.campaigns     enable row level security;
alter table app_public.goals        enable row level security;
alter table app_public.habits       enable row level security;
alter table app_public.occurrences  enable row level security;
alter table app_public.tasks        enable row level security;

drop policy if exists "profiles_owner_all"     on app_public.profiles;
drop policy if exists "campaigns_owner_all"    on app_public.campaigns;
drop policy if exists "goals_owner_all"        on app_public.goals;
drop policy if exists "habits_owner_all"       on app_public.habits;
drop policy if exists "occurrences_owner_all" on app_public.occurrences;
drop policy if exists "tasks_owner_all"       on app_public.tasks;

create policy "profiles_owner_all"     on app_public.profiles     for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);
create policy "campaigns_owner_all"    on app_public.campaigns    for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);
create policy "goals_owner_all"        on app_public.goals        for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);
create policy "habits_owner_all"       on app_public.habits       for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);
create policy "occurrences_owner_all"  on app_public.occurrences  for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);
create policy "tasks_owner_all"        on app_public.tasks        for all using (user_id = auth.uid()::uuid) with check (user_id = auth.uid()::uuid);