"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionRow } from "@/types";

export default function NewSessionPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/session");
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const { sessions } = await res.json();
      setSessions(sessions);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSession() {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const { session } = await res.json();
      router.push(`/admin/${session.id}`);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-simpsonBlue">Panel de administrador</h1>

      <div className="mb-8 rounded-xl border border-simpsonBrown/20 bg-white p-4">
        <h2 className="mb-3 font-semibold">Crear nueva retrospectiva</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-simpsonBrown/30 px-3 py-2"
            placeholder="Nombre (ej: Sprint 42)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={createSession}
            className="rounded-lg bg-simpsonYellow px-4 py-2 font-semibold text-simpsonBrown"
          >
            Crear
          </button>
        </div>
      </div>

      <h2 className="mb-3 font-semibold">Retrospectivas anteriores</h2>
      {loading && <p className="text-simpsonBrown/50">Cargando…</p>}
      <div className="flex flex-col gap-2">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/admin/${s.id}`)}
            className="flex items-center justify-between rounded-lg border border-simpsonBrown/20 bg-white px-4 py-3 text-left hover:border-simpsonYellow"
          >
            <span>{s.name}</span>
            <span className="text-xs text-simpsonBrown/50">
              {new Date(s.created_at).toLocaleDateString("es-ES")} · {s.current_step}
            </span>
          </button>
        ))}
        {!loading && sessions.length === 0 && (
          <p className="text-simpsonBrown/50">Aún no hay retrospectivas creadas.</p>
        )}
      </div>
    </main>
  );
}
