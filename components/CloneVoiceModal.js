"use client";
import { useRef, useState } from "react";

// Upload-an-audio-sample → ElevenLabs Instant Voice Clone → callback with new voice_id.
export default function CloneVoiceModal({ open, onClose, onCloned }) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  if (!open) return null;

  const reset = () => { setName(""); setFiles([]); setError(""); setBusy(false); if (fileRef.current) fileRef.current.value = ""; };
  const cancel = () => { reset(); onClose(); };

  const submit = async () => {
    setError("");
    if (!name.trim()) return setError("Give the voice a name.");
    if (files.length === 0) return setError("Upload at least one audio sample.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      for (const f of files) form.append("files", f);
      const res = await fetch("/api/audio/clone", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onCloned?.({ value: data.voice_id, label: data.name || name.trim() });
      reset();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const totalMb = (files.reduce((a, f) => a + f.size, 0) / (1024 * 1024)).toFixed(1);

  return (
    <div className="nw-backdrop" onClick={busy ? null : cancel}>
      <div className="nw-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="nw-title">Clone a voice</h3>
        <p className="nw-sub">
          Upload a clear audio sample (30 seconds–2 minutes works best). It&apos;s sent to
          ElevenLabs Instant Voice Clone and added to your voice library.
        </p>
        <input
          className="nw-input"
          autoFocus
          placeholder="Voice name (e.g. My voice)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          onKeyDown={(e) => { if (e.key === "Escape" && !busy) cancel(); }}
        />
        <div style={{ marginTop: 12 }}>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => setFiles([...(e.target.files || [])])}
            disabled={busy}
            style={{ fontSize: 13 }}
          />
          {files.length > 0 && (
            <div style={{ fontSize: 12, color: "#5b6472", marginTop: 6 }}>
              {files.length} file{files.length === 1 ? "" : "s"} · {totalMb} MB
            </div>
          )}
        </div>
        {error && (
          <div style={{ marginTop: 14, fontSize: 13, color: "#dc2626", background: "#fee2e2", padding: "10px 12px", borderRadius: 8 }}>
            {error}
          </div>
        )}
        <div className="nw-actions">
          <button className="nw-cancel" onClick={cancel} disabled={busy}>Cancel</button>
          <button className="primary-btn" onClick={submit} disabled={busy}>
            {busy ? "Cloning…" : "Clone voice"}
          </button>
        </div>
      </div>
    </div>
  );
}
