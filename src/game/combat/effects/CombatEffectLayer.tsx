import { useCombatStore } from '../../../stores/game/useCombatStore';
import { getCombatEffect } from '../../../stores/game/editorCombatStore';
import { GeometryEffectRenderer } from './GeometryEffectRenderer';
import { ModelComponentEffectRunner } from './ModelComponentEffectRunner';

// Renders all active combat effect instances (driven by CombatEffectDirector). Picks the geometry renderer
// or the model-component runner per effect def. Instances are removed by CombatDirector.update (cleanupExpired).
export const CombatEffectLayer = () => {
  const effects = useCombatStore((s) => s.activeEffects);
  return (
    <>
      {effects.map((inst) => {
        const def = getCombatEffect(inst.effectDefId);
        if (!def) return null;
        if (def.effectType === 'model-component-motion') {
          return <ModelComponentEffectRunner key={inst.instanceId} instance={inst} def={def} />;
        }
        if (def.geometry) {
          return <GeometryEffectRenderer key={inst.instanceId} instance={inst} def={def} />;
        }
        return null;
      })}
    </>
  );
};
