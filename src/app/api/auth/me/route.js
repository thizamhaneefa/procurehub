export const dynamic = "force-dynamic";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ id: user.id, username: user.username, name: user.name });
}
