"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import s from "./landing.module.css";

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PlayLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

const TOOLS = [
  { icon: "🖼️", title: "Image Generation", desc: "Generate stunning images with FLUX, Seedream, and Nano Banana — straight to a public URL.", video: "/tools/image.mp4" },
  { icon: "🎬", title: "Video Generation", desc: "Text-to-video and image-to-video powered by LTX, Wan, MiniMax Hailuo, and Kling.", video: "/tools/video.mp4" },
  { icon: "🎙️", title: "AI Voiceover", desc: "Turn any script into natural-sounding narration with one click.", video: "/tools/voiceover.mp4" },
  { icon: "✍️", title: "AI Scriptwriter", desc: "Generate captions, copy, and full scripts from a single prompt.", video: "/tools/scriptwriter.mp4" },
  { icon: "🤖", title: "AI Assistant", desc: "Describe what you want in plain language — it builds and runs the nodes for you.", video: "/tools/assistant.mp4" },
  { icon: "🔗", title: "Genmax Flow", desc: "Connect image, video, text, and audio nodes on one infinite canvas.", video: "/tools/genmax.mp4", tag: "New" },
];

// Auto-scrolling showcase tiles — empty placeholders (3 landscape, 3 portrait).
const SHOWCASE = [
  { ratio: "16:9", views: "54.2M Views", video: "/marquee/l1.mp4" },
  { ratio: "9:16", views: "12.7M Views", video: "/marquee/p1.mp4" },
  { ratio: "16:9", views: "88.1M Views", video: "/marquee/l2.mp4" },
  { ratio: "9:16", views: "31.5M Views", video: "/marquee/p2.mp4" },
  { ratio: "16:9", views: "117.3M Views", video: "/marquee/l3.mp4" },
  { ratio: "9:16", views: "9.4M Views", video: "/marquee/p3.mp4" },
  { ratio: "16:9", views: "73.6M Views", video: "/marquee/l4.mp4" },
  { ratio: "16:9", views: "45.9M Views", video: "/marquee/l5.mp4" },
];

const FEATURES = [
  { h: "Node-Based Canvas", p: "Build creative workflows on an infinite canvas. Drag from any node to connect Image → Video, Text → Audio, and more." },
  { h: "Connect & Propagate", p: "An image output flows downstream as the source for a video node automatically — no copy-pasting URLs." },
  { h: "Multi-Model, One Place", p: "Switch between FLUX, Seedream, Kling, MiniMax and others from a single prompt bar per node." },
  { h: "Use in Claude", p: "The Geoflix MCP connector lets Claude generate images, video, audio and text through the same backend." },
];

const FAQS = [
  { q: "What is Geoflix?", a: "Geoflix is a node-based AI creative canvas. You connect Image, Video, Text, and Audio nodes on an infinite canvas to build and run generation workflows visually." },
  { q: "Which models can I use?", a: "Images use FLUX 2 Pro/Max, Nano Banana Pro, and Seedream 4.5. Video uses LTX, Wan 2.2, MiniMax Hailuo, and Kling v2. Text and audio are powered by OpenAI." },
  { q: "Do I need an account?", a: "Yes — sign up free with email or Google to open the app. Once you're in, your workflows save automatically in your browser." },
  { q: "Can I use Geoflix inside Claude?", a: "Yes. Geoflix ships an MCP connector so Claude can generate media through Geoflix directly from chat." },
  { q: "Is my work saved?", a: "Workflows auto-save to your browser as you edit, and every generation is collected in the Library." },
];

export default function Landing() {
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);

  // globals.css locks body { overflow:hidden; height:100% } for the canvas editor.
  // Release it on the landing page so it can scroll, then restore on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      htmlHeight: html.style.height,
    };
    body.style.overflow = "auto";
    body.style.height = "auto";
    html.style.height = "auto";
    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      html.style.height = prev.htmlHeight;
    };
  }, []);

  const MCP_URL = "https://www.geoflix.online/api/mcp?key=YOUR_KEY";
  const [copied, setCopied] = useState(false);
  const copyMcp = () => {
    navigator.clipboard?.writeText(MCP_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // Auth routing: signed-out users hitting these are gated by middleware.
  const signInHref = CLERK_ENABLED ? "/sign-in" : "/app";
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/app";

  return (
    <div className={s.page}>
      {/* NAV */}
      <div className={s.navWrap}>
        <nav className={s.nav}>
          <div className={s.brand}>
            <span className={s.logoIcon}><PlayLogo /></span>
            <b>Geoflix</b> <span>Studio</span>
          </div>
          <div className={s.navLinks}>
            <a href="#tools">Tools</a>
            <a href="#features">Features</a>
            <a href="#mcp">Claude MCP</a>
            <a href="#faq">FAQs</a>
            <Link href="/app">Library</Link>
          </div>
          <div className={s.navRight}>
            <Link href={signInHref} className={s.signIn}>Sign In</Link>
            <Link href={signUpHref} className={s.btn}>Sign Up <Arrow /></Link>
          </div>
        </nav>
      </div>

      {/* HERO */}
      <header className={s.hero}>
        <span className={s.badge}><span className={s.accent}>New:</span> AI Assistant is live! &rarr;</span>
        <h1 className={s.h1}>
          The Easiest Way to Make<br />Viral Videos
        </h1>
        <p className={s.sub}>
          The AI tool suite for video generation, scripting, voiceovers, caption removal, and more.
        </p>
        <div className={s.heroCta}>
          <Link href="/app" className={`${s.btn} ${s.btnLg}`}>Start Creating <Arrow /></Link>
        </div>
        <div className={s.proof}>
          <div className={s.avatars}><span>🎨</span><span>🎬</span><span>🤖</span><span>✨</span></div>
          Built for creators who move fast.
        </div>

        <div className={s.center} style={{ marginTop: 80 }}>
          <span className={s.badge}>Viral Videos Made with Geoflix</span>
          <h2 className={s.h2}>Top Creators Don&apos;t Start from Scratch</h2>
          <p className={s.lead}>They use tools to copy what&apos;s already working.</p>
        </div>

        <div className={s.marquee}>
          <div className={s.marqueeTrack}>
            {[...SHOWCASE, ...SHOWCASE].map((t, i) => (
              <div key={i} className={`${s.mTile} ${t.ratio === "9:16" ? s.mPortrait : s.mLandscape}`}>
                {t.video && <video className={s.mVideo} src={t.video} autoPlay loop muted playsInline preload="metadata" />}
                <span className={s.mViews}>{t.views}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* TOOLS */}
      <section id="tools" className={`${s.section} ${s.center}`}>
        <span className={s.badge}>Powerful AI Tools</span>
        <h2 className={s.h2}>Everything You Need to Create</h2>
        <p className={s.lead}>AI-powered tools to generate images, video, voiceovers, scripts, and more.</p>
        <div className={s.grid}>
          {TOOLS.map((t) => (
            <div key={t.title} className={s.card}>
              <div className={s.cardTitle}>{t.title}{t.tag && <span className={s.tag}>{t.tag}</span>}</div>
              <p className={s.cardDesc}>{t.desc}</p>
              <div className={s.cardArt}>
                {t.video ? (
                  <video className={s.cardVideo} src={t.video} autoPlay loop muted playsInline preload="metadata" />
                ) : (
                  t.art
                )}
              </div>
              <Link href="/app" className={`${s.btn} ${s.cardBtn}`}>Try Now <Arrow /></Link>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={s.section}>
        <div className={s.center} style={{ marginBottom: 56 }}>
          <span className={s.badge}>Speed Up Your Workflow</span>
          <h2 className={s.h2}>Designed to Make Great Content</h2>
          <p className={s.lead}>Everything connects on one canvas, so ideas become finished media faster.</p>
        </div>
        <div className={s.features}>
          <div className={s.featList}>
            {FEATURES.map((f, i) => (
              <div
                key={f.h}
                className={`${s.feat} ${active === i ? s.featActive : ""}`}
                onMouseEnter={() => setActive(i)}
              >
                <div className={s.featH}>{f.h}</div>
                <div className={s.featP}>{f.p}</div>
              </div>
            ))}
          </div>
          <div className={s.featArt}>
            <video className={s.featVideo} src="/tools/canvas.mp4" autoPlay loop muted playsInline preload="metadata" />
          </div>
        </div>
      </section>

      {/* CLAUDE MCP */}
      <section id="mcp" className={`${s.section} ${s.center}`}>
        <span className={s.badge}>MCP Connector</span>
        <h2 className={s.h2}>Generate Right Inside Claude</h2>
        <p className={s.lead}>Connect Geoflix to Claude and generate images, video, voiceovers, and text right from your conversations.</p>
        <div className={s.mcpSteps}>
          <div className={s.mcpStep}>
            <div className={s.mcpStepNum}>1</div>
            <h3 className={s.mcpStepTitle}>Open Claude settings</h3>
            <p className={s.mcpStepBody}>Launch Claude Desktop or open claude.ai and go to <b>Settings &rarr; Connectors</b>.</p>
          </div>
          <div className={s.mcpStep}>
            <div className={s.mcpStepNum}>2</div>
            <h3 className={s.mcpStepTitle}>Add a custom connector</h3>
            <p className={s.mcpStepBody}>Name it <b>Geoflix</b> and paste the URL:</p>
            <div className={s.mcpRow}>
              <code className={s.mcpUrl}>{MCP_URL}</code>
              <button className={s.mcpCopy} onClick={copyMcp} title="Copy URL">
                {copied ? "Copied" : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
            </div>
          </div>
          <div className={s.mcpStep}>
            <div className={s.mcpStepNum}>3</div>
            <h3 className={s.mcpStepTitle}>Connect &amp; approve</h3>
            <p className={s.mcpStepBody}>Hit <b>Connect</b>, approve in the popup, and you're set — generate from any chat. No API keys to paste.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${s.section} ${s.center}`}>
        <span className={s.badge}>FAQs</span>
        <h2 className={s.h2}>Frequently Asked Questions</h2>
        <p className={s.lead}>Everything you need to know about Geoflix.</p>
        <div className={s.faq}>
          {FAQS.map((f, i) => (
            <div key={f.q} className={`${s.faqItem} ${open === i ? s.faqOpen : ""}`}>
              <button className={s.faqQ} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <svg className={s.faqChevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className={s.faqA}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={s.ctaBanner}>
        <div className={s.ctaPattern} />
        <div className={s.ctaInner}>
          <div className={s.ctaKicker}>Geoflix Studio</div>
          <h2 className={s.h2}>Launch Your Canvas Today!</h2>
          <p className={s.lead}>Join creators turning prompts into finished media with Geoflix.</p>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
            <Link href="/app" className={`${s.btn} ${s.btnLg} ${s.btnWhite}`}>Start Creating <Arrow /></Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footTop}>
          <div>
            <div className={s.brand}>
              <span className={s.logoIcon}><PlayLogo /></span>
              <b>Geoflix</b> <span>Studio</span>
            </div>
            <p className={s.footBlurb}>The node-based AI creative canvas. Generate and connect images, video, audio, and text on one canvas.</p>
          </div>
          <div className={s.footCol}>
            <h4>Product</h4>
            <a href="#tools">Tools</a>
            <a href="#features">Features</a>
            <Link href="/app">Library</Link>
          </div>
          <div className={s.footCol}>
            <h4>Info</h4>
            <a href="#faq">FAQs</a>
            <Link href="/app">Open App</Link>
          </div>
        </div>
        <div className={s.footBar}>Geoflix. All rights reserved. © 2026</div>
      </footer>
    </div>
  );
}
