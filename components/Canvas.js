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
import { getWorkflow, saveWorkflow, renameWorkflow } from "@/lib/store";
import { generateOutput, generateVideo } from "@/lib/run";

const NODE_TYPES_META = [
  { kind: "image", label: "Image", sub: "Generate or upload" },
  { kind: "video", label: "Video", sub: "Generate or upload" },
  { kind: "text", label: "Text", sub: "Write or generate" },
  { kind: "audio", label: "Audio", sub: "Generate or upload" },
  { kind: "motion", label: "Motion", sub: "Motion Graphics", isNew: true },
];

const CARD_ICONS = {
  image: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>,
  video: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>,
  text: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7V5h16v2M9 19h6M12 5v14" /></svg>,
  audio: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5 6 9H2v6h4l5 4V5z"/></svg>,
  motion: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor" /></svg>,
};

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
  const { screenToFlowPosition, fitView } = useReactFlow();
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
    if (!wf) { router.replace("/"); return; }
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
    setName(wf.name || "Untitled Workflow");
    setLoaded(true);
  }, [workflowId, router]);

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
      if (out && typeof out === "string" && (out.startsWith("http") || out.startsWith("data:"))) {
        (map[e.target] ||= []).push({ id: src.id, kind: src.data.kind, url: out });
      }
    }
    return map;
  }, [nodes, edges]);

  // Sync sourceThumb into each node's data (so the node renders it)
  useEffect(() => {
    setNodes((ns) => {
      let changed = false;
      const next = ns.map((n) => {
        const wanted = sourcesByNode[n.id]?.[0]?.url || null;
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
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: newData } : n)));
  }, []);

  const addNode = (kind, options = {}) => {
    const W = SIZE[kind] || 304;
    const H = HEIGHT[kind] || 340;
    let pos = options.position;
    if (!pos) {
      pos = {
        x: 200 + (nodes.length % 3) * (W + 60),
        y: 80 + Math.floor(nodes.length / 3) * (H + 60),
      };
    }
    const id = nextId();
    const node = { id, type: "workflow", position: pos, data: { kind, prompt: options.prompt || "" }, width: W, height: H };
    setNodes((n) => [...n, node]);
    if (options.connectFrom) {
      setEdges((e) => addEdge({ source: options.connectFrom, target: id, animated: true }, e));
    }
    setSelectedId(id);
    setAddMenuOpen(false);
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
      if (node.data.kind === "video") {
        const [aspectRatio, resolution] = (node.data.aspect || "16:9 · 720p").split("·").map((s) => s.trim());
        let dur = parseInt(node.data.duration) || 8;
        dur = dur <= 4 ? 4 : dur <= 6 ? 6 : 8;
        output = await generateVideo({
          prompt: node.data.prompt,
          model: node.data.model,
          image: node.data.sourceThumb || null,
          aspect: aspectRatio,
          resolution,
          duration: dur,
        });
      } else {
        output = await generateOutput(node.data.kind, node.data.prompt, node.data.model);
      }
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "done", output } } : n)));
    } catch (e) {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, status: "error", error: e.message } } : n)));
    } finally {
      setRunningId(null);
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
  const selectedSources = selectedId ? (sourcesByNode[selectedId] || []) : [];

  if (!loaded) return <div style={{ color: "#737373", padding: 32 }}>Loading…</div>;

  return (
    <>
      <div className="topbar">
        <div className="title-pill">
          <button className="back-btn" onClick={() => router.push("/")} title="Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="logo">p</div>
          <input value={name} onChange={(e) => onTitleChange(e.target.value)} />
          <span className="dot" />
        </div>
        <div className="topbar-right">
          {savedAt && <span className="save-indicator">Saved</span>}
          <button className="assistant-open-btn" onClick={() => setAssistantOpen(true)} title="Open AI Assistant">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"/></svg>
            Assistant
          </button>
          <div className="chip">68% <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg></div>
          <div className="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg></div>
          <div className="avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></svg></div>
          <div className="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></div>
        </div>
      </div>

      <div className="rail">
        <button title="Select">{RAIL_ICONS.cursor}</button>
        <button title="Add node" onClick={() => setAddMenuOpen((v) => !v)}>{RAIL_ICONS.plus}</button>
        <button title="Fit view" onClick={() => fitView({ padding: 0.3, duration: 300 })}>{RAIL_ICONS.frame}</button>
        <button title="Templates">{RAIL_ICONS.grid}</button>
        <button title="Comments">{RAIL_ICONS.chat}</button>
        <button title="Assets">{RAIL_ICONS.folder}</button>
        <div className="divider" />
        <button title="Undo (Ctrl+Z)" onClick={undo} disabled={!past.length} style={!past.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.undo}</button>
        <button title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!future.length} style={!future.length ? { opacity: .3, cursor: "not-allowed" } : null}>{RAIL_ICONS.redo}</button>
      </div>

      {addMenuOpen && (
        <div className="add-menu">
          {NODE_TYPES_META.map((t) => (
            <button key={t.kind} onClick={() => addNode(t.kind)}>
              <span className="ic">{CARD_ICONS[t.kind]}</span>
              {t.label}
            </button>
          ))}
        </div>
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
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#1f1f1f" />
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

      <Assistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onCreateAndMaybeRun={({ kind, prompt }, autoRun) => {
          const id = addNode(kind, { prompt });
          if (autoRun) setTimeout(() => runNode(id), 50);
        }}
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
