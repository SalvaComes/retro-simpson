import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET ?sessionId=...  -> todas las colocaciones (el frontend decide si
// muestra nombre/personaje o las agrupa anónimamente según session.checkin_anonymous)
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("checkin_placements")
    .select("*, members(character, display_name)")
    .eq("session_id", sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ placements: data });
}

// POST: añade un icono en una zona emocional
// body: { sessionId, memberId, emotionZone }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, memberId, emotionZone } = body;
  if (!sessionId || !memberId || !emotionZone) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  if (emotionZone < 1 || emotionZone > 8) {
    return NextResponse.json({ error: "Zona inválida" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("checkin_placements")
    .insert({ session_id: sessionId, member_id: memberId, emotion_zone: emotionZone })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ placement: data });
}

// DELETE ?id=...&memberId=...  -> quita un icono concreto (para poder moverlo/corregirlo)
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!id || !memberId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("checkin_placements")
    .delete()
    .eq("id", id)
    .eq("member_id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
