export const dynamic = "force-dynamic";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// Builds the prompt for marketing copy. Returned to the client for manual use
// when no API key is configured, or sent to Claude when one is.
function buildPrompt({ company, goal, segment, category, tone, offer, channel, productHints }) {
  return `You are an expert B2B email marketing copywriter for ${company || "an aquarium retail & maintenance company"} (we sell aquarium products and offer aquarium maintenance services in the UAE).

Write a ${channel || "marketing email"} for this campaign.

Audience segment: ${segment || "customers"}${category ? ` (interested in ${category})` : ""}.
Campaign goal: ${goal || "drive repeat purchases"}.
${offer ? `Offer / hook: ${offer}.` : ""}
${productHints ? `Relevant products to mention: ${productHints}.` : ""}
Tone: ${tone || "friendly, professional, concise"}.

Requirements:
- Give 3 subject line options (short, high open-rate, no spammy ALL-CAPS or excessive emoji).
- Then write the email body: a warm greeting using {{first_name}} as a merge placeholder, 2–4 short paragraphs, one clear call-to-action, and a sign-off from "The ${company || "AquaGallery"} Team".
- Keep it skimmable. Total body under 180 words.
- Use the merge placeholders {{first_name}} and {{company_name}} where natural. Do not invent specific prices or discounts unless the offer above provides them.

Format your answer exactly as:
SUBJECTS:
1. ...
2. ...
3. ...

BODY:
<the email body>`;
}

export async function POST(req) {
  const body = await req.json();
  const prompt = buildPrompt(body);

  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const apiKey = settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  const model = settings?.aiModel || "claude-opus-4-8";

  // No key configured → return the prompt so the user can paste it into Claude they already have.
  if (!apiKey) {
    return Response.json({ mode: "manual", prompt });
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return Response.json({ mode: "ai", text, model });
  } catch (e) {
    const status = e?.status;
    let error = e?.message || "AI request failed";
    if (status === 401) error = "Invalid Anthropic API key — check it in Settings.";
    else if (status === 429) error = "Anthropic rate limit / insufficient credit. Try again later or use manual mode.";
    return Response.json({ mode: "error", error, prompt }, { status: 200 });
  }
}
