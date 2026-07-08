"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  STEPS,
  STEP_LABELS,
  EMOTIONS,
  RETRO_COLUMNS,
  CHARACTERS,
  type Step,
} from "@/lib/constants";
import type {
  SessionRow,
  ChapterWithVotes,
  CheckinPlacementRow,
  RetroItemRow,
  ActionItemRow,
} from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function characterEmoji(slug: string | null | undefined) {
  return CHARACTERS.find((c) => c.slug === slug)?.placeholder || "❓";
}

function characterName(slug: string | null | undefined) {
  return CHARACTERS.find((c) => c.slug === slug)?.name || "Sin personaje";
}

export default function AdminSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const router = useRouter();

  const [session, setSession] = useState<SessionRow | null>(null);
  const [chapters, setChapters] = useState<ChapterWithVotes[]>([]);
  const [placements, setPlacements] = useState<(CheckinPlacementRow & { members?: { character: string | null } })[]>([]);
  const [retroItems, setRetroItems] = useState<(RetroItemRow & { members?: { character: string | null; display_name: string | null } })[]>([]);
  const [actionItems, setActionItems] = useState<ActionItemRow[]>([]);
  const [editingRetroId, setEditingRetroId] = useState<string | null>(null);
  const [editingRetroText, setEditingRetroText] = useState("");

  const loadAll = useCallback(async () => {
    const [sRes, cRes, pRes, rRes, aRes] = await Promise.all([
      fetch(`/api/session/${sessionId}/state`),
      fetch(`/api/icebreaker?sessionId=${sessionId}`),
      fetch(`/api/checkin?sessionId=${sessionId}`),
      fetch(`/api/retro?sessionId=${sessionId}`),
      fetch(`/api/action-plan?sessionId=${sessionId}`),
    ]);
    if (sRes.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (sRes.ok) setSession((await sRes.json()).session);
    if (cRes.ok) setChapters((await cRes.json()).chapters);
    if (pRes.ok) setPlacements((await pRes.json()).placements);
    if (rRes.ok) setRetroItems((await rRes.json()).items);
    if (aRes.ok) setActionItems((await aRes.json()).items);
  }, [sessionId, router]);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel(`admin-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "icebreaker_chapters", filter: `session_id=eq.${sessionId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "icebreaker_votes" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkin_placements", filter: `session_id=eq.${sessionId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "retro_items", filter: `session_id=eq.${sessionId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "action_items", filter: `session_id=eq.${sessionId}` }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, loadAll]);

  async function patchSession(update: Record<string, unknown>) {
    await fetch(`/api/session/${sessionId}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  }

  function goToStep(step: Step) {
    patchSession({ current_step: step });
  }

  async function deleteChapter(id: string) {
    await fetch(`/api/icebreaker?id=${id}`, { method: "DELETE" });
    loadAll();
  }

  async function saveRetroEdit(id: string) {
    await fetch("/api/retro", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: editingRetroText }),
    });
    setEditingRetroId(null);
    loadAll();
  }

  async function deleteRetroItem(id: string) {
    await fetch(`/api/retro?id=${id}`, { method: "DELETE" });
    loadAll();
  }

  async function patchAction(id: string, update: Record<string, unknown>) {
    await fetch("/api/action-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...update }),
    });
    loadAll();
  }

  async function deleteAction(id: string) {
    await fetch(`/api/action-plan?id=${id}`, { method: "DELETE" });
    loadAll();
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-simpsonBrown/50">Cargando…</p>
      </main>
    );
  }

  const memberLink = typeof window !== "undefined" ? `${window.location.origin}/session/${sessionId}` : "";

  const emotionCounts = EMOTIONS.map((e) => ({
    name: e.label,
    value: placements.filter((p) => p.emotion_zone === e.zone).length,
    color: e.color,
  })).filter((e) => e.value > 0);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-simpsonBlue">{session.name}</h1>
        <button
          onClick={() => navigator.clipboard.writeText(memberLink)}
          className="rounded-lg border border-simpsonBrown/30 px-3 py-2 text-sm"
        >
          Copiar enlace para el equipo 🔗
        </button>
      </div>

      {/* Control de pasos */}
      <section className="mb-8 rounded-xl border border-simpsonBrown/20 bg-white p-4">
        <h2 className="mb-3 font-semibold">Control de la retrospectiva</h2>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((step) => (
            <button
              key={step}
              onClick={() => goToStep(step)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                session.current_step === step
                  ? "bg-simpsonBlue text-white"
                  : "bg-simpsonYellow/40 hover:bg-simpsonYellow/70"
              }`}
            >
              {STEP_LABELS[step]}
            </button>
          ))}
        </div>
      </section>

      {/* Rompe hielo */}
      {session.current_step === "icebreaker" && (
        <section className="mb-8 rounded-xl border border-simpsonBrown/20 bg-white p-4">
          <h2 className="mb-3 font-semibold">Rompe hielo — Capítulos propuestos</h2>
          <div className="flex flex-col gap-2">
            {chapters.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-simpsonYellow/10 px-3 py-2">
                <span>{c.chapter_name} — {c.votes} votos</span>
                <button onClick={() => deleteChapter(c.id)} className="text-simpsonRed">Eliminar</button>
              </div>
            ))}
            {chapters.length === 0 && <p className="text-simpsonBrown/50">Sin capítulos aún.</p>}
          </div>
        </section>
      )}

      {/* Selector de personaje */}
      {session.current_step === "character_select" && (
        <section className="mb-8 rounded-xl border border-simpsonBrown/20 bg-white p-4">
          <h2 className="mb-3 font-semibold">Elige tu personaje</h2>
          <p className="text-simpsonBrown/50">
            Los miembros están eligiendo su personaje Simpson. Activa el siguiente paso cuando estén listos.
          </p>
        </section>
      )}

      {/* Check-in emocional */}
      {session.current_step === "checkin" && (
        <section className="mb-8 rounded-xl border border-simpsonBrown/20 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Check-in emocional</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={session.checkin_anonymous}
                onChange={(e) => patchSession({ checkin_anonymous: e.target.checked })}
              />
              Mostrar anónimo
            </label>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {EMOTIONS.map((e) => (
              <div key={e.zone} className="rounded-lg border p-2 text-center" style={{ borderColor: e.color }}>
                <p className="mb-1 text-xs font-semibold" style={{ color: e.color }}>{e.label}</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {placements
                    .filter((p) => p.emotion_zone === e.zone)
                    .map((p) => (
                      <span key={p.id} title={session.checkin_anonymous ? "" : p.members?.character || ""} className="text-xl">
                        {characterEmoji(p.members?.character)}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {emotionCounts.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={emotionCounts} dataKey="value" nameKey="name" outerRadius={90} label>
                    {emotionCounts.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}

      {/* Retrospectiva */}
      {session.current_step === "retro" && (
        <section className="mb-8 rounded-xl border border-simpsonBrown/20 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Retrospectiva</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={session.retro_anonymous}
                onChange={(e) => patchSession({ retro_anonymous: e.target.checked })}
              />
              Mostrar anónimo
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {RETRO_COLUMNS.map((col) => (
              <div key={col.key}>
                <h3 className="mb-2 text-sm font-semibold" style={{ color: col.color }}>{col.label}</h3>
                <div className="flex flex-col gap-2">
                  {retroItems
                    .filter((i) => i.column_type === col.key)
                    .map((i) => (
                      <div key={i.id} className="rounded-lg bg-simpsonYellow/10 px-3 py-2 text-sm">
                        {editingRetroId === i.id ? (
                          <div className="flex gap-2">
                            <input
                              className="flex-1 rounded border px-2 py-1 text-sm"
                              value={editingRetroText}
                              onChange={(e) => setEditingRetroText(e.target.value)}
                            />
                            <button onClick={() => saveRetroEdit(i.id)} className="text-simpsonBlue">Guardar</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span>
                              {!session.retro_anonymous && (
                                <span className="mr-1" title={characterName(i.members?.character)}>
                                  {characterEmoji(i.members?.character)}
                                </span>
                              )}
                              {i.content}
                            </span>
                            <div className="flex gap-2 text-xs">
                              <button
                                onClick={() => {
                                  setEditingRetroId(i.id);
                                  setEditingRetroText(i.content);
                                }}
                              >
                                ✏️
                              </button>
                              <button onClick={() => deleteRetroItem(i.id)} className="text-simpsonRed">🗑️</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Plan de acción */}
      {(session.current_step === "action_plan" || session.current_step === "finished") && (
        <section className="mb-8 rounded-xl border border-simpsonBrown/20 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Plan de acción</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={session.action_plan_anonymous}
                onChange={(e) => patchSession({ action_plan_anonymous: e.target.checked })}
              />
              Mostrar anónimo
            </label>
          </div>

          <div className="flex flex-col gap-3">
            {actionItems.map((a) => (
              <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-simpsonBrown/20 px-3 py-2 sm:flex-row sm:items-center">
                <input
                  type="checkbox"
                  checked={a.selected}
                  onChange={(e) => patchAction(a.id, { selected: e.target.checked })}
                />
                <span className="flex-1 text-sm">{a.content}</span>
                <input
                  className="rounded border px-2 py-1 text-sm sm:w-40"
                  placeholder="Responsable"
                  defaultValue={a.assignee || ""}
                  onBlur={(e) => patchAction(a.id, { assignee: e.target.value })}
                />
                <input
                  type="date"
                  className="rounded border px-2 py-1 text-sm"
                  defaultValue={a.due_date || ""}
                  onChange={(e) => patchAction(a.id, { due_date: e.target.value })}
                />
                <button onClick={() => deleteAction(a.id)} className="text-simpsonRed">🗑️</button>
              </div>
            ))}
            {actionItems.length === 0 && <p className="text-simpsonBrown/50">Sin acciones propuestas aún.</p>}
          </div>

          <a
            href={`/api/admin/export?sessionId=${sessionId}`}
            className="mt-4 inline-block rounded-lg bg-simpsonYellow px-4 py-2 font-semibold text-simpsonBrown"
          >
            Exportar a Excel 📊
          </a>
        </section>
      )}
    </main>
  );
}
