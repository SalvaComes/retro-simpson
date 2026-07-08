import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST: alterna el voto de un miembro sobre un capítulo (votar / quitar voto)
// body: { chapterId, memberId }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { chapterId, memberId } = body;
  if (!chapterId || !memberId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("icebreaker_votes")
    .select("id")
    .eq("chapter_id", chapterId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin.from("icebreaker_votes").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ voted: false });
  } else {
    const { error } = await supabaseAdmin
      .from("icebreaker_votes")
      .insert({ chapter_id: chapterId, member_id: memberId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ voted: true });
  }
}
