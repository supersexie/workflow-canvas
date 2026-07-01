#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=TUTORIAL-AND-ONBOARDING.md

fence() { printf '````%s\n' "$1"; }   # 4-backtick fence so inner ``` can't break it
endf() { printf '````\n'; }

{
cat <<'MD'
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

MD
fence jsx
cat components/CanvasTutorial.js
endf

cat <<'MD'

## A2. The CSS — add to your global stylesheet

Uses CSS variables (`--surface`, `--line-2`, `--ink`, `--text`, `--muted`, `--muted-2`,
`--blue`, `--blue-dark`, `--shadow`) — define them or replace with literals. The
**z-index raises** are important: any popup opened *during* a spotlight step (an add-menu,
a dropdown) must render above the `z-index:1000` overlay or it looks buried. Rename those
selectors (`.add-menu`, `.dd-menu`, `.type-picker`) to match your app.

MD
fence css
sed -n '755,831p' app/globals.css
endf

cat <<'MD'

## A3. Wiring it into your editor component

The parent holds the current step index and detects when the user performs each step.
Below are the exact snippets (from a React Flow canvas). Adapt the advancement
conditions to your own state (`nodes`, `selectedId`, an "is generating" flag, etc.).

### Import + state
MD
fence jsx
cat <<'CODE'
import CanvasTutorial, { TUT_STEPS, TUTORIAL_DONE_KEY } from "./CanvasTutorial";

// inside the component:
const [tutStep, setTutStep] = useState(null); // null = tour closed
CODE
endf

cat <<'MD'

### Auto-launch once + advancement effects + close helper

`loaded` = your "editor is ready" flag. `nodes`, `selectedId`, `runningId`,
`assistantOpen` are this canvas's state — swap for your equivalents. The step indices
match the 14-step tour in `TUT_STEPS` (image → branch-to-video → assistant → finish).
MD
fence jsx
sed -n '136,183p' components/Canvas.js
endf

cat <<'MD'

### Next-button gating + custom Next handler

`tutNextEnabled` disables **Next** until the step's action is done (a prompt is typed).
`tutNext` auto-creates the video node if the user clicks Next past the "branch" step.
`selectedNode` / `addNode` are your canvas's helpers.
MD
fence jsx
sed -n '591,603p' components/Canvas.js
endf

cat <<'MD'

### Mark the spotlight targets + "How it works" button + render

Put `data-tut="add"` on your add button (and matching classes on the prompt bar, model
chips, generate button, etc. — see `TUT_STEPS` targets). Add the replay button to your
top bar, and render `<CanvasTutorial/>` once near the root of the editor.
MD
fence jsx
cat <<'CODE'
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
CODE
endf

cat <<'MD'

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
MD
fence jsx
cat app/onboarding/page.js
endf

cat <<'MD'

## B2. The styles — `app/onboarding/onboarding.module.css`
MD
fence css
cat app/onboarding/onboarding.module.css
endf

cat <<'MD'

## B3. Wiring the onboarding flow

### Trigger it after sign-up (Clerk example, `app/layout.js`)
Point new sign-ups at `/onboarding` instead of straight to the app:
MD
fence jsx
cat <<'CODE'
<ClerkProvider
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  signInFallbackRedirectUrl="/app"
  signUpFallbackRedirectUrl="/onboarding"   // ← new users land here first
>
  {children}
</ClerkProvider>
CODE
endf

cat <<'MD'

### Gate the route (Clerk middleware, `middleware.js`)
Protect `/onboarding` like the rest of the app so only signed-in users hit it:
MD
fence jsx
cat <<'CODE'
const isProtected = createRouteMatcher(["/app(.*)", "/w(.*)", "/onboarding(.*)"]);
CODE
endf

cat <<'MD'

### What the final step does
On "Enter Your Studio", the page (see B1) saves the answers to `localStorage`
(`gmx:onboarding`) so the wizard never re-shows, and creates the user's first workflow
named after their workspace, then routes to `/app`:
MD
fence jsx
cat <<'CODE'
import { createWorkflow, listWorkflows } from "@/lib/store";

// in the final "next()":
localStorage.setItem("gmx:onboarding", JSON.stringify({ ...ans, completedAt: Date.now() }));
const name = ans.workspaceName.trim() || "My Workspace";
if (!listWorkflows().some((w) => w.name === name)) createWorkflow(name); // dedupe by name
router.push("/app");
CODE
endf

cat <<'MD'

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
MD
} > "$OUT"

echo "Wrote $OUT ($(wc -l < "$OUT") lines)"
