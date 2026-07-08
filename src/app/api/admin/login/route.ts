import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, setAdminCookie, clearAdminCookie } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { password } = body;

  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  setAdminCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearAdminCookie();
  return NextResponse.json({ ok: true });
}
