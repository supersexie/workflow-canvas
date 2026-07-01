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
