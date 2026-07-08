"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrCreateMemberId } from "@/lib/memberId";
import { supabase } from "@/lib/supabaseClient";
import { StepGuard } from "@/components/StepGuard";
import { RETRO_COLUMNS } from "@/lib/constants";
import type { RetroItemRow } from "@/types";

function RetroContent({ sessionId }: { sessionId: string }) {
  const memberId = getOrCreateMemberId(sessionId);
  const [items, setItems] = useState<RetroItemRow[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({ good: "", bad: "", improve: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/retro?sessionId=${sessionId}`);
    if (res.ok) {
      const { items } = await res.json();
      setItems(items);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`retro-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "retro_items", filter: `session_id=eq.${sessionId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, load]);

  async function addItem(columnType: string) {
    const content = inputs[columnType]?.trim();
    if (!content) return;
    await fetch("/api/retro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, memberId, columnType, content }),
    });
    setInputs((prev) => ({ ...prev, [columnType]: "" }));
    load();
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-simpsonBlue">Retrospectiva 📝</h1>
      <p className="mb-6 text-simpsonBrown/70">Tus respuestas son siempre anónimas.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {RETRO_COLUMNS.map((col) => (
          <div key={col.key} className="rounded-xl border border-simpsonBrown/20 bg-white p-4">
            <h2 className="mb-3 font-semibold" style={{ color: col.color }}>
              {col.label}
            </h2>
            <div className="mb-3 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-simpsonBrown/30 px-2 py-1 text-sm"
                value={inputs[col.key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [col.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addItem(col.key)}
                placeholder="Escribe aquí…"
              />
              <button
                onClick={() => addItem(col.key)}
                className="rounded-lg bg-simpsonYellow px-3 py-1 text-sm font-semibold"
              >
                +
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {items
                .filter((i) => i.column_type === col.key)
                .map((i) => (
                  <div key={i.id} className="rounded-lg bg-simpsonYellow/20 px-3 py-2 text-sm">
                    {i.content}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-simpsonBrown/50">
        Espera a que el administrador avance a la siguiente pantalla.
      </p>
    </main>
  );
}

export default function RetroPage({ params }: { params: { sessionId: string } }) {
  return (
    <StepGuard sessionId={params.sessionId} expectedStep="retro">
      <RetroContent sessionId={params.sessionId} />
    </StepGuard>
  );
}
