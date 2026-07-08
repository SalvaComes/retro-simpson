"use client";

import { useState } from "react";
import { CHARACTERS, EMOTIONS } from "@/lib/constants";

export function characterEmoji(slug: string | null | undefined) {
  return CHARACTERS.find((c) => c.slug === slug)?.placeholder || "❓";
}

export function characterName(slug: string | null | undefined) {
  return CHARACTERS.find((c) => c.slug === slug)?.name || "Sin personaje";
}

function emotionEmoji(zone: number) {
  return EMOTIONS.find((e) => e.zone === zone)?.emoji || "❓";
}

// Retrato fijo de un personaje (elegido en character-select), independiente
// del estado de ánimo. Ruta: /images/characters/{slug}.png
// Si el archivo no existe todavía, cae al emoji de marcador de posición.
export function CharacterPortrait({
  slug,
  className = "h-10 w-10",
  emojiClassName = "text-2xl",
}: {
  slug: string | null | undefined;
  className?: string;
  emojiClassName?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!slug || errored) {
    return <span className={emojiClassName}>{characterEmoji(slug)}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/characters/${slug}.png`}
      alt={characterName(slug)}
      className={`${className} object-contain`}
      onError={() => setErrored(true)}
    />
  );
}

// Imagen genérica del estado de ánimo: igual para todos, sin depender del
// personaje elegido. Ruta: /images/emotions/{zone}.png
// Si el archivo no existe todavía, cae al emoji de marcador de posición.
export function EmotionIcon({
  zone,
  className = "h-10 w-10",
  emojiClassName = "text-2xl",
}: {
  zone: number;
  className?: string;
  emojiClassName?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <span className={emojiClassName}>{emotionEmoji(zone)}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/emotions/${zone}.png`}
      alt={EMOTIONS.find((e) => e.zone === zone)?.label || "Emoción"}
      className={`${className} object-contain`}
      onError={() => setErrored(true)}
    />
  );
}
