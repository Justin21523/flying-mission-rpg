import type { PresetKind } from '../../types/game/editorPreset';

// A tiny module-level clipboard for timeline fragments (one effect, one keyframe, …). Generalizes the existing
// per-store `cameraClipboard` precedent in flightPhaseStore so copy/paste works the same way in every editor.
// `kind` gates paste so you can't paste a flight keyframe into a transformation timeline. Payloads are cloned
// on copy AND on take, so the clipboard never shares a reference with live editor state.
export interface ClipboardFragment<T = unknown> {
  kind: PresetKind;
  payload: T;
  copiedAt: number;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

let current: ClipboardFragment | null = null;

export function copyFragment<T>(kind: PresetKind, payload: T): void {
  current = { kind, payload: clone(payload), copiedAt: Date.now() };
  // Best-effort OS-clipboard mirror (cross-window/session); the in-memory fragment stays the paste source.
  try { void navigator.clipboard?.writeText(JSON.stringify(current)); } catch { /* ignore */ }
}

export function peekFragment(): ClipboardFragment | null {
  return current;
}

export function canPaste(kind: PresetKind): boolean {
  return current != null && current.kind === kind;
}

// Returns a fresh clone of the clipboard payload if the kind matches, else null.
export function takeFragmentPayload<T>(kind: PresetKind): T | null {
  if (!current || current.kind !== kind) return null;
  return clone(current.payload as T);
}

export function clearClipboard(): void {
  current = null;
}
