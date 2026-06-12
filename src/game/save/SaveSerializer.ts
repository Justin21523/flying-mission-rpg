// Batch 13 — JSON (de)serialization for saves. Never throws; deserialize returns null on malformed input
// so the caller can fall back to a default save.

export function serializeSave(data: unknown): string {
  return JSON.stringify(data);
}

export function deserializeSave(raw: string | null): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
