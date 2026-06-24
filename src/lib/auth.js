import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "./session";
import { prisma } from "./prisma";

export async function getUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const id = await verifyToken(token);
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
