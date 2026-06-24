export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/session";

export async function POST() {
  cookies().delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
