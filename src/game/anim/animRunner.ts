import type { AnimRule } from '../../types/character';

// Shared animation-rule evaluation for the player + NPCs. Given the live state, returns whether a rule's
// trigger matches; callers pick the highest-priority matching rule and crossfade to its clip.
export interface AnimState {
  speed: number;
  moving: boolean;
  sprinting?: boolean;
  flying?: boolean;
  form?: 'vehicle' | 'robot';
  ability?: boolean;
  keyDown?: (code: string) => boolean;
}

export function ruleMatches(r: AnimRule, s: AnimState): boolean {
  if (r.speedMin != null && s.speed < r.speedMin) return false;
  if (r.speedMax != null && s.speed > r.speedMax) return false;
  switch (r.trigger) {
    case 'always': return true;
    case 'idle': return !s.moving && !s.flying;
    case 'moving': return s.moving;
    case 'sprinting': return !!s.sprinting;
    case 'flying': return !!s.flying;
    case 'vehicle': return s.form === 'vehicle';
    case 'robot': return s.form === 'robot';
    case 'ability': return !!s.ability;
    case 'key': return !!r.key && !!s.keyDown?.(r.key);
    default: return false;
  }
}

// Highest-priority looping rule that matches AND has a clip present in `hasClip`.
export function pickLoopRule(rules: AnimRule[], s: AnimState, hasClip: (clip: string) => boolean): AnimRule | null {
  let best: AnimRule | null = null;
  let bestP = -Infinity;
  for (const r of rules) {
    if (r.once || !hasClip(r.clip)) continue;
    if (!ruleMatches(r, s)) continue;
    const p = r.priority ?? 0;
    if (p > bestP) { bestP = p; best = r; }
  }
  return best;
}
