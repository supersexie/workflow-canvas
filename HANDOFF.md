# Geoflix — Project Handoff

> A node-based AI creative canvas (Picsart-Workflows clone) deployed at **geoflix.online**, plus a Claude MCP connector that exposes its generation tools. This doc lets a new Claude instance continue with full context.

Last updated: 2026-06-22.

---

## 1. Project Overview & Goals

**What it is:** A web app where users build node-based "workflows" on an infinite canvas — Image / Video / Text / Audio nodes you connect together (e.g. Image → Video for image-to-video). Modeled visually on Picsart Workflows. Plus an **MCP server** so Claude (Desktop / claude.ai connector) can generate media through the same backend.

**Goals (in order they were pursued):**
1. Clone the Picsart Workflows look & interactions (canvas, node cards, drag-to-connect). ✅
2. Make it a real working site (dashboard, save/load, editor). ✅
3. Real AI generation (image/text/audio/video). ✅ (video via fal; Veo blocked on billing)
4. AI assistant side panel that turns natural language into nodes. ✅
5. A "Library" gallery of all generations. ✅
6. Deploy live on a custom domain. ✅ (geoflix.online)
7. MCP connector so Claude can generate. ✅ (tools work; **inline media rendering in chat is the open problem**)

**User:** Indian locale, on Vercel Hobby plan, GitHub user `supersexie`, email `rishavvashisht347@gmail.com`. Frustrated by the long inline-video saga — be efficient and verify against reality, don't guess.

---

## 2. Architecture & Tech Stack

- **Framework:** Next.js 15.5.x (App Router), React 19.
- **Canvas:** `@xyflow/react` (React Flow v12).
- **Hosting:** Vercel (Hobby plan → **60s serverless function cap**, ~4.5MB response considerations).
- **Repo:** GitHub `supersexie/workflow-canvas`. Auto-deploys on push to `main`.
- **Domain:** `geoflix.online` (registered at Hostinger; DNS A `@`→`76.76.21.21`, CNAME `www`→`cname.vercel-dns.com`). **Use `https://www.geoflix.online`** — apex 308-redirects to www and some clients don't follow.
- **Persistence:** browser **localStorage only** (no backend DB, no auth — deliberate user choice). Key: `wfc:workflows:v1`.
- **Local dev:** `npm run dev` (port 3000). ⚠️ **Windows dev server is flaky**: running `npm run build` while `next dev` is running corrupts `.next` (`Cannot find module './vendor-chunks/next.js'`). Fix: stop dev server, `rm -rf .next`, restart. Build for verification, not while dev runs.

### Providers / Env vars (set in Vercel → Settings → Environment Variables)
| Env var | Used for |
|---|---|
| `OPENAI_API_KEY` | text (`gpt-4o-mini`), audio (`tts-1`). (Was image via gpt-image; now images use fal.) |
| `FAL_KEY` | **images** (FLUX/Seedream/Nano Banana) and **video** (LTX/Wan/MiniMax/Kling) |
| `GEMINI_API_KEY` | Google Veo video (wired but blocked — see Outstanding) |
| `MCP_KEY` | shared secret gating the remote MCP endpoint (`?key=`) |

`.npmrc` contains `legacy-peer-deps=true` (required — see Decisions).

---

## 3. Key Decisions & Why

1. **React Flow for the canvas** — fastest path to Picsart-like nodes/edges/pan/zoom.
2. **localStorage, no auth** — user explicitly chose single-user/local; multi-user+Postgres deferred.
3. **fal.ai as the primary media provider** — Veo (Google) hit a `429` billing/quota wall; fal works, is cheap, and returns public URLs. Eromify (reference product) also uses fal.
4. **Images switched from OpenAI gpt-image → fal FLUX** — gpt-image only returns **base64** (1.5MB data URLs), which (a) bloated localStorage and (b) Claude won't render inline. fal returns small **public URLs**. Trade-off: image style changed from gpt-image to FLUX. (gpt-image quality would require base64 → no inline.)
5. **Video is async (start → poll)** — Vercel Hobby caps functions at 60s but video takes 1–3 min. So `/api/video/start` returns a handle; client/`check_video` polls `/api/video/status`.
6. **MCP: both remote + local** — remote connector (`/api/[transport]`, for claude.ai) AND a local stdio server (`geoflix-mcp/`, for Claude Desktop/Code).
7. **MCP Apps widget for inline media** — Claude does NOT inline-render `video/mp4` blobs or markdown links from custom connectors; the only path is an MCP Apps `ui://` HTML widget (this is what Eromify does). Required upgrading SDK to 1.29 + adding `@modelcontextprotocol/ext-apps` → conflicts with `mcp-handler` (pins SDK 1.26) → hence `--legacy-peer-deps` + `.npmrc`.
8. **Hand-written ~2KB widget instead of the ext-apps SDK** — bundling the SDK made a ~376KB iframe that Claude renders blank; a tiny hand-written `postMessage` client renders.
9. **Same-origin media proxy (`/api/media`)** — Claude's sandboxed widget iframe won't load cross-origin `fal.media` URLs; proxying through geoflix's own domain is what makes media loadable (Eromify does the same via `api.eromify.com/mcp-gen/...`).

---

## 4. Status of Every Major Feature

| Feature | Status | Notes |
|---|---|---|
| Dashboard (`/`) | ✅ | List/create/rename/delete workflows |
| Editor (`/w/[id]`) | ✅ | Auto-save (500ms debounce), editable title |
| Node cards (Image/Video/Text/Audio) | ✅ | Per-kind sizes; "Motion" was replaced by "Library" |
| Drag-to-connect → type picker | ✅ | Drag from a node's right handle to empty canvas → pick a kind → connected node |
| Upstream→downstream propagation | ✅ | Image output shows as source thumbnail in connected Video node + prompt bar |
| Upload (image/video/audio) | ✅ | File picker; data URL → node output |
| Bottom prompt bar | ✅ | Per-node model/aspect/duration/Play; model dropdowns wired to backend |
| Delete / undo-redo / fit-view / deselect | ✅ | Delete key + per-node trash; Ctrl+Z/Y; rail buttons |
| Image generation | ✅ | fal FLUX/Seedream/Nano Banana → public URL |
| Text generation | ✅ | OpenAI gpt-4o-mini |
| Audio generation | ✅ | OpenAI tts-1 |
| Video generation | ✅ | fal LTX/Wan/MiniMax/Kling (text→video + image→video) |
| Google Veo | ⚠️ blocked | Code complete; `429` quota — needs paid Gemini tier (see Outstanding) |
| AI Assistant panel | ✅ | Right side panel; GPT-4o-mini classifies intent → creates+runs node |
| Library gallery | ✅ | Grid of all generations across workflows (16:9 blocks, hover overlay) |
| Deploy / domain / SSL | ✅ | geoflix.online live |
| MCP connector (tools work) | ✅ | image/video/audio/text/check_video all functional, secured by `MCP_KEY` |
| **Inline media in Claude chat** | ❌ **OPEN** | Widget renders blank in user's claude.ai despite spec-correct server. See §6/§10. |

---

## 5. Bugs Found & Fixes Applied

1. **Dark Reader hydration mismatch** → added `suppressHydrationWarning` to `<html>` in `app/layout.js`.
2. **`next/dynamic` with `ssr:false` in a Server Component** (build error) → import `Canvas` directly.
3. **CSS minifier stripped `.assistant` positioning** — dev preview doesn't minify, so it only broke in production. Fix: use `inset` shorthand with distinct values; **always verify CSS fixes against the built `.next` CSS / live bundle, not dev**. (Memory: `nextjs-dev-no-minify-verify-built-css`.)
4. **Uploaded `data:` URLs didn't propagate** downstream → `sourcesByNode` now accepts `http`, `data:`, and `/api/` outputs.
5. **Assistant panel: input pushed off-screen** after first message — went flex → grid → absolute → finally a clean component; root cause was layout + a stale connector cache confusion.
6. **Paste didn't work in prompt input** → explicit `onPaste` handler + `stopPropagation`.
7. **fal status poll `405`** → don't construct the status URL; use the `status_url`/`response_url` fal returns from submit.
8. **Veo `durationSeconds` 400** → must be a **number**, not a string (docs were wrong).
9. **Image localStorage bloat + no inline render** → switched images to fal public URLs.
10. **CSS/JS import order** — `@xyflow/react/dist/style.css` must be imported **before** `globals.css` (was overriding handle styles).
11. **React Flow handles invisible** → styled as always-visible circular `+` handles.

---

## 6. The Inline-Media-in-Claude Saga (most important open item)

**Goal:** make generated images/videos render **inline in claude.ai chat** via the MCP connector (like Eromify does).

**What was proven NOT to work (all tested live):**
- Returning video as a `video/mp4` **blob resource** → client: "Resources of type video/mp4 are not currently supported".
- Returning a **bare `.mp4`/image URL in text** → renders as a clickable **link**, not inline media.
- Returning a **markdown `![](url)`** → claude.ai does NOT render markdown images from connector tool results.
- **Image content block** (`{type:"image",data,mimeType}`) → renders in Claude Code (my env) but the user reports it does **not** render inline in their claude.ai for geoflix (Eromify's images DO render → via widget).

**The correct mechanism (confirmed from Eromify's architecture doc + Anthropic ext-apps spec):** an **MCP Apps UI widget**:
- Register a `ui://` resource, mime `text/html;profile=mcp-app`, via `registerAppResource`.
- Tool carries `_meta: { ui: { resourceUri } }` (EXTENSION_ID `io.modelcontextprotocol/ui`).
- Tool returns `structuredContent: { url, kind }`; the widget reads it (`ui/notifications/tool-result` over postMessage) and renders `<img>`/`<video>`.
- Host loads the widget HTML in a sandboxed iframe.

**Two real blockers discovered & addressed:**
1. **Widget too big** — the ext-apps `app-with-deps` SDK (~337KB) → ~376KB iframe Claude renders blank. → Replaced with a **hand-written ~2KB widget** (`geoflix-widget/widget.html`) doing the `postMessage` handshake manually (protocol `2026-01-26`, `ui/initialize` → `ui/notifications/initialized`, deep-scan messages for `{url}`).
2. **Cross-origin media** — claude.ai's sandbox won't load `fal.media` URLs. → Added **same-origin proxy `/api/media?u=<encoded>`** (verified: returns `image/jpeg`, CORS `*`). `structuredContent.url` points at the proxy.

**Verified working pieces (via direct curl / tool calls):**
- `tools/list` → video/image tools carry correct `_meta.ui.resourceUri`.
- `resources/list` / `resources/read` → widget served correctly with CSP.
- `/api/media` proxy → 200, correct content-type, same-origin.
- `generate_image` tool → returns `{"url":"https://www.geoflix.online/api/media?u=...","kind":"image"}` (correct).
- fal video → valid public `.mp4`, `video/mp4`, CORS `*`.

**CURRENT STATE: still renders BLANK in the user's claude.ai** even after same-origin proxy + tiny widget + fresh connector re-add. Last action: deployed a **debug widget** (`a744155`) that prints a bright-green event log (`SENT ui/initialize`, `RECV <method>`, `FOUND <kind>`) on screen. **Awaiting a user screenshot of the widget box after a fresh connector re-add + a generation** to determine:
- green text shows + RECV lines → handshake works, fix parsing/render;
- green text + no RECV → host isn't delivering messages to the widget (transport/handshake wrong — may need MessagePort, or the host never sends tool-result without a perfect init);
- totally blank (no green text) → Claude isn't painting the iframe body at all → hard client limitation (open bug `modelcontextprotocol/ext-apps#671`), fall back to links.

**Critical caveat:** the widget HTML is **cached at connector-connect time**. Any widget change requires the user to **fully remove + re-add the connector** (not toggle) to load it. Much confusion came from stale cached widgets.

**Note:** the user can show Eromify's exact response (CLAUDE.md doc is on their Desktop). Eromify proves the mechanism works in their client — so if our debug widget shows it's a parsing/transport issue, copying Eromify's exact widget/transport is the path. If the iframe never paints even static text, it's a platform gap.

---

## 7. Key Files, Folders, APIs, MCP Tools

### App (`workflow-canvas/`)
```
app/
  layout.js                  # imports xyflow css BEFORE globals.css; suppressHydrationWarning
  page.js                    # Dashboard
  globals.css                # all styles (dark theme, canvas, assistant, library, prompt bar)
  w/[id]/page.js             # editor route → <Canvas workflowId>
  api/
    generate/route.js        # POST {kind,prompt,model} → image(fal)/text(openai)/audio(openai); mock fallback
    video/start/route.js     # POST → fal/Veo start; returns {provider, statusUrl/responseUrl | operation} or {mock}
    video/status/route.js    # POST handle → {done, output} (fal public url / veo proxy path)
    video/file/route.js      # GET ?uri= → proxies Veo video bytes (Veo only; needs GEMINI_API_KEY)
    video/check/route.js     # GET → free Veo key/access health check
    media/route.js           # GET ?u= → SAME-ORIGIN media proxy (SSRF-allowlisted to fal/google/eromify)
    assistant/route.js       # POST {input,history} → gpt-4o-mini → {kind,prompt,message}
    [transport]/route.js     # THE REMOTE MCP SERVER (mcp-handler + ext-apps). Gated by ?key=MCP_KEY.
    [transport]/widget-html.js  # AUTO-GENERATED widget string (do not edit; built by geoflix-widget)
components/
  Canvas.js                  # main editor: ReactFlow, nodes/edges, run, undo/redo, assistant+library state
  nodes/WorkflowNode.js      # the large editing-card node (per-kind), upload, delete, output render
  PromptBar.js               # bottom bar: model/aspect/duration dropdowns, Play; MODELS/ASPECTS/DURATIONS maps
  Assistant.js               # right-side AI chat panel
  Library.js                 # gallery modal of all generations
  Dashboard.js               # workflow list/create/delete/rename
lib/
  store.js                   # localStorage CRUD + listGenerations()
  run.js                     # generateOutput() + generateVideo() (client polling)
  mockRun.js                 # mock outputs + topoOrder
geoflix-mcp/                 # LOCAL stdio MCP server (Claude Desktop/Code) — @modelcontextprotocol/sdk + zod
  index.js, package.json, README.md
geoflix-widget/              # builds the inline-media widget
  widget.html                # the hand-written ~2KB MCP Apps widget (CURRENTLY a debug version)
  build.js                   # reads widget.html → writes app/api/[transport]/widget-html.js (JSON.stringify)
.npmrc                       # legacy-peer-deps=true
.claude/launch.json          # preview server config
```

### MCP tools (remote `/api/mcp` and local stdio)
- `generate_image(prompt, model?)` — fal FLUX/Seedream/Nano Banana → public URL → widget
- `generate_video(prompt, model?, image_url?, aspect?, resolution?, duration?)` — fal/Veo; returns widget or a `check_video` handle if >~45s
- `check_video(handle)` — polls + renders the finished video (remote only; async pattern)
- `generate_audio(prompt)` — tts-1, returns audio content block
- `generate_text(prompt)` — gpt-4o-mini text
- Models: image = Flux 2 Pro / Flux 2 Max / Nano Banana Pro / Seedream 4.5; video = LTX Video / Wan 2.2 / MiniMax Hailuo / Kling v2 / Veo 3.1 Fast / Veo 3.1

### Connector URL (claude.ai custom connector)
```
https://www.geoflix.online/api/mcp?key=<MCP_KEY value>
```

### fal endpoints (reference, from Eromify doc)
- Images: `fal-ai/flux-2-pro`, `fal-ai/flux-2-max`, `fal-ai/nano-banana-pro`, `fal-ai/bytedance/seedream/v4.5/text-to-image`. Call `POST https://fal.run/{endpoint}` with `Authorization: Key <FAL_KEY>` → `{images:[{url}]}` (public fal.media URL).
- Video (queue): `POST https://queue.fal.run/{endpoint}` → `{request_id, status_url, response_url}`; poll `status_url`; result at `response_url` → `{video:{url}}`. Models: `fal-ai/ltx-video`(+`/image-to-video`), `fal-ai/wan/v2.2-a14b/(text|image)-to-video`, `fal-ai/minimax/hailuo-02/standard/...`, `fal-ai/kling-video/v2/master/...`.
- **gpt-image via fal returns base64, NOT a URL** — that's why images use FLUX.
- Veo (Gemini API): `POST https://generativelanguage.googleapis.com/v1beta/models/{veo-3.1-fast-generate-preview|veo-3.1-generate-preview}:predictLongRunning` with `x-goog-api-key`; `durationSeconds` must be a **number**; poll the returned operation; video at `response.generateVideoResponse.generatedSamples[0].video.uri` (needs key to download → proxied via `/api/video/file`).

---

## 8. Commands, Scripts, Workflows

- **Deploy:** `git push` (Vercel auto-deploys `main` in ~90s). Commit author used: `-c user.email="rishavvashisht347@gmail.com" -c user.name="supersexie"`.
- **Build/verify:** `cd workflow-canvas && rm -rf .next && npm run build`. (Always verify production build for CSS/route issues.)
- **Rebuild the widget after editing `geoflix-widget/widget.html`:** `cd geoflix-widget && node build.js` (regenerates `app/api/[transport]/widget-html.js`), then rebuild/push the app.
- **Inspect live MCP protocol (debugging):** temporarily add a `?debug=1` bypass in `/api/[transport]/route.js`'s `gated()` (REMOVE after), then `curl -X POST https://www.geoflix.online/api/mcp?debug=1 -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize",...}'`. Also `tools/list`, `resources/list`, `resources/read`.
- **Verify backend without MCP key (these routes are public):** `curl -X POST .../api/video/start -d '{...}'`, poll `.../api/video/status`, test `.../api/media?u=<encoded fal url>`, `.../api/generate -d '{"kind":"image",...}'`.
- **Local MCP (Claude Code):** `claude mcp add geoflix -- node "C:\Users\91821\workflow-canvas\geoflix-mcp\index.js"` (PowerShell needs `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` first).
- **Windows preview gotcha:** never `npm run build` while `next dev` runs (corrupts `.next`).

---

## 9. Assumptions & Constraints

- **Vercel Hobby 60s function cap** → video must be start+poll (`check_video`), not one long call.
- **claude.ai sandbox** won't load cross-origin media → same-origin `/api/media` proxy required for inline widgets.
- **Widget cached at connect** → must fully remove+re-add the connector to load widget changes.
- **ext-apps needs SDK ^1.29 but mcp-handler pins 1.26** → `--legacy-peer-deps` + `.npmrc`.
- **ext-apps SDK bundle too big** for an inline widget → hand-write the client.
- **gpt-image only returns base64** → can't be a small public URL → images use fal FLUX.
- **No auth** → MCP `/api/mcp` is gated by `MCP_KEY`, but `/api/generate`, `/api/video/*`, `/api/media` are **OPEN** (cost risk if URL leaks).
- **fal media URLs may expire** → for permanence, re-host (Vercel Blob / Supabase) like Eromify; not done yet.
- **Veo blocked** on Gemini paid-tier quota (`429`).

---

## 10. What To Do Next (priority order)

1. **Resolve inline media (active):** read the user's debug-widget screenshot (`geoflix-widget/widget.html` is currently the debug version).
   - If green log shows `RECV ui/notifications/tool-result` but no render → fix `deepFind`/`render` parsing of the result shape.
   - If log shows no `RECV` after `SENT ui/initialize` → the transport is wrong; the host may use a **MessagePort** (transferred in the first message) instead of `window.parent`, or requires a different init handshake. Compare against Eromify's exact widget (user can paste its raw response / it's an `image-viewer.html`).
   - If totally blank (no green text) → Claude isn't painting custom-connector widgets in this client → **stop; fall back to returning a clean link** (revert widget to a text link as in commit `1788607`'s sibling approach) and treat the web-app Library as the place to view media. This is a platform limitation (ext-apps#671), not a code bug.
   - **After fixing, restore the non-debug widget** (it should render `<img>`/`<video>` from `structuredContent.url`, with the END-TURN text already in the tools).
2. **Lock down open API routes** — add `MCP_KEY`/a secret to `/api/generate`, `/api/video/*`, `/api/media` (or rate-limit) so a leaked geoflix URL can't burn OpenAI/fal credits. Currently only `/api/mcp` is gated.
3. **Persist media** — re-host fal outputs to durable storage (Vercel Blob) so links/Library don't rot when fal URLs expire.
4. **Veo** — either get the Gemini project onto paid tier (resolves `429`) or drop the Veo dropdown options (fal already covers video).
5. **Optional polish:** bump assistant + intent model to `gpt-4o`; restore gpt-image quality option (knowing it can't render inline); add a landing page at `/` with the app at `/app`; eventually auth + Postgres for multi-device sync (originally requested, deferred).

---

## 11. Memory Notes (in `~/.claude/.../memory/`)
- `nextjs-dev-no-minify-verify-built-css` — verify CSS fixes against built/live CSS, not dev; use `inset` shorthand to dodge minifier mangling.
- `claude-mcp-inline-video` — the full inline-media findings (blob/URL/markdown don't render; MCP Apps widget required; size + cross-origin blockers; same-origin proxy fix; status pending).

---

## 12. Recent Commit Trail (newest first, abbreviated)
`a744155` debug widget log · `1788607` end-turn instruction · `cca4973` same-origin proxy + widget · `62c51e7` fal FLUX images · `4c7ade0` images via fal/public URL · widget size iterations (`0ae2d50` tiny widget, `eed9d95` ext-apps app tools) · `d729290`/`156a030`/`bd58eb7` video resource/URL attempts · `f9bd290` check_video · Veo + fal video integration · OpenAI generate route · editor polish · MCP server. Repo: https://github.com/supersexie/workflow-canvas
