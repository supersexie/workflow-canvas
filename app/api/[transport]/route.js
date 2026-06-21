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

// Build a poster still (base64 image) for a video: the source image for image-to-video,
// or a freshly generated still for text-to-video.
async function buildPoster({ prompt, image_url }) {
  try {
    if (image_url) {
      const d = parseDataUrl(image_url);
      if (d) return d;
      const r = await fetch(image_url);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        return { mimeType: r.headers.get("content-type") || "image/png", data: buf.toString("base64") };
      }
    } else if (prompt) {
      const { output } = await postJson("/api/generate", { kind: "image", prompt });
      return parseDataUrl(output);
    }
  } catch {}
  return null;
}

// Poll a video job for up to `budgetMs`. Returns an MCP content result when done, else null.
async function pollVideo(handle, budgetMs) {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await postJson("/api/video/status", handle);
    if (s.done) {
      const url = s.output.startsWith("http") ? s.output : `${BASE}${s.output}`;
      const poster = await buildPoster({ prompt: handle.prompt, image_url: handle.image_url });
      const content = [];
      if (poster) content.push({ type: "image", data: poster.data, mimeType: poster.mimeType });
      content.push({ type: "text", text: `✅ Video ready${poster ? " (still preview above)" : ""} — [▶ play / download the full video](${url})` });
      return { content };
    }
  }
  return null;
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
        // carry prompt + image_url so check_video can build the poster
        start.prompt = prompt;
        if (image_url) start.image_url = image_url;
        const done = await pollVideo(start, 40 * 1000);
        if (done) return done;
        return {
          content: [{
            type: "text",
            text:
              "Video is rendering (takes ~1-2 min). Call the `check_video` tool with this exact handle to retrieve it once ready:\n\n" +
              "```json\n" + JSON.stringify(start) + "\n```\n\n" +
              "If it says still rendering, call `check_video` again with the same handle after a few seconds.",
          }],
        };
      }
    );

    server.tool(
      "check_video",
      "Retrieve a video started by generate_video that wasn't ready yet. Pass the exact `handle` JSON returned by generate_video. Returns the video inline once ready.",
      { handle: z.string().describe("The JSON handle string from generate_video") },
      async ({ handle }) => {
        let start;
        try { start = JSON.parse(handle); } catch { return { content: [{ type: "text", text: "Invalid handle. Pass the exact JSON from generate_video." }], isError: true }; }
        const done = await pollVideo(start, 45 * 1000);
        if (done) return done;
        return { content: [{ type: "text", text: "Still rendering — call `check_video` again with the same handle in a few seconds." }] };
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
