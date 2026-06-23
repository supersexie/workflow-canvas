// Create an ElevenLabs Instant Voice Clone from an uploaded sample.
// Accepts multipart: { name: string, files: File[] (one or more audio samples) }
// Forwards to ElevenLabs /v1/voices/add → returns { voice_id }.
//
// Note: Voice cloning requires a paid ElevenLabs plan (Starter+).

export const runtime = "nodejs";
export const maxDuration = 60;

const ELEVEN = process.env.ELEVENLABS_API_KEY;

export async function POST(req) {
  if (!ELEVEN) {
    return Response.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
  }
  try {
    const form = await req.formData();
    const name = (form.get("name") || "").toString().trim();
    const description = (form.get("description") || "").toString().trim();
    const files = form.getAll("files").filter((f) => f && typeof f === "object" && "name" in f);
    if (!name) return Response.json({ error: "Voice name is required" }, { status: 400 });
    if (files.length === 0) return Response.json({ error: "At least one audio sample is required" }, { status: 400 });

    // Forward to ElevenLabs as multipart form-data.
    const out = new FormData();
    out.append("name", name);
    if (description) out.append("description", description);
    for (const f of files) out.append("files", f, f.name || "sample.mp3");

    const r = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": ELEVEN }, // do NOT set Content-Type — fetch sets the multipart boundary
      body: out,
    });
    const text = await r.text();
    if (!r.ok) {
      // Surface ElevenLabs' message so the user sees e.g. "free plan doesn't support cloning".
      let msg = text.slice(0, 400);
      try { msg = JSON.parse(text)?.detail?.message || msg; } catch {}
      return Response.json({ error: `ElevenLabs ${r.status}: ${msg}` }, { status: r.status });
    }
    const data = JSON.parse(text);
    return Response.json({ voice_id: data.voice_id, name });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
