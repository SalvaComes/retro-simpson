import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

// GET ?sessionId=...  -> todos los items (nunca se envía member_id al frontend
// público; solo el admin lo necesitaría, y ni siquiera lo usa en pantalla)
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("retro_items")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}

// POST: añade una respuesta a una columna
// body: { sessionId, memberId, columnType, content }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, memberId, columnType, content } = body;

  if (!sessionId || !memberId || !content?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  if (!["good", "bad", "improve"].includes(columnType)) {
    return NextResponse.json({ error: "Columna inválida" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("retro_items")
    .insert({ session_id: sessionId, member_id: memberId, column_type: columnType, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}

// PATCH: solo admin, para corregir duplicados o typos
// body: { id, content }
export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { id, content } = body;
  if (!id || !content?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("retro_items")
    .update({ content: content.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}

// DELETE ?id=...  -> solo admin (limpiar duplicados)
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("retro_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
