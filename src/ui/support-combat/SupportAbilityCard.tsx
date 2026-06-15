import type { SupportAvailabilityView } from '../../game/support-combat/SupportCombatDirector';
import { SupportCooldownIndicator } from './SupportCooldownIndicator';
import { SUPPORT_TYPE_LABEL } from './supportNames';

// One support ability button (Batch E). Shows name, support type, cost, cooldown + an availability reason;
// click casts it. Selecting it (right-click / long-press handled by parent) drives the targeting overlay.
export const SupportAbilityCard = ({ view, selected, onCast, onSelect }: {
  view: SupportAvailabilityView;
  selected: boolean;
  onCast: () => void;
  onSelect: () => void;
}) => {
  const a = view.ability;
  const color = a.editorMeta?.themeColor ?? '#60a5fa';
  return (
    <button
      onClick={onCast}
      onContextMenu={(e) => { e.preventDefault(); onSelect(); }}
      onPointerEnter={onSelect}
      disabled={!view.usable}
      title={view.reason}
      className={`relative w-full overflow-hidden rounded-md border px-2 py-1 text-left text-[10px] transition ${
        view.usable ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' : 'cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-500'
      } ${selected ? 'ring-1 ring-sky-400' : ''}`}
    >
      <div className="flex items-center gap-1">
        <span className="rounded px-1 text-[8px] font-bold uppercase" style={{ background: color, color: '#0b1020' }}>{SUPPORT_TYPE_LABEL[a.supportType] ?? a.supportType}</span>
        <span className="font-semibold text-slate-100">{a.editorMeta?.displayName ?? a.name}</span>
        {view.downgraded && <span className="ml-auto text-[8px] text-amber-300">remote</span>}
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[9px] text-slate-400">
        <span>⚡{view.cost}</span>
        <span>cd {a.cooldownSeconds}s</span>
        {!view.usable && view.reason && <span className="text-rose-400">{view.reason}</span>}
      </div>
      <SupportCooldownIndicator remainingMs={view.cooldownRemainingMs} cooldownSeconds={a.cooldownSeconds} />
    </button>
  );
};
