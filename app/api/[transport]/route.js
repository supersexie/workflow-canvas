import { createMcpHandler } from "mcp-handler";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { WIDGET_HTML } from "./widget-html.js";

export const maxDuration = 60;

const UI_URI = "ui://geoflix/media.html";

// Domains the widget iframe is allowed to load media from (CSP media-src/img-src).
const MEDIA_DOMAINS = [
  "https://*.fal.media",
  "https://*.fal.run",
  "https://*.googleapis.com",
  "https://storage.googleapis.com",
  "https://*.eromify.com",
  "https://geoflix.online",
  "https://www.geoflix.online",
];
const UI_CSP = { resourceDomains: MEDIA_DOMAINS, connectDomains: MEDIA_DOMAINS };

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

// Poll a video job for up to `budgetMs`. Returns a tool result (with structuredContent
// the UI widget reads) when done, else null.
async function pollVideo(handle, budgetMs) {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await postJson("/api/video/status", handle);
    if (s.done) {
      const url = s.output.startsWith("http") ? s.output : `${BASE}${s.output}`;
      return {
        structuredContent: { url, kind: "video" },
        content: [{ type: "text", text: `✅ Video ready: ${url}` }],
      };
    }
  }
  return null;
}

const VIDEO_INPUT = {
  prompt: z.string(),
  model: z.enum(["LTX Video", "Wan 2.2", "MiniMax Hailuo", "Kling v2", "Veo 3.1 Fast", "Veo 3.1"]).optional(),
  image_url: z.string().optional(),
  aspect: z.enum(["16:9", "9:16"]).optional(),
  resolution: z.enum(["720p", "1080p"]).optional(),
  duration: z.number().optional(),
};

const handler = createMcpHandler(
  (server) => {
    // UI widget resource that renders generated media inline (MCP Apps).
    registerAppResource(
      server,
      "geoflix-media",
      UI_URI,
      { _meta: { ui: { csp: UI_CSP } } },
      async () => ({ contents: [{ uri: UI_URI, mimeType: RESOURCE_MIME_TYPE, text: WIDGET_HTML, _meta: { ui: { csp: UI_CSP } } }] })
    );

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

    // Video tools are App tools — their results render in the UI widget (inline player).
    registerAppTool(
      server,
      "generate_video",
      {
        title: "Generate video",
        description: "Generate a video from text (and optionally a source image for image-to-video). Cheap models (LTX) finish in under a minute; pricier ones may exceed the time limit — then call check_video with the handle.",
        inputSchema: VIDEO_INPUT,
        _meta: { ui: { resourceUri: UI_URI } },
      },
      async ({ prompt, model, image_url, aspect, resolution, duration }) => {
        const start = await postJson("/api/video/start", { prompt, model: model || "LTX Video", image: image_url, aspect, resolution, duration });
        if (start.mock) return { content: [{ type: "text", text: start.output }] };
        start.prompt = prompt;
        if (image_url) start.image_url = image_url;
        const done = await pollVideo(start, 40 * 1000);
        if (done) return done;
        return {
          content: [{
            type: "text",
            text:
              "Video is rendering (takes ~1-2 min). Call the `check_video` tool with this exact handle to retrieve it once ready:\n\n" +
              "```json\n" + JSON.stringify(start) + "\n```",
          }],
        };
      }
    );

    registerAppTool(
      server,
      "check_video",
      {
        title: "Check video",
        description: "Retrieve a video started by generate_video that wasn't ready yet. Pass the exact `handle` JSON from generate_video. Renders the video inline once ready.",
        inputSchema: { handle: z.string().describe("The JSON handle string from generate_video") },
        _meta: { ui: { resourceUri: UI_URI } },
      },
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
