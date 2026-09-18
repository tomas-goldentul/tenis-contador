export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  surface TEXT NOT NULL CHECK (surface IN ('Polvo de ladrillo','Dura')),
  match_date TEXT NOT NULL,
  first_serve_in INTEGER NOT NULL DEFAULT 0,
  first_serve_out INTEGER NOT NULL DEFAULT 0,
  second_serve_in INTEGER NOT NULL DEFAULT 0,
  second_serve_out INTEGER NOT NULL DEFAULT 0,
  aces INTEGER NOT NULL DEFAULT 0,
  winners_forehand INTEGER NOT NULL DEFAULT 0,
  winners_backhand INTEGER NOT NULL DEFAULT 0,
  unforced_errors_forehand INTEGER NOT NULL DEFAULT 0,
  unforced_errors_backhand INTEGER NOT NULL DEFAULT 0,
  serve_direction_t INTEGER NOT NULL DEFAULT 0,
  serve_direction_body INTEGER NOT NULL DEFAULT 0,
  serve_direction_wide INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drill_sessions (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  drill_type TEXT NOT NULL CHECK (drill_type IN ('Saque','Devolución','Red','Fondo')),
  drill_name TEXT NOT NULL,
  target_shots INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drill_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES drill_sessions(id) ON DELETE CASCADE,
  successful INTEGER NOT NULL CHECK (successful IN (0, 1)),
  shot_side TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_drill_events_session ON drill_events(session_id);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert','delete')),
  record_id TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(synced_at);
`;