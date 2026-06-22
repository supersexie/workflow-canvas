"use client";
import { useState } from "react";
import Link from "next/link";
import s from "./landing.module.css";

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PlayLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

const TOOLS = [
  { icon: "🖼️", title: "Image Generation", desc: "Generate stunning images with FLUX, Seedream, and Nano Banana — straight to a public URL.", art: "🖼️" },
  { icon: "🎬", title: "Video Generation", desc: "Text-to-video and image-to-video powered by LTX, Wan, MiniMax Hailuo, and Kling.", art: "🎬" },
  { icon: "🎙️", title: "AI Voiceover", desc: "Turn any script into natural-sounding narration with one click.", art: "🎙️" },
  { icon: "✍️", title: "AI Scriptwriter", desc: "Generate captions, copy, and full scripts from a single prompt.", art: "✍️" },
  { icon: "🤖", title: "AI Assistant", desc: "Describe what you want in plain language — it builds and runs the nodes for you.", art: "🤖" },
  { icon: "🗂️", title: "Library", desc: "Every image, video, and clip you generate, collected in one gallery.", art: "🗂️", tag: "New" },
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
  { q: "Do I need an account?", a: "No. Geoflix runs in your browser and saves your workflows locally — just open the app and start creating." },
  { q: "Can I use Geoflix inside Claude?", a: "Yes. Geoflix ships an MCP connector so Claude can generate media through Geoflix directly from chat." },
  { q: "Is my work saved?", a: "Workflows auto-save to your browser as you edit, and every generation is collected in the Library." },
];

export default function Landing() {
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState(0);

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
            <a href="#faq">FAQs</a>
            <Link href="/">Library</Link>
          </div>
          <div className={s.navRight}>
            <Link href="/" className={s.signIn}>Sign In</Link>
            <Link href="/" className={s.btn}>Open App <Arrow /></Link>
          </div>
        </nav>
      </div>

      {/* HERO */}
      <header className={s.hero}>
        <span className={s.badge}><span className={s.accent}>New:</span> AI Assistant is live! &rarr;</span>
        <h1 className={s.h1}>
          The Node-Based Canvas<br />for <span className={s.grad}>AI Creation</span>
        </h1>
        <p className={s.sub}>
          Generate images, video, voiceovers, and scripts — then connect them on one infinite canvas.
        </p>
        <div className={s.heroCta}>
          <Link href="/" className={`${s.btn} ${s.btnLg}`}>Start Creating <Arrow /></Link>
        </div>
        <div className={s.proof}>
          <div className={s.avatars}><span>🎨</span><span>🎬</span><span>🤖</span><span>✨</span></div>
          Built for creators who move fast.
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
              <div className={s.cardArt}>{t.art}</div>
              <Link href="/" className={`${s.btn} ${s.cardBtn}`}>Try Now <Arrow /></Link>
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
            <div className={s.node} style={{ top: 60, left: 50 }}>🖼️ Image</div>
            <div className={s.node} style={{ top: 180, left: 150 }}>🎬 Video</div>
            <div className={s.node} style={{ bottom: 70, left: 70 }}>🎙️ Audio</div>
            <div className={s.node} style={{ top: 120, right: 50 }}>✍️ Text</div>
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
            <Link href="/" className={`${s.btn} ${s.btnLg} ${s.btnWhite}`}>Start Creating <Arrow /></Link>
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
            <Link href="/">Library</Link>
          </div>
          <div className={s.footCol}>
            <h4>Info</h4>
            <a href="#faq">FAQs</a>
            <Link href="/">Open App</Link>
          </div>
        </div>
        <div className={s.footBar}>Geoflix. All rights reserved. © 2026</div>
      </footer>
    </div>
  );
}
