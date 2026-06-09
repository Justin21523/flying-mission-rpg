import { EDITOR_CONTENT_DOMAINS, EDITOR_STORES } from '../game/editor/editorContentRegistry';
import { useUiStore } from './uiStore';
import { useSceneEditStore } from './sceneEditStore';
import { useWorldSelectStore } from './worldSelectStore';

// POLI — a global, snapshot-based Undo/Redo for ALL authoring edits. The kit's per-store history only covered
// the sceneEdit gizmo + terrain, so Ctrl+Z did nothing for crosswalks, road nodes, portals, map points, tab
// fields, etc. This subscribes to every editor-content store and, after each change (debounced), records a
// full snapshot of all editor domains. Ctrl+Z steps back through those snapshots so undo "always works".

const UNDO_DOMAIN_IDS = new Set([
  'sceneEdit', 'modelStudio', 'editorEnvironment', 'editorTrigger', 'editorNpc', 'editorQuest', 'editorEncounter',
  'editorActivity', 'editorPoliCharacter', 'editorLandmark', 'editorIncident', 'editorRandomEvent', 'editorTraffic',
  'editorTool', 'editorWorld', 'editorLayout', 'editorCollectible', 'editorPortal', 'editorBoost', 'editorResearch',
]);
const domains = () => EDITOR_CONTENT_DOMAINS.filter((d) => UNDO_DOMAIN_IDS.has(d.id));

const LIMIT = 40;
const DEBOUNCE_MS = 400;
const APPLYING_MS = 550; // ignore the store changes our own restore() causes

let stack: string[] = [];
let index = -1;
let applying = false;
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function snapshot(): string {
  const o: Record<string, unknown> = {};
  for (const d of domains()) { try { o[d.id] = d.serialize(); } catch { /* ignore */ } }
  return JSON.stringify(o);
}
function restore(json: string): void {
  let o: Record<string, unknown>;
  try { o = JSON.parse(json) as Record<string, unknown>; } catch { return; }
  for (const d of domains()) { if (d.id in o) { try { d.deserialize(o[d.id]); } catch { /* ignore */ } } }
  // The restored objects may no longer exist — drop any stale selection so the gizmo doesn't dangle.
  useSceneEditStore.getState().clearSelection();
  useWorldSelectStore.getState().select(null);
}

function recordNow(): void {
  const snap = snapshot();
  if (index >= 0 && stack[index] === snap) return; // unchanged
  stack = stack.slice(0, index + 1);
  stack.push(snap);
  if (stack.length > LIMIT) stack = stack.slice(stack.length - LIMIT);
  index = stack.length - 1;
}

// Subscribe once; record (debounced) on any editor edit made in Edit Mode.
export function initEditorUndo(): void {
  if (started) return;
  started = true;
  recordNow(); // baseline (index 0)
  const onChange = () => {
    if (applying || !useUiStore.getState().editMode) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; if (!applying) recordNow(); }, DEBOUNCE_MS);
  };
  for (const s of EDITOR_STORES) s.subscribe(onChange);
}

export function editorUndo(): boolean {
  if (timer) { clearTimeout(timer); timer = null; recordNow(); } // flush a pending change first
  if (index <= 0) return false;
  index--;
  applying = true;
  restore(stack[index]);
  setTimeout(() => { applying = false; }, APPLYING_MS);
  return true;
}

export function editorRedo(): boolean {
  if (index >= stack.length - 1) return false;
  index++;
  applying = true;
  restore(stack[index]);
  setTimeout(() => { applying = false; }, APPLYING_MS);
  return true;
}
