export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, createToken } from "@/lib/session";

export async function POST(req) {
  const { username, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { username: String(username || "").trim() } });
  if (!user || !bcrypt.compareSync(String(password || ""), user.passwordHash)) {
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }
  cookies().set(COOKIE_NAME, await createToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return Response.json({ ok: true, name: user.name });
}
