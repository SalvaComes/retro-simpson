"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrCreateMemberId } from "@/lib/memberId";
import { supabase } from "@/lib/supabaseClient";
import { StepGuard } from "@/components/StepGuard";
import type { ActionItemRow } from "@/types";

function ActionPlanContent({ sessionId }: { sessionId: string }) {
  const memberId = getOrCreateMemberId(sessionId);
  const [items, setItems] = useState<ActionItemRow[]>([]);
  const [input, setInput] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/action-plan?sessionId=${sessionId}`);
    if (res.ok) {
      const { items } = await res.json();
      setItems(items);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`action-plan-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "action_items", filter: `session_id=eq.${sessionId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, load]);

  async function addAction() {
    if (!input.trim()) return;
    await fetch("/api/action-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, memberId, content: input.trim() }),
    });
    setInput("");
    load();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-simpsonBlue">Plan de acción 🎯</h1>
      <p className="mb-6 text-simpsonBrown/70">
        Propón acciones para mejorar. El administrador decidirá cuáles se ejecutan.
      </p>

      <div className="mb-6 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-simpsonBrown/30 px-3 py-2"
          placeholder="Ej: Hacer daily más cortas"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addAction()}
        />
        <button
          onClick={addAction}
          className="rounded-lg bg-simpsonYellow px-4 py-2 font-semibold text-simpsonBrown"
        >
          Agregar acción
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.id} className="rounded-lg border border-simpsonBrown/20 bg-white px-4 py-3">
            {i.content}
          </div>
        ))}
        {items.length === 0 && <p className="text-simpsonBrown/50">Aún no hay acciones propuestas.</p>}
      </div>

      <p className="mt-8 text-center text-sm text-simpsonBrown/50">
        Espera a que el administrador finalice la retrospectiva.
      </p>
    </main>
  );
}

export default function ActionPlanPage({ params }: { params: { sessionId: string } }) {
  return (
    <StepGuard sessionId={params.sessionId} expectedStep="action_plan">
      <ActionPlanContent sessionId={params.sessionId} />
    </StepGuard>
  );
}
