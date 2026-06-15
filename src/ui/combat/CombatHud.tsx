import { useUiStore } from '../../stores/uiStore';
import { useDevStore } from '../../stores/devStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { useEditorCombatSkillStore } from '../../stores/game/editorCombatStore';
import { cooldownFraction } from '../../game/combat/CooldownManager';
import { useNowMs } from '../../game/combat/useNowMs';

// Combat HUD — HP / Shield / Energy bars for the active combatant, skill cooldown chips, and the latest
// damage result. A debug strip (game-state console / Edit Mode) surfaces the debug flags + target count.
const Bar = ({ value, max, color, bg, label }: { value: number; max: number; color: string; bg: string; label: string }) => {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded" style={{ background: bg }}>
        <div className="h-full rounded transition-[width] duration-150" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <span className="w-14 text-right text-[10px] tabular-nums text-slate-300">{Math.round(value)}/{max}</span>
    </div>
  );
};

export const CombatHud = () => {
  const editMode = useUiStore((s) => s.editMode);
  const fsmDebug = useDevStore((s) => s.fsmDebug);
  const activeId = useCombatStore((s) => s.activeCombatantId);
  const statsById = useCombatStore((s) => s.playerStatsByCharacterId);
  const cooldowns = useCombatStore((s) => s.activeCooldowns);
  const lastResults = useCombatStore((s) => s.lastDamageResults);
  // Select primitives individually — an inline object selector returns a new reference every render and
  // triggers Zustand's "getSnapshot should be cached" infinite loop.
  const godMode = useCombatStore((s) => s.godMode);
  const ignoreEnergyCost = useCombatStore((s) => s.ignoreEnergyCost);
  const ignoreCooldown = useCombatStore((s) => s.ignoreCooldown);
  const showHitVolumes = useCombatStore((s) => s.showHitVolumes);
  const skills = useEditorCombatSkillStore((s) => s.items);

  const stats = activeId ? statsById[activeId] : undefined;
  const now = useNowMs(150);
  const last = lastResults[0];
  // Subscribe to the target-set version so the live count re-renders on spawn/defeat.
  useCombatTargetStore((s) => s.version);
  const liveCount = liveTargets.filter((t) => !t.defeatedAt).length;

  if (!stats) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 w-[420px] -translate-x-1/2 rounded-xl border border-slate-600/40 bg-slate-900/80 p-3 text-slate-100 shadow-lg backdrop-blur">
      <div className="space-y-1">
        <Bar label="HP" value={stats.hp} max={stats.maxHp} color="#22c55e" bg="#3f1d1d" />
        {stats.maxShield > 0 && <Bar label="Shield" value={stats.shield} max={stats.maxShield} color="#38bdf8" bg="#1e3a5f" />}
        <Bar label="Energy" value={stats.energy} max={stats.maxEnergy} color="#facc15" bg="#3a3413" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {skills.filter((s) => s.enabled !== false).map((s) => {
          const frac = cooldownFraction(cooldowns, s.id, now, s.cooldownSeconds);
          const ready = frac <= 0;
          return (
            <div key={s.id} className={`relative overflow-hidden rounded px-2 py-1 text-[10px] ${ready ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {!ready && <div className="absolute inset-0 bg-slate-900/70" style={{ width: `${frac * 100}%` }} />}
              <span className="relative">{s.inputBinding.replace('Key', '')} · {s.editorMeta?.displayName ?? s.name}</span>
            </div>
          );
        })}
      </div>

      {last && (
        <div className="mt-1 text-[10px] text-slate-400">
          last: <span className="text-slate-200">{last.finalAmount}</span>
          {last.wasWeaknessHit && <span className="text-amber-400"> weakness</span>}
          {last.wasResisted && <span className="text-sky-400"> resisted</span>}
          {last.wasImmune && <span className="text-slate-500"> immune</span>}
          {last.shieldBroken && <span className="text-cyan-300"> shield-break</span>}
          {last.targetDefeated && <span className="text-emerald-400"> defeated</span>}
        </div>
      )}

      {(fsmDebug || editMode) && (
        <div className="mt-1 border-t border-slate-700/60 pt-1 text-[10px] text-slate-500">
          combatant: {activeId ?? '—'} · targets: {liveCount}
          {godMode && <span className="text-fuchsia-400"> · GOD</span>}
          {ignoreEnergyCost && <span> · ∞energy</span>}
          {ignoreCooldown && <span> · no-cd</span>}
          {showHitVolumes && <span> · hitvol</span>}
        </div>
      )}
    </div>
  );
};
