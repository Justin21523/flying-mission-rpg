import { useFrame } from '@react-three/fiber';
import { getEffectEntry } from '../transformation/effects/registry';
import '../transformation/effects/registryEntries'; // side-effect: register all effect renderers
import type { ActiveEffectV2 } from '../../types/game/transformationEffects';
import { activeCombatFx, tickCinematicVfx, useCinematicVfxStore } from './cinematicVfxRuntime';
import { decayCombatCameraFx } from './combatCameraFx';

// In-Canvas host for COMBAT cinematic effects (Batch F.5). Renders each live combat effect layer via the SAME
// V2 registry renderers the transformation system uses (one unified runtime), and ticks progress/anchors +
// camera-fx decay each frame. Re-renders only when the SET changes (version bump); per-frame state is mutated
// in place. Mounted in CombatRuntimeLayer (combat phases).
const CombatFxViz = ({ fx }: { fx: ActiveEffectV2 }) => {
  const entry = getEffectEntry(fx.config.effectType);
  if (!entry) return null;
  const Renderer = entry.Renderer;
  return <Renderer fx={fx} />;
};

export const CinematicVfxLayer = () => {
  useCinematicVfxStore((s) => s.version);
  useFrame((_, dt) => {
    tickCinematicVfx();
    decayCombatCameraFx(Math.min(0.05, dt));
  });
  return (
    <>
      {activeCombatFx.map((fx) => (
        <CombatFxViz key={fx.config.effectId} fx={fx} />
      ))}
    </>
  );
};
