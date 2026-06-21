import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const FAL = process.env.FAL_KEY;

// Candidate video model slugs to probe. Sending an empty body returns 422
// (model exists, input invalid) or 404 (slug doesn't exist) WITHOUT starting a job.
const CANDIDATES = [
  "fal-ai/wan/v2.2-a14b/text-to-video",
  "fal-ai/wan/v2.2-a14b/image-to-video",
  "fal-ai/wan-t2v",
  "fal-ai/wan-i2v",
  "fal-ai/ltx-video",
  "fal-ai/ltx-video/image-to-video",
  "fal-ai/kling-video/v2/master/text-to-video",
  "fal-ai/kling-video/v2/master/image-to-video",
  "fal-ai/minimax/hailuo-02/standard/text-to-video",
  "fal-ai/minimax/hailuo-02/standard/image-to-video",
];

export async function GET() {
  if (!FAL) {
    return NextResponse.json({ ok: false, keyLoaded: false, reason: "FAL_KEY not set in this deployment. Add it in Vercel and redeploy." });
  }
  const results = {};
  await Promise.all(
    CANDIDATES.map(async (slug) => {
      try {
        const res = await fetch(`https://queue.fal.run/${slug}`, {
          method: "POST",
          headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
          body: JSON.stringify({}), // empty -> validation error, no job started
        });
        // 422 = exists (input invalid), 404 = not found, 401/403 = auth issue
        results[slug] = { status: res.status, exists: res.status === 422 || res.status === 200 };
      } catch (e) {
        results[slug] = { error: e.message };
      }
    })
  );
  const available = Object.entries(results).filter(([, v]) => v.exists).map(([k]) => k);
  return NextResponse.json({ ok: true, keyLoaded: true, available, results });
}
