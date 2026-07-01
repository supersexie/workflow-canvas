"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import WorkflowNode from "./nodes/WorkflowNode";
import PromptBar from "./PromptBar";
import Assistant from "./Assistant";
import Library from "./Library";
import UserMenu from "./UserMenu";
import CanvasTutorial, { TUT_STEPS, TUTORIAL_DONE_KEY } from "./CanvasTutorial";
import { getWorkflow, saveWorkflow, renameWorkflow } from "@/lib/store";
import { generateOutput, generateVideo, combineVideos, lastFrameDataUrl } from "@/lib/run";
import { nodeDims } from "@/lib/cardSize";

const NODE_TYPES_META = [
  { kind: "image", label: "Image", sub: "Generate or upload" },
  { kind: "video", label: "Video", sub: "Generate or upload" },
  { kind: "text", label: "Text", sub: "Write or generate" },
  { kind: "audio", label: "Audio", sub: "Generate or upload" },
];

const CARD_ICONS = {
  image: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>,
  video: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>,
  text: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7V5h16v2M9 19h6M12 5v14" /></svg>,
  audio: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5 6 9H2v6h4l5 4V5z"/></svg>,
  motion: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor" /></svg>,
};

// Picsart-style "Transformation" operations. Not wired to a backend yet, so
// these render as disabled "Soon" rows to match the reference layout honestly.
const XFORM_META = [
  { key: "upscale", label: "Upscale", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg> },
  { key: "enhance", label: "Enhance", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg> },
  { key: "removebg", label: "Remove Background", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg> },
  { key: "animate", label: "Animate", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg> },
  { key: "extract", label: "Extract Frames", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h4M3 15h4M17 9h4M17 15h4M9 5v14"/></svg> },
];

const RAIL_ICONS = {
  cursor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
  frame: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg>,
  undo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>,
  redo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>,
};

const SIZE = { image: 304, video: 525, text: 213, audio: 304, motion: 304 };
const HEIGHT = { image: 340, video: 320, text: 340, audio: 340, motion: 340 };

let idCounter = 0;
const nextId = () => `n_${++idCounter}_${Math.random().toString(36).slice(2, 6)}`;

function CanvasInner({ workflowId }) {
  const router = useRouter();
  const { screenToFlowPosition, fitView, setCenter, getZoom } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [name, setName] = useState("Untitled Workflow");
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [picker, setPicker] = useState(null); // { x, y, flowPos, sourceId }
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [tutStep, setTutStep] = useState(null); // null = tour closed
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const saveTimer = useRef(null);
  const histTimer = useRef(null);
  const connectingRef = useRef(null);
  const skipNextHistRef = useRef(false);
  const lastSnapshotRef = useRef(null);
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // Snapshot helpers
  const snapshot = useCallback(() => ({
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: edges.map((e) => ({ ...e })),
  }), [nodes, edges]);

  const restore = useCallback((snap) => {
    skipNextHistRef.current = true;
    setNodes(snap.nodes);
    setEdges(snap.edges);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [snapshot(), ...f].slice(0, 50));
      restore(prev);
      return p.slice(0, -1);
    });
  }, [snapshot, restore]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPast((p) => [...p, snapshot()].slice(-50));
      restore(next);
      return f.slice(1);
    });
  }, [snapshot, restore]);

  useEffect(() => {
    if (!workflowId) return;
    const wf = getWorkflow(workflowId);
    if (!wf) { router.replace("/app"); return; }
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
    setName(wf.name || "Untitled Workflow");
    setLoaded(true);
  }, [workflowId, router]);

  // Auto-launch the hands-on tour once — on the user's first canvas. Mark it
  // shown immediately so it never auto-opens again; the "How it works" button
  // replays it anytime.
  useEffect(() => {
    if (!loaded) return;
    try {
      if (!localStorage.getItem(TUTORIAL_DONE_KEY)) {
        setTutStep(0);
        localStorage.setItem(TUTORIAL_DONE_KEY, "1");
      }
    } catch {}
  }, [loaded]);

  const closeTutorial = useCallback(() => {
    setTutStep(null);
    try { localStorage.setItem(TUTORIAL_DONE_KEY, "1"); } catch {}
  }, []);

  // Hands-on advancement: auto-advance when the user actually does the step.
  // Step 1 (add a node) → advance once a node exists.
  useEffect(() => {
    if (tutStep === 1 && nodes.length >= 1) setTutStep(2);
  }, [tutStep, nodes.length]);
  // Step 4 (generate) → advance once a run starts.
  useEffect(() => {
    if (tutStep === 4 && runningId) setTutStep(5);
  }, [tutStep, runningId]);
  // Step 6 (meet the Assistant) → advance once the panel opens.
  useEffect(() => {
    if (tutStep === 6 && assistantOpen) setTutStep(7);
  }, [tutStep, assistantOpen]);
  // Steps that point at the prompt bar (2–5) need a node selected so the bar is
  // mounted; auto-select one so the spotlight never dims to a blank screen.
  useEffect(() => {
    if ([2, 3, 4, 5].includes(tutStep) && !selectedId && nodes.length > 0) {
      setSelectedId(nodes[nodes.length - 1].id);
    }
  }, [tutStep, selectedId, nodes]);

  useEffect(() => {
    if (!loaded || !workflowId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWorkflow({ id: workflowId, name, nodes, edges });
      setSavedAt(Date.now());
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [nodes, edges, name, workflowId, loaded]);

  // History snapshot (debounced) — captures the PREVIOUS state before the change settled
  useEffect(() => {
    if (!loaded) return;
    if (skipNextHistRef.current) {
      skipNextHistRef.current = false;
      lastSnapshotRef.current = { nodes, edges };
      return;
    }
    clearTimeout(histTimer.current);
    histTimer.current = setTimeout(() => {
      const prev = lastSnapshotRef.current;
      if (prev) {
        setPast((p) => [...p, prev].slice(-50));
        setFuture([]);
      }
      lastSnapshotRef.current = {
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: edges.map((e) => ({ ...e })),
      };
    }, 500);
    return () => clearTimeout(histTimer.current);
  }, [nodes, edges, loaded]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Propagate upstream output → downstream sourceThumb
  const sourcesByNode = useMemo(() => {
    const map = {};
    for (const e of edges) {
      const src = nodes.find((n) => n.id === e.source);
      if (!src) continue;
      const out = src.data?.output;
      if (!out || typeof out !== "string") continue;
      const isUrl = out.startsWith("http") || out.startsWith("data:") || out.startsWith("/api/");
      const isText = src.data.kind === "text";
      if (!isUrl && !isText) continue;
      (map[e.target] ||= []).push({
        id: src.id,
        kind: src.data.kind,
        url: isUrl ? out : null,
        text: isText ? out : null,
      });
    }
    return map;
  }, [nodes, edges]);

  // Sync sourceThumb into each node's data (so the node renders it)
  useEffect(() => {
    setNodes((ns) => {
      let changed = false;
      const next = ns.map((n) => {
        const wanted = (sourcesByNode[n.id] || []).find((x) => x.url)?.url || null;
        if ((n.data?.sourceThumb || null) === wanted) return n;
        changed = true;
        return { ...n, data: { ...n.data, sourceThumb: wanted } };
      });
      return changed ? next : ns;
    });
  }, [sourcesByNode]);

  const nodeTypes = useMemo(() => ({ workflow: WorkflowNode }), []);

  const onNodesChange = useCallback((c) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c) => setEdges((e) => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback((p) => setEdges((e) => addEdge({ ...p, animated: true }, e)), []);

  const updateNodeData = useCallback((id, newData) => {
    setNodes((ns) => ns.map((n) => {
      if (n.id !== id) return n;
      const next = { ...n, data: newData };
      // Keep React Flow's stored size in sync so the card reshapes with the
      // chosen aspect ratio (handles/edges follow). Null for text/audio.
      const d = nodeDims(newData.kind, newData.aspect);
      if (d) { next.width = d.width; next.height = d.height; }
      return next;
    }));
  }, []);

  const addNode = (kind, options = {}) => {
    const d = nodeDims(kind, options.aspect);
    const W = d ? d.width : (SIZE[kind] || 304);
    const H = d ? d.height : (HEIGHT[kind] || 340);
    let pos = options.position;
    if (!pos) {
      pos = {
        x: 200 + (nodes.length % 3) * (W + 60),
        y: 80 + Math.floor(nodes.length / 3) * (H + 60),
      };
    }
    const id = nextId();
    const data = { kind, prompt: options.prompt || "" };
    if (options.model) data.model = options.model;
    if (options.aspect) data.aspect = options.aspect;
    const node = { id, type: "workflow", position: pos, data, width: W, height: H };
    setNodes((n) => [...n, node]);
    if (options.connectFrom) {
      setEdges((e) => addEdge({ source: options.connectFrom, target: id, animated: true }, e));
    }
    setSelectedId(id);
    setAddMenuOpen(false);
    // Pan the canvas to the new card so the user doesn't have to hunt for it.
    // Skipped for bulk creators (director mode) that fit-view the whole result.
    if (!options.noFocus) {
      setCenter(pos.x + W / 2, pos.y + H / 2, { zoom: Math.max(getZoom(), 0.7), duration: 500 });
    }
    return id;
  };

  const onSelectionChange = useCallback(({ nodes: selNodes }) => {
    setSelectedId(selNodes?.[0]?.id || null);
  }, []);

  const onTitleChange = (v) => {
    setName(v);
    if (workflowId) renameWorkflow(workflowId, v);
  };

  const runNode = async (id) => {
    if (runningId) return;
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    setRunningId(id);
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "running", output: null, error: null } } : n)));
    try {
      let output;
      // A connected Text node supplies the prompt when the node's own prompt
      // is empty (typed prompt always wins).
      const srcs = sourcesByNode[id] || [];
      const textPrompt = srcs.find((s) => s.kind === "text" && s.text)?.text;
      const typed = (node.data.prompt || "").trim();
      const prompt = typed || textPrompt || "";
      if (node.data.kind === "video") {
        const [aspectRatio, resolution] = (node.data.aspect || "16:9 · 720p").split("·").map((s) => s.trim());
        const dur = parseInt(node.data.duration) || 8;
        output = await generateVideo({
          prompt,
          model: node.data.model || "LTX Video", // match the prompt bar's displayed default (else falls through to Veo)
          image: node.data.sourceThumb || null,
          aspect: aspectRatio,
          resolution,
          duration: dur,
          audio: node.data.audio !== false, // audio ON by default
        });
      } else {
        // For image nodes, forward connected source image(s) → image-to-image edit.
        const images = node.data.kind === "image"
          ? srcs.filter((s) => s.kind === "image" && s.url).map((s) => s.url)
          : [];
        output = await generateOutput(node.data.kind, prompt, node.data.model, images, { voice: node.data.voice });
      }
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "done", output } } : n)));
    } catch (e) {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "error", error: e.message } } : n)));
    } finally {
      setRunningId(null);
    }
  };

  const setNodeData = (id, patch) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));

  const addEdgeBetween = (source, target) =>
    setEdges((es) => [...es, { id: `e_${source}_${target}`, source, target, animated: true }]);

  // Director mode (character-consistent): one reference image → per-scene
  // staged image (image-to-image) → image-to-video → stitch into one video.
  const runDirector = async ({ scenes, character, style, seedImage, narration, seconds }, models = {}) => {
    const list = (scenes || []).slice(0, 6);
    if (list.length < 2) return;
    // Match the user's requested total length: split it evenly across the scenes
    // (per-clip 4–10s) and use the SAME durations when stitching, so the final
    // video is ~"seconds" long — not a fixed 6s-per-clip pile-up.
    const totalSeconds = Number(seconds) > 0 ? Number(seconds) : list.length * 6;
    const perClip = Math.max(4, Math.min(10, Math.round(totalSeconds / list.length)));
    const videoModel = models.videoModel || "LTX Video";
    const IMG_MODEL = models.imageModel || "Flux 2 Pro"; // image model for reference + staging
    // Script narration: per-part voiceover of the user's exact lines (muxed onto the stitched video).
    const lines = models.narrate && Array.isArray(narration) ? narration : null;
    // Style-lock lives in the TEXT: prepend the ONE locked style spec (verbatim)
    // to every prompt so all scenes share the same art style. Each scene gets its
    // OWN seed so compositions differ (a shared seed makes near-identical prompts
    // produce near-identical images — over-consistency).
    const stylePrefix = (style || "").trim() ? `${style.trim().replace(/[.\s]+$/, "")}. ` : "";
    const styled = (p) => `${stylePrefix}${p}`;
    const baseSeed = Math.floor(Math.random() * 1_000_000_000);
    const sceneSeed = (i) => (baseSeed + (i + 1) * 7919) % 1_000_000_000; // distinct per scene, deterministic
    const colX = { ref: 40, img: 420, vid: 900, aud: 900, out: 1480 };
    const gapY = 330;
    // Drop the new graph in clean empty space BELOW existing nodes (not on top of
    // an older run), with a small margin. Then pan the user straight to it.
    const existing = nodesRef.current || [];
    const startY = existing.length
      ? Math.max(...existing.map((n) => (n.position?.y || 0) + (n.height || 340))) + 160
      : 80;
    const midY = startY + ((list.length - 1) * gapY) / 2;
    // Frame the new graph's region right away so the user is taken to it as it builds.
    const gW = colX.out + 560 - colX.ref;
    const gH = (list.length - 1) * gapY + 380;
    const focusZoom = Math.max(0.2, Math.min(0.7, Math.min(window.innerWidth / gW, window.innerHeight / gH) * 0.85));
    setCenter((colX.ref + colX.out + 525) / 2, midY + 150, { zoom: focusZoom, duration: 600 });

    // 1) Reference image (the shared character/style anchor). Use the selected
    //    image if provided ("turn this image into a video"), else generate one.
    let refUrl = seedImage || null;
    let refId = null;
    if (!refUrl && character) {
      refId = addNode("image", { prompt: styled(character), model: IMG_MODEL, aspect: "16:9 · 1080p", position: { x: colX.ref, y: midY }, noFocus: true });
      setNodeData(refId, { status: "running", output: null, error: null });
      try {
        refUrl = await generateOutput("image", styled(character), IMG_MODEL, [], { seed: baseSeed });
        setNodeData(refId, { status: "done", output: refUrl });
      } catch (e) {
        setNodeData(refId, { status: "error", error: e.message });
      }
    }

    // 2a) SEAMLESS mode: build clips SEQUENTIALLY, each starting on the previous
    //     clip's last frame → invisible transitions. Slower (can't parallelize).
    if (models.seamless) {
      const combineId = addNode("video", { prompt: "Combined video", aspect: "16:9 · 720p", position: { x: colX.out, y: midY }, noFocus: true });
      setNodeData(combineId, { status: "running" });
      let prevFrame = refUrl || null;   // clip 1 seeds from the reference image
      let prevVidId = null;
      const clips = [], audioUrls = [];
      for (let i = 0; i < list.length; i++) {
        const scene = list[i];
        const y = startY + i * gapY;
        const vidId = addNode("video", { prompt: styled(scene), model: videoModel, aspect: "16:9 · 720p", position: { x: colX.vid, y }, noFocus: true });
        if (i === 0 && refId) addEdgeBetween(refId, vidId);
        if (prevVidId) addEdgeBetween(prevVidId, vidId); // chain edge (previous clip → this one)
        addEdgeBetween(vidId, combineId);
        setNodeData(vidId, { status: "running" });
        // Optional narration for this part.
        const line = lines && typeof lines[i] === "string" ? lines[i].trim() : "";
        let audOut = null;
        if (line) {
          const audId = addNode("audio", { prompt: line, position: { x: colX.aud, y: y + 150 }, noFocus: true });
          addEdgeBetween(audId, combineId);
          setNodeData(audId, { status: "running" });
          try { audOut = await generateOutput("audio", line, undefined, [], {}); setNodeData(audId, { status: "done", output: audOut }); }
          catch (e) { setNodeData(audId, { status: "error", error: e.message }); }
        }
        try {
          const clip = await generateVideo({ prompt: styled(scene), model: videoModel, image: prevFrame || null, aspect: "16:9", resolution: "720p", duration: perClip, seed: sceneSeed(i), audio: true });
          setNodeData(vidId, { status: "done", output: clip });
          clips.push(clip);
          audioUrls.push(typeof audOut === "string" && /^https?:/.test(audOut) ? audOut : null);
          // Grab this clip's last frame to seed the next one. Fall back to the
          // current seed if extraction fails (keeps the chain going).
          const nf = await lastFrameDataUrl(clip);
          prevFrame = nf || prevFrame;
        } catch (e) {
          setNodeData(vidId, { status: "error", error: e.message });
        }
        prevVidId = vidId;
      }
      if (clips.length < 2) {
        setNodeData(combineId, { status: "error", error: "Not enough scenes generated to combine" });
        return;
      }
      try {
        const finalUrl = await combineVideos(clips, clips.map(() => perClip), undefined, lines ? audioUrls : null);
        setNodeData(combineId, { status: "done", output: finalUrl });
        fitView({ padding: 0.2, duration: 400 });
      } catch (e) {
        setNodeData(combineId, { status: "error", error: e.message });
      }
      return;
    }

    // 2b) PARALLEL mode (default): stage each scene off the shared reference
    //     (image-to-image), animate it, all at once. Faster, but hard cuts.
    const combineId = addNode("video", { prompt: "Combined video", aspect: "16:9 · 720p", position: { x: colX.out, y: midY }, noFocus: true });
    setNodeData(combineId, { status: "running" });

    const vidIds = [];
    const results = await Promise.all(
      list.map(async (scene, i) => {
        const y = startY + i * gapY;
        const vidId = addNode("video", { prompt: styled(scene), model: videoModel, aspect: "16:9 · 720p", position: { x: colX.vid, y }, noFocus: true });
        vidIds.push(vidId);
        // Staged scene image (only if we have a reference to seed from): same
        // style prefix + same character reference (→ consistent look), but its
        // OWN seed (→ this scene's composition differs from the others).
        let stagedUrl = null;
        if (refUrl) {
          const imgId = addNode("image", { prompt: styled(scene), model: IMG_MODEL, aspect: "16:9 · 1080p", position: { x: colX.img, y }, noFocus: true });
          if (refId) addEdgeBetween(refId, imgId);
          addEdgeBetween(imgId, vidId);
          setNodeData(imgId, { status: "running" });
          try {
            stagedUrl = await generateOutput("image", styled(scene), IMG_MODEL, [refUrl], { seed: sceneSeed(i) });
            setNodeData(imgId, { status: "done", output: stagedUrl });
          } catch (e) {
            setNodeData(imgId, { status: "error", error: e.message });
          }
        }
        addEdgeBetween(vidId, combineId);
        setNodeData(vidId, { status: "running" });
        // Voiceover of this part's exact script lines (script + narrate mode).
        const line = lines && typeof lines[i] === "string" ? lines[i].trim() : "";
        const audioPromise = line
          ? (async () => {
              const audId = addNode("audio", { prompt: line, position: { x: colX.aud, y: y + 150 }, noFocus: true });
              addEdgeBetween(audId, combineId);
              setNodeData(audId, { status: "running" });
              try {
                const out = await generateOutput("audio", line, undefined, [], {});
                setNodeData(audId, { status: "done", output: out });
                return out;
              } catch (e) {
                setNodeData(audId, { status: "error", error: e.message });
                return null;
              }
            })()
          : Promise.resolve(null);
        try {
          const [clip, audio] = await Promise.all([
            generateVideo({ prompt: styled(scene), model: videoModel, image: stagedUrl || null, aspect: "16:9", resolution: "720p", duration: perClip, seed: sceneSeed(i), audio: true }),
            audioPromise,
          ]);
          setNodeData(vidId, { status: "done", output: clip });
          return { clip, audio };
        } catch (e) {
          setNodeData(vidId, { status: "error", error: e.message });
          return { clip: null, audio: null };
        }
      })
    );

    // 3) Stitch the finished clips into one video (with narration audio if any).
    const kept = results.filter((r) => r && r.clip);
    const urls = kept.map((r) => r.clip);
    if (urls.length < 2) {
      setNodeData(combineId, { status: "error", error: "Not enough scenes generated to combine" });
      return;
    }
    // Only mux narration that's a hosted URL — fal compose can't take data: URIs.
    const audioUrls = lines
      ? kept.map((r) => (typeof r.audio === "string" && /^https?:/.test(r.audio) ? r.audio : null))
      : null;
    try {
      const finalUrl = await combineVideos(urls, urls.map(() => perClip), undefined, audioUrls);
      setNodeData(combineId, { status: "done", output: finalUrl });
      fitView({ padding: 0.2, duration: 400 });
    } catch (e) {
      setNodeData(combineId, { status: "error", error: e.message });
    }
  };

  // Drop-to-create wiring
  const onConnectStart = useCallback((_, params) => {
    connectingRef.current = params; // { nodeId, handleId, handleType }
  }, []);

  const onConnectEnd = useCallback((event) => {
    const conn = connectingRef.current;
    connectingRef.current = null;
    if (!conn || conn.handleType !== "source") return;
    const targetIsPane = event.target.classList?.contains("react-flow__pane");
    if (!targetIsPane) return;

    const clientX = "touches" in event ? event.changedTouches[0].clientX : event.clientX;
    const clientY = "touches" in event ? event.changedTouches[0].clientY : event.clientY;
    const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
    setPicker({ x: clientX, y: clientY, flowPos, sourceId: conn.nodeId });
  }, [screenToFlowPosition]);

  const pickType = (kind) => {
    if (!picker) return;
    const W = SIZE[kind] || 304;
    const H = HEIGHT[kind] || 340;
    addNode(kind, {
      position: { x: picker.flowPos.x, y: picker.flowPos.y - H / 2 },
      connectFrom: picker.sourceId,
    });
    setPicker(null);
  };

  const selectedNode = nodes.find((n) => n.id === selectedId);
  // Step 2 (write prompt) advances via Next, enabled only once a prompt is typed.
  const tutNextEnabled = tutStep === 2 ? !!(selectedNode?.data?.prompt || "").trim() : true;
  const selectedSources = selectedId ? (sourcesByNode[selectedId] || []) : [];
  const selectedImageUrl =
    selectedNode?.data?.kind === "image" &&
    typeof selectedNode.data.output === "string" &&
    /^(https?:|data:|\/api\/)/.test(selectedNode.data.output)
      ? selectedNode.data.output
      : null;

  if (!loaded) return <div style={{ color: "#5b6472", padding: 32 }}>Loading…</div>;

  return (
    <>
      <div className="topbar">
        <div className="title-pill">
          <button className="back-btn" onClick={() => router.push("/app")} title="Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="logo">p</div>
          <input value={name} onChange={(e) => onTitleChange(e.target.value)} />
          <span className="dot" />
        </div>
        <div className="topbar-right">
          {savedAt && <span className="save-indicator">Saved</span>}
          <button className="howitworks-btn" onClick={() => setTutStep(0)} title="Replay the tutorial">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            How it works
          </button>
          <button className="assistant-open-btn" onClick={() => setAssistantOpen(true)} title="Open AI Assistant">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"/></svg>
            Assistant
          </button>
          <div className="chip">68% <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg></div>
          <div className="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg></div>
          <div className="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></div>
          <UserMenu />
        </div>
      </div>

      <div className="rail">
        <button title="Select">{RAIL_ICONS.cursor}</button>
        <button title="Add node" data-tut="add" onClick={() => setAddMenuOpen((v) => !v)}>{RAIL_ICONS.plus}</button>
        <button title="Fit view" onClick={() => fitView({ padding: 0.3, duration: 300 })}>{RAIL_ICONS.frame}</button>
        <button title="Templates">{RAIL_ICONS.grid}</button>
        <button title="Comments">{RAIL_ICONS.chat}</button>
        <button title="Library" onClick={() => setLibraryOpen(true)}>{RAIL_ICONS.folder}</button>
        <div className="divider" />
        <button title="Undo (Ctrl+Z)" onClick={undo} disabled={!past.length} style={!past.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.undo}</button>
        <button title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!future.length} style={!future.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.redo}</button>
      </div>

      {addMenuOpen && (
        <>
          <div className="add-menu-backdrop" onClick={() => setAddMenuOpen(false)} />
          <div className="add-menu">
            <div className="add-menu-header">Content</div>
            {NODE_TYPES_META.map((t) => (
              <button key={t.kind} onClick={() => addNode(t.kind)}>
                <span className="ic">{CARD_ICONS[t.kind]}</span>
                {t.label}
              </button>
            ))}
            <div className="add-menu-sep" />
            <div className="add-menu-header">Transformation</div>
            {XFORM_META.map((x) => (
              <button key={x.key} className="add-menu-soon" disabled title="Coming soon">
                <span className="ic">{x.icon}</span>
                {x.label}
                <span className="add-menu-tag">Soon</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ width: "100vw", height: "100vh" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onSelectionChange={onSelectionChange}
          onPaneClick={() => { setSelectedId(null); setAddMenuOpen(false); }}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView={nodes.length > 0}
          fitViewOptions={{ padding: 0.3, maxZoom: 0.85 }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#c7d0de" />
        </ReactFlow>
      </div>

      {nodes.length === 0 && (
        <div className="empty">
          <h1>Add your first node to the canvas</h1>
          <p>Each node is a creative step in your workflow.</p>
          <div className="node-cards">
            {NODE_TYPES_META.map((t) => (
              <div key={t.kind} className="node-card" onClick={() => addNode(t.kind)}>
                <div className="ic">{CARD_ICONS[t.kind]}</div>
                <div className="label">
                  {t.label}
                  {t.isNew && <span className="badge-new">New</span>}
                </div>
                <div className="sub">{t.sub}</div>
              </div>
            ))}
            <div className="node-card" onClick={() => setLibraryOpen(true)}>
              <div className="ic">{RAIL_ICONS.folder}</div>
              <div className="label">Library</div>
              <div className="sub">All your generations</div>
            </div>
          </div>
        </div>
      )}

      <div className="zoom-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg></div>

      {picker && (
        <>
          <div className="dd-backdrop" onClick={() => setPicker(null)} />
          <div className="type-picker" style={{ left: picker.x + 8, top: picker.y + 8 }}>
            <div className="type-picker-header">Add connected node</div>
            {NODE_TYPES_META.map((t) => (
              <button key={t.kind} onClick={() => pickType(t.kind)}>
                <span className="ic">{CARD_ICONS[t.kind]}</span>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedNode && (
        <PromptBar
          node={selectedNode}
          sources={selectedSources}
          onChange={updateNodeData}
          onRun={() => runNode(selectedNode.id)}
          running={runningId === selectedNode.id}
        />
      )}

      {!assistantOpen && (
        <button className="assistant-fab" onClick={() => setAssistantOpen(true)} title="Open Assistant">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"/></svg>
        </button>
      )}

      <Library open={libraryOpen} onClose={() => setLibraryOpen(false)} />

      <Assistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        hasSelectedImage={!!selectedImageUrl}
        onCreateAndMaybeRun={({ kind, prompt, imageModel, videoModel }, autoRun, useSelected) => {
          // Apply the Assistant's chosen model to the matching node kind.
          const model = kind === "image" ? imageModel : kind === "video" ? videoModel : undefined;
          // "turn this image into a video" → seed a video node from the selected image
          if (kind === "video" && useSelected && selectedImageUrl && selectedId) {
            const id = addNode("video", { prompt, model: videoModel, aspect: "16:9 · 720p", connectFrom: selectedId });
            if (autoRun) setTimeout(() => runNode(id), 50);
            return;
          }
          const id = addNode(kind, { prompt, model });
          if (autoRun) setTimeout(() => runNode(id), 50);
        }}
        onDirector={(payload, models, useSelected) =>
          runDirector({ ...payload, seedImage: useSelected ? selectedImageUrl : null }, models)
        }
      />

      <CanvasTutorial
        step={tutStep}
        total={TUT_STEPS.length}
        nextEnabled={tutNextEnabled}
        onNext={() => setTutStep((s) => (s >= TUT_STEPS.length - 1 ? (closeTutorial(), null) : s + 1))}
        onBack={() => setTutStep((s) => Math.max(0, (s ?? 0) - 1))}
        onSkip={closeTutorial}
      />
    </>
  );
}

export default function Canvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
