export const dynamic = "force-dynamic";
import { uploadFile, proxiedUrl } from "@/lib/storage";

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "No file" }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 10 * 1024 * 1024) {
    return Response.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }
  try {
    const path = await uploadFile(bytes, file.name, file.type);
    return Response.json({ url: proxiedUrl(path), path });
  } catch (e) {
    return Response.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
