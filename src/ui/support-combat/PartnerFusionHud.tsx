import { useFusionRuntimeStore } from '../../stores/game/useFusionRuntimeStore';
import { fusionsForPrimary } from '../../stores/game/useFusionEditorStore';
import { canCastFusion } from '../../game/support-combat/PartnerFusionDirector';
import { activeCombatantId } from '../../game/combat/CombatDirector';
import { useNowMs } from '../../game/combat/useNowMs';

// Partner Fusion HUD (Batch I) — sync gauge + the active hero's fusion charges + ready state. Press F to fire.
export const PartnerFusionHud = () => {
  useNowMs(200);
  const sync = useFusionRuntimeStore((s) => s.syncGauge);
  const gaugeMax = useFusionRuntimeStore((s) => s.gaugeMax);
  const byId = useFusionRuntimeStore((s) => s.byId);
  const charId = activeCombatantId();
  const fusions = fusionsForPrimary(charId);
  if (fusions.length === 0) return null;
  const frac = Math.max(0, Math.min(1, sync / gaugeMax));

  return (
    <div className="pointer-events-none fixed bottom-44 left-1/2 z-30 w-[300px] -translate-x-1/2 rounded-xl border border-fuchsia-500/30 bg-slate-900/80 p-2 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-semibold uppercase tracking-wide text-fuchsia-300">⚡ Fusion · press F</span>
        <span className="text-slate-400">Sync {Math.round(frac * 100)}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-slate-800">
        <div className="h-full bg-fuchsia-500" style={{ width: `${frac * 100}%` }} />
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {fusions.map((f) => {
          const e = byId[f.id];
          const ready = canCastFusion(f.id).ok;
          return (
            <span key={f.id} className={`rounded px-1.5 py-0.5 text-[9px] ${ready ? 'bg-fuchsia-700 text-white' : 'bg-slate-800 text-slate-400'}`} title={`${f.name} — needs ${f.supportCharacterId.replace('char_', '')} support`}>
              {f.name} · {e?.charges ?? 0}×
            </span>
          );
        })}
      </div>
    </div>
  );
};
