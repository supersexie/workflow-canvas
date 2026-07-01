"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

const GOALS = [
  { key: "social", icon: "🎬", h: "Social Media Content", p: "Create videos & posts for Instagram, TikTok, YouTube" },
  { key: "marketing", icon: "📣", h: "Marketing & Ads", p: "Generate campaign creative and product content" },
  { key: "personal", icon: "✨", h: "Personal Projects", p: "Explore ideas and bring stories to life" },
  { key: "learn", icon: "⚡", h: "Learn AI Tools", p: "Explore what's possible with generative AI" },
];
const EXPERIENCE = [
  "I'm new to AI content creation",
  "I've used AI tools before",
  "I'm experienced with AI creative tools",
];
const USE_CASES = [
  { key: "social", icon: "📱", h: "Social Media" },
  { key: "ads", icon: "🛍️", h: "Product & Ads" },
  { key: "story", icon: "📖", h: "Storytelling" },
  { key: "edu", icon: "🎓", h: "Education" },
  { key: "music", icon: "🎧", h: "Music & Audio" },
  { key: "other", icon: "💡", h: "Something Else" },
];
const STYLES = [
  { key: "realistic", h: "Realistic", p: "Photorealistic AI renders" },
  { key: "stylized", h: "Stylized", p: "Bold, illustrated look" },
  { key: "cinematic", h: "Cinematic", p: "Film-grade lighting & motion" },
  { key: "anime", h: "Anime-Inspired", p: "Japanese animation style" },
];
const PLATFORMS = [
  { key: "instagram", icon: "📷", h: "Instagram" },
  { key: "youtube", icon: "▶️", h: "YouTube" },
  { key: "tiktok", icon: "🎵", h: "TikTok" },
  { key: "twitter", icon: "🐦", h: "Twitter / X" },
];
const CONTENT_TYPES = [
  { key: "images", icon: "🖼️", h: "Images" },
  { key: "videos", icon: "🎬", h: "Videos" },
  { key: "voiceovers", icon: "🎙️", h: "Voiceovers" },
  { key: "scripts", icon: "✍️", h: "Scripts" },
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
              <span className={s.badge}>✨ 5-minute setup</span>
              <h1 className={s.h1}>Create Your <span className={s.grad}>AI Workflow</span></h1>
              <p className={s.lead}>Join thousands of creators building on Genmax. We'll guide you through every step — it only takes a few minutes.</p>
              <div className={s.stats}>
                <div className={s.stat}><div className={s.statNum}>5 min</div><div className={s.statLabel}>Setup time</div></div>
                <div className={s.stat}><div className={s.statNum}>4</div><div className={s.statLabel}>Node types</div></div>
                <div className={s.stat}><div className={s.statNum}>10+</div><div className={s.statLabel}>AI models</div></div>
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
                    <span className={s.tileIcon}>{g.icon}</span>
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
                  { key: "template", icon: "⚡", h: "Template Workflow", p: "Start from a ready-made workflow for common tasks", list: ["Instant results, no setup", "Proven node combinations", "Customize as you go"] },
                  { key: "blank", icon: "🧩", h: "Blank Canvas", p: "Start from scratch and build your own workflow", list: ["Full creative control", "Connect any node type", "Build exactly what you need"] },
                ].map((m) => (
                  <button key={m.key} type="button" className={`${s.methodCard} ${ans.method === m.key ? s.methodSel : ""}`} onClick={() => toggle("method", m.key, false)}>
                    <span className={s.methodIcon}>{m.icon}</span>
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
                    <span className={s.tileIcon}>{u.icon}</span>
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
                    <span className={s.tileIcon}>{p.icon}</span>
                    <div className={s.tileH}>{p.h}</div>
                  </button>
                ))}
              </div>
              <div className={s.label}>Content types</div>
              <div className={s.grid4}>
                {CONTENT_TYPES.map((c) => (
                  <button key={c.key} type="button" className={`${s.tile} ${ans.contentTypes.includes(c.key) ? s.tileSel : ""}`} onClick={() => toggle("contentTypes", c.key, true)}>
                    {ans.contentTypes.includes(c.key) && <span className={s.tileCheck}><Check /></span>}
                    <span className={s.tileIcon}>{c.icon}</span>
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
                  <div className={s.summaryArtIcon}>✨</div>
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
