"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrCreateMemberId } from "@/lib/memberId";
import { supabase } from "@/lib/supabaseClient";
import { StepGuard } from "@/components/StepGuard";
import { MAX_ICEBREAKER_CHAPTERS_PER_MEMBER } from "@/lib/constants";
import type { ChapterWithVotes } from "@/types";

function IcebreakerContent({ sessionId }: { sessionId: string }) {
  const memberId = getOrCreateMemberId(sessionId);
  const [chapters, setChapters] = useState<ChapterWithVotes[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/icebreaker?sessionId=${sessionId}&memberId=${memberId}`);
    if (res.ok) {
      const { chapters } = await res.json();
      setChapters(chapters);
    }
  }, [sessionId, memberId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`icebreaker-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "icebreaker_chapters", filter: `session_id=eq.${sessionId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "icebreaker_votes" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, load]);

  const myChapters = chapters.filter((c) => c.member_id === memberId);

  async function addChapter() {
    setError("");
    if (!input.trim()) return;
    if (myChapters.length >= MAX_ICEBREAKER_CHAPTERS_PER_MEMBER) {
      setError(`Máximo ${MAX_ICEBREAKER_CHAPTERS_PER_MEMBER} capítulos por persona`);
      return;
    }
    const res = await fetch("/api/icebreaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, memberId, chapterName: input.trim() }),
    });
    if (res.ok) {
      setInput("");
      load();
    } else {
      const { error } = await res.json();
      setError(error);
    }
  }

  async function removeChapter(id: string) {
    await fetch(`/api/icebreaker?id=${id}&memberId=${memberId}`, { method: "DELETE" });
    load();
  }

  async function vote(chapterId: string) {
    await fetch("/api/icebreaker/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId, memberId }),
    });
    load();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-simpsonBlue">
        ¿Cuál es tu capítulo favorito de Los Simpson? 📺
      </h1>
      <p className="mb-6 text-simpsonBrown/70">
        Comparte hasta {MAX_ICEBREAKER_CHAPTERS_PER_MEMBER} capítulos favoritos y vota los de tus compañeros.
      </p>

      <div className="mb-6 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-simpsonBrown/30 px-3 py-2"
          placeholder="Ej: El que se convierte en Hulk..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addChapter()}
        />
        <button
          onClick={addChapter}
          className="rounded-lg bg-simpsonYellow px-4 py-2 font-semibold text-simpsonBrown hover:brightness-95"
        >
          Agregar
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-simpsonRed">{error}</p>}

      {myChapters.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-simpsonBrown/70">Tus capítulos:</p>
          <div className="flex flex-wrap gap-2">
            {myChapters.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-2 rounded-full bg-simpsonYellow/40 px-3 py-1 text-sm"
              >
                {c.chapter_name}
                <button onClick={() => removeChapter(c.id)} className="text-simpsonRed">
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-sm font-medium text-simpsonBrown/70">Todos los capítulos propuestos:</p>
      <div className="flex flex-col gap-2">
        {chapters.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-simpsonBrown/20 bg-white px-4 py-3"
          >
            <span>{c.chapter_name}</span>
            <button
              onClick={() => vote(c.id)}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                c.votedByMe ? "bg-simpsonBlue text-white" : "bg-simpsonYellow/60"
              }`}
            >
              👍 {c.votes}
            </button>
          </div>
        ))}
        {chapters.length === 0 && <p className="text-simpsonBrown/50">Aún no hay capítulos propuestos.</p>}
      </div>

      <p className="mt-8 text-center text-sm text-simpsonBrown/50">
        Espera a que el administrador avance a la siguiente pantalla.
      </p>
    </main>
  );
}

export default function IcebreakerPage({ params }: { params: { sessionId: string } }) {
  return (
    <StepGuard sessionId={params.sessionId} expectedStep="icebreaker">
      <IcebreakerContent sessionId={params.sessionId} />
    </StepGuard>
  );
}
