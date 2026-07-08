"use client";

import { useState } from "react";
import { getOrCreateMemberId, storeCharacter } from "@/lib/memberId";
import { StepGuard } from "@/components/StepGuard";
import { CHARACTERS, type CharacterSlug } from "@/lib/constants";
import { CharacterIcon } from "@/components/CharacterIcon";

function CharacterSelectContent({ sessionId }: { sessionId: string }) {
  const memberId = getOrCreateMemberId(sessionId);
  const [selected, setSelected] = useState<CharacterSlug | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function choose(slug: CharacterSlug) {
    setSelected(slug);
    setSaving(true);
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, memberId, character: slug }),
    });
    storeCharacter(sessionId, slug);
    setSaving(false);
    setSaved(true);
  }

  return (
    <main className="mx-auto max-w-3xl p-6 text-center">
      <h1 className="mb-1 text-2xl font-bold text-simpsonBlue">Elige tu personaje 🎭</h1>
      <p className="mb-6 text-simpsonBrown/70">
        Este será tu icono para arrastrar en el check-in emocional de hoy.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {CHARACTERS.map((c) => (
          <button
            key={c.slug}
            onClick={() => choose(c.slug)}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
              selected === c.slug
                ? "border-simpsonBlue bg-simpsonBlue/10"
                : "border-simpsonBrown/20 bg-white hover:border-simpsonYellow"
            }`}
          >
            <CharacterIcon slug={c.slug} className="h-16 w-16" emojiClassName="text-4xl" />
            <span className="text-sm font-medium">{c.name}</span>
          </button>
        ))}
      </div>

      {saving && <p className="mt-6 text-simpsonBrown/50">Guardando…</p>}
      {saved && !saving && (
        <p className="mt-6 text-simpsonBlue">
          ¡Listo! Espera a que el administrador avance al check-in.
        </p>
      )}
    </main>
  );
}

export default function CharacterSelectPage({ params }: { params: { sessionId: string } }) {
  return (
    <StepGuard sessionId={params.sessionId} expectedStep="character_select">
      <CharacterSelectContent sessionId={params.sessionId} />
    </StepGuard>
  );
}
