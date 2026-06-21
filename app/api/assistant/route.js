import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const KEY = process.env.OPENAI_API_KEY;

const SYS = `You are an assistant inside a node-based workflow canvas (like Picsart Workflows).
The user describes a creative task. You decide:
  - what kind of node to create: "image", "video", "text", "audio", or "motion"
  - what concrete prompt to use for that node
  - a brief message back to the user

Defaults: "image" if ambiguous. If the user mentions "video", "clip", "animation" → video. If "voiceover", "narrate", "speech", "music" → audio. If "write", "story", "summary", "describe in text" → text. If "motion graphics", "animated logo" → motion.

If the user asks something off-topic or unclear, respond with kind=null and a clarifying message.

Always respond as JSON:
{
  "kind": "image" | "video" | "text" | "audio" | "motion" | null,
  "prompt": "the concrete prompt to feed the model",
  "message": "short reply to the user (1-2 sentences)"
}`;

export async function POST(req) {
  const { input, history = [] } = await req.json();
  if (!KEY) {
    // No key — fall back to a dumb regex classifier
    const text = (input || "").toLowerCase();
    let kind = "image";
    if (/\b(video|clip|animation|animate)\b/.test(text)) kind = "video";
    else if (/\b(audio|voice|narrate|speech|music|sound)\b/.test(text)) kind = "audio";
    else if (/\b(write|text|story|summary|paragraph)\b/.test(text)) kind = "text";
    else if (/\bmotion graphic/.test(text)) kind = "motion";
    return NextResponse.json({
      kind,
      prompt: input,
      message: `Creating a ${kind} node. (Set OPENAI_API_KEY for smarter intent detection.)`,
    });
  }
  try {
    const messages = [
      { role: "system", content: SYS },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: input },
    ];
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 250,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      kind: parsed.kind ?? null,
      prompt: parsed.prompt || input,
      message: parsed.message || "Done.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
