import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getDb } from "../db/database";
import { applyStatDeltas, getMatch, matchSyncRow } from "../db/repositories";
import { enqueueUpsert } from "../db/syncQueue";
import type { StatDelta } from "../types";

export interface LiveTracking {
  busy: boolean;
  canUndo: boolean;
  record: (delta: StatDelta) => void;
  undoLast: () => void;
}

function negate(delta: StatDelta): StatDelta {
  const reverse: StatDelta = {};
  for (const [k, v] of Object.entries(delta) as Array<[keyof StatDelta, number]>) {
    if (typeof v === "number") reverse[k] = -v;
  }
  return reverse;
}

export function useLiveTracking(matchId: string): LiveTracking {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [stack, setStack] = useState<StatDelta[]>([]);

  const persist = async (delta: StatDelta) => {
    const db = await getDb();
    await applyStatDeltas(db, matchId, delta);
    const m = await getMatch(db, matchId);
    if (m) {
      await enqueueUpsert(db, "matches", m.id, matchSyncRow(m));
    }
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["matches", matchId] });
    qc.invalidateQueries({ queryKey: ["sync"] });
  };

  const record = (delta: StatDelta) => {
    if (busy) return;
    setBusy(true);
    setStack((s) => [...s, delta]);
    persist(delta)
      .catch((e) => console.warn("stat persist", e))
      .finally(() => setBusy(false));
  };

  const undoLast = () => {
    if (busy || stack.length === 0) return;
    const delta = stack[stack.length - 1];
    setBusy(true);
    setStack((s) => s.slice(0, -1));
    persist(negate(delta))
      .catch((e) => console.warn("stat undo", e))
      .finally(() => setBusy(false));
  };

  return { busy, canUndo: stack.length > 0, record, undoLast };
}