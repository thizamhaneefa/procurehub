import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the SECRET (service-role) key.
// Used only for file storage — the app's data still goes through Prisma.
const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

let _client;
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase storage is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).");
  if (!_client) _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Stored DB value is always a proxied, auth-gated URL so documents stay private.
export const proxiedUrl = (path) => `/api/files?path=${encodeURIComponent(path)}`;
// Pull the storage object path back out of a proxied URL (or accept a raw path).
export function pathFromUrl(value) {
  if (!value) return null;
  const m = String(value).match(/[?&]path=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  if (value.startsWith("uploads/") || !value.includes("/")) return value;
  return null; // legacy "/uploads/.." local paths won't resolve in the cloud
}

export async function uploadFile(buffer, originalName, contentType) {
  const safe = String(originalName || "file").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const objectPath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const { error } = await client().storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: contentType || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error("Storage upload failed: " + error.message);
  return objectPath; // store the path; serve via /api/files
}

// Lets the browser upload straight to Supabase, bypassing the Netlify Function's
// ~6MB synchronous payload limit that a proxied multipart upload would hit.
export async function createUploadUrl(originalName) {
  const safe = String(originalName || "file").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const objectPath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const { data, error } = await client().storage.from(BUCKET).createSignedUploadUrl(objectPath);
  if (error) throw new Error("Could not create upload URL: " + error.message);
  return { path: objectPath, signedUrl: data.signedUrl, token: data.token };
}

// Same idea for downloads: hand the browser a short-lived Supabase URL instead of
// streaming the file through the function (which hits the same payload limit).
export async function createSignedDownloadUrl(objectPath, expiresIn = 60) {
  const { data, error } = await client().storage.from(BUCKET).createSignedUrl(objectPath, expiresIn);
  if (error || !data) throw new Error("Could not create download URL");
  return data.signedUrl;
}

export async function removeFile(objectPath) {
  if (!objectPath) return;
  try { await client().storage.from(BUCKET).remove([objectPath]); } catch { /* ignore */ }
}

export async function downloadFile(objectPath) {
  const { data, error } = await client().storage.from(BUCKET).download(objectPath);
  if (error || !data) return null;
  const buf = Buffer.from(await data.arrayBuffer());
  return { buffer: buf, contentType: data.type || "application/octet-stream" };
}
