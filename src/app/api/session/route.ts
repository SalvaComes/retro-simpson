import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

// POST: crea una nueva sesión de retrospectiva. Requiere estar logueado como admin.
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name: string = body.name?.trim() || `Retrospectiva ${new Date().toLocaleDateString("es-ES")}`;

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({ name, current_step: "icebreaker" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}

// GET: lista todas las sesiones (para el dashboard de admin)
export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data });
}
