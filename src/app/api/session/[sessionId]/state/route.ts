import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { STEPS } from "@/lib/constants";

// GET: cualquiera (miembro o admin) puede leer el estado actual de la sesión.
export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("id", params.sessionId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ session: data });
}

// PATCH: solo el admin puede cambiar de paso o los toggles de anonimato.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (body.current_step) {
    if (!STEPS.includes(body.current_step)) {
      return NextResponse.json({ error: "Paso inválido" }, { status: 400 });
    }
    update.current_step = body.current_step;
  }
  if (typeof body.checkin_anonymous === "boolean") {
    update.checkin_anonymous = body.checkin_anonymous;
  }
  if (typeof body.action_plan_anonymous === "boolean") {
    update.action_plan_anonymous = body.action_plan_anonymous;
  }
  if (typeof body.is_active === "boolean") {
    update.is_active = body.is_active;
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update(update)
    .eq("id", params.sessionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
