import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { getCombatSkills } from '../../stores/game/editorCombatStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { phaserBridge } from '../phaser/phaserBridge';
import { robotHandle } from '../destination/robotHandle';
import { hitVolumeActiveWindow } from './HitVolumeRuntime';
import { recordHitVolume } from './effects/combatDebugBus';
import { initializeCombatForZone, shutdownCombat, castSkillById, activeCombatantId, registerPlayerCombatant, update } from './CombatDirector';
import { tickZoneCombatClear, resetZoneCombatAdapter } from './ZoneCombatAdapter';

// Per-frame pump for the Combat Runtime + skill input. Registers the active combatant on mount, ticks the
// director each frame, and binds skill keys (J/K/L by default — data-driven inputBinding). Skill input is
// ignored while a Phaser mini-game overlay or dialogue is open. Mounted only in combat phases (the parent
// layer is phase-gated), so heavy combat work stops outside the zone.
export const CombatRuntimeHost = () => {
  useEffect(() => {
    initializeCombatForZone();
    resetZoneCombatAdapter();
    return () => shutdownCombat();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (phaserBridge.isOpen() || useDialogueStore.getState().isActive) return;
      const skill = getCombatSkills().find((s) => s.enabled !== false && s.inputBinding === e.code);
      if (!skill) return;
      // Make sure the combatant is registered (control may have switched).
      registerPlayerCombatant(activeCombatantId());
      const outcome = castSkillById(skill.id);
      if (outcome?.ok) {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        recordHitVolume({
          def: skill.hitVolume,
          x: robotHandle.pos.x,
          z: robotHandle.pos.z,
          headingRad: robotHandle.heading,
          untilMs: now + hitVolumeActiveWindow(skill.hitVolume) * 1000 + 200,
          color: skill.editorMeta?.themeColor ?? skill.hitVolume.debugColor ?? '#ffffff',
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useFrame((_, dt) => { update(Math.min(0.05, dt)); tickZoneCombatClear(); });

  return null;
};
