import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../db/database";
import {
  createMatch as dbCreateMatch,
  deleteMatch as dbDeleteMatch,
  getMatch,
  listMatches,
  matchSyncRow,
} from "../db/repositories";
import { enqueueDelete, enqueueUpsert } from "../db/syncQueue";
import type { Match, Surface } from "../types";

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async () => listMatches(await getDb()),
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["matches", id],
    queryFn: async () => getMatch(await getDb(), id),
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { surface: Surface; matchDate: string }) => {
      const db = await getDb();
      const match = await dbCreateMatch(db, input);
      await enqueueUpsert(db, "matches", match.id, matchSyncRow(match));
      return match;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["sync"] });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = await getDb();
      await dbDeleteMatch(db, id);
      await enqueueDelete(db, "matches", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["sync"] });
    },
  });
}