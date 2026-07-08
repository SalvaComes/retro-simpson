"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login() {
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin/new-session");
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-simpsonBlue">Panel de administrador</h1>
      <input
        type="password"
        className="w-64 rounded-lg border border-simpsonBrown/30 px-3 py-2"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && login()}
      />
      {error && <p className="text-sm text-simpsonRed">{error}</p>}
      <button
        onClick={login}
        className="rounded-lg bg-simpsonYellow px-6 py-2 font-semibold text-simpsonBrown"
      >
        Entrar
      </button>
    </main>
  );
}
