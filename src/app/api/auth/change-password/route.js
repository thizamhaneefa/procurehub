export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  if (!bcrypt.compareSync(String(currentPassword || ""), user.passwordHash)) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: bcrypt.hashSync(String(newPassword), 10) },
  });
  return Response.json({ ok: true });
}
