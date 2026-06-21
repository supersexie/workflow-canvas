export const runtime = "nodejs";
export const maxDuration = 60;

// Same-origin media proxy so Claude's widget iframe trusts/loads generated media
// (claude.ai does not reliably load raw fal.media/googleapis URLs in the sandbox).
const ALLOW = [
  /^https:\/\/[a-z0-9.-]*\.fal\.media\//i,
  /^https:\/\/[a-z0-9.-]*\.fal\.run\//i,
  /^https:\/\/[a-z0-9.-]*\.googleapis\.com\//i,
  /^https:\/\/storage\.googleapis\.com\//i,
  /^https:\/\/[a-z0-9.-]*\.eromify\.com\//i,
  /^https:\/\/generativelanguage\.googleapis\.com\//i,
];

export async function GET(req) {
  const u = new URL(req.url).searchParams.get("u");
  if (!u || !ALLOW.some((r) => r.test(u))) return new Response("Forbidden", { status: 403 });
  try {
    const r = await fetch(u, { redirect: "follow" });
    if (!r.ok) return new Response(`Upstream ${r.status}`, { status: 502 });
    return new Response(r.body, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(`Proxy error: ${e.message}`, { status: 502 });
  }
}
