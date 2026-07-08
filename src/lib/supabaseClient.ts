import { createClient } from "@supabase/supabase-js";

// Cliente para usar en componentes de cliente (browser).
// Solo tiene permisos de LECTURA (ver políticas RLS en schema.sql).
// Toda escritura pasa por las API routes usando supabaseAdmin.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
