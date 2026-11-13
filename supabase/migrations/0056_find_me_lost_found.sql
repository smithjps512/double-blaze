-- Find Me Phase 2: lost and found. See docs/clients/find-me/build-plan.md.
--
-- Privacy rules, enforced here rather than trusted to the app:
--   - The public sees a lost or found post with a fuzzed point (a ~400 m
--     grid cell center). The exact spot and the secret ID detail live in
--     fm_report_private, readable only by the poster and shelter staff.
--     RLS hides rows, not columns, so private fields need their own table.
--   - Owners and helpers talk in fm_conversations / fm_messages. Only the two
--     people in a conversation can read it. No phone or address is shown
--     anywhere unless someone types it into a message.
--   - The helper's answer to "describe something not in the photo" is stored
--     on the conversation when it starts and cannot be edited afterwards, so a
--     scammer cannot revise a guess after seeing the owner's reaction.

create or replace function public.fm_is_any_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.fm_staff s where s.user_id = auth.uid()) or public.fm_is_admin();
$$;

-- ------------------------------------------------------------------ posts

create table if not exists public.fm_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('lost', 'found')),
  user_id uuid not null references auth.users (id) on delete cascade,
  species text not null check (species in ('dog', 'cat')),
  name text not null default '' check (char_length(name) <= 60),
  sex text not null default 'unknown' check (sex in ('male', 'female', 'unknown')),
  size text not null check (size in ('small', 'medium', 'large', 'xlarge')),
  colors text not null check (char_length(colors) between 1 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  photo_url text,
  seen_on date not null check (seen_on <= current_date + 1),
  area_text text not null check (char_length(area_text) between 1 and 120),
  public_lat double precision not null check (public_lat between -85 and 85),
  public_lng double precision not null check (public_lng between -180 and 180),
  microchipped text not null default 'unknown' check (microchipped in ('yes', 'no', 'unknown')),
  status text not null default 'open' check (status in ('open', 'reunited', 'closed')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'found' or char_length(name) >= 1)
);
create index if not exists fm_reports_open on public.fm_reports (status, kind, species, seen_on desc);
create index if not exists fm_reports_user on public.fm_reports (user_id, created_at desc);
alter table public.fm_reports enable row level security;

create table if not exists public.fm_report_private (
  report_id uuid primary key references public.fm_reports (id) on delete cascade,
  exact_lat double precision not null check (exact_lat between -85 and 85),
  exact_lng double precision not null check (exact_lng between -180 and 180),
  secret_detail text not null check (char_length(secret_detail) between 3 and 200)
);
alter table public.fm_report_private enable row level security;

create or replace function public.fm_owns_report(report uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.fm_reports r where r.id = report and r.user_id = auth.uid());
$$;

-- Closed posts disappear from everyone but their poster and shelter staff.
-- Reunited posts stay up as good news.
drop policy if exists fm_reports_read on public.fm_reports;
create policy fm_reports_read on public.fm_reports
  for select to anon, authenticated using (status <> 'closed' or user_id = auth.uid() or public.fm_is_any_staff());
drop policy if exists fm_reports_insert on public.fm_reports;
create policy fm_reports_insert on public.fm_reports
  for insert to authenticated with check (user_id = auth.uid() and status = 'open');
drop policy if exists fm_reports_update on public.fm_reports;
create policy fm_reports_update on public.fm_reports
  for update to authenticated using (user_id = auth.uid() or public.fm_is_admin())
  with check (user_id = auth.uid() or public.fm_is_admin());

drop policy if exists fm_report_private_read on public.fm_report_private;
create policy fm_report_private_read on public.fm_report_private
  for select to authenticated using (public.fm_owns_report(report_id) or public.fm_is_any_staff());
drop policy if exists fm_report_private_write on public.fm_report_private;
create policy fm_report_private_write on public.fm_report_private
  for insert to authenticated with check (public.fm_owns_report(report_id));
drop policy if exists fm_report_private_update on public.fm_report_private;
create policy fm_report_private_update on public.fm_report_private
  for update to authenticated using (public.fm_owns_report(report_id)) with check (public.fm_owns_report(report_id));

-- ----------------------------------------------------------- conversations

create table if not exists public.fm_conversations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.fm_reports (id) on delete cascade,
  poster_id uuid not null references auth.users (id) on delete cascade,
  helper_id uuid not null references auth.users (id) on delete cascade,
  helper_detail text not null default '' check (char_length(helper_detail) <= 300),
  last_message_at timestamptz not null default now(),
  poster_read_at timestamptz,
  helper_read_at timestamptz,
  poster_notified_at timestamptz,
  helper_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (report_id, helper_id),
  check (poster_id <> helper_id)
);
create index if not exists fm_conversations_poster on public.fm_conversations (poster_id, last_message_at desc);
create index if not exists fm_conversations_helper on public.fm_conversations (helper_id, last_message_at desc);
alter table public.fm_conversations enable row level security;

create or replace function public.fm_in_conversation(conv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fm_conversations c
    where c.id = conv and auth.uid() in (c.poster_id, c.helper_id)
  );
$$;

drop policy if exists fm_conversations_read on public.fm_conversations;
create policy fm_conversations_read on public.fm_conversations
  for select to authenticated using (auth.uid() in (poster_id, helper_id));
drop policy if exists fm_conversations_start on public.fm_conversations;
create policy fm_conversations_start on public.fm_conversations
  for insert to authenticated with check (
    helper_id = auth.uid()
    and exists (
      select 1 from public.fm_reports r
      where r.id = report_id and r.user_id = poster_id and r.status = 'open'
    )
  );
drop policy if exists fm_conversations_mark_read on public.fm_conversations;
create policy fm_conversations_mark_read on public.fm_conversations
  for update to authenticated using (auth.uid() in (poster_id, helper_id)) with check (auth.uid() in (poster_id, helper_id));

-- Participants may only touch their read markers. Everything else on the
-- row (who is in it, the helper's answer, notification times) is fixed or
-- written by triggers and the server.
revoke update on public.fm_conversations from anon, authenticated;
grant update (poster_read_at, helper_read_at) on public.fm_conversations to authenticated;

create table if not exists public.fm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.fm_conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists fm_messages_conversation on public.fm_messages (conversation_id, created_at);
alter table public.fm_messages enable row level security;

drop policy if exists fm_messages_read on public.fm_messages;
create policy fm_messages_read on public.fm_messages
  for select to authenticated using (public.fm_in_conversation(conversation_id));
drop policy if exists fm_messages_send on public.fm_messages;
create policy fm_messages_send on public.fm_messages
  for insert to authenticated with check (sender_id = auth.uid() and public.fm_in_conversation(conversation_id));
-- No update or delete policy: messages are a record, for safety reports.

create or replace function public.fm_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.fm_conversations c
  set last_message_at = new.created_at,
      poster_read_at = case when c.poster_id = new.sender_id then new.created_at else c.poster_read_at end,
      helper_read_at = case when c.helper_id = new.sender_id then new.created_at else c.helper_read_at end
  where c.id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists fm_message_sent on public.fm_messages;
create trigger fm_message_sent
  after insert on public.fm_messages
  for each row execute function public.fm_on_message();

-- Public good news, numbers only.
create or replace function public.fm_reunion_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.fm_reports where status = 'reunited';
$$;
grant execute on function public.fm_reunion_count() to anon, authenticated;
