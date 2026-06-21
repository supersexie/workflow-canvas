export async function generateOutput(kind, prompt, model) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, prompt, model }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  const { output } = await res.json();
  return output;
}

// Video uses an async long-running operation (Veo). Start, then poll until done.
export async function generateVideo({ prompt, model, image, aspect, resolution, duration }, onProgress) {
  const startRes = await fetch("/api/video/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, image, aspect, resolution, duration }),
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
