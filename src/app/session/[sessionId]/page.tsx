"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateMemberId } from "@/lib/memberId";
import { useSessionState } from "@/lib/useSessionState";

const STEP_ROUTE: Record<string, string> = {
  icebreaker: "icebreaker",
  character_select: "character-select",
  checkin: "checkin",
  retro: "retro",
  action_plan: "action-plan",
  finished: "finished",
};

export default function SessionEntryPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { session, loading } = useSessionState(params.sessionId);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const memberId = getOrCreateMemberId(params.sessionId);
    fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: params.sessionId, memberId }),
    }).finally(() => setRegistered(true));
  }, [params.sessionId]);

  useEffect(() => {
    if (!registered || loading || !session) return;
    const route = STEP_ROUTE[session.current_step] || "icebreaker";
    router.replace(`/session/${params.sessionId}/${route}`);
  }, [registered, loading, session, params.sessionId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <p className="text-lg text-simpsonBrown/80">Entrando a la retrospectiva… 🍩</p>
    </main>
  );
}
