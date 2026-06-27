import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { getCombatSkills, getSkillsForCharacter } from '../../stores/game/editorCombatStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { phaserBridge } from '../phaser/phaserBridge';
import { robotHandle } from '../destination/robotHandle';
import { hitVolumeActiveWindow } from './HitVolumeRuntime';
import { recordHitVolume } from './effects/combatDebugBus';
import { initializeCombatForZone, shutdownCombat, castSkillById, activeCombatantId, registerPlayerCombatant, update, tryExecuteNearest } from './CombatDirector';
import { tickZoneCombatClear, resetZoneCombatAdapter } from './ZoneCombatAdapter';
import { SLOT_KEYS } from './skillSlots';
import { hasKit, castArsenalAbilityBySlot, loadKitForCharacter } from '../character-skills/CharacterSkillKitDirector';
import { routeActionKey, useAbilityPageStore } from '../character-skills/abilityPages';
import { initFusionsForZone, castPartnerFusion } from '../support-combat/PartnerFusionDirector';

// Per-frame pump for the Combat Runtime + skill input. Registers the active combatant on mount, ticks the
// director each frame, and binds the active character's skills by slot (Z/X/Y/H/B/N). A skill without an
// owner/slot can still be bound by its explicit inputBinding. Skill input is ignored while a Phaser overlay
// or dialogue is open, or while a modifier is held (editor shortcuts). Mounted only in combat phases.
export const CombatRuntimeHost = () => {
  useEffect(() => {
    initializeCombatForZone();
    resetZoneCombatAdapter();
    initFusionsForZone(); // Batch I — reset partner-fusion charges/gauge for this zone
    return () => shutdownCombat();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (phaserBridge.isOpen() || useDialogueStore.getState().isActive) return;
      const charId = activeCombatantId();

      // Batch F.5 — paged ability input: Ctrl cycles the active ability page (handled before the modifier
      // guard, so the Control keydown itself switches the page in combat).
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        if (charId && hasKit(charId)) { useAbilityPageStore.getState().cyclePage(); return; }
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return; // let editor shortcuts (Ctrl+Z/Y …) through

      // Batch I — Partner Fusion (F): fire the synchronized combo if a partner is present + the gauge is full.
      if (e.code === 'KeyF') { if (charId) castPartnerFusion(charId); return; }

      // Wave 2 — Execution (E): finish the nearest low-HP / poise-broken enemy for a cinematic + resource refund.
      if (e.code === 'KeyE') { tryExecuteNearest(robotHandle.pos.x, robotHandle.pos.z); return; }

      // Kit characters: the 4 action keys (4 / 5 / Z / X) cast the current page's ability set (so combos +
      // utility fire); Ctrl pages through all 11 abilities. Non-kit heroes keep the generic slot scan.
      if (charId && hasKit(charId)) {
        const abilitySlot = routeActionKey(e.code, useAbilityPageStore.getState().page);
        if (abilitySlot) { loadKitForCharacter(charId); castArsenalAbilityBySlot(charId, abilitySlot); }
        return;
      }

      // Prefer the active character's slotted skill bar; fall back to an explicit inputBinding (Batch B).
      const slot = SLOT_KEYS[e.code];
      const skill = (slot ? getSkillsForCharacter(charId).find((s) => s.slot === slot) : undefined)
        ?? getCombatSkills().find((s) => s.enabled !== false && s.inputBinding === e.code);
      if (!skill) return;
      // Make sure the combatant is registered (control may have switched).
      registerPlayerCombatant(charId);
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
    return () => { window.removeEventListener('keydown', onKey); useAbilityPageStore.getState().reset(); };
  }, []);

  useFrame((_, dt) => { update(Math.min(0.05, dt)); tickZoneCombatClear(); });

  return null;
};
