# Interactive Canvas Tutorial — Portable Code

A hands-on guided tour that **dims the screen, cuts a bright "spotlight" hole around a
real UI element, and advances when the user actually performs the step** (adds a node,
types a prompt, hits generate). Welcome/Finish are centered modals. It auto-launches once
per user (localStorage flag); a "How it works" button replays it anytime.

Drop it into any React / Next.js app: copy the component, add the CSS, wire the small
integration snippets, and repoint the step selectors at your own UI.

**Stack assumptions:** React 18/19, Next.js App Router (`"use client"` component). The
mechanism is generic — the example targets a React Flow node editor, but any UI works.

---

## 1. The component — `components/CanvasTutorial.js`

Self-contained. `TUT_STEPS` defines the tour; edit each `target` selector + copy to fit
your UI. Each step is a `modal` (centered card) or a `spotlight` (dim + hole + tip card).
The dim layer is click-through, so users interact with the live UI underneath.

````jsx
"use client";
import { useEffect, useLayoutEffect, useState } from "react";

// Hands-on guided tutorial for the Genmax Canvas. Steps come in two flavours:
//  - mode "modal": a centered card (welcome / finish) with a blocking backdrop.
//  - mode "spotlight": dims the screen but cuts a bright hole around a live UI
//    element (`target` CSS selector). The dim layer is click-THROUGH, so the
//    user can actually perform the step; the parent advances the step when it
//    detects the action (node added / prompt typed / generation started).
//
// `step` is the active index; `onNext`/`onBack`/`onSkip` are wired by Canvas.

export const TUTORIAL_DONE_KEY = "genmax:canvasTutorialDone:v1";

export const TUT_STEPS = [
  {
    mode: "modal",
    title: "Welcome to the Canvas",
    body: "Genmax lets you chain creative steps together as nodes — image, video, text, and audio. Let's build your first one. It takes about 30 seconds.",
    cta: "Start",
  },
  {
    mode: "spotlight",
    target: '[data-tut="add"]',
    placement: "right",
    title: "Add an Image node",
    body: "Click the + button in the toolbar, then choose Image from the menu. That's your first node — we'll build from it.",
  },
  {
    mode: "spotlight",
    target: ".pb-title",
    tipTarget: ".prompt-bar",
    placement: "bl",
    optional: true,
    title: "Write a prompt",
    body: "This is the prompt bar for the selected node. Describe what you want to create — for example: “a boy and a tiger in Pixar style”. Then click Next.",
  },
  {
    mode: "spotlight",
    target: ".pb-chips-left",
    placement: "bl",
    optional: true,
    title: "Pick model & aspect ratio",
    body: "Choose the generation model and aspect ratio for this node. The defaults are fine to start — tweak them, then Next.",
  },
  {
    mode: "spotlight",
    target: ".pb-play",
    placement: "top",
    title: "Generate it",
    body: "Hit the play button to run this node. Your result appears right on the card.",
  },
  {
    mode: "spotlight",
    target: ".react-flow__handle.source",
    tipTarget: ".react-flow__node",
    placement: "left-of",
    optional: true,
    revealHandles: true,
    title: "Branch into a video node",
    body: "See the + handle on the edge of your image card? Drag it onto empty canvas and choose Video — it turns your image into a connected video node. (Or click Next and we'll add it for you.)",
  },
  {
    mode: "spotlight",
    target: ".pb-title",
    tipTarget: ".prompt-bar",
    placement: "bl",
    optional: true,
    title: "Prompt your video",
    body: "Your image seeds this video node. Describe the motion or scene — for example: “the boy is playing with his puppy”. Then click Next.",
  },
  {
    mode: "spotlight",
    target: ".pb-chips-left",
    placement: "bl",
    optional: true,
    title: "Choose a video model",
    body: "Pick the video model, aspect ratio and length for this clip. Wan 2.2 is a solid default — tweak if you like, then Next.",
  },
  {
    mode: "spotlight",
    target: ".pb-play",
    placement: "top",
    title: "Generate the video",
    body: "Hit play to animate your image into a video clip. It renders right on the card.",
  },
  {
    mode: "spotlight",
    target: ".assistant-open-btn",
    placement: "tl",
    title: "Meet the AI Assistant",
    body: "Now let the AI do the building. Click Assistant to open the chat — describe what you want and it builds the whole node graph for you.",
  },
  {
    mode: "spotlight",
    target: ".cb-textarea",
    tipTarget: ".cb-modal",
    placement: "left-of",
    optional: true,
    title: "Ask for a full video",
    body: "Try: “Make a 20-second nursery rhyme video for kids.” For a story like this, the Assistant plans multiple scenes and stitches them into one video. Type it, then Next.",
  },
  {
    mode: "spotlight",
    target: '[data-tut="cb-models"]',
    tipTarget: ".cb-modal",
    placement: "left-of",
    optional: true,
    title: "Choose your models",
    body: "Pick the image model (used for the reference & scene frames) and the video model (used to animate them). Defaults are fine — then Next.",
  },
  {
    mode: "spotlight",
    target: ".cb-send",
    tipTarget: ".cb-modal",
    placement: "left-of",
    optional: true,
    title: "Hit generate",
    body: "Send it. The Assistant generates a reference image, stages each scene, animates them, and stitches everything into one finished video — live on the canvas. Click Next to finish.",
  },
  {
    mode: "modal",
    title: "You're all set 🎉",
    body: "Build nodes by hand or just ask the Assistant. Connect nodes by dragging their side handles onto empty space. Re-open this tour anytime from the “How it works” button.",
    cta: "Finish",
  },
];

function useTargetRect(selector, active) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!selector || !active) { setRect(null); return; }
    let raf;
    const measure = () => {
      const el = document.querySelector(selector);
      setRect(el ? el.getBoundingClientRect() : null);
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [selector, active]);
  return rect;
}

export default function CanvasTutorial({ step, total, onNext, onBack, onSkip, nextEnabled = true }) {
  const active = step != null && step >= 0 && step < TUT_STEPS.length;
  const spec = active ? TUT_STEPS[step] : null;
  const rect = useTargetRect(spec?.mode === "spotlight" ? spec.target : null, active);
  // Optional separate anchor for the tip card (e.g. position beside the node
  // card while the spotlight hole stays on the small + handle).
  const tipRect = useTargetRect(spec?.tipTarget || null, active);

  // Esc closes the tour.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") onSkip(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onSkip]);

  // Some node handles are only visible on hover/selection. For steps that point
  // at one, force them visible via a body class so the spotlight isn't empty.
  useEffect(() => {
    const reveal = active && spec?.revealHandles;
    document.body.classList.toggle("tut-reveal-handles", !!reveal);
    return () => document.body.classList.remove("tut-reveal-handles");
  }, [active, spec]);

  if (!active) return null;
  const isModal = spec.mode === "modal";
  const pad = 8;

  // Tooltip position for spotlight steps.
  let tipStyle = {};
  if (!isModal && rect) {
    if (spec.placement === "left-of") {
      const CARD_W = 340;
      const anchor = tipRect || rect;
      const left = Math.max(16, anchor.left - CARD_W - 20);
      const top = Math.max(64, Math.min(anchor.top, window.innerHeight - 240));
      tipStyle = { left, top };
    } else if (spec.placement === "right") {
      tipStyle = { left: rect.right + 16, top: rect.top };
    } else if (spec.placement === "bl") {
      // Lower-left, just above the prompt bar (clear of dropdowns on the right).
      tipStyle = { left: 24, bottom: window.innerHeight - rect.top + 16 };
    } else if (spec.placement === "tl") {
      tipStyle = { left: 24, top: 70 };
    } else if (spec.placement === "top") {
      tipStyle = { left: Math.min(rect.left, window.innerWidth - 360), bottom: window.innerHeight - rect.top + 16 };
    } else {
      tipStyle = { left: rect.left, top: rect.bottom + 16 };
    }
  }

  return (
    <div className="tut-root">
      {isModal ? (
        <div className="tut-modal-backdrop">
          <div className="tut-card tut-card-modal">
            <div className="tut-progress">Step {step + 1} of {total}</div>
            <h3>{spec.title}</h3>
            <p>{spec.body}</p>
            <div className="tut-actions">
              <button className="tut-skip" onClick={onSkip}>Skip tour</button>
              <div className="tut-actions-right">
                {step > 0 && <button className="tut-back" onClick={onBack}>Back</button>}
                <button className="tut-next" onClick={onNext}>{spec.cta || "Next"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Click-through dim layer with a cut-out hole around the target. */}
          <svg className="tut-overlay" width="100%" height="100%">
            <defs>
              <mask id="tut-hole">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {rect && (
                  <rect
                    x={rect.left - pad} y={rect.top - pad}
                    width={rect.width + pad * 2} height={rect.height + pad * 2}
                    rx="12" fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(11,18,32,0.55)" mask="url(#tut-hole)" />
            {rect && (
              <rect
                className="tut-ring"
                x={rect.left - pad} y={rect.top - pad}
                width={rect.width + pad * 2} height={rect.height + pad * 2}
                rx="12" fill="none"
              />
            )}
          </svg>
          {/* Fallback to a centered card if the target isn't on screen yet, so
              the tour is never a blank dim screen. */}
          <div
            className={rect ? "tut-card tut-card-tip" : "tut-card tut-card-tip tut-card-fallback"}
            style={rect ? tipStyle : undefined}
          >
            <div className="tut-progress">Step {step + 1} of {total}</div>
            <h3>{spec.title}</h3>
            <p>{spec.body}</p>
            <div className="tut-actions">
              <button className="tut-skip" onClick={onSkip}>Skip tour</button>
              <div className="tut-actions-right">
                {step > 0 && <button className="tut-back" onClick={onBack}>Back</button>}
                {spec.optional || !rect
                  ? <button className="tut-next" onClick={onNext} disabled={!nextEnabled}>Next</button>
                  : <span className="tut-hint">Do the step to continue →</span>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
````

## 2. The CSS — add to your global stylesheet

Uses CSS variables (`--surface`, `--line-2`, `--ink`, `--text`, `--muted`, `--muted-2`,
`--blue`, `--blue-dark`, `--shadow`) — define them or replace with literals. The
**z-index raises** are important: any popup opened *during* a spotlight step (an add-menu,
a dropdown) must render above the `z-index:1000` overlay or it looks buried. Rename those
selectors (`.add-menu`, `.dd-menu`, `.type-picker`) to match your app.

````css
/* ---- Canvas hands-on tutorial ---- */
/* Root is click-through so spotlight steps let the user interact with the live
   UI underneath; only the tip card / modal backdrop re-enable pointer events. */
.tut-root { position: fixed; inset: 0; z-index: 1000; pointer-events: none; }
.tut-overlay { position: fixed; inset: 0; pointer-events: none; } /* click-through dim */
.tut-ring {
  stroke: var(--blue); stroke-width: 2.5;
  filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.55));
  animation: tut-pulse 1.6s ease-in-out infinite;
}
@keyframes tut-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

.tut-modal-backdrop {
  position: fixed; inset: 0; background: rgba(11, 18, 32, 0.55);
  display: flex; align-items: center; justify-content: center; padding: 24px;
  pointer-events: auto;
}

.tut-card {
  width: 340px; max-width: calc(100vw - 32px);
  background: var(--surface); border: 1px solid var(--line-2);
  border-radius: 14px; padding: 18px; box-shadow: var(--shadow);
}
.tut-card-tip { position: fixed; pointer-events: auto; }
.tut-card-fallback { left: 50%; top: 50%; transform: translate(-50%, -50%); }
.tut-card-modal { width: 400px; }
.tut-card h3 { margin: 6px 0 8px; font-size: 17px; color: var(--ink); }
.tut-card p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--muted); }
.tut-progress {
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--blue);
}
.tut-actions {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-top: 16px;
}
.tut-actions-right { display: flex; align-items: center; gap: 8px; }
.tut-skip {
  background: none; border: none; color: var(--muted-2);
  font-size: 12.5px; cursor: pointer; padding: 6px 2px; font-family: inherit;
}
.tut-skip:hover { color: var(--text); }
.tut-back {
  background: var(--surface-2); border: 1px solid var(--line);
  color: var(--text); font-size: 13px; font-weight: 500;
  padding: 7px 14px; border-radius: 9px; cursor: pointer; font-family: inherit;
}
.tut-back:hover { background: var(--line); }
.tut-next {
  background: var(--blue); border: none; color: #fff;
  font-size: 13px; font-weight: 600; padding: 8px 18px;
  border-radius: 9px; cursor: pointer; font-family: inherit;
}
.tut-next:hover { background: var(--blue-dark); }
.tut-next:disabled { opacity: 0.4; cursor: not-allowed; }
.tut-hint { font-size: 12px; color: var(--blue); font-weight: 500; }

/* During the "branch into a new node" step, reveal node source handles so the
   spotlight has something visible to point at (they're hover-only otherwise). */
body.tut-reveal-handles .react-flow .react-flow__handle.source { opacity: 1; }

/* Popups opened DURING a spotlight step must render above the 1000-z overlay,
   or they appear buried in the dim and look dead. */
.add-menu-backdrop { z-index: 1090; }
.add-menu { z-index: 1100; }
.type-picker { z-index: 1100; }
.dd-backdrop { z-index: 1090; }
.dd-menu { z-index: 1100; }

/* The "How it works" replay button (top bar). */
.howitworks-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--surface); border: 1px solid var(--line);
  color: var(--muted); padding: 6px 11px; border-radius: 8px;
  font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.howitworks-btn:hover { color: var(--ink); border-color: var(--line-2); background: var(--surface-2); }
````

## 3. Wiring it into your editor component

The parent holds the current step index and detects when the user performs each step.
Below are the exact snippets (from a React Flow canvas). Adapt the advancement
conditions to your own state (`nodes`, `selectedId`, an "is generating" flag, etc.).

### Import + state
````jsx
import CanvasTutorial, { TUT_STEPS, TUTORIAL_DONE_KEY } from "./CanvasTutorial";

// inside the component:
const [tutStep, setTutStep] = useState(null); // null = tour closed
````

### Auto-launch once + advancement effects + close helper

`loaded` = your "editor is ready" flag. `nodes`, `selectedId`, `runningId`,
`assistantOpen` are this canvas's state — swap for your equivalents. The step indices
match the 14-step tour in `TUT_STEPS` (image → branch-to-video → assistant → finish).
````jsx
  useEffect(() => {
    if (!loaded) return;
    try {
      if (!localStorage.getItem(TUTORIAL_DONE_KEY)) {
        setTutStep(0);
        localStorage.setItem(TUTORIAL_DONE_KEY, "1");
      }
    } catch {}
  }, [loaded]);

  const closeTutorial = useCallback(() => {
    setTutStep(null);
    try { localStorage.setItem(TUTORIAL_DONE_KEY, "1"); } catch {}
  }, []);

  // Hands-on advancement: auto-advance when the user actually does the step.
  // Step 1 (add a node) → advance once a node exists.
  useEffect(() => {
    if (tutStep === 1 && nodes.length >= 1) setTutStep(2);
  }, [tutStep, nodes.length]);
  // Step 4 (generate image) → advance once a run starts.
  // Step 8 (generate video) → same.
  useEffect(() => {
    if (tutStep === 4 && runningId) setTutStep(5);
    if (tutStep === 8 && runningId) setTutStep(9);
  }, [tutStep, runningId]);
  // Step 5 (branch into a video node) → advance once a video node exists.
  useEffect(() => {
    if (tutStep === 5 && nodes.some((n) => n.data?.kind === "video")) setTutStep(6);
  }, [tutStep, nodes]);
  // Step 9 (meet the Assistant) → advance once the panel opens.
  useEffect(() => {
    if (tutStep === 9 && assistantOpen) setTutStep(10);
  }, [tutStep, assistantOpen]);
  // Keep the right node selected so the prompt bar is mounted for its spotlight:
  // image steps (2–4) → any node; video steps (6–8) → the branched video node.
  useEffect(() => {
    if ([2, 3, 4].includes(tutStep) && !selectedId && nodes.length > 0) {
      setSelectedId(nodes[nodes.length - 1].id);
    }
    if ([6, 7, 8].includes(tutStep)) {
      const sel = nodes.find((n) => n.id === selectedId);
      if (!sel || sel.data?.kind !== "video") {
        const vid = [...nodes].reverse().find((n) => n.data?.kind === "video");
        if (vid && vid.id !== selectedId) setSelectedId(vid.id);
      }
    }
  }, [tutStep, selectedId, nodes]);
````

### Next-button gating + custom Next handler

`tutNextEnabled` disables **Next** until the step's action is done (a prompt is typed).
`tutNext` auto-creates the video node if the user clicks Next past the "branch" step.
`selectedNode` / `addNode` are your canvas's helpers.
````jsx
  // Write-prompt steps (2 = image, 6 = video) advance via Next, enabled only
  // once a prompt is typed on the selected node.
  const tutNextEnabled = (tutStep === 2 || tutStep === 6) ? !!(selectedNode?.data?.prompt || "").trim() : true;

  const tutNext = () => {
    // Leaving the "branch into a video node" step without one → create it for
    // them, connected to the image, so the video sub-steps have a node to use.
    if (tutStep === 5 && !nodes.some((n) => n.data?.kind === "video")) {
      const img = nodes.find((n) => n.data?.kind === "image") || nodes[nodes.length - 1];
      if (img) addNode("video", { aspect: "16:9 · 720p", connectFrom: img.id });
    }
    setTutStep((s) => (s >= TUT_STEPS.length - 1 ? (closeTutorial(), null) : s + 1));
  };
````

### Mark the spotlight targets + "How it works" button + render

Put `data-tut="add"` on your add button (and matching classes on the prompt bar, model
chips, generate button, etc. — see `TUT_STEPS` targets). Add the replay button to your
top bar, and render `<CanvasTutorial/>` once near the root of the editor.
````jsx
// add-node button (left toolbar):
<button title="Add node" data-tut="add" onClick={() => setAddMenuOpen((v) => !v)}>+</button>

// "How it works" replay button (top bar):
<button className="howitworks-btn" onClick={() => setTutStep(0)} title="Replay the tutorial">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
  </svg>
  How it works
</button>

// render once near the root of your editor JSX:
<CanvasTutorial
  step={tutStep}
  total={TUT_STEPS.length}
  nextEnabled={tutNextEnabled}
  onNext={tutNext}
  onBack={() => setTutStep((s) => Math.max(0, (s ?? 0) - 1))}
  onSkip={closeTutorial}
/>
````

## 4. Adapting the tour to your UI — checklist
1. Define the CSS variables (or swap for literals) and add the CSS incl. the z-index raises.
2. In `TUT_STEPS`, set each `target` to a selector that exists in your UI and rewrite the copy.
3. Wire the advancement `useEffect`s to your own state (node list, selection, is-generating).
4. Put `data-tut="add"` on your add button; add the "How it works" button; render `<CanvasTutorial/>` once.

**Placement values** (`step.placement`): `right`, `bl` (lower-left, above a bottom bar),
`tl` (top-left), `top`, `left-of` (left of a separate `tipTarget`), or default (below).

## Dependencies
- **React 18/19 + Next.js App Router** (`"use client"`).
- **No other libraries** — icons are inline SVG; the overlay is a plain SVG mask.
