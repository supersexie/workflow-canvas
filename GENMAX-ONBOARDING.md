# Genmax Onboarding Flow (YouTube Kids) — Complete Code

A **6-step onboarding wizard** for a YouTube-Kids creator: dark violet/blue theme, a
progress bar, per-step cards (goal/experience → starting point → channel setup → output →
summary), full validation, and a summary that reflects every choice. On finish it creates
the user's first workflow (named after their channel) and routes into the app.

- **Stack:** **React 18/19 + Next.js App Router** (`"use client"`). `useRouter` from
  `next/navigation`. Two files (a page + a CSS module) + one logo image.
- **Route:** drop these at `app/onboarding/page.js` and `app/onboarding/onboarding.module.css`.
- **Logo:** place the app icon at `public/genmax-icon.jpg` (referenced as `/genmax-icon.jpg`).
- **On finish:** saves answers to `localStorage` (`gmx:onboarding`), creates a first
  workflow via `createWorkflow(name)`, and `router.push("/app")`.
- **Buttons** are pill-shaped (`border-radius: 999px`); the hero-step CTA is centered
  (the bottom bar gets `.bottomCenter` when `step === 0`).

## Wiring
- **Trigger after sign-up** (`app/layout.js`, Clerk example): set
  `signUpFallbackRedirectUrl="/onboarding"`.
- **Gate the route** (`middleware.js`): add `"/onboarding(.*)"` to the protected matcher.
- **First workflow:** the finish handler imports `createWorkflow, listWorkflows` from your
  store (`@/lib/store`) — swap for your own "create project" call, or delete for a purely
  cosmetic flow.

## Customizing the content
Everything a YouTube-Kids creator sees lives in the data arrays near the top of the page:
`GOALS`, `EXPERIENCE`, `USE_CASES` (content focus/niche), `STYLES` (animation styles),
`PLATFORMS`, `CONTENT_TYPES`. Edit those + the hero/summary copy to retarget.

---

## `app/onboarding/page.js`

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
  { key: "rhymes", icon: IcoMusic, h: "Nursery Rhyme Videos", p: "Sing-along rhymes & catchy kids songs" },
  { key: "learning", icon: IcoCap, h: "Learning & Educational", p: "ABCs, numbers, colors & shapes" },
  { key: "stories", icon: IcoFilm, h: "Cartoon Stories", p: "Animated story episodes for kids" },
  { key: "channel", icon: IcoPlay, h: "Grow a Kids Channel", p: "Post safe, consistent content" },
];
const EXPERIENCE = [
  "I'm new to making kids content",
  "I've made a few kids videos",
  "I run a kids channel already",
];
const USE_CASES = [
  { key: "rhymes", icon: IcoMusic, h: "Nursery Rhymes" },
  { key: "learning", icon: IcoCap, h: "Learning & ABCs" },
  { key: "stories", icon: IcoFilm, h: "Cartoons & Stories" },
  { key: "numbers", icon: IcoPalette, h: "Numbers & Colors" },
  { key: "songs", icon: IcoHeadphones, h: "Kids Songs" },
  { key: "other", icon: IcoSparkles, h: "Something Else" },
];
const STYLES = [
  { key: "3d", h: "3D Animation", p: "Pixar-style 3D characters" },
  { key: "cartoon", h: "2D Cartoon", p: "Flat, colorful cartoon look" },
  { key: "clay", h: "Claymation", p: "Playful clay-model style" },
  { key: "storybook", h: "Storybook", p: "Hand-drawn picture-book art" },
];
const PLATFORMS = [
  { key: "youtubekids", icon: IcoPlay, h: "YouTube Kids" },
  { key: "youtube", icon: IcoFilm, h: "YouTube" },
  { key: "tiktok", icon: IcoMusic, h: "TikTok" },
  { key: "instagram", icon: IcoCamera, h: "Instagram" },
];
const CONTENT_TYPES = [
  { key: "videos", icon: IcoFilm, h: "Rhyme Videos" },
  { key: "voiceovers", icon: IcoMic, h: "Voiceovers" },
  { key: "art", icon: IcoImage, h: "Character Art" },
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
    style: "3d",
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
          <img className={s.logoImg} src="/genmax-icon.jpg" alt="Genmax" />
          <b>Genmax</b>
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
              <h1 className={s.h1}>Create Videos <span className={s.grad}>Kids Love</span></h1>
              <p className={s.lead}>Turn simple ideas into kid-friendly videos — nursery rhymes, learning songs, and cartoon stories. We'll set up your channel in minutes.</p>
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
                <h2 className={s.h2}>What do you want to make?</h2>
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
                  { key: "template", icon: IcoSparkles, h: "Kids Video Template", p: "Start from a ready-made nursery-rhyme / story workflow", list: ["A finished video in minutes", "Kid-safe, proven layouts", "Just swap the theme & characters"] },
                  { key: "blank", icon: IcoPuzzle, h: "Blank Canvas", p: "Build your own kids video from scratch", list: ["Full creative control", "Connect any node type", "Make exactly the video you want"] },
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
                <h2 className={s.h2}>Set up your channel</h2>
                <p className={s.stepSub}>Give your kids channel a name and a look</p>
              </div>
              <div className={s.label} style={{ marginTop: 34 }}>Channel name</div>
              <div className={s.field}>
                <input
                  className={s.input}
                  placeholder="My Kids Channel"
                  value={ans.workspaceName}
                  onChange={(e) => setAns((a) => ({ ...a, workspaceName: e.target.value }))}
                  maxLength={40}
                />
              </div>
              <div className={s.label}>Content focus</div>
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
                <h2 className={s.h2}>{ans.workspaceName.trim() || "Your channel"} is ready to launch</h2>
                <p className={s.stepSub}>Your kids channel is set up on Genmax and ready to start creating.</p>
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
                      <div className={s.summaryH}>{ans.workspaceName.trim() || "Kids Channel"}</div>
                      <div className={s.summaryP}>{label(ans.useCase, USE_CASES) || "Kids content"} · {label(ans.style, STYLES) || "3D Animation"}</div>
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
      <div className={`${s.bottom} ${step === 0 ? s.bottomCenter : ""}`}>
        {step > 0 ? (
          <button type="button" className={`${s.btn} ${s.btnBack}`} onClick={prev}><Back /> Back</button>
        ) : null}
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

## `app/onboarding/onboarding.module.css`

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
.logoImg { width: 30px; height: 30px; border-radius: 8px; object-fit: cover; display: block; }
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
.bottomCenter { justify-content: center; }
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: 15px; border: none; cursor: pointer; text-decoration: none;
  padding: 13px 26px; border-radius: 999px; font-family: inherit;
  transition: transform .12s ease, opacity .12s ease, background .12s ease;
}
.btnBack { background: #fff; border: 1px solid var(--line); color: var(--ink); }
.btnBack:hover { border-color: #c7d2e6; background: #f8fafc; }
.btnPrimary { background: var(--blue); color: #fff; }
.btnPrimary:hover:not(:disabled) { background: var(--blue-dark); transform: translateY(-1px); }
.btnPrimary:disabled { opacity: 0.4; cursor: not-allowed; }
.btnLg { padding: 15px 34px; font-size: 16.5px; border-radius: 999px; }

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

## Dependencies
- **React 18/19 + Next.js App Router** (`"use client"`).
- **`useRouter`** from `next/navigation`.
- **A store helper** `createWorkflow(name)` / `listWorkflows()` (optional — for the
  "create first workflow" step). Auth (Clerk) is only used to *trigger* the flow; the
  wizard itself is auth-agnostic.
- **No other libraries** — icons are inline SVG; styling is a CSS Module.
