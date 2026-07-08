export const dynamic = "force-dynamic";
import { createUploadUrl, proxiedUrl } from "@/lib/storage";

// Step 1 of a direct-to-Supabase upload: returns a short-lived signed URL the
// browser can PUT the file to directly, so the bytes never pass through this
// Netlify Function (which has a ~6MB synchronous payload limit).
export async function POST(req) {
  const { fileName } = await req.json();
  if (!fileName) return Response.json({ error: "fileName is required" }, { status: 400 });

  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) return Response.json({ error: "Direct upload is not configured (SUPABASE_ANON_KEY missing)" }, { status: 500 });

  try {
    const { path, signedUrl, token } = await createUploadUrl(fileName);
    return Response.json({ path, signedUrl, token, anonKey, url: proxiedUrl(path) });
  } catch (e) {
    return Response.json({ error: e.message || "Could not prepare upload" }, { status: 500 });
  }
}
