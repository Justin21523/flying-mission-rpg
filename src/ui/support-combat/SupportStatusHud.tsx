import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { useNowMs } from '../../game/combat/useNowMs';

// Compact support status HUD (Batch E) — shows live shield/decoy support effects so the player knows a dome
// or decoy is active. Reads the support-combat store's activeSupportEffects (ticked by the director).
export const SupportStatusHud = () => {
  const now = useNowMs(250);
  useSupportCombatStore((s) => s.version);
  const effects = Object.values(useSupportCombatStore.getState().activeSupportEffects).filter((e) => e.untilMs > now);
  if (effects.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-72 z-30 flex flex-col gap-1">
      {effects.map((e) => {
        const secs = Math.ceil((e.untilMs - now) / 1000);
        const label = e.effectType === 'shield' ? `🛡 Shield Dome ${Math.round((e.amount ?? 0) * 100)}%` : e.effectType === 'spawn-cover' ? '🧱 Cover' : '✦ Support';
        return (
          <div key={e.id} className="rounded-md border border-sky-500/30 bg-slate-900/80 px-2 py-0.5 text-[10px] text-sky-200 backdrop-blur">
            {label} · {secs}s{e.projectileBlocksRemaining != null ? ` · ⛨${e.projectileBlocksRemaining}` : ''}
          </div>
        );
      })}
    </div>
  );
};
