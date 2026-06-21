import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI = process.env.GEMINI_API_KEY;
const FAL = process.env.FAL_KEY;

const VEO_MODELS = {
  "Veo 3.1 Fast": "veo-3.1-fast-generate-preview",
  "Veo 3.1": "veo-3.1-generate-preview",
};

const FAL_MODELS = {
  "LTX Video": {
    t2v: "fal-ai/ltx-video",
    i2v: "fal-ai/ltx-video/image-to-video",
  },
  "Wan 2.2": {
    t2v: "fal-ai/wan/v2.2-a14b/text-to-video",
    i2v: "fal-ai/wan/v2.2-a14b/image-to-video",
  },
  "MiniMax Hailuo": {
    t2v: "fal-ai/minimax/hailuo-02/standard/text-to-video",
    i2v: "fal-ai/minimax/hailuo-02/standard/image-to-video",
  },
  "Kling v2": {
    t2v: "fal-ai/kling-video/v2/master/text-to-video",
    i2v: "fal-ai/kling-video/v2/master/image-to-video",
  },
};

function parseDataUrl(d) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(d || "");
  return m ? { mimeType: m[1], data: m[2] } : null;
}

export async function POST(req) {
  const { prompt, model, image, aspect, resolution, duration } = await req.json();

  // ---- fal.ai (Wan) ----
  const fal = FAL_MODELS[model];
  if (fal) {
    if (!FAL) return NextResponse.json({ mock: true, output: "Generated video (mock — set FAL_KEY for real fal.ai)" });
    const endpoint = image ? fal.i2v : fal.t2v;
    const input = { prompt: prompt || "a cinematic scene, smooth camera motion" };
    if (image) input.image_url = image; // fal accepts data URIs
    try {
      const res = await fetch(`https://queue.fal.run/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      if (!data.request_id) throw new Error("fal did not return a request_id");
      // Use fal's own returned URLs (correct base path for multi-segment models)
      return NextResponse.json({
        provider: "fal",
        statusUrl: data.status_url,
        responseUrl: data.response_url,
      });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ---- Google Veo (default) ----
  if (!GEMINI) return NextResponse.json({ mock: true, output: "Generated video (mock — set GEMINI_API_KEY for real Veo)" });
  const modelId = VEO_MODELS[model] || "veo-3.1-fast-generate-preview";
  const instance = { prompt: prompt || "a cinematic establishing shot, smooth camera motion" };
  const img = parseDataUrl(image);
  if (img) instance.image = { inlineData: { mimeType: img.mimeType, data: img.data } };
  const parameters = {};
  if (aspect) parameters.aspectRatio = aspect;
  if (resolution) parameters.resolution = resolution;
  if (duration) parameters.durationSeconds = Number(duration);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning`,
      {
        method: "POST",
        headers: { "x-goog-api-key": GEMINI, "Content-Type": "application/json" },
        body: JSON.stringify({ instances: [instance], parameters }),
      }
    );
    if (!res.ok) throw new Error(`Veo ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    if (!data.name) throw new Error("Veo did not return an operation name");
    return NextResponse.json({ provider: "veo", operation: data.name });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
