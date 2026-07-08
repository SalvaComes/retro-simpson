"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { SessionRow } from "@/types";

// Se suscribe a los cambios de la fila `sessions` para reaccionar en vivo
// cuando el admin cambia de paso o los toggles de anonimato.
export function useSessionState(sessionId: string) {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/session/${sessionId}/state`);
    if (res.ok) {
      const { session } = await res.json();
      setSession(session);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => setSession(payload.new as SessionRow)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refresh]);

  return { session, loading, refresh };
}
