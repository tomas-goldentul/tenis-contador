import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../db/database";
import {
  createDrillSession,
  finishDrillSession,
  insertDrillEvent,
  listDrillEvents,
  listDrillSessions,
} from "../db/repositories";
import { enqueueUpsert } from "../db/syncQueue";
import type { DrillType, StrokeSide } from "../types";

export function useDrillSessions() {
  return useQuery({
    queryKey: ["drills"],
    queryFn: async () => listDrillSessions(await getDb()),
  });
}

export function useStartDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      drillType: DrillType;
      drillName: string;
      targetShots: number;
    }) => {
      const db = await getDb();
      const session = await createDrillSession(db, input);
      await enqueueUpsert(db, "drill_sessions", session.id, {
        id: session.id,
        created_by: null,
        drill_type: session.drillType,
        drill_name: session.drillName,
        target_shots: session.targetShots,
        started_at: session.startedAt,
        finished_at: null,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      });
      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drills"] });
    },
  });
}

export function useRecordDrillEvent(sessionId: string) {
  const qc = useQueryClient();
  return async (event: { successful: boolean; shotSide: StrokeSide | null }) => {
    const db = await getDb();
    const id = await insertDrillEvent(db, sessionId, event);
    const row = await getDrillEventRow(db, id, sessionId, event);
    await enqueueUpsert(db, "drill_events", id, row);
    qc.invalidateQueries({ queryKey: ["drills", sessionId] });
  };
}

async function getDrillEventRow(
  db: Awaited<ReturnType<typeof getDb>>,
  id: string,
  sessionId: string,
  event: { successful: boolean; shotSide: StrokeSide | null },
) {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT created_at, updated_at FROM drill_events WHERE id = ?`,
    id,
  );
  return {
    id,
    session_id: sessionId,
    successful: event.successful,
    shot_side: event.shotSide,
    created_at: (row?.created_at as string) ?? new Date().toISOString(),
    updated_at: (row?.updated_at as string) ?? new Date().toISOString(),
  };
}

export function useDrillEvents(sessionId: string) {
  return useQuery({
    queryKey: ["drills", sessionId],
    queryFn: async () => listDrillEvents(await getDb(), sessionId),
  });
}

export function useFinishDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const db = await getDb();
      await finishDrillSession(db, sessionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drills"] });
    },
  });
}