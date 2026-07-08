"use client";

import { v4 as uuidv4 } from "uuid";
import { ANON_MEMBER_STORAGE_KEY, ANON_MEMBER_CHARACTER_KEY } from "@/lib/constants";

// Genera (o recupera) el ID anónimo del miembro para una sesión concreta.
// Se guarda en localStorage por sessionId, así si el mismo dispositivo entra
// a dos retrospectivas distintas, cada una tiene su propio ID.
export function getOrCreateMemberId(sessionId: string): string {
  const key = `${ANON_MEMBER_STORAGE_KEY}:${sessionId}`;
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = uuidv4();
    window.localStorage.setItem(key, id);
  }
  return id;
}

export function getStoredCharacter(sessionId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${ANON_MEMBER_CHARACTER_KEY}:${sessionId}`);
}

export function storeCharacter(sessionId: string, character: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${ANON_MEMBER_CHARACTER_KEY}:${sessionId}`, character);
}
