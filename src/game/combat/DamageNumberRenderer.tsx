import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { type Group } from 'three';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { drainCombatHits, type CombatHitEvent } from '../../stores/game/combatTargetStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getVfxPerformanceBudget } from '../vfx/VfxPerformanceBudget';

// Pooled rising damage numbers (reuses the KillFxLayer circular-buffer pattern: fixed slots, head pointer,
// no per-frame allocation). Drains combat hit events each frame; weakness hits are amber, crits larger.
const POPUPS = 12;
const LIFE = 0.9;

interface Slot { active: boolean; t: number; x: number; y: number; z: number }

export const DamageNumberRenderer = () => {
  const show = useCombatStore((s) => s.showDamageNumbers);
  const damageNumbers = useSettingsStore((s) => s.damageNumbers);
  const groups = useRef<(Group | null)[]>(Array.from({ length: POPUPS }, () => null));
  const texts = useRef<(({ text: string } | null))[]>(Array.from({ length: POPUPS }, () => null));
  const slots = useRef<Slot[]>(Array.from({ length: POPUPS }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0 })));
  const head = useRef(0);
  const drained = useRef<CombatHitEvent[]>([]);

  useFrame((_, dt) => {
    if (!show || damageNumbers === 'off') {
      drainCombatHits(drained.current);
      return;
    }
    const n = drainCombatHits(drained.current);
    const budget = Math.min(POPUPS, damageNumbers === 'minimal' ? 3 : getVfxPerformanceBudget().maxDamageNumbers);
    for (let k = 0; k < Math.min(n, budget); k++) {
      const e = drained.current[k];
      const i = head.current % POPUPS; head.current++;
      slots.current[i] = { active: true, t: 0, x: e.x, y: e.y + 2.6, z: e.z };
      const txt = texts.current[i];
      if (txt) txt.text = `${e.crit ? '✦' : ''}${e.amount}${e.weakness ? '!' : ''}`;
    }
    for (let i = 0; i < POPUPS; i++) {
      const s = slots.current[i];
      const g = groups.current[i];
      if (!g) continue;
      if (!s.active) { g.visible = false; continue; }
      s.t += dt;
      if (s.t >= LIFE) { s.active = false; g.visible = false; continue; }
      g.visible = true;
      g.position.set(s.x, s.y + s.t * 1.6, s.z);
    }
  });

  if (!show || damageNumbers === 'off') return null;
  return (
    <>
      {Array.from({ length: POPUPS }, (_, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }} visible={false}>
          <Text ref={(el) => { texts.current[i] = el as unknown as { text: string } | null; }} fontSize={0.7} color="#fde047" anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000">
            0
          </Text>
        </group>
      ))}
    </>
  );
};
