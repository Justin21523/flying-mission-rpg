import type { ComboSkillDefinition } from '../../types/game/characterKit';
import type { ComboCast } from '../../stores/game/useCharacterSkillStore';

// Pure combo detection (Batch D-kits). Given the recent cast buffer (incl. the just-cast skill as the last
// entry) + the character's combos, return the combo whose inputSequence matches the tail of the buffer with
// every gap ≤ maxInputGapSeconds (and requiredPreviousSkillId satisfied). Unit-testable.

export function detectCombo(recentCasts: ComboCast[], combos: ComboSkillDefinition[]): ComboSkillDefinition | null {
  if (recentCasts.length === 0) return null;
  const lastId = recentCasts[recentCasts.length - 1].skillId;
  for (const combo of combos) {
    const seq = combo.inputSequence;
    if (seq.length === 0) continue;
    if (seq[seq.length - 1] !== lastId) continue;
    if (recentCasts.length < seq.length) continue;
    const tail = recentCasts.slice(-seq.length);
    let ok = true;
    for (let i = 0; i < seq.length; i++) {
      if (tail[i].skillId !== seq[i]) { ok = false; break; }
      if (i > 0) {
        const gap = (tail[i].t - tail[i - 1].t);
        if (gap > combo.maxInputGapSeconds) { ok = false; break; }
      }
    }
    if (!ok) continue;
    if (combo.requiredPreviousSkillId && tail[tail.length - 2]?.skillId !== combo.requiredPreviousSkillId) continue;
    return combo;
  }
  return null;
}
