import * as SQLite from "expo-sqlite";
import { v4 as uuidv4 } from "uuid";
import { SCHEMA_SQL } from "./schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Migración de instalaciones previas. Si la tabla `matches` existe con el
 * esquema de contadores (tiene `first_serve_in`) pero le faltan columnas de
 * versiones posteriores, se agregan con ALTER TABLE (se preservan los datos).
 * Los esquemas legados con `points` se descartan y se recrean.
 */
const MISSING_MATCH_COLUMNS: Array<[string, string]> = [
  ["winners_forehand", "INTEGER NOT NULL DEFAULT 0"],
  ["winners_backhand", "INTEGER NOT NULL DEFAULT 0"],
  ["unforced_errors_forehand", "INTEGER NOT NULL DEFAULT 0"],
  ["unforced_errors_backhand", "INTEGER NOT NULL DEFAULT 0"],
  ["serve_direction_t", "INTEGER NOT NULL DEFAULT 0"],
  ["serve_direction_body", "INTEGER NOT NULL DEFAULT 0"],
  ["serve_direction_wide", "INTEGER NOT NULL DEFAULT 0"],
];

async function migrateIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const cols = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM pragma_table_info('matches')",
    );
    if (cols.length > 0) {
      if (!cols.some((c) => c.name === "first_serve_in")) {
        await db.execAsync(
          "DROP TABLE IF EXISTS drill_events; DROP TABLE IF EXISTS drill_sessions; " +
            "DROP TABLE IF EXISTS points; DROP TABLE IF EXISTS matches;",
        );
        return;
      }
      const existing = new Set(cols.map((c) => c.name));
      for (const [name, def] of MISSING_MATCH_COLUMNS) {
        if (!existing.has(name)) {
          await db.execAsync(`ALTER TABLE matches ADD COLUMN ${name} ${def}`);
        }
      }
    } else {
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('points','drill_sessions')",
      );
      if (tables.some((t) => t.name === "points")) {
        await db.execAsync(
          "DROP TABLE IF EXISTS points; DROP TABLE IF EXISTS drill_events; DROP TABLE IF EXISTS drill_sessions; DROP TABLE IF EXISTS matches;",
        );
      }
    }
  } catch {
    // Esquema ya correcto o tabla ausente: no hay nada que migrar.
  }
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("tennis-stats.db");
      await migrateIfNeeded(db);
      await db.execAsync(SCHEMA_SQL);
      return db;
    })();
  }
  return dbPromise;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return uuidv4();
}