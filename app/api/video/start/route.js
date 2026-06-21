import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const KEY = process.env.GEMINI_API_KEY;

const MODEL_MAP = {
  "Veo 3.1 Fast": "veo-3.1-fast-generate-preview",
  "Veo 3.1": "veo-3.1-generate-preview",
};

function parseDataUrl(d) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(d || "");
  return m ? { mimeType: m[1], data: m[2] } : null;
}

export async function POST(req) {
  const { prompt, model, image, aspect, resolution, duration } = await req.json();

  if (!KEY) {
    return NextResponse.json({ mock: true, output: "Generated video (mock — set GEMINI_API_KEY for real Veo)" });
  }

  const modelId = MODEL_MAP[model] || "veo-3.1-fast-generate-preview";
  const instance = { prompt: prompt || "a cinematic establishing shot, smooth camera motion" };

  const img = parseDataUrl(image);
  if (img) instance.image = { inlineData: { mimeType: img.mimeType, data: img.data } };

  const parameters = {};
  if (aspect) parameters.aspectRatio = aspect;        // "16:9" | "9:16"
  if (resolution) parameters.resolution = resolution; // "720p" | "1080p"
  if (duration) parameters.durationSeconds = Number(duration); // 4 | 6 | 8 (must be a number)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`,
      {
        method: "POST",
        headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ instances: [instance], parameters }),
      }
    );
    if (!res.ok) throw new Error(`Veo ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    if (!data.name) throw new Error("Veo did not return an operation name");
    return NextResponse.json({ operation: data.name });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
