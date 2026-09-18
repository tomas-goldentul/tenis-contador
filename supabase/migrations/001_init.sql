-- TennisStats · migracion inicial
-- Esquema espejo del almacen local (SQLite) para sync offline-first.

create extension if not exists "pgcrypto";

-- Perfil del usuario (rol Jugador / Registrador).
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'Jugador' check (role in ('Jugador', 'Registrador')),
  created_at timestamptz not null default now()
);

alter table users enable row level security;

create policy "users select own" on users for select using (auth.uid() = id);
create policy "users insert own" on users for insert with check (auth.uid() = id);
create policy "users update own" on users for update using (auth.uid() = id);

-- Partidos. created_by = id del usuario que registro.
-- Estadisticas agregadas: solo del jugador "Yo".
create table if not exists matches (
  id uuid primary key,
  created_by uuid references auth.users(id) on delete cascade,
  surface text not null check (surface in ('Polvo de ladrillo', 'Dura')),
  match_date date not null,
  first_serve_in integer not null default 0,
  first_serve_out integer not null default 0,
  second_serve_in integer not null default 0,
  second_serve_out integer not null default 0,
  aces integer not null default 0,
  winners_forehand integer not null default 0,
  winners_backhand integer not null default 0,
  unforced_errors_forehand integer not null default 0,
  unforced_errors_backhand integer not null default 0,
  serve_direction_t integer not null default 0,
  serve_direction_body integer not null default 0,
  serve_direction_wide integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table matches enable row level security;

create policy "matches select own" on matches for select using (created_by = auth.uid());
create policy "matches insert own" on matches for insert with check (created_by = auth.uid());
create policy "matches update own" on matches for update using (created_by = auth.uid());
create policy "matches delete own" on matches for delete using (created_by = auth.uid());

-- Sesiones de entrenamiento.
create table if not exists drill_sessions (
  id uuid primary key,
  created_by uuid references auth.users(id) on delete cascade,
  drill_type text not null check (drill_type in ('Saque', 'Devolución', 'Red', 'Fondo')),
  drill_name text not null,
  target_shots integer not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table drill_sessions enable row level security;

create policy "drills select own" on drill_sessions for select using (created_by = auth.uid());
create policy "drills insert own" on drill_sessions for insert with check (created_by = auth.uid());
create policy "drills update own" on drill_sessions for update using (created_by = auth.uid());
create policy "drills delete own" on drill_sessions for delete using (created_by = auth.uid());

create table if not exists drill_events (
  id uuid primary key,
  session_id uuid not null references drill_sessions(id) on delete cascade,
  successful boolean not null,
  shot_side text check (shot_side in ('forehand', 'backhand')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_drill_events_session on drill_events(session_id);

alter table drill_events enable row level security;

create policy "drill_events select via session" on drill_events for select
  using (exists (select 1 from drill_sessions s where s.id = session_id and s.created_by = auth.uid()));
create policy "drill_events insert via session" on drill_events for insert
  with check (exists (select 1 from drill_sessions s where s.id = session_id and s.created_by = auth.uid()));
create policy "drill_events update via session" on drill_events for update
  using (exists (select 1 from drill_sessions s where s.id = session_id and s.created_by = auth.uid()));
create policy "drill_events delete via session" on drill_events for delete
  using (exists (select 1 from drill_sessions s where s.id = session_id and s.created_by = auth.uid()));

-- Trigger para refrescar updated_at.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_matches_updated on matches;
create trigger trg_matches_updated before update on matches for each row execute function set_updated_at();
drop trigger if exists trg_drill_sessions_updated on drill_sessions;
create trigger trg_drill_sessions_updated before update on drill_sessions for each row execute function set_updated_at();
drop trigger if exists trg_drill_events_updated on drill_events;
create trigger trg_drill_events_updated before update on drill_events for each row execute function set_updated_at();