import { useMutation } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getSupabase } from "../api/supabaseClient";

export interface AuthState {
  session: Session | null;
  ready: boolean;
}

export function useAuthSession(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setReady(true);
      return;
    }
    let mounted = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, ready };
}

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      const client = getSupabase();
      await client?.auth.signOut();
    },
    onSuccess: () => {
      router.replace("/login");
    },
  });
}