// Edge-safe HMAC-signed session tokens (works in middleware and route handlers)
const SECRET = process.env.SESSION_SECRET || "procurehub-local-dev-secret";
const enc = new TextEncoder();
let keyPromise;

function getKey() {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw", enc.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
  }
  return keyPromise;
}

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(payload) {
  const sig = await crypto.subtle.sign("HMAC", await getKey(), enc.encode(payload));
  return toHex(sig);
}

export const COOKIE_NAME = "ph_session";

export async function createToken(userId) {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  return `${btoa(payload)}.${await sign(payload)}`;
}

export async function verifyToken(token) {
  try {
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return null;
    const payload = atob(b64);
    if ((await sign(payload)) !== sig) return null;
    const [id, exp] = payload.split(".");
    if (Date.now() > Number(exp)) return null;
    return Number(id);
  } catch {
    return null;
  }
}
