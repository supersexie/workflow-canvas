import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const KEY = process.env.GEMINI_API_KEY;

export async function POST(req) {
  const { operation } = await req.json();
  if (!KEY) return NextResponse.json({ done: true, output: "Generated video (mock — no GEMINI_API_KEY)" });
  if (!operation) return NextResponse.json({ error: "Missing operation name" }, { status: 400 });

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation}`, {
      headers: { "x-goog-api-key": KEY },
    });
    if (!res.ok) throw new Error(`Veo poll ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();

    if (!data.done) return NextResponse.json({ done: false });
    if (data.error) throw new Error(data.error.message || "Veo generation failed");

    const uri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      data.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("No video URI in completed operation");

    return NextResponse.json({ done: true, uri });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
