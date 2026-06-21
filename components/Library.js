"use client";
import { useEffect, useState } from "react";
import { listGenerations } from "@/lib/store";

const KIND_LABEL = { image: "Image", video: "Video", audio: "Audio", text: "Text", motion: "Motion" };

export default function Library({ open, onClose }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) setItems(listGenerations());
  }, [open]);

  if (!open) return null;

  return (
    <div className="lib-backdrop" onMouseDown={onClose}>
      <div className="lib-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lib-head">
          <div className="lib-head-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
            Library <span className="lib-count">{items.length}</span>
          </div>
          <button className="lib-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="lib-body">
          {items.length === 0 ? (
            <div className="lib-empty">
              <div className="lib-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
              </div>
              <h3>No generations yet</h3>
              <p>Images, videos, and audio you generate or upload will collect here.</p>
            </div>
          ) : (
            <div className="lib-grid">
              {items.map((it, i) => (
                <div key={i} className="lib-card">
                  <div className="lib-thumb">
                    {it.kind === "image" && <img src={it.url} alt="" />}
                    {it.kind === "video" && <video src={it.url} muted loop playsInline onMouseOver={(e) => e.target.play()} onMouseOut={(e) => e.target.pause()} />}
                    {it.kind === "audio" && (
                      <div className="lib-audio">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19 12a4 4 0 0 0-2-3.5"/></svg>
                      </div>
                    )}
                    {(it.kind === "text" || it.kind === "motion") && <div className="lib-textthumb">{it.kind}</div>}
                    <span className="lib-badge">{KIND_LABEL[it.kind] || it.kind}</span>
                  </div>
                  <div className="lib-meta">
                    <div className="lib-prompt">{it.prompt || "(no prompt)"}</div>
                    <div className="lib-wf">{it.workflowName}</div>
                  </div>
                  <a className="lib-open" href={it.url} target="_blank" rel="noreferrer" download>Open ↗</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
