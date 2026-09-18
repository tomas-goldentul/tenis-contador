import type { SQLiteBindValue, SQLiteDatabase } from "expo-sqlite";
import type {
  DrillEvent,
  DrillSession,
  DrillType,
  Match,
  StatDelta,
  StatField,
  Surface,
} from "../types";
import { newId, nowIso } from "./database";

type Row = Record<string, unknown>;

const STAT_COLUMNS: Record<StatField, string> = {
  firstServeIn: "first_serve_in",
  firstServeOut: "first_serve_out",
  secondServeIn: "second_serve_in",
  secondServeOut: "second_serve_out",
  aces: "aces",
  winnersForehand: "winners_forehand",
  winnersBackhand: "winners_backhand",
  unforcedErrorsForehand: "unforced_errors_forehand",
  unforcedErrorsBackhand: "unforced_errors_backhand",
  serveDirectionT: "serve_direction_t",
  serveDirectionBody: "serve_direction_body",
  serveDirectionWide: "serve_direction_wide",
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function mapMatch(r: Row): Match {
  return {
    id: r.id as string,
    surface: r.surface as Surface,
    matchDate: (r.match_date as string).slice(0, 10),
    firstServeIn: num(r.first_serve_in),
    firstServeOut: num(r.first_serve_out),
    secondServeIn: num(r.second_serve_in),
    secondServeOut: num(r.second_serve_out),
    aces: num(r.aces),
    winnersForehand: num(r.winners_forehand),
    winnersBackhand: num(r.winners_backhand),
    unforcedErrorsForehand: num(r.unforced_errors_forehand),
    unforcedErrorsBackhand: num(r.unforced_errors_backhand),
    serveDirectionT: num(r.serve_direction_t),
    serveDirectionBody: num(r.serve_direction_body),
    serveDirectionWide: num(r.serve_direction_wide),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function matchSyncRow(m: Match): Record<string, unknown> {
  return {
    id: m.id,
    created_by: null,
    surface: m.surface,
    match_date: m.matchDate,
    first_serve_in: m.firstServeIn,
    first_serve_out: m.firstServeOut,
    second_serve_in: m.secondServeIn,
    second_serve_out: m.secondServeOut,
    aces: m.aces,
    winners_forehand: m.winnersForehand,
    winners_backhand: m.winnersBackhand,
    unforced_errors_forehand: m.unforcedErrorsForehand,
    unforced_errors_backhand: m.unforcedErrorsBackhand,
    serve_direction_t: m.serveDirectionT,
    serve_direction_body: m.serveDirectionBody,
    serve_direction_wide: m.serveDirectionWide,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

export async function createMatch(
  db: SQLiteDatabase,
  input: { surface: Surface; matchDate: string },
): Promise<Match> {
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO matches (id, created_by, surface, match_date, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?)`,
    id,
    input.surface,
    input.matchDate,
    now,
    now,
  );
  return {
    id,
    surface: input.surface,
    matchDate: input.matchDate,
    firstServeIn: 0,
    firstServeOut: 0,
    secondServeIn: 0,
    secondServeOut: 0,
    aces: 0,
    winnersForehand: 0,
    winnersBackhand: 0,
    unforcedErrorsForehand: 0,
    unforcedErrorsBackhand: 0,
    serveDirectionT: 0,
    serveDirectionBody: 0,
    serveDirectionWide: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listMatches(db: SQLiteDatabase): Promise<Match[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM matches ORDER BY match_date DESC, created_at DESC`,
  );
  return rows.map(mapMatch);
}

export async function getMatch(db: SQLiteDatabase, id: string): Promise<Match | null> {
  const row = await db.getFirstAsync<Row>(`SELECT * FROM matches WHERE id = ?`, id);
  return row ? mapMatch(row) : null;
}

export async function updateMatch(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<Pick<Match, "surface" | "matchDate">>,
): Promise<void> {
  const sets: string[] = [];
  const params: SQLiteBindValue[] = [];
  if (patch.surface !== undefined) {
    sets.push("surface = ?");
    params.push(patch.surface);
  }
  if (patch.matchDate !== undefined) {
    sets.push("match_date = ?");
    params.push(patch.matchDate);
  }
  if (sets.length === 0) return;
  sets.push("updated_at = ?");
  params.push(nowIso());
  params.push(id);
  await db.runAsync(`UPDATE matches SET ${sets.join(", ")} WHERE id = ?`, ...params);
}

export async function deleteMatch(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM matches WHERE id = ?`, id);
}

export async function applyStatDeltas(
  db: SQLiteDatabase,
  matchId: string,
  deltas: StatDelta,
): Promise<void> {
  const entries = (
    Object.entries(deltas) as Array<[StatField, number | undefined]>
  ).filter(([field, v]) => typeof v === "number" && v !== 0 && field in STAT_COLUMNS);
  if (entries.length === 0) return;

  const sets: string[] = [];
  const params: SQLiteBindValue[] = [];
  for (const [field, delta] of entries) {
    sets.push(`${STAT_COLUMNS[field]} = MAX(${STAT_COLUMNS[field]} + ?, 0)`);
    params.push(delta as number);
  }
  sets.push("updated_at = ?");
  params.push(nowIso());
  params.push(matchId);
  await db.runAsync(`UPDATE matches SET ${sets.join(", ")} WHERE id = ?`, ...params);
}

export async function createDrillSession(
  db: SQLiteDatabase,
  input: { drillType: DrillType; drillName: string; targetShots: number },
): Promise<DrillSession> {
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO drill_sessions (id, created_by, drill_type, drill_name, target_shots, started_at, finished_at, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, NULL, ?, ?)`,
    id,
    input.drillType,
    input.drillName,
    input.targetShots,
    now,
    now,
    now,
  );
  return {
    id,
    drillType: input.drillType,
    drillName: input.drillName,
    targetShots: input.targetShots,
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function finishDrillSession(db: SQLiteDatabase, id: string): Promise<void> {
  const now = nowIso();
  await db.runAsync(
    `UPDATE drill_sessions SET finished_at = ?, updated_at = ? WHERE id = ?`,
    now,
    now,
    id,
  );
}

export async function listDrillSessions(db: SQLiteDatabase): Promise<DrillSession[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM drill_sessions ORDER BY started_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id as string,
    drillType: r.drill_type as DrillType,
    drillName: r.drill_name as string,
    targetShots: r.target_shots as number,
    startedAt: r.started_at as string,
    finishedAt: (r.finished_at as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export async function insertDrillEvent(
  db: SQLiteDatabase,
  sessionId: string,
  event: { successful: boolean; shotSide: DrillEvent["shotSide"] },
): Promise<string> {
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO drill_events (id, session_id, successful, shot_side, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    sessionId,
    event.successful ? 1 : 0,
    event.shotSide ?? null,
    now,
    now,
  );
  return id;
}

export async function listDrillEvents(db: SQLiteDatabase, sessionId: string): Promise<DrillEvent[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM drill_events WHERE session_id = ? ORDER BY created_at ASC`,
    sessionId,
  );
  return rows.map((r) => ({
    id: r.id as string,
    sessionId: r.session_id as string,
    successful: r.successful === 1,
    shotSide: (r.shot_side as DrillEvent["shotSide"]) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}