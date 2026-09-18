import { getDb } from "../db/database";
import { getPendingOps, markSynced } from "../db/syncQueue";
import { getSupabase } from "./supabaseClient";

/**
 * Empuja las operaciones pendientes al backend.
 * Devuelve la cantidad de operaciones sincronizadas.
 * Si no hay Supabase configurado, no-op.
 */
export async function syncNow(): Promise<number> {
  const client = getSupabase();
  if (!client) return 0;

  const db = await getDb();
  const ops = await getPendingOps(db);
  if (ops.length === 0) return 0;

  const { data } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
  const userId = data.user?.id;

  let synced = 0;
  for (const op of ops) {
    try {
      if (op.operation === "upsert" && op.payload) {
        const payload = JSON.parse(op.payload) as Record<string, unknown>;
        if (op.tableName === "matches" || op.tableName === "drill_sessions") {
          payload.created_by = userId ?? null;
        }
        await client.from(op.tableName).upsert(payload, { onConflict: "id" });
      } else {
        await client.from(op.tableName).delete().eq("id", op.recordId);
      }
      await markSynced(db, op.id);
      synced += 1;
    } catch (err) {
      console.warn(`sync fallido para ${op.tableName}/${op.recordId}:`, err);
      break;
    }
  }
  return synced;
}