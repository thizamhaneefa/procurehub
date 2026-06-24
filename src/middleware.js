import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/session";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const userId = token ? await verifyToken(token) : null;

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth/login")) {
    if (userId && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!userId) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|uploads/|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp)).*)"],
};
