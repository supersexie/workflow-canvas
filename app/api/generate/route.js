import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const KEY = process.env.OPENAI_API_KEY;
const OAI = "https://api.openai.com/v1";

async function oai(path, init = {}, json = true) {
  const res = await fetch(`${OAI}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 300)}`);
  }
  return res;
}

async function genImage(prompt) {
  const res = await oai("/images/generations", {
    method: "POST",
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt || "abstract gradient",
      size: "1024x1024",
      n: 1,
    }),
  });
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return `data:image/png;base64,${b64}`;
}

async function genText(prompt) {
  const res = await oai("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt || "Write a short creative description." }],
      max_tokens: 400,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function genAudio(prompt) {
  const res = await oai(
    "/audio/speech",
    {
      method: "POST",
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy",
        input: prompt || "Hello, this is a test.",
        response_format: "mp3",
      }),
    },
    true
  );
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:audio/mpeg;base64,${buf.toString("base64")}`;
}

function mockFallback(kind, prompt) {
  if (kind === "image") return `https://picsum.photos/seed/${Math.floor(Math.random() * 9999)}/512/512`;
  if (kind === "video") return "Generated 6s video (mock — no provider wired)";
  if (kind === "audio") return "Generated audio (mock — no provider wired)";
  if (kind === "motion") return "Generated motion scene (mock — no provider wired)";
  return `Mock text for: ${prompt || "(empty)"} — Lorem ipsum dolor sit amet.`;
}

export async function POST(req) {
  const { kind, prompt } = await req.json();

  if (!KEY) {
    return NextResponse.json({ output: mockFallback(kind, prompt), provider: "mock" });
  }

  try {
    let output;
    if (kind === "image") output = await genImage(prompt);
    else if (kind === "text") output = await genText(prompt);
    else if (kind === "audio") output = await genAudio(prompt);
    else output = mockFallback(kind, prompt); // video, motion
    return NextResponse.json({ output, provider: kind === "video" || kind === "motion" ? "mock" : "openai" });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
