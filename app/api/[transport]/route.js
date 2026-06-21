import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

export const maxDuration = 60;

const BASE = (
  process.env.GEOFLIX_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://geoflix.online")
).replace(/\/$/, "");

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function parseDataUrl(s) {
  const m = /^data:(.+?);base64,(.+)$/.exec(s || "");
  return m ? { mimeType: m[1], data: m[2] } : null;
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "generate_image",
      "Generate an image from a text prompt (GPT Image). Returns the image inline.",
      { prompt: z.string(), model: z.enum(["GPT Image 1", "GPT Image 2"]).optional() },
      async ({ prompt, model }) => {
        const { output } = await postJson("/api/generate", { kind: "image", prompt, model });
        const img = parseDataUrl(output);
        if (img) return { content: [{ type: "image", data: img.data, mimeType: img.mimeType }, { type: "text", text: `Generated image for: "${prompt}"` }] };
        return { content: [{ type: "text", text: output }] };
      }
    );

    server.tool(
      "generate_text",
      "Generate text (copy, captions, ideas) from a prompt.",
      { prompt: z.string() },
      async ({ prompt }) => {
        const { output } = await postJson("/api/generate", { kind: "text", prompt });
        return { content: [{ type: "text", text: output }] };
      }
    );

    server.tool(
      "generate_audio",
      "Generate speech audio (text-to-speech). Returns an MP3 inline.",
      { prompt: z.string() },
      async ({ prompt }) => {
        const { output } = await postJson("/api/generate", { kind: "audio", prompt });
        const aud = parseDataUrl(output);
        if (aud) return { content: [{ type: "audio", data: aud.data, mimeType: aud.mimeType }, { type: "text", text: "Generated audio." }] };
        return { content: [{ type: "text", text: output }] };
      }
    );

    server.tool(
      "generate_video",
      "Generate a video from text (and optionally a source image for image-to-video). Cheap models (LTX) finish in under a minute; pricier ones may exceed the time limit — if so, check the Geoflix Library for the result.",
      {
        prompt: z.string(),
        model: z.enum(["LTX Video", "Wan 2.2", "MiniMax Hailuo", "Kling v2", "Veo 3.1 Fast", "Veo 3.1"]).optional(),
        image_url: z.string().optional(),
        aspect: z.enum(["16:9", "9:16"]).optional(),
        resolution: z.enum(["720p", "1080p"]).optional(),
        duration: z.number().optional(),
      },
      async ({ prompt, model, image_url, aspect, resolution, duration }) => {
        const start = await postJson("/api/video/start", { prompt, model: model || "LTX Video", image: image_url, aspect, resolution, duration });
        if (start.mock) return { content: [{ type: "text", text: start.output }] };
        const deadline = Date.now() + 50 * 1000; // stay under serverless cap
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 5000));
          const s = await postJson("/api/video/status", start);
          if (s.done) {
            const url = s.output.startsWith("http") ? s.output : `${BASE}${s.output}`;
            return { content: [{ type: "text", text: `✅ Video ready — [▶ Watch / download](${url})\n\n${url}` }] };
          }
        }
        return { content: [{ type: "text", text: "Video is still processing (longer than the request limit). Check the Geoflix Library shortly for the finished clip." }] };
      }
    );
  },
  {},
  { basePath: "/api" }
);

// Optional shared-secret gate: if MCP_KEY is set, require ?key=<token>.
async function gated(req) {
  const token = process.env.MCP_KEY;
  if (token) {
    const key = new URL(req.url).searchParams.get("key");
    if (key !== token) return new Response("Unauthorized", { status: 401 });
  }
  return handler(req);
}

export { gated as GET, gated as POST, gated as DELETE };
