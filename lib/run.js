// Grab the last frame of a generated video as a data-URI image, so the next
// clip can start exactly where this one ended (seamless director transitions).
// Loads via the same-origin /api/media proxy so the canvas isn't tainted.
export async function lastFrameDataUrl(videoUrl) {
  if (!videoUrl || typeof document === "undefined") return null;
  const src = /^data:/.test(videoUrl) ? videoUrl : `/api/media?u=${encodeURIComponent(videoUrl)}`;
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.playsInline = true;
    let done = false;
    const finish = (val) => { if (!done) { done = true; resolve(val); } };
    v.addEventListener("loadedmetadata", () => {
      try { v.currentTime = Math.max(0, (v.duration || 6) - 0.05); } catch { finish(null); }
    });
    v.addEventListener("seeked", () => {
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth || 1280;
        c.height = v.videoHeight || 720;
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        finish(c.toDataURL("image/jpeg", 0.9));
      } catch { finish(null); }
    });
    v.addEventListener("error", () => finish(null));
    setTimeout(() => finish(null), 20000);
    v.src = src;
  });
}

export async function generateOutput(kind, prompt, model, images, opts = {}) {
  // Images go through the async fal queue (start + poll) so slow edit models
  // aren't bound by the 60s serverless cap. Text/audio stay synchronous.
  if (kind === "image") return generateImage({ prompt, model, images, seed: opts.seed });

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, prompt, model, images, voice: opts.voice, seed: opts.seed }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  const { output } = await res.json();
  return output;
}

// Stitch multiple clip URLs into one video via the combine endpoint (start + poll).
export async function combineVideos(urls, durations, onProgress, audioUrls) {
  const startRes = await fetch("/api/video/combine/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, durations, audioUrls }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  const deadline = Date.now() + 4 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    onProgress?.();
    const sRes = await fetch("/api/video/combine/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Combine timed out (over 4 min)");
}

async function generateImage({ prompt, model, images, seed }) {
  const startRes = await fetch("/api/image/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, images, seed }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.output) return start.output; // synchronous fallback (OpenAI/mock)

  const handle = { statusUrl: start.statusUrl, responseUrl: start.responseUrl };
  const deadline = Date.now() + 3 * 60 * 1000; // 3 min cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const sRes = await fetch("/api/image/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Image generation timed out (over 3 min)");
}

// Video uses an async long-running operation (Veo). Start, then poll until done.
export async function generateVideo({ prompt, model, image, aspect, resolution, duration, seed, audio }, onProgress) {
  const startRes = await fetch("/api/video/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, image, aspect, resolution, duration, seed, audio }),
  });
  const start = await startRes.json();
  if (!startRes.ok) throw new Error(start.error || `HTTP ${startRes.status}`);
  if (start.mock) return start.output;

  // Forward the provider-specific handle (veo: {operation}, fal: {endpoint,requestId}) to status.
  const handle = start;
  const deadline = Date.now() + 5 * 60 * 1000; // 5 min cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 6000));
    onProgress?.();
    const sRes = await fetch("/api/video/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handle),
    });
    const s = await sRes.json();
    if (!sRes.ok) throw new Error(s.error || `HTTP ${sRes.status}`);
    if (s.done) return s.output;
  }
  throw new Error("Video generation timed out (over 5 min)");
}
