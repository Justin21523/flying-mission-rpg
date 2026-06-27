import type { SkillTimelineEvent, CombatSkillDefinition } from '../../types/game/combat';
import { previewEffect } from '../vfx/CinematicVfxDirector';
import { playTimelineSound } from '../audio/playTimelineSound';

// Schedule a skill's authored timeline: fire each enabled event at its timeSeconds via setTimeout (consistent
// with the existing wall-clock, fire-and-forget combat-effect model). Returns a cancel fn that clears pending
// timers. The caller supplies how to fire an effect / a sound, so the SAME scheduler serves both the editor
// preview (robot anchor) and live combat (caster anchor).
export interface SkillTimelineHandlers {
  onEffect: (effectDefinitionId: string) => void;
  onSound: (soundId: string) => void;
}

export function scheduleSkillTimeline(events: SkillTimelineEvent[], h: SkillTimelineHandlers): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  for (const e of events) {
    if (!e.enabled) continue;
    const fire = () => {
      if (e.kind === 'effect' && e.effectDefinitionId) h.onEffect(e.effectDefinitionId);
      else if (e.kind === 'sound' && e.soundId) h.onSound(e.soundId);
    };
    timers.push(setTimeout(fire, Math.max(0, e.timeSeconds) * 1000));
  }
  return () => { for (const t of timers) clearTimeout(t); };
}

let cancelPreview: (() => void) | null = null;

// Editor preview: play the whole timeline in real time at the robot/preview anchor. Cancels any prior run so
// rapid clicks don't stack.
export function playSkillTimelinePreview(skill: CombatSkillDefinition): void {
  cancelPreview?.();
  cancelPreview = scheduleSkillTimeline(skill.timelineEvents ?? [], {
    onEffect: (id) => { previewEffect(id); },
    onSound: (sid) => { playTimelineSound(sid); },
  });
}
