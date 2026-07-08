export const dynamic = "force-dynamic";
import { createSignedDownloadUrl, pathFromUrl } from "@/lib/storage";

// Auth-gated file proxy: protected by middleware (all /api routes require a
// session), so documents are never publicly accessible. Rather than streaming
// the file through this Netlify Function (subject to its ~6MB payload limit),
// it redirects to a short-lived signed Supabase URL so large files still work.
export async function GET(req) {
  const raw = new URL(req.url).searchParams.get("path");
  const path = pathFromUrl(raw);
  if (!path) return new Response("Not found", { status: 404 });

  try {
    const signedUrl = await createSignedDownloadUrl(path);
    return Response.redirect(signedUrl, 302);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
