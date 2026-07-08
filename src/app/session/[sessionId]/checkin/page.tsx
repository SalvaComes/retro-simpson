"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getOrCreateMemberId, getStoredCharacter } from "@/lib/memberId";
import { supabase } from "@/lib/supabaseClient";
import { StepGuard } from "@/components/StepGuard";
import { EMOTIONS } from "@/lib/constants";
import { CharacterIcon } from "@/components/CharacterIcon";
import type { CheckinPlacementRow } from "@/types";

function CheckinContent({ sessionId }: { sessionId: string }) {
  const memberId = getOrCreateMemberId(sessionId);
  const character = getStoredCharacter(sessionId);
  const [myPlacements, setMyPlacements] = useState<CheckinPlacementRow[]>([]);
  const zoneRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const draggingRef = useRef(false);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/checkin?sessionId=${sessionId}`);
    if (res.ok) {
      const { placements } = await res.json();
      setMyPlacements(placements.filter((p: CheckinPlacementRow) => p.member_id === memberId));
    }
  }, [sessionId, memberId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`checkin-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkin_placements", filter: `session_id=eq.${sessionId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, load]);

  async function placeInZone(zone: number) {
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, memberId, emotionZone: zone }),
    });
    load();
  }

  async function removePlacement(id: string) {
    await fetch(`/api/checkin?id=${id}&memberId=${memberId}`, { method: "DELETE" });
    load();
  }

  function handlePointerUp(clientX: number, clientY: number) {
    draggingRef.current = false;
    setGhostPos(null);
    for (const [zoneStr, el] of Object.entries(zoneRefs.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        placeInZone(Number(zoneStr));
        return;
      }
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-simpsonBlue">
        ¿Cómo te sientes hoy? <CharacterIcon slug={character} className="h-8 w-8" emojiClassName="text-2xl" />
      </h1>
      <p className="mb-6 text-simpsonBrown/70">
        Arrastra tu icono a las zonas que representen cómo te sientes. Puedes poner varios, incluso repetidos en la misma zona.
      </p>

      <div className="mb-8 flex justify-center">
        <div
          className="drag-avatar flex h-16 w-16 select-none items-center justify-center rounded-full bg-simpsonYellow text-3xl shadow"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            draggingRef.current = true;
            setGhostPos({ x: e.clientX, y: e.clientY });
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) setGhostPos({ x: e.clientX, y: e.clientY });
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            handlePointerUp(e.clientX, e.clientY);
          }}
        >
          <CharacterIcon slug={character} className="h-12 w-12" emojiClassName="text-3xl" />
        </div>
      </div>
      <p className="mb-6 text-center text-xs text-simpsonBrown/50">
        Mantén pulsado y arrastra hacia una zona del espectro
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
        {EMOTIONS.map((e) => (
          <div
            key={e.zone}
            ref={(el) => { zoneRefs.current[e.zone] = el; }}
            className="drop-zone flex flex-col items-center justify-start gap-1 p-2"
            style={{ borderColor: e.color }}
          >
            <span className="text-center text-xs font-semibold" style={{ color: e.color }}>
              {e.label}
            </span>
            <div className="flex flex-wrap justify-center gap-1">
              {myPlacements
                .filter((p) => p.emotion_zone === e.zone)
                .map((p) => (
                  <button
                    key={p.id}
                    title="Toca para quitar"
                    onClick={() => removePlacement(p.id)}
                  >
                    <CharacterIcon slug={character} zone={e.zone} className="h-8 w-8" emojiClassName="text-xl" />
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {ghostPos && (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: ghostPos.x - 20, top: ghostPos.y - 20 }}
        >
          <CharacterIcon slug={character} className="h-10 w-10" emojiClassName="text-4xl" />
        </div>
      )}

      <p className="mt-8 text-center text-sm text-simpsonBrown/50">
        Espera a que el administrador avance a la siguiente pantalla.
      </p>
    </main>
  );
}

export default function CheckinPage({ params }: { params: { sessionId: string } }) {
  return (
    <StepGuard sessionId={params.sessionId} expectedStep="checkin">
      <CheckinContent sessionId={params.sessionId} />
    </StepGuard>
  );
}
