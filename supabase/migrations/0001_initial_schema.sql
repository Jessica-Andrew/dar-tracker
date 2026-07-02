-- DAR Tracker — initial schema
-- Apply from Supabase SQL editor, or via `supabase db push` with the CLI.

-- ================
-- tasks table
-- ================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null,
  hours numeric not null default 0,
  task_label text,
  links text,
  blockers text,
  next_steps text,
  source text not null default 'manual'
    check (source in ('manual', 'clockify', 'merged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_date_idx on public.tasks(user_id, date);

-- Auto-update the updated_at column
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

-- Row-level security: users see only their own tasks
alter table public.tasks enable row level security;

create policy "users read own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "users insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "users update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ================
-- clockify_config table
-- ================
create table public.clockify_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_id text,
  clockify_user_id text,
  updated_at timestamptz not null default now()
);

alter table public.clockify_config enable row level security;

create policy "users read own clockify config"
  on public.clockify_config for select
  using (auth.uid() = user_id);

create policy "users upsert own clockify config"
  on public.clockify_config for insert
  with check (auth.uid() = user_id);

create policy "users update own clockify config"
  on public.clockify_config for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
