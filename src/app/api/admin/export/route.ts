import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { RETRO_COLUMNS } from "@/lib/constants";

// GET ?sessionId=...  -> descarga un .xlsx con hoja de plan de acción
// y hoja de resumen de retrospectiva (bien / mal / mejorar)
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });

  const [{ data: session }, { data: actions }, { data: retroItems }] = await Promise.all([
    supabaseAdmin.from("sessions").select("*").eq("id", sessionId).single(),
    supabaseAdmin.from("action_items").select("*").eq("session_id", sessionId).order("created_at"),
    supabaseAdmin.from("retro_items").select("*").eq("session_id", sessionId).order("created_at"),
  ]);

  const workbook = XLSX.utils.book_new();

  const actionRows = (actions ?? [])
    .filter((a) => a.selected)
    .map((a) => ({
      Acción: a.content,
      Responsable: a.assignee || "Sin asignar",
      "Fecha límite": a.due_date || "Sin definir",
    }));
  const actionSheet = XLSX.utils.json_to_sheet(
    actionRows.length ? actionRows : [{ Acción: "(sin acciones seleccionadas)", Responsable: "", "Fecha límite": "" }]
  );
  XLSX.utils.book_append_sheet(workbook, actionSheet, "Plan de acción");

  const retroRows = RETRO_COLUMNS.flatMap((col) =>
    (retroItems ?? [])
      .filter((i) => i.column_type === col.key)
      .map((i) => ({ Columna: col.label, Contenido: i.content }))
  );
  const retroSheet = XLSX.utils.json_to_sheet(retroRows);
  XLSX.utils.book_append_sheet(workbook, retroSheet, "Retrospectiva");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const fileName = `retro-${(session?.name || "sesion").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
