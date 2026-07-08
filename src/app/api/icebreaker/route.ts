import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { MAX_ICEBREAKER_CHAPTERS_PER_MEMBER } from "@/lib/constants";
import type { ChapterWithVotes } from "@/types";

// GET ?sessionId=...&memberId=...  -> lista capítulos con nº de votos
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!sessionId) {
    return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });
  }

  const { data: chapters, error: chaptersError } = await supabaseAdmin
    .from("icebreaker_chapters")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (chaptersError) {
    return NextResponse.json({ error: chaptersError.message }, { status: 500 });
  }

  const { data: votes, error: votesError } = await supabaseAdmin
    .from("icebreaker_votes")
    .select("*")
    .in("chapter_id", chapters.map((c) => c.id).length ? chapters.map((c) => c.id) : ["00000000-0000-0000-0000-000000000000"]);

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  const result: ChapterWithVotes[] = chapters.map((c) => {
    const chapterVotes = votes.filter((v) => v.chapter_id === c.id);
    return {
      ...c,
      votes: chapterVotes.length,
      votedByMe: memberId ? chapterVotes.some((v) => v.member_id === memberId) : false,
    };
  });

  result.sort((a, b) => b.votes - a.votes);

  return NextResponse.json({ chapters: result });
}

// POST: un miembro propone un capítulo (máx. 3 por miembro, validado aquí)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, memberId, chapterName } = body;

  if (!sessionId || !memberId || !chapterName?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { count, error: countError } = await supabaseAdmin
    .from("icebreaker_chapters")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("member_id", memberId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  if ((count ?? 0) >= MAX_ICEBREAKER_CHAPTERS_PER_MEMBER) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ICEBREAKER_CHAPTERS_PER_MEMBER} capítulos por persona` },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("icebreaker_chapters")
    .insert({ session_id: sessionId, member_id: memberId, chapter_name: chapterName.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chapter: data });
}

// DELETE ?id=...  (el propio miembro borra uno de sus capítulos, o el admin borra cualquiera)
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  let query = supabaseAdmin.from("icebreaker_chapters").delete().eq("id", id);
  if (!isAdminAuthenticated()) {
    if (!memberId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    query = query.eq("member_id", memberId);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
