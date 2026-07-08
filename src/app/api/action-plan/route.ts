import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

// GET ?sessionId=...
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("action_items")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}

// POST: un miembro propone una acción
// body: { sessionId, memberId, content }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, memberId, content } = body;
  if (!sessionId || !memberId || !content?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("action_items")
    .insert({ session_id: sessionId, member_id: memberId, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}

// PATCH: solo admin. Selecciona la acción, asigna responsable y fecha límite,
// o corrige el texto.
// body: { id, selected?, assignee?, due_date?, content? }
export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { id, selected, assignee, due_date, content } = body;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof selected === "boolean") update.selected = selected;
  if (typeof assignee === "string") update.assignee = assignee;
  if (typeof due_date === "string" || due_date === null) update.due_date = due_date;
  if (typeof content === "string" && content.trim()) update.content = content.trim();

  const { data, error } = await supabaseAdmin
    .from("action_items")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}

// DELETE ?id=...  -> solo admin
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("action_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
