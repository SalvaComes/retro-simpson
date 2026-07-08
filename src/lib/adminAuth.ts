import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "retro_admin_session";

// Genera el hash SHA-256 de una contraseña en texto plano.
// Úsalo una vez para generar el valor de ADMIN_PASSWORD_HASH en .env.local:
//   node -e "console.log(require('crypto').createHash('sha256').update('tu_password').digest('hex'))"
export function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export function verifyPassword(plain: string): boolean {
  const expected = process.env.ADMIN_PASSWORD_HASH || "";
  const actual = hashPassword(plain);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

// Cookie simple: guardamos el hash del secreto de sesión de admin como
// prueba de que el login fue exitoso. No es JWT, pero es suficiente
// para un panel interno de un solo administrador.
export function setAdminCookie() {
  const value = createHash("sha256")
    .update(process.env.ADMIN_SESSION_SECRET || "fallback-secret")
    .digest("hex");
  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

export function isAdminAuthenticated(): boolean {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie) return false;
  const expected = createHash("sha256")
    .update(process.env.ADMIN_SESSION_SECRET || "fallback-secret")
    .digest("hex");
  return cookie.value === expected;
}

export function clearAdminCookie() {
  cookies().delete(COOKIE_NAME);
}
