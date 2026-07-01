# Interactive Tutorial + Onboarding Flow — Portable Code

Everything needed to drop the **hands-on canvas tutorial** (spotlight tour) and the
**6-step onboarding wizard** into another React / Next.js app. Copy each file to the
path shown, add the CSS, and wire the small integration snippets.

**Stack assumptions:** React 18/19, Next.js App Router (`"use client"` components),
`next/navigation` for routing. The tutorial targets a node-canvas editor (React Flow),
but the mechanism is generic — you just point its CSS selectors at your own UI.

---

# PART A — Interactive Canvas Tutorial

A guided tour that **dims the screen, cuts a bright "spotlight" hole around a real UI
element, and advances when the user actually performs the step** (adds a node, types a
prompt, hits generate). Welcome/Finish are centered modals. Auto-launches once per user
(localStorage flag); a "How it works" button replays it.

## A1. The component — `components/CanvasTutorial.js`

Self-contained. `TUT_STEPS` defines the tour; edit the `target` selectors + copy to fit
your UI. Each step is a `modal` (centered card) or a `spotlight` (dim + hole + tip card).

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

## A2. The CSS — add to your global stylesheet

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

## A3. Wiring it into your editor component

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

### Adapting the tour to your UI — checklist
1. Define the CSS variables (or swap for literals) and add the CSS incl. the z-index raises.
2. In `TUT_STEPS`, set each `target` to a selector that exists in your UI and rewrite the copy.
3. Wire the advancement `useEffect`s to your own state (node list, selection, is-generating).
4. Put `data-tut="add"` on your add button; add the "How it works" button; render `<CanvasTutorial/>` once.

**Placement values** (`step.placement`): `right`, `bl` (lower-left, above a bottom bar),
`tl` (top-left), `top`, `left-of` (left of a separate `tipTarget`), or default (below).

---

# PART B — Onboarding Flow (6-step wizard)

A full-screen, dark, gradient onboarding wizard: progress bar, per-step cards
(goal/experience, starting point, workspace name + style, output platforms/types),
and a summary that reflects every choice. Cosmetic by default (saves answers to
localStorage); the final step can create the user's first workspace.

## B1. The page — `app/onboarding/page.js`

A standalone route. Uses outline SVG icons (no emoji) and CSS-module styling.
````jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkflow, listWorkflows } from "@/lib/store";
import s from "./onboarding.module.css";

const TOTAL_STEPS = 6;

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const Back = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);
const Check = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);
const PlayLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

// Outline icon set (Lucide-style) replacing emoji — colored via CSS (var(--icon), Genmax's blue/violet accent).
const ico = (children) => (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoSparkles = ico(<path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3zM19 13.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2zM5 14.5l.7 1.7L7.5 17l-1.8.8L5 19.5l-.7-1.7L2.5 17l1.8-.8.7-1.7z" />);
const IcoFilm = ico(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 10h4M17 10h4M3 15h4M17 15h4" /></>);
const IcoMegaphone = ico(<><path d="M3 11v2a2 2 0 0 0 2 2h1l2 6h2l-1-6h4l7 4V5l-7 4H6a2 2 0 0 0-2 2z" /></>);
const IcoPalette = ico(<><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="13" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="11" r="1" fill="currentColor" /><circle cx="10.5" cy="14" r="1" fill="currentColor" /><path d="M12 21a2 2 0 0 1-2-2c0-1 .8-1.3.8-2.2 0-.8-.8-1.3-1.8-1.3H9" /></>);
const IcoZap = ico(<path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />);
const IcoSmartphone = ico(<><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18.5h2" /></>);
const IcoBag = ico(<><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>);
const IcoBook = ico(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" /></>);
const IcoCap = ico(<><path d="M12 3l10 5-10 5-10-5 10-5z" /><path d="M6 10.5V16c0 1.2 2.7 3 6 3s6-1.8 6-3v-5.5" /></>);
const IcoHeadphones = ico(<><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="2.5" y="14" width="4" height="6" rx="1.3" /><rect x="17.5" y="14" width="4" height="6" rx="1.3" /></>);
const IcoCamera = ico(<><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="14" r="3.5" /></>);
const IcoPlay = ico(<><circle cx="12" cy="12" r="9" /><path d="M10 8.5l6 3.5-6 3.5v-7z" fill="currentColor" stroke="none" /></>);
const IcoMusic = ico(<><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>);
const IcoX = ico(<path d="M5 5l14 14M19 5L5 19" />);
const IcoImage = ico(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.5-5.5L4 21" /></>);
const IcoMic = ico(<><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4M9 22h6" /></>);
const IcoPen = ico(<><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" /><path d="M14 6l3 3" /></>);
const IcoPuzzle = ico(<path d="M9 3h4v2.5a1.5 1.5 0 0 0 3 0V3h3a2 2 0 0 1 2 2v3h-2.5a1.5 1.5 0 0 0 0 3H21v3a2 2 0 0 1-2 2h-3v-2.5a1.5 1.5 0 0 0-3 0V18H9a2 2 0 0 1-2-2v-3h2.5a1.5 1.5 0 0 0 0-3H7V7a2 2 0 0 1 2-2z" />);

const GOALS = [
  { key: "social", icon: IcoFilm, h: "Social Media Content", p: "Create videos & posts for Instagram, TikTok, YouTube" },
  { key: "marketing", icon: IcoMegaphone, h: "Marketing & Ads", p: "Generate campaign creative and product content" },
  { key: "personal", icon: IcoPalette, h: "Personal Projects", p: "Explore ideas and bring stories to life" },
  { key: "learn", icon: IcoZap, h: "Learn AI Tools", p: "Explore what's possible with generative AI" },
];
const EXPERIENCE = [
  "I'm new to AI content creation",
  "I've used AI tools before",
  "I'm experienced with AI creative tools",
];
const USE_CASES = [
  { key: "social", icon: IcoSmartphone, h: "Social Media" },
  { key: "ads", icon: IcoBag, h: "Product & Ads" },
  { key: "story", icon: IcoBook, h: "Storytelling" },
  { key: "edu", icon: IcoCap, h: "Education" },
  { key: "music", icon: IcoHeadphones, h: "Music & Audio" },
  { key: "other", icon: IcoSparkles, h: "Something Else" },
];
const STYLES = [
  { key: "realistic", h: "Realistic", p: "Photorealistic AI renders" },
  { key: "stylized", h: "Stylized", p: "Bold, illustrated look" },
  { key: "cinematic", h: "Cinematic", p: "Film-grade lighting & motion" },
  { key: "anime", h: "Anime-Inspired", p: "Japanese animation style" },
];
const PLATFORMS = [
  { key: "instagram", icon: IcoCamera, h: "Instagram" },
  { key: "youtube", icon: IcoPlay, h: "YouTube" },
  { key: "tiktok", icon: IcoMusic, h: "TikTok" },
  { key: "twitter", icon: IcoX, h: "Twitter / X" },
];
const CONTENT_TYPES = [
  { key: "images", icon: IcoImage, h: "Images" },
  { key: "videos", icon: IcoFilm, h: "Videos" },
  { key: "voiceovers", icon: IcoMic, h: "Voiceovers" },
  { key: "scripts", icon: IcoPen, h: "Scripts" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState({
    goal: null,
    experience: null,
    method: null,
    workspaceName: "",
    useCase: null,
    style: "realistic",
    platforms: [],
    contentTypes: [],
  });

  const toggle = (field, key, multi) => {
    setAns((a) => {
      if (!multi) return { ...a, [field]: a[field] === key ? a[field] : key };
      const list = a[field].includes(key) ? a[field].filter((k) => k !== key) : [...a[field], key];
      return { ...a, [field]: list };
    });
  };

  const canContinue = [
    true, // hero
    !!ans.goal,
    !!ans.method,
    ans.workspaceName.trim().length > 0 && !!ans.useCase,
    ans.platforms.length > 0 && ans.contentTypes.length > 0,
    true, // summary
  ][step];

  const next = () => {
    if (step === TOTAL_STEPS - 1) {
      try {
        localStorage.setItem("gmx:onboarding", JSON.stringify({ ...ans, completedAt: Date.now() }));
        // Create the user's first workflow named after their workspace, so it's
        // waiting for them on the dashboard. Dedupe by name in case of re-runs.
        const name = ans.workspaceName.trim() || "My Workspace";
        if (!listWorkflows().some((w) => w.name === name)) createWorkflow(name);
      } catch {}
      router.push("/app");
      return;
    }
    setStep((v) => Math.min(v + 1, TOTAL_STEPS - 1));
  };
  const prev = () => setStep((v) => Math.max(v - 1, 0));

  const label = (key, list) => list.find((o) => o.key === key)?.h;

  return (
    <div className={s.page}>
      {/* TOP: brand + progress */}
      <div className={s.top}>
        <div className={s.brand}>
          <span className={s.logoIcon}><PlayLogo /></span>
          <b>Genmax</b> <span className={s.brandFull}>Studio</span>
        </div>
        <div className={s.progress}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`${s.seg} ${i < step ? s.segDone : ""}`}>
              <div className={s.segFill} style={{ width: i < step ? "100%" : i === step ? "40%" : "0%" }} />
            </div>
          ))}
        </div>
        <div className={s.stepCount}>{step + 1}/{TOTAL_STEPS}</div>
      </div>

      {/* BODY */}
      <div className={s.body}>
        <div className={s.inner}>

          {/* STEP 1 — hero */}
          {step === 0 && (
            <div className={s.center}>
              <span className={s.badge}><IcoSparkles width={15} height={15} /> 5-minute setup</span>
              <h1 className={s.h1}>Create Your <span className={s.grad}>AI Workflow</span></h1>
              <p className={s.lead}>Join thousands of creators building on Genmax. We'll guide you through every step — it only takes a few minutes.</p>
              <div className={s.stats}>
                <div className={s.stat}><div className={s.statNum}>5 min</div><div className={s.statLabel}>Setup time</div></div>
                <div className={s.stat}><div className={s.statNum}>10+</div><div className={s.statLabel}>AI models</div></div>
                <div className={s.stat}><div className={s.statNum}>100K+</div><div className={s.statLabel}>Creators</div></div>
              </div>
            </div>
          )}

          {/* STEP 2 — goal + experience */}
          {step === 1 && (
            <>
              <div className={s.center}>
                <h2 className={s.h2}>What's your goal?</h2>
                <p className={s.stepSub}>Choose your path to get started</p>
              </div>
              <div className={s.label}>I want to:</div>
              <div className={s.grid2}>
                {GOALS.map((g) => (
                  <button key={g.key} type="button" className={`${s.tile} ${ans.goal === g.key ? s.tileSel : ""}`} onClick={() => toggle("goal", g.key, false)}>
                    {ans.goal === g.key && <span className={s.tileCheck}><Check /></span>}
                    <span className={s.tileIcon}><g.icon /></span>
                    <div className={s.tileH}>{g.h}</div>
                    <div className={s.tileP}>{g.p}</div>
                  </button>
                ))}
              </div>
              <div className={s.label}>My experience level:</div>
              {EXPERIENCE.map((e) => (
                <div key={e} className={`${s.radioRow} ${ans.experience === e ? s.radioSel : ""}`} onClick={() => toggle("experience", e, false)}>
                  <span className={s.radioDot} />
                  <span className={s.radioLabel}>{e}</span>
                </div>
              ))}
            </>
          )}

          {/* STEP 3 — starting point */}
          {step === 2 && (
            <>
              <div className={s.center}>
                <h2 className={s.h2}>Choose your starting point</h2>
                <p className={s.stepSub}>Pick how you want to begin</p>
              </div>
              <div style={{ marginTop: 34 }}>
                {[
                  { key: "template", icon: IcoSparkles, h: "Template Workflow", p: "Start from a ready-made workflow for common tasks", list: ["Instant results, no setup", "Proven node combinations", "Customize as you go"] },
                  { key: "blank", icon: IcoPuzzle, h: "Blank Canvas", p: "Start from scratch and build your own workflow", list: ["Full creative control", "Connect any node type", "Build exactly what you need"] },
                ].map((m) => (
                  <button key={m.key} type="button" className={`${s.methodCard} ${ans.method === m.key ? s.methodSel : ""}`} onClick={() => toggle("method", m.key, false)}>
                    <span className={s.methodIcon}><m.icon /></span>
                    <div>
                      <div className={s.methodH}>{m.h}</div>
                      <div className={s.methodP}>{m.p}</div>
                      <ul className={s.methodList}>
                        {m.list.map((li) => <li key={li}><Check />{li}</li>)}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 4 — workspace setup */}
          {step === 3 && (
            <>
              <div className={s.center}>
                <h2 className={s.h2}>Set up your workspace</h2>
                <p className={s.stepSub}>Give your workspace a name and a look</p>
              </div>
              <div className={s.label} style={{ marginTop: 34 }}>Workspace name</div>
              <div className={s.field}>
                <input
                  className={s.input}
                  placeholder="My Workspace"
                  value={ans.workspaceName}
                  onChange={(e) => setAns((a) => ({ ...a, workspaceName: e.target.value }))}
                  maxLength={40}
                />
              </div>
              <div className={s.label}>Primary use case</div>
              <div className={s.grid2} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {USE_CASES.map((u) => (
                  <button key={u.key} type="button" className={`${s.tile} ${ans.useCase === u.key ? s.tileSel : ""}`} onClick={() => toggle("useCase", u.key, false)}>
                    {ans.useCase === u.key && <span className={s.tileCheck}><Check /></span>}
                    <span className={s.tileIcon}><u.icon /></span>
                    <div className={s.tileH}>{u.h}</div>
                  </button>
                ))}
              </div>
              <div className={s.label}>Visual style</div>
              <div className={s.grid2}>
                {STYLES.map((st) => (
                  <button key={st.key} type="button" className={`${s.tile} ${ans.style === st.key ? s.tileSel : ""}`} onClick={() => toggle("style", st.key, false)}>
                    {ans.style === st.key && <span className={s.tileCheck}><Check /></span>}
                    <div className={s.tileH}>{st.h}</div>
                    <div className={s.tileP}>{st.p}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 5 — output */}
          {step === 4 && (
            <>
              <div className={s.center}>
                <h2 className={s.h2}>Choose your output</h2>
                <p className={s.stepSub}>Tell us where your content is headed</p>
              </div>
              <div className={s.label} style={{ marginTop: 34 }}>Select platforms</div>
              <div className={s.grid4}>
                {PLATFORMS.map((p) => (
                  <button key={p.key} type="button" className={`${s.tile} ${ans.platforms.includes(p.key) ? s.tileSel : ""}`} onClick={() => toggle("platforms", p.key, true)}>
                    {ans.platforms.includes(p.key) && <span className={s.tileCheck}><Check /></span>}
                    <span className={s.tileIcon}><p.icon /></span>
                    <div className={s.tileH}>{p.h}</div>
                  </button>
                ))}
              </div>
              <div className={s.label}>Content types</div>
              <div className={s.grid4}>
                {CONTENT_TYPES.map((c) => (
                  <button key={c.key} type="button" className={`${s.tile} ${ans.contentTypes.includes(c.key) ? s.tileSel : ""}`} onClick={() => toggle("contentTypes", c.key, true)}>
                    {ans.contentTypes.includes(c.key) && <span className={s.tileCheck}><Check /></span>}
                    <span className={s.tileIcon}><c.icon /></span>
                    <div className={s.tileH}>{c.h}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 6 — summary */}
          {step === 5 && (
            <>
              <div className={s.center}>
                <h2 className={s.h2}>{ans.workspaceName.trim() || "Your workspace"} is ready to launch</h2>
                <p className={s.stepSub}>Your Genmax workspace is configured and ready to start creating.</p>
              </div>
              <div className={s.summaryGrid}>
                <div className={s.summaryArt}>
                  <div className={s.summaryArtIcon}><IcoSparkles width={28} height={28} /></div>
                  <div className={s.summaryArtText}>{label(ans.method, [{ key: "blank", h: "Blank canvas" }, { key: "template", h: "Template workflow" }]) || "Canvas"} ready to open</div>
                </div>
                <div className={s.summaryList}>
                  <div className={s.summaryItem}>
                    <span className={s.summaryCheck}><Check /></span>
                    <div>
                      <div className={s.summaryH}>{ans.workspaceName.trim() || "Workspace"}</div>
                      <div className={s.summaryP}>{label(ans.useCase, USE_CASES) || "General use"} · {label(ans.style, STYLES) || "Realistic"}</div>
                    </div>
                  </div>
                  <div className={s.summaryItem}>
                    <span className={s.summaryCheck}><Check /></span>
                    <div>
                      <div className={s.summaryH}>Starting point ready</div>
                      <div className={s.summaryP}>{label(ans.method, [{ key: "blank", h: "Blank canvas" }, { key: "template", h: "Template workflow" }]) || "Not set"}</div>
                    </div>
                  </div>
                  <div className={s.summaryItem}>
                    <span className={s.summaryCheck}><Check /></span>
                    <div>
                      <div className={s.summaryH}>Output configured</div>
                      <div className={s.summaryP}>{ans.contentTypes.length ? ans.contentTypes.map((k) => label(k, CONTENT_TYPES)).join(", ") : "Not set"}</div>
                    </div>
                  </div>
                  <div className={s.summaryItem}>
                    <span className={s.summaryCheck}><Check /></span>
                    <div>
                      <div className={s.summaryH}>Ready to publish</div>
                      <div className={s.summaryP}>{ans.platforms.length ? ans.platforms.map((k) => label(k, PLATFORMS)).join(", ") : "Not set"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className={s.bottom}>
        {step > 0 ? (
          <button type="button" className={`${s.btn} ${s.btnBack}`} onClick={prev}><Back /> Back</button>
        ) : <span />}
        {step === 0 ? (
          <button type="button" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`} onClick={next}>Start Creating <Arrow /></button>
        ) : step === TOTAL_STEPS - 1 ? (
          <button type="button" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`} onClick={next}>Enter Your Studio <Arrow /></button>
        ) : (
          <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={next} disabled={!canContinue}>Continue <Arrow /></button>
        )}
      </div>
    </div>
  );
}
````

## B2. The styles — `app/onboarding/onboarding.module.css`
````css
/* Genmax onboarding — light theme, matches the main site (white cards, #2563eb blue, purple/pink accent). */

.page {
  --blue: #2563eb;
  --blue-dark: #1d4ed8;
  --violet: #7c3aed;
  --grad: linear-gradient(90deg, var(--blue), var(--violet));
  --bg: #f3f6fb;
  --panel: #fff;
  --panel-2: #fff;
  --line: #e7eaef;
  --ink: #0b1220;
  --muted: #5b6472;
  --icon: #2563eb;
  height: 100vh;            /* fixed shell so the body scrolls internally (globals locks body overflow) */
  overflow: hidden;
  background:
    radial-gradient(1000px 460px at 50% -140px, #dbe7ff 0%, rgba(219,231,255,0) 70%),
    var(--bg);
  color: var(--ink);
  font-family: "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
}
.page * { box-sizing: border-box; }

/* ---------- top bar ---------- */
.top {
  flex: 0 0 auto;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 22px;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(14px) saturate(160%);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 9px; font-size: 17px; justify-self: start; }
.brand b { font-weight: 800; }
.logoIcon {
  width: 28px; height: 28px; border-radius: 8px;
  display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}
.progress { display: flex; gap: 6px; width: min(600px, 48vw); justify-self: center; }
.seg { flex: 1; height: 5px; border-radius: 999px; background: #e2e8f5; overflow: hidden; }
.segFill { height: 100%; width: 0%; background: var(--grad); border-radius: 999px; transition: width .35s ease; }
.segDone .segFill { width: 100%; }
.stepCount { justify-self: end; font-size: 13px; color: var(--muted); font-weight: 600; font-variant-numeric: tabular-nums; }

/* ---------- body ---------- */
.body {
  flex: 1 1 auto; min-height: 0; overflow-y: scroll; padding: 48px 24px 40px;
  scrollbar-width: thin; scrollbar-color: #b9c2d6 transparent;
}
.body::-webkit-scrollbar { width: 12px; }
.body::-webkit-scrollbar-track { background: transparent; }
.body::-webkit-scrollbar-thumb {
  background: #b9c2d6; border-radius: 999px;
  border: 3px solid transparent; background-clip: padding-box;
}
.body::-webkit-scrollbar-thumb:hover { background: #98a3bd; background-clip: padding-box; }
.inner { max-width: 900px; margin: 0 auto; }
.center { text-align: center; }

.badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 999px;
  font-size: 14px; font-weight: 600;
  background: linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #7c3aed, #ec4899) border-box;
  border: 1.5px solid transparent;
  color: #6d28d9;
}
.h1 {
  font-size: clamp(38px, 5vw, 58px); font-weight: 800; letter-spacing: -0.03em;
  line-height: 1.05; margin: 22px 0 0;
}
.h1 .grad { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.h2 { font-size: clamp(26px, 3vw, 34px); font-weight: 800; letter-spacing: -0.02em; margin: 0; }
.lead { color: var(--muted); font-size: 16.5px; line-height: 1.55; max-width: 560px; margin: 16px auto 0; }
.stepSub { color: var(--muted); font-size: 15px; margin: 8px 0 0; }

/* hero stats */
.stats { display: flex; gap: 16px; justify-content: center; margin-top: 40px; flex-wrap: wrap; }
.stat {
  background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
  padding: 22px 34px; min-width: 150px;
  box-shadow: 0 4px 18px rgba(16, 24, 40, 0.04);
}
.statNum { font-size: 30px; font-weight: 800; }
.statLabel { color: var(--muted); font-size: 13.5px; margin-top: 4px; }
.heroCta { margin-top: 38px; display: flex; justify-content: center; }

/* section label */
.label { font-size: 14px; font-weight: 700; color: var(--muted); margin: 34px 0 14px; }
.label:first-child { margin-top: 0; }

/* option grid (goal cards, niche cards, platform/content cards) */
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.tile {
  position: relative; text-align: left; cursor: pointer;
  background: var(--panel); border: 1px solid var(--line); border-radius: 14px;
  padding: 20px; color: var(--ink); font: inherit;
  box-shadow: 0 2px 10px rgba(16, 24, 40, 0.03);
  transition: border-color .15s ease, background .15s ease, transform .1s ease, box-shadow .15s ease;
}
.tile:hover { border-color: #c7d2e6; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06); }
.tileSel {
  border-color: var(--blue);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(124, 58, 237, 0.04));
}
.tileIcon { display: flex; margin-bottom: 12px; color: var(--icon); }
.tileH { font-size: 15.5px; font-weight: 700; }
.tileP { color: var(--muted); font-size: 13.5px; margin-top: 5px; line-height: 1.4; }
.tileCheck {
  position: absolute; top: 12px; right: 12px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--grad); color: #fff;
  display: grid; place-items: center; font-size: 12px;
}

/* method / bigger feature cards (step 3) */
.methodCard {
  display: flex; gap: 16px; text-align: left; cursor: pointer;
  background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
  padding: 26px; margin-bottom: 14px; color: var(--ink); font: inherit; width: 100%;
  box-shadow: 0 2px 10px rgba(16, 24, 40, 0.03);
}
.methodCard:hover { border-color: #c7d2e6; }
.methodSel { border-color: var(--blue); background: linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(124, 58, 237, 0.04)); }
.methodIcon {
  flex: 0 0 auto; width: 44px; height: 44px; border-radius: 12px;
  background: #eef2ff; display: grid; place-items: center; color: var(--icon);
}
.methodH { font-size: 17px; font-weight: 700; }
.methodP { color: var(--muted); font-size: 14px; margin-top: 4px; }
.methodList { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 7px; }
.methodList li { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #3b4452; }
.methodList svg { flex: 0 0 auto; color: var(--blue); }

/* text input */
.field { margin-bottom: 8px; }
.fieldLabel { font-size: 14px; font-weight: 700; color: var(--muted); margin-bottom: 10px; display: block; }
.input {
  width: 100%; background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
  padding: 14px 16px; color: var(--ink); font-size: 15px; font-family: inherit;
}
.input:focus { outline: none; border-color: var(--blue); }
.input::placeholder { color: #9aa3b5; }

/* radio rows (experience level) */
.radioRow {
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
  padding: 16px 18px; margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(16, 24, 40, 0.03);
}
.radioRow:hover { border-color: #c7d2e6; }
.radioSel { border-color: var(--blue); background: linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(124, 58, 237, 0.03)); }
.radioDot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #c7cedd; flex: 0 0 auto; position: relative; }
.radioSel .radioDot { border-color: var(--blue); }
.radioSel .radioDot::after {
  content: ""; position: absolute; inset: 3px; border-radius: 50%; background: var(--grad);
}
.radioLabel { font-size: 14.5px; font-weight: 500; }

/* summary (step 6) */
.summaryGrid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 18px; margin-top: 36px; text-align: left; }
.summaryArt {
  background: var(--panel); border: 1px solid var(--line); border-radius: 18px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  min-height: 220px; padding: 24px;
  box-shadow: 0 4px 18px rgba(16, 24, 40, 0.04);
}
.summaryArtIcon {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(124, 58, 237, 0.1));
  display: grid; place-items: center; color: var(--icon);
}
.summaryArtText { color: var(--muted); font-size: 14.5px; text-align: center; }
.summaryList { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 8px 22px; box-shadow: 0 4px 18px rgba(16, 24, 40, 0.04); }
.summaryItem { display: flex; gap: 14px; align-items: flex-start; padding: 18px 0; border-bottom: 1px solid var(--line); }
.summaryItem:last-child { border-bottom: none; }
.summaryCheck {
  flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; margin-top: 1px;
  background: var(--grad); color: #fff; display: grid; place-items: center; font-size: 14px;
}
.summaryH { font-size: 16px; font-weight: 700; }
.summaryP { color: var(--muted); font-size: 13.5px; margin-top: 2px; }

/* ---------- bottom nav ---------- */
.bottom {
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 28px; border-top: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px);
}
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: 15px; border: none; cursor: pointer; text-decoration: none;
  padding: 12px 22px; border-radius: 12px; font-family: inherit;
  transition: transform .12s ease, opacity .12s ease, background .12s ease;
}
.btnBack { background: #fff; border: 1px solid var(--line); color: var(--ink); }
.btnBack:hover { border-color: #c7d2e6; background: #f8fafc; }
.btnPrimary { background: var(--blue); color: #fff; }
.btnPrimary:hover:not(:disabled) { background: var(--blue-dark); transform: translateY(-1px); }
.btnPrimary:disabled { opacity: 0.4; cursor: not-allowed; }
.btnLg { padding: 15px 30px; font-size: 16.5px; border-radius: 14px; }

@media (max-width: 720px) {
  .grid2, .grid4 { grid-template-columns: 1fr 1fr; }
  .summaryGrid { grid-template-columns: 1fr; }
  .stats { gap: 10px; }
  .stat { padding: 16px 20px; min-width: 120px; }
  .top { gap: 12px; padding: 14px 16px; }
  .brand span.brandFull { display: none; }
}
@media (max-width: 480px) {
  .grid4 { grid-template-columns: 1fr 1fr; }
}
````

## B3. Wiring the onboarding flow

### Trigger it after sign-up (Clerk example, `app/layout.js`)
Point new sign-ups at `/onboarding` instead of straight to the app:
````jsx
<ClerkProvider
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  signInFallbackRedirectUrl="/app"
  signUpFallbackRedirectUrl="/onboarding"   // ← new users land here first
>
  {children}
</ClerkProvider>
````

### Gate the route (Clerk middleware, `middleware.js`)
Protect `/onboarding` like the rest of the app so only signed-in users hit it:
````jsx
const isProtected = createRouteMatcher(["/app(.*)", "/w(.*)", "/onboarding(.*)"]);
````

### What the final step does
On "Enter Your Studio", the page (see B1) saves the answers to `localStorage`
(`gmx:onboarding`) so the wizard never re-shows, and creates the user's first workflow
named after their workspace, then routes to `/app`:
````jsx
import { createWorkflow, listWorkflows } from "@/lib/store";

// in the final "next()":
localStorage.setItem("gmx:onboarding", JSON.stringify({ ...ans, completedAt: Date.now() }));
const name = ans.workspaceName.trim() || "My Workspace";
if (!listWorkflows().some((w) => w.name === name)) createWorkflow(name); // dedupe by name
router.push("/app");
````

`createWorkflow(name)` is a tiny localStorage helper — swap for your own "create a
project/workspace" call. If you only want the cosmetic flow, drop the createWorkflow
line and just `router.push()` wherever the app lives.

---

## Dependencies
- **React 18/19 + Next.js App Router.** Both features are `"use client"` components.
- **Routing:** `useRouter` from `next/navigation` (onboarding). Replace with your router.
- **Auth (optional):** the onboarding trigger + route-gate examples use Clerk, but the
  wizard itself is auth-agnostic — trigger it however you like.
- **No other libraries.** Icons are inline SVG; styling is plain CSS / CSS Modules.
