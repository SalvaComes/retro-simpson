import { createClient } from "@supabase/supabase-js";

// ATENCIÓN: este cliente usa la service_role key, que salta la RLS.
// Nunca debe importarse desde un componente de cliente ni exponerse
// al navegador. Solo se usa dentro de src/app/api/**/route.ts.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
