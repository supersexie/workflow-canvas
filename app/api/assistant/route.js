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

STYLE: Do NOT default to any single house style. Choose the visual style that best fits the request:
- If the user names a style (realistic, cinematic, anime, claymation, watercolor, 3D, cyberpunk, retro, etc.), use EXACTLY that.
- If they don't, pick what fits the subject: default to "photorealistic, cinematic lighting, shallow depth of field" for real-world people/products/places; use a stylized look (e.g. "Pixar-style 3D animation", "2D anime cel-shaded", "claymation", "flat vector") only when the subject is cartoonish or the user implies it.
Whatever style you pick, state it concretely once and reuse it.

SELECTED ITEM (interactive): The user may have an item selected on the canvas — see "Canvas selection" in context. If an image is selected and the user refers to "this", "that image", "it", "the current image", or asks to turn/convert the selected image into a video, set "useSelectedImage": true. Then the selected image is the starting frame/seed — do NOT invent a new character or return a "character" field; write the prompt/scenes to ANIMATE or CONTINUE from that exact image (describe motion, camera, what happens next), keeping its subject and style.

DIRECTOR MODE (multi-scene video): If the user wants a video longer than ~8 seconds, OR mentions multiple scenes / a story / a sequence (e.g. "30 second video", "1 minute rhyme", "a story about..."), break it into a SEQUENCE of short clips returned in "scenes".
- Return "seconds": the TOTAL video length the user asked for, as a number (e.g. "make a 10s video" → 10, "30 second video" → 30). If they gave no length, default to 8.
- Scene count MUST match that length: use round(seconds ÷ 5), clamped between 2 and 6. So a 10s video = 2 scenes, a 25s video = 5 scenes. Do NOT add extra scenes beyond this — the final video length must match "seconds".

The clips are generated INDEPENDENTLY (each model call has no memory of the others) and then stitched together, so visual consistency depends ENTIRELY on locking the look. Therefore:
- Lock ONE fixed STYLE spec (the chosen style, concretely: medium, rendering, lighting, color palette, mood) and return it SEPARATELY in a "style" field.
- Do NOT repeat the style text inside each scene — the app prepends the "style" field to every scene automatically, so the style is byte-identical across all clips.
- DO give a precise, FIXED description for every recurring CHARACTER (species/role, exact colors, outfit, size, distinguishing features), and repeat that character text VERBATIM in every scene.
- Write each scene as: <the SAME character description(s), word-for-word> + <this scene's specific action, setting, and camera move>. (No style text — that's in the "style" field.)
- Keep setting, time of day, and color palette continuous across consecutive scenes unless the story calls for a change. End/begin scenes on matching framing where possible for smooth cuts.
- 2-4 sentences per scene. No "Shot N" labels or timestamps.
- Return a "character" field: ONE prompt for a single reference image of the main character — full body, simple neutral background (no style text; the app prepends "style"). (OMIT "character" when useSelectedImage is true — the selected image is the reference.)

If the user asks something off-topic or unclear, respond with kind=null and a clarifying message.

Always respond as JSON. For a single asset:
{ "kind": "image"|"video"|"text"|"audio"|"motion"|null, "prompt": "...", "useSelectedImage": false, "message": "short reply (1-2 sentences)" }
For a multi-scene video, instead use:
{ "kind": "video", "seconds": 10, "style": "the ONE locked style spec, concrete", "character": "reference image prompt without style (omit if useSelectedImage)", "scenes": ["scene 1 without style", "scene 2 without style", ...], "useSelectedImage": false, "message": "short reply mentioning the length and how many scenes" }`;

export async function POST(req) {
  const { input, history = [], context = {} } = await req.json();
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
    const sel = context.hasSelectedImage
      ? "Canvas selection: the user currently has an IMAGE selected on the canvas."
      : "Canvas selection: nothing relevant is selected.";
    // SCRIPT MODE: the user's message is a finished script to turn into a video.
    const scriptMsg = context.script
      ? `SCRIPT MODE IS ON. The user's message is a SCRIPT (their own written narration/story), not a brief. Turn it into a multi-scene video ("kind":"video" with "scenes"):
- Segment the script FAITHFULLY and IN ORDER into 2-6 parts. Do not rewrite or reorder the user's content.
- For each part, write a "scenes" entry = a VISUAL prompt for that part (what's on screen), using the locked style + fixed character description.${
          context.narrate
            ? `\n- ALSO return "narration": an array parallel to "scenes", where narration[i] is the EXACT script text for that part, VERBATIM (the lines to be read aloud). Split the user's script text across the parts in order; do not paraphrase, add, or drop words.`
            : ``
        }
- Still return "style" and (unless a selected image is used) "character" as usual.`
      : "";
    const messages = [
      { role: "system", content: SYS },
      { role: "system", content: sel },
      ...(scriptMsg ? [{ role: "system", content: scriptMsg }] : []),
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
    // Per-part narration lines (script mode + narrate), aligned to scenes.
    const narration = context.narrate && Array.isArray(parsed.narration)
      ? parsed.narration.map((s) => (typeof s === "string" ? s : "")).slice(0, scenes ? scenes.length : 6)
      : null;
    const useSelectedImage = parsed.useSelectedImage === true && context.hasSelectedImage === true;
    return NextResponse.json({
      kind: parsed.kind ?? null,
      prompt: parsed.prompt || input,
      scenes: scenes && scenes.length >= 2 ? scenes : null,
      seconds: Number.isFinite(parsed.seconds) ? parsed.seconds : null,
      narration: narration && narration.length ? narration : null,
      style: typeof parsed.style === "string" ? parsed.style : null,
      character: useSelectedImage ? null : (typeof parsed.character === "string" ? parsed.character : null),
      useSelectedImage,
      message: parsed.message || "Done.",
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
