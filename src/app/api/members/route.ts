import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CHARACTERS } from "@/lib/constants";

// POST: crea (o actualiza) el registro de un miembro anónimo dentro de una sesión.
// body: { sessionId, memberId, character? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, memberId, character } = body;

  if (!sessionId || !memberId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  if (character && !CHARACTERS.some((c) => c.slug === character)) {
    return NextResponse.json({ error: "Personaje inválido" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("members")
    .upsert(
      {
        id: memberId,
        session_id: sessionId,
        ...(character ? { character } : {}),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member: data });
}
