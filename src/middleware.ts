import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const COOKIE_NAME = "retro_admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = req.cookies.get(COOKIE_NAME);
    const expected = createHash("sha256")
      .update(process.env.ADMIN_SESSION_SECRET || "fallback-secret")
      .digest("hex");

    if (!cookie || cookie.value !== expected) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
