-- ============================================================================
-- autobladi.ma — Realtime messaging
-- Adds messages.conversation_id (FK) + enables Realtime on messaging tables.
-- Run after 001 and 002.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Add conversation_id to messages
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists conversation_id uuid
  references public.conversations(id) on delete cascade;

create index if not exists idx_messages_conversation
  on public.messages (conversation_id, created_at);

create index if not exists idx_messages_unread_per_user
  on public.messages (receiver_id, is_read)
  where is_read = false;

-- ---------------------------------------------------------------------------
-- Backfill: if any messages exist without conversation_id (legacy rows),
-- attach them by matching (sender, receiver, annonce) to a conversation.
-- Safe to run repeatedly.
-- ---------------------------------------------------------------------------
update public.messages m
   set conversation_id = c.id
  from public.conversations c
 where m.conversation_id is null
   and (
     (c.user1_id = m.sender_id   and c.user2_id = m.receiver_id) or
     (c.user1_id = m.receiver_id and c.user2_id = m.sender_id)
   )
   and (c.annonce_id is not distinct from m.annonce_id);

-- ---------------------------------------------------------------------------
-- Enable Realtime by adding tables to the supabase_realtime publication
-- (no-op if already added).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- REPLICA IDENTITY: required so Realtime can emit OLD values for UPDATE/DELETE
-- ---------------------------------------------------------------------------
alter table public.messages      replica identity full;
alter table public.conversations replica identity full;
