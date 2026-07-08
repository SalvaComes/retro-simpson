"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionState } from "@/lib/useSessionState";
import type { Step } from "@/lib/constants";

const STEP_ROUTE: Record<Step, string> = {
  icebreaker: "icebreaker",
  character_select: "character-select",
  checkin: "checkin",
  retro: "retro",
  action_plan: "action-plan",
  finished: "finished",
};

// Envuelve cada pantalla de paso. Si el admin avanza (o retrocede) el paso
// global de la sesión, todos los miembros son redirigidos automáticamente
// en tiempo real gracias a la suscripción de useSessionState.
export function StepGuard({
  sessionId,
  expectedStep,
  children,
}: {
  sessionId: string;
  expectedStep: Step;
  children: React.ReactNode;
}) {
  const { session, loading } = useSessionState(sessionId);
  const router = useRouter();

  useEffect(() => {
    if (loading || !session) return;
    if (session.current_step !== expectedStep) {
      router.replace(`/session/${sessionId}/${STEP_ROUTE[session.current_step]}`);
    }
  }, [loading, session, expectedStep, sessionId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-simpsonBrown/70">Cargando…</p>
      </main>
    );
  }

  return <>{children}</>;
}
