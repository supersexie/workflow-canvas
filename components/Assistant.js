"use client";
import { useEffect, useRef, useState } from "react";

export default function Assistant({ open, onClose, onCreateAndMaybeRun }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [autoRun, setAutoRun] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sending]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const userMsg = { role: "user", content: text };
    setHistory((h) => [...h, userMsg]);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setHistory((h) => [...h, { role: "assistant", content: data.message || "Done.", action: data.kind ? { kind: data.kind, prompt: data.prompt } : null }]);
      if (data.kind) {
        onCreateAndMaybeRun({ kind: data.kind, prompt: data.prompt }, autoRun);
      }
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

  const reset = () => setHistory([]);

  const S = {
    panel: { position: "fixed", top: 0, right: 0, bottom: 0, width: 380, height: "100vh" },
    header: { position: "absolute", top: 0, left: 0, right: 0, height: 57 },
    body: { position: "absolute", top: 57, left: 0, right: 0, bottom: 132, overflowY: "auto" },
    inputArea: { position: "absolute", left: 0, right: 0, bottom: 0 },
  };

  return (
    <div className="assistant" style={S.panel}>
      <div className="assistant-header" style={S.header}>
        <span>Assistant</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="assistant-iconbtn" onClick={reset} title="New chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 1 3 6.7L3 21"/><path d="M3 13v-3h3"/></svg>
          </button>
          <button className="assistant-iconbtn" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="assistant-body" style={S.body} ref={scrollRef}>
        {history.length === 0 ? (
          <div className="assistant-empty">
            <h3>How can I help?</h3>
            <p>I can create and configure nodes, generate images, edit prompts, connect workflows, and help you build your pipeline step by step. Just describe what you need.</p>
          </div>
        ) : (
          history.map((m, i) => (
            <div key={i} className={`assistant-msg ${m.role}`}>
              <div className="assistant-msg-bubble">
                {m.content}
                {m.action && (
                  <div className="assistant-action-chip">
                    + {m.action.kind} node{m.action.prompt ? ` — "${m.action.prompt.slice(0, 60)}${m.action.prompt.length > 60 ? '…' : ''}"` : ''}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {sending && <div className="assistant-msg assistant"><div className="assistant-msg-bubble assistant-thinking">Thinking…</div></div>}
      </div>

      <div className="assistant-input-area" style={S.inputArea}>
        <textarea
          className="assistant-input"
          placeholder="Type your task here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
        />
        <div className="assistant-input-row">
          <button className="assistant-pill" title="Add">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button
            className={`assistant-pill assistant-autorun ${autoRun ? "on" : ""}`}
            onClick={() => setAutoRun((v) => !v)}
            title={autoRun ? "Auto-run is on" : "Auto-run is off"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={autoRun ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Auto-run
          </button>
          <div style={{ flex: 1 }} />
          <button className="assistant-send" onClick={send} disabled={!input.trim() || sending}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
