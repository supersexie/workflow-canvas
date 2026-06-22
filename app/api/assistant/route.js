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

DIRECTOR MODE (multi-scene video): If the user wants a video longer than ~8 seconds, OR mentions multiple scenes / a story / a sequence (e.g. "30 second video", "1 minute rhyme", "a story about..."), break it into a SEQUENCE of short clips (~6-8s each) returned in "scenes". Estimate scene count as seconds ÷ 7, clamped between 2 and 6.

The clips are generated INDEPENDENTLY (each model call has no memory of the others) and then stitched together, so visual consistency depends ENTIRELY on you repeating identical descriptors. Therefore:
- Lock ONE fixed STYLE spec up front (e.g. "Pixar-style 3D animation, soft pastel colors, warm cinematic lighting, shallow depth of field") and a precise, FIXED description for every recurring CHARACTER (species/role, exact colors, outfit, size, distinguishing features).
- Write each scene as: <the SAME style spec> + <the SAME character description(s), word-for-word> + <this scene's specific action, setting, and camera move>. Repeat the style and character text VERBATIM in every scene so every clip looks like the same world and characters.
- Keep setting, time of day, and color palette continuous across consecutive scenes unless the story calls for a change. End/begin scenes on matching framing where possible for smooth cuts.
- 2-4 sentences per scene. No "Shot N" labels or timestamps.
- ALSO return a "character" field: ONE text-to-image prompt for a single reference image of the main character — full body, simple neutral background, in the locked style. This image seeds every scene so the character stays identical; each scene prompt then describes that scene's setting and action.

If the user asks something off-topic or unclear, respond with kind=null and a clarifying message.

Always respond as JSON. For a single asset:
{ "kind": "image"|"video"|"text"|"audio"|"motion"|null, "prompt": "...", "message": "short reply (1-2 sentences)" }
For a multi-scene video, instead use:
{ "kind": "video", "character": "reference image prompt for the main character", "scenes": ["scene 1 prompt", "scene 2 prompt", ...], "message": "short reply mentioning how many scenes" }`;

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
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const scenes = Array.isArray(parsed.scenes)
      ? parsed.scenes.filter((s) => typeof s === "string" && s.trim()).slice(0, 6)
      : null;
    return NextResponse.json({
      kind: parsed.kind ?? null,
      prompt: parsed.prompt || input,
      scenes: scenes && scenes.length >= 2 ? scenes : null,
      character: typeof parsed.character === "string" ? parsed.character : null,
      message: parsed.message || "Done.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
