// Uploads a File straight from the browser to Supabase Storage using a
// short-lived signed URL, bypassing the Netlify Function's payload limit.
// Returns the proxied URL to store against the record (e.g. fileUrl/imageUrl).
export async function uploadFileDirect(file) {
  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name }),
  });
  const signData = await signRes.json().catch(() => ({}));
  if (!signRes.ok) throw new Error(signData.error || "Could not prepare upload");

  const { signedUrl, anonKey, url } = signData;
  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!putRes.ok) throw new Error("Upload failed");
  return url;
}
