// ============================================================
// Personajes disponibles para el check-in emocional.
// La clave "slug" se usa para construir la ruta de imagen:
//   /images/characters/{slug}/{emotionId}.png
// IMPORTANTE: las imágenes de los personajes NO se incluyen en este
// proyecto por derechos de autor. Debes añadirlas tú mismo en
// public/images/characters/{slug}/1.png ... 8.png (una por cada
// emoción, ver EMOTIONS más abajo). Mientras tanto se muestra un
// emoji de marcador de posición.
// ============================================================
export const CHARACTERS = [
  { slug: "homer", name: "Homer Simpson", placeholder: "🍩" },
  { slug: "marge", name: "Marge Simpson", placeholder: "💙" },
  { slug: "bart", name: "Bart Simpson", placeholder: "🛹" },
  { slug: "lisa", name: "Lisa Simpson", placeholder: "🎷" },
  { slug: "mr-burns", name: "Mr. Burns", placeholder: "🦉" },
  { slug: "ned-flanders", name: "Ned Flanders", placeholder: "✝️" },
  { slug: "barney", name: "Barney Gumble", placeholder: "🍺" },
  { slug: "krusty", name: "Krusty el Payaso", placeholder: "🤡" },
  { slug: "otto", name: "Otto Mann", placeholder: "🚌" },
  { slug: "moe", name: "Moe Szyslak", placeholder: "🥃" },
  { slug: "patty-selma", name: "Patty y Selma", placeholder: "🚬" },
  { slug: "maggie", name: "Maggie Simpson", placeholder: "🍼" },
  { slug: "hank-scorpio", name: "Hank Scorpio", placeholder: "🌋" },
] as const;

export type CharacterSlug = (typeof CHARACTERS)[number]["slug"];

// ============================================================
// 8 estados emocionales para el check-in.
// El campo "zone" es el valor 1-8 que se guarda en checkin_placements.
// ============================================================
export const EMOTIONS = [
  { zone: 1, label: "Muy triste", color: "#5B6B8C" },
  { zone: 2, label: "Triste", color: "#7A8CB0" },
  { zone: 3, label: "Estresado", color: "#D6622A" },
  { zone: 4, label: "Neutral", color: "#B8A46A" },
  { zone: 5, label: "Contento", color: "#8FBF5A" },
  { zone: 6, label: "Feliz", color: "#5FBF6E" },
  { zone: 7, label: "Muy feliz", color: "#3FBF8E" },
  { zone: 8, label: "Eufórico", color: "#FED90F" },
] as const;

export const RETRO_COLUMNS = [
  { key: "good", label: "Qué salió bien", color: "#8FBF5A" },
  { key: "bad", label: "Qué salió mal", color: "#D62411" },
  { key: "improve", label: "Qué mejorar", color: "#209CD8" },
] as const;

export const STEPS = [
  "icebreaker",
  "character_select",
  "checkin",
  "retro",
  "action_plan",
  "finished",
] as const;

export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  icebreaker: "Rompe hielo",
  character_select: "Elige tu personaje",
  checkin: "Check-in emocional",
  retro: "Retrospectiva",
  action_plan: "Plan de acción",
  finished: "Finalizada",
};

export const MAX_ICEBREAKER_CHAPTERS_PER_MEMBER = 3;

export const ANON_MEMBER_STORAGE_KEY = "retro_simpsons_member_id";
export const ANON_MEMBER_CHARACTER_KEY = "retro_simpsons_member_character";
