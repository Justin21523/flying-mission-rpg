import type { DialogueCondition } from '../dialogue';

// A region groups world locations on the map (the managed map system). Authored in the 🗺 Map tab; used to
// filter the runtime Mission Control map and to gate access. Abstract — not a real-scale geography.
export interface Region {
  id: string;
  name: string;
  color: string; // hex — pin tint + filter chip
  description?: string;
  order?: number; // sort order in lists / filter chips
  unlocked?: boolean; // false = manual HARD lock (overrides conditions); default true
  // ── progress-driven unlock (evaluated live) ──
  requiredMissionIds?: string[]; // unlock once these missions are complete (mission:<id>:done flags)
  unlockConditions?: DialogueCondition[]; // general gate (world flag / quest / trust / level …) — ALL must pass
}
