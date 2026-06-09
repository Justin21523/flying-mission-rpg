import { useEffect, useRef } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useYokaiDirectorStore } from '../../stores/yokaiDirectorStore';
import { useEditorActivityStore } from '../../stores/editorActivityStore';
import { SEED_ACTIVITIES } from '../../data/activities';
import type { EditorActivity } from '../../types/activity';

// POLI yokai-hunt (Phase D) — the random director. Mounted in App (DOM, like IncidentDirector). On its own
// interval it starts an eligible enemyRush activity in the player's CURRENT area and jumps straight to the
// running phase, so a yokai swarm "randomly appears" while you play. Disabled in Edit Mode. Hunts can also be
// started manually via the `startActivity` dialogue effect (NPC / marker) — no code needed for that.

// All candidate hunts = editor-authored activities first, then the seed samples (deduped by id).
function allActivities(): EditorActivity[] {
  const authored = useEditorActivityStore.getState().activities;
  const ids = new Set(authored.map((a) => a.def.id));
  return [...authored, ...SEED_ACTIVITIES.filter((a) => !ids.has(a.def.id))];
}

export const YokaiDirector = () => {
  const nextAt = useRef(0);
  useEffect(() => {
    const tick = () => {
      const cfg = useYokaiDirectorStore.getState();
      if (!cfg.enabled) return;
      if (useUiStore.getState().editMode) return;
      if (useActivityStore.getState().isActive) return;
      const t = Date.now() / 1000;
      if (t < nextAt.current) return;
      nextAt.current = t + Math.max(8, cfg.intervalSec);
      if (Math.random() > cfg.chance) return;
      const area = usePlayerStore.getState().currentAreaId;
      const cands = allActivities().filter((a) => a.def.activityType === 'enemyRush' && a.def.zoneId === area);
      if (cands.length === 0) return;
      const pick = cands[Math.floor(Math.random() * cands.length)];
      if (useActivityStore.getState().startActivity(pick.def.id)) {
        useActivityStore.getState().begin(); // jump straight to the running swarm
      }
    };
    // First possible hunt one interval from load.
    nextAt.current = Date.now() / 1000 + Math.max(8, useYokaiDirectorStore.getState().intervalSec);
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);
  return null;
};
