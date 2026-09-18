import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { syncNow } from "../api/sync";
import { isSupabaseConfigured } from "../api/supabaseClient";
import { useNetwork } from "./useNetwork";

/**
 * Sincroniza en segundo plano cuando se recupera la conexion.
 * Si Supabase no esta configurado o no hay conexion, no-op.
 */
export function useOfflineSync() {
  const isOnline = useNetwork();
  const qc = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    if (!isOnline || !isSupabaseConfigured()) return;
    const t = setTimeout(async () => {
      if (running.current) return;
      running.current = true;
      try {
        const n = await syncNow();
        if (n > 0) {
          await qc.invalidateQueries();
        }
      } finally {
        running.current = false;
      }
    }, 800);
    return () => clearTimeout(t);
  }, [isOnline, qc]);

  return { isOnline, syncingEnabled: isSupabaseConfigured() };
}