import type { SQLiteDatabase } from "expo-sqlite";
import { nowIso } from "./database";

export interface QueuedOp {
  id: number;
  tableName: string;
  operation: "upsert" | "delete";
  recordId: string;
  payload: string | null;
  createdAt: string;
}

export async function enqueueUpsert(
  db: SQLiteDatabase,
  tableName: string,
  recordId: string,
  payload: unknown,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_queue (table_name, operation, record_id, payload, created_at) VALUES (?, 'upsert', ?, ?, ?)`,
    tableName,
    recordId,
    JSON.stringify(payload),
    nowIso(),
  );
}

export async function enqueueDelete(
  db: SQLiteDatabase,
  tableName: string,
  recordId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_queue (table_name, operation, record_id, payload, created_at) VALUES (?, 'delete', ?, NULL, ?)`,
    tableName,
    recordId,
    nowIso(),
  );
}

export async function getPendingOps(db: SQLiteDatabase): Promise<QueuedOp[]> {
  const rows = await db.getAllAsync<{
    id: number;
    table_name: string;
    operation: "upsert" | "delete";
    record_id: string;
    payload: string | null;
    created_at: string;
  }>(`SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY id ASC`);
  return rows.map((r) => ({
    id: r.id,
    tableName: r.table_name,
    operation: r.operation,
    recordId: r.record_id,
    payload: r.payload,
    createdAt: r.created_at,
  }));
}

export async function markSynced(db: SQLiteDatabase, opId: number): Promise<void> {
  await db.runAsync(`UPDATE sync_queue SET synced_at = ? WHERE id = ?`, nowIso(), opId);
}

export async function countPending(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sync_queue WHERE synced_at IS NULL`,
  );
  return row?.n ?? 0;
}