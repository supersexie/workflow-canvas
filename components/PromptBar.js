"use client";
import { useState } from "react";

const MODELS = {
  image: ["GPT Image 1", "GPT Image 2"],
  video: ["Wan 2.2", "Veo 3.1 Fast", "Veo 3.1"],
  text: ["GPT-5.1", "Claude Opus 4.7", "Gemini 2.5 Pro"],
  audio: ["ElevenLabs", "OpenAI TTS", "Suno v4"],
  motion: ["Motion Pro", "After Effects AI"],
};

const ASPECTS = {
  image: ["1:1 · 1080p", "16:9 · 1080p", "9:16 · 1080p", "4:3 · 1024p"],
  video: ["16:9 · 720p", "16:9 · 1080p", "9:16 · 720p"],
  motion: ["16:9 · 1080p", "1:1 · 1080p"],
};

const DURATIONS = ["4s", "6s", "8s"];
const VOICES = ["James – Husky & Engaging", "Aria – Warm & Bright", "Nova – Crisp Narrator"];

const MODEL_ICON = {
  image: <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 2 22 22 22 12 2" /></svg>,
  video: <svg width="12" height="12" viewBox="0 0 24 24" fill="#a855f7"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z" /></svg>,
  text: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>,
  audio: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="6" y="3" width="12" height="14" rx="6" /><path d="M8 11v4M16 11v4" /></svg>,
  motion: <svg width="12" height="12" viewBox="0 0 24 24" fill="#a855f7"><polygon points="6 3 20 12 6 21 6 3" /></svg>,
};

function Chip({ icon, label, accent, onClick }) {
  return (
    <button className="chip-btn" onClick={onClick}>
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      <span style={accent ? { color: accent } : null}>{label}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );
}

function Dropdown({ open, options, onPick, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="dd-backdrop" onClick={onClose} />
      <div className="dd-menu">
        {options.map((o) => (
          <button key={o} onClick={() => { onPick(o); onClose(); }}>{o}</button>
        ))}
      </div>
    </>
  );
}

export default function PromptBar({ node, sources = [], onChange, onRun, running }) {
  const [openMenu, setOpenMenu] = useState(null);
  if (!node) return null;
  const { kind } = node.data;
  const data = node.data;

  const set = (patch) => onChange(node.id, { ...data, ...patch });
  const toggle = (k) => setOpenMenu((m) => (m === k ? null : k));

  const modelList = MODELS[kind] || [];
  const aspectList = ASPECTS[kind] || null;
  const isAudio = kind === "audio";
  const isVideo = kind === "video";
  const hasSources = sources.length > 0;
  const placeholder = isAudio
    ? "Prompt not available for this node"
    : hasSources
      ? "Describe your next edit..."
      : "Describe what you want…";

  const runCount = data.runCount || 1;
  const incRun = (e) => { e.stopPropagation(); set({ runCount: ((runCount % 9) + 1) }); };

  return (
    <div className="prompt-bar">
      <div className="pb-divider"><div className="pb-grip" /></div>

      <div className="pb-title-row">
        <input
          className="pb-title"
          placeholder={placeholder}
          value={data.prompt || ""}
          onChange={(e) => set({ prompt: e.target.value })}
          disabled={isAudio}
        />
        <span className="pb-tab">Tab</span>
        <button className="pb-window" title="Detach">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>
        </button>
      </div>

      {hasSources && (
        <div className="pb-sources">
          {sources.map((s) => (
            <div key={s.id} className="pb-source-thumb">
              <img src={s.url} alt="source" />
            </div>
          ))}
        </div>
      )}

      <div className="pb-chips">
        <div className="pb-chips-left">
          {isAudio && (
            <div className="pb-attached">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2 1 21h22z" /><path d="M12 9v4M12 17h.01" fill="#0a0a0a"/></svg>
              <span className="pb-attached-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h10M4 18h12" /></svg>
              </span>
            </div>
          )}
          <div className="chip-wrap">
            <Chip icon={MODEL_ICON[kind]} label={data.model || modelList[0]} onClick={() => toggle("model")} />
            <Dropdown open={openMenu === "model"} options={modelList} onPick={(v) => set({ model: v })} onClose={() => setOpenMenu(null)} />
          </div>
          {aspectList && (
            <div className="chip-wrap">
              <Chip
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>}
                label={data.aspect || aspectList[0]}
                onClick={() => toggle("aspect")}
              />
              <Dropdown open={openMenu === "aspect"} options={aspectList} onPick={(v) => set({ aspect: v })} onClose={() => setOpenMenu(null)} />
            </div>
          )}
          {isVideo && (
            <div className="chip-wrap">
              <Chip
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                label={data.duration || DURATIONS[0]}
                onClick={() => toggle("duration")}
              />
              <Dropdown open={openMenu === "duration"} options={DURATIONS} onPick={(v) => set({ duration: v })} onClose={() => setOpenMenu(null)} />
            </div>
          )}
          {isVideo && (
            <Chip
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M22 9 18 13M18 9l4 4"/></svg>}
              label={data.audio || "No Audio"}
            />
          )}
          {isAudio && (
            <div className="chip-wrap">
              <Chip
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 12a7 7 0 0 0 14 0M12 19v3"/></svg>}
                label={data.voice || VOICES[0]}
                onClick={() => toggle("voice")}
              />
              <Dropdown open={openMenu === "voice"} options={VOICES} onPick={(v) => set({ voice: v })} onClose={() => setOpenMenu(null)} />
            </div>
          )}
          {kind !== "text" && (
            <Chip
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>}
              label={data.ep || "No EP"}
            />
          )}
        </div>

        <button className="pb-play" onClick={onRun} disabled={running}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>{runCount}</span>
          <span onClick={incRun} className="pb-play-inc">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </button>
      </div>
    </div>
  );
}
