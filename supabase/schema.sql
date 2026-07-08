-- ============================================================
-- ESQUEMA DE BASE DE DATOS: Retro Simpsons
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- SESSIONS: una fila por cada retrospectiva
-- current_step: 'icebreaker' | 'character_select' | 'checkin'
--               | 'retro' | 'action_plan' | 'finished'
-- ------------------------------------------------------------
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now(),
  current_step text not null default 'icebreaker',
  checkin_anonymous boolean not null default true,
  action_plan_anonymous boolean not null default true,
  retro_anonymous boolean not null default true,
  is_active boolean not null default true
);

-- ------------------------------------------------------------
-- MEMBERS: identidad anónima de cada participante dentro de una sesión
-- El id se genera en el cliente (uuid) y se guarda en localStorage
-- display_name es opcional, solo para que el admin pueda desanonimizar
-- ------------------------------------------------------------
create table members (
  id uuid primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  display_name text,
  character text, -- personaje Simpson elegido para el check-in
  joined_at timestamptz not null default now(),
  unique (id, session_id)
);

-- ------------------------------------------------------------
-- ICEBREAKER: capítulos propuestos por cada miembro (máx. 3 por miembro,
-- validado en la API)
-- ------------------------------------------------------------
create table icebreaker_chapters (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  chapter_name text not null,
  created_at timestamptz not null default now()
);

create table icebreaker_votes (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid not null references icebreaker_chapters(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (chapter_id, member_id) -- un miembro no puede votar dos veces el mismo capítulo
);

-- ------------------------------------------------------------
-- CHECKIN: cada fila es UN icono colocado en una zona emocional.
-- Un miembro puede tener varias filas (arrastra varios iconos).
-- emotion_zone va de 1 a 8, ver EMOTIONS en src/lib/constants.ts
-- ------------------------------------------------------------
create table checkin_placements (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  emotion_zone int not null check (emotion_zone between 1 and 8),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RETRO: tabla estándar (bien / mal / mejorar). Anónima por defecto en
-- pantalla; el admin puede desanonimizarla con retro_anonymous en sessions.
-- column_type: 'good' | 'bad' | 'improve'
-- ------------------------------------------------------------
create table retro_items (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  column_type text not null check (column_type in ('good', 'bad', 'improve')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ACTION PLAN: propuestas de acciones + gestión desde admin
-- ------------------------------------------------------------
create table action_items (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  content text not null,
  selected boolean not null default false,
  assignee text,
  due_date date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Índices para consultas frecuentes por sesión
-- ------------------------------------------------------------
create index idx_members_session on members(session_id);
create index idx_icebreaker_chapters_session on icebreaker_chapters(session_id);
create index idx_icebreaker_votes_chapter on icebreaker_votes(chapter_id);
create index idx_checkin_session on checkin_placements(session_id);
create index idx_retro_session on retro_items(session_id);
create index idx_action_session on action_items(session_id);

-- ------------------------------------------------------------
-- Realtime: habilitar para que el frontend reciba cambios en vivo
-- (cambios de paso, nuevos votos, nuevas respuestas, etc.)
-- ------------------------------------------------------------
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table icebreaker_chapters;
alter publication supabase_realtime add table icebreaker_votes;
alter publication supabase_realtime add table checkin_placements;
alter publication supabase_realtime add table retro_items;
alter publication supabase_realtime add table action_items;

-- ------------------------------------------------------------
-- Row Level Security: deshabilitado a propósito.
-- Todo el acceso pasa por las API routes de Next.js, que usan la
-- service_role key en el servidor. El cliente nunca habla directo
-- con Supabase salvo para suscripciones realtime de solo lectura.
-- ------------------------------------------------------------
alter table sessions enable row level security;
alter table members enable row level security;
alter table icebreaker_chapters enable row level security;
alter table icebreaker_votes enable row level security;
alter table checkin_placements enable row level security;
alter table retro_items enable row level security;
alter table action_items enable row level security;

-- Política de solo lectura pública para permitir las suscripciones realtime
-- (no exponemos escritura directa, siempre pasa por las API routes con service_role)
create policy "public read sessions" on sessions for select using (true);
create policy "public read members" on members for select using (true);
create policy "public read icebreaker_chapters" on icebreaker_chapters for select using (true);
create policy "public read icebreaker_votes" on icebreaker_votes for select using (true);
create policy "public read checkin_placements" on checkin_placements for select using (true);
create policy "public read retro_items" on retro_items for select using (true);
create policy "public read action_items" on action_items for select using (true);

-- ------------------------------------------------------------
-- MIGRACIÓN: si tu proyecto de Supabase ya estaba desplegado antes de
-- que existiera retro_anonymous, ejecuta solo esta línea en el SQL Editor:
-- ------------------------------------------------------------
-- alter table sessions add column if not exists retro_anonymous boolean not null default true;
