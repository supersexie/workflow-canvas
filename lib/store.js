"use client";

const KEY = "wfc:workflows:v1";

function read() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(all) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function listWorkflows() {
  const all = read();
  return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getWorkflow(id) {
  return read()[id] || null;
}

export function createWorkflow(name = "Untitled Workflow") {
  const all = read();
  const id = uid();
  const now = Date.now();
  all[id] = {
    id,
    name,
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
  };
  write(all);
  return all[id];
}

export function saveWorkflow(wf) {
  const all = read();
  all[wf.id] = { ...wf, updatedAt: Date.now() };
  write(all);
}

export function renameWorkflow(id, name) {
  const all = read();
  if (!all[id]) return;
  all[id].name = name;
  all[id].updatedAt = Date.now();
  write(all);
}

export function deleteWorkflow(id) {
  const all = read();
  delete all[id];
  write(all);
}
