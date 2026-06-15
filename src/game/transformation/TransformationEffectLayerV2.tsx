import { txFrame, useTxVersion } from './transformationRuntime';
import { getEffectEntry } from './effects/registry';
import './effects/registryEntries'; // side-effect: register all effect types
import type { ActiveEffectV2 } from '../../types/game/transformationEffects';

// Host for the registry-driven v2 effects. Mirrors TransformationEffects: reads the active v2 effect set from
// the shared snapshot, re-rendering only when the SET changes (useTxVersion, bumped by the director/preview),
// and mounts each effect's registered Renderer keyed by effectId so mount/unmount = clean create/cleanup.
const EffectVizV2 = ({ fx }: { fx: ActiveEffectV2 }) => {
  const entry = getEffectEntry(fx.config.effectType);
  if (!entry) return null;
  const Renderer = entry.Renderer;
  return <Renderer fx={fx} />;
};

export const TransformationEffectLayerV2 = () => {
  useTxVersion((s) => s.v);
  const active = txFrame.snapshot?.activeEffectsV2 ?? [];
  return (
    <>
      {active.map((fx) => (
        <EffectVizV2 key={fx.config.effectId} fx={fx} />
      ))}
    </>
  );
};
