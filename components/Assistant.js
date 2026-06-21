"use client";
import { useEffect, useRef, useState } from "react";

export default function Assistant({ open, onClose, onCreateAndMaybeRun }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [autoRun, setAutoRun] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sending]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setHistory((h) => [...h, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setHistory((h) => [
        ...h,
        { role: "assistant", content: data.message || "Done.", action: data.kind ? { kind: data.kind, prompt: data.prompt } : null },
      ]);
      if (data.kind) onCreateAndMaybeRun({ kind: data.kind, prompt: data.prompt }, autoRun);
    } catch (e) {
      setHistory((h) => [...h, { role: "assistant", content: `⚠ ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="cb-sidepanel">
      <div className="cb-modal">
        <div className="cb-head">
          <div className="cb-head-title">
            <span className="cb-spark">✦</span> AI Assistant
          </div>
          <div className="cb-head-actions">
            {history.length > 0 && (
              <button className="cb-iconbtn" onClick={() => setHistory([])} title="New chat">New chat</button>
            )}
            <button className="cb-iconbtn cb-close" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        <div className="cb-messages" ref={scrollRef}>
          {history.length === 0 && (
            <div className="cb-welcome">
              <div className="cb-welcome-icon">✦</div>
              <h3>How can I help?</h3>
              <p>Describe what you want and I'll create the right node and generate it.</p>
              <div className="cb-suggestions">
                {[
                  "Generate an image of a sunset over mountains",
                  "Write a tagline for a coffee brand",
                  "Make a video of waves crashing",
                ].map((s) => (
                  <button key={s} className="cb-suggestion" onClick={() => setInput(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {history.map((m, i) => (
            <div key={i} className={`cb-msg cb-msg-${m.role}`}>
              <div className="cb-bubble">
                {m.content}
                {m.action && (
                  <div className="cb-chip">
                    ✦ Created {m.action.kind} node{m.action.prompt ? ` — "${m.action.prompt.slice(0, 50)}${m.action.prompt.length > 50 ? "…" : ""}"` : ""}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="cb-msg cb-msg-assistant">
              <div className="cb-bubble cb-thinking">
                <span className="cb-dot" /><span className="cb-dot" /><span className="cb-dot" />
              </div>
            </div>
          )}
        </div>

        <div className="cb-inputbar">
          <div className="cb-autorun-row">
            <button
              className={`cb-autorun ${autoRun ? "on" : ""}`}
              onClick={() => setAutoRun((v) => !v)}
              title="When on, generated nodes run automatically"
            >
              ⚡ Auto-run {autoRun ? "on" : "off"}
            </button>
          </div>
          <div className="cb-inputrow">
            <textarea
              ref={inputRef}
              className="cb-textarea"
              placeholder="Describe what you want to create…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
            />
            <button className="cb-send" onClick={send} disabled={!input.trim() || sending} title="Send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
