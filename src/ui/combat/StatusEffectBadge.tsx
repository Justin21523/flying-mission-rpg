import type { StatusEffectType } from '../../game/combat/StatusEffectRuntime';

export const StatusEffectBadge = ({ type }: { type: StatusEffectType | string }) => (
  <span className="rounded border border-cyan-400/30 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-bold text-cyan-100">{type}</span>
);
