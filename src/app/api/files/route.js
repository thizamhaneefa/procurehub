export const dynamic = "force-dynamic";
import { downloadFile, pathFromUrl } from "@/lib/storage";

// Auth-gated file proxy: streams a private Supabase Storage object to the
// logged-in user. Protected by middleware (all /api routes require a session),
// so customer documents are never publicly accessible.
export async function GET(req) {
  const raw = new URL(req.url).searchParams.get("path");
  const path = pathFromUrl(raw);
  if (!path) return new Response("Not found", { status: 404 });

  const file = await downloadFile(path);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
    },
  });
}
