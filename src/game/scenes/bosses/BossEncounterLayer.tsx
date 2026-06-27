import { BossHost } from './BossHost';
import { BossRenderer } from './BossRenderer';
import { BossArenaRenderer } from './BossArenaRenderer';
import { BossWeakpointRenderer } from './BossWeakpointRenderer';
import { BossSignatureHazardRenderer } from './BossSignatureHazardRenderer';

// In-Canvas boss encounter layer (Batch F) — the per-frame BossDirector pump + the model-first renderers
// (boss body, arena boundary, weakpoint markers). Attack warnings/executions render through the existing
// CombatEffectLayer (geometry fx via playEffect). Mounted inside CombatRuntimeLayer (combat phases).
export const BossEncounterLayer = () => (
  <>
    <BossHost />
    <BossArenaRenderer />
    <BossRenderer />
    <BossWeakpointRenderer />
    <BossSignatureHazardRenderer />
  </>
);
