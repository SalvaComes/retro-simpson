"use client";

import { useState } from "react";
import { CHARACTERS } from "@/lib/constants";

export function characterEmoji(slug: string | null | undefined) {
  return CHARACTERS.find((c) => c.slug === slug)?.placeholder || "❓";
}

export function characterName(slug: string | null | undefined) {
  return CHARACTERS.find((c) => c.slug === slug)?.name || "Sin personaje";
}

// Zona "neutral" usada como retrato por defecto del personaje cuando no
// aplica una emoción concreta (selector de personaje, avatar antes de
// soltarlo, identificación en la tabla retrospectiva).
const DEFAULT_ZONE = 4;

// Muestra /images/characters/{slug}/{zone}.png y si el archivo no existe
// (porque el usuario aún no lo ha subido, ver README) cae automáticamente
// al emoji de marcador de posición.
export function CharacterIcon({
  slug,
  zone = DEFAULT_ZONE,
  className = "h-10 w-10",
  emojiClassName = "text-2xl",
}: {
  slug: string | null | undefined;
  zone?: number;
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
      src={`/images/characters/${slug}/${zone}.png`}
      alt={characterName(slug)}
      className={`${className} object-contain`}
      onError={() => setErrored(true)}
    />
  );
}
