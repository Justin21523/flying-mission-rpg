import type { ReactNode } from 'react';
import { playUiSound } from '../../game/audio/uiSound';
import type { UiSoundKind } from '../../game/audio/uiSound';

// Shared "hi-tech console" chrome for the Mission Control / Briefing / Character-Select screens. Keeps
// each screen small (mirrors how editorShared centralises form bits). All text English.
export const panel = 'rounded-2xl border border-sky-800/50 bg-slate-950/80 backdrop-blur shadow-2xl';
export const chip = 'rounded-full border px-2 py-0.5 text-[11px] font-semibold';

export const ScreenFrame = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div className="pointer-events-auto fixed inset-0 z-[70] flex animate-[fadeIn_180ms_ease-out] flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
    <div className="flex items-baseline gap-3 border-b border-sky-900/50 px-6 py-3">
      <h1 className="text-xl font-black tracking-wide text-sky-200">{title}</h1>
      {subtitle && <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">{subtitle}</span>}
    </div>
    <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>
  </div>
);

type Tone = 'primary' | 'ghost' | 'danger';
const toneCls: Record<Tone, string> = {
  primary: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/40',
  ghost: 'bg-slate-800/70 hover:bg-slate-700 text-slate-200 border-slate-600/50',
  danger: 'bg-rose-700/30 hover:bg-rose-700/50 text-rose-100 border-rose-600/40',
};

export const Btn = ({
  children,
  onClick,
  tone = 'ghost',
  disabled,
  sound = 'select',
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: Tone;
  disabled?: boolean;
  sound?: UiSoundKind;
}) => (
  <button
    disabled={disabled}
    onMouseEnter={() => playUiSound('hover')}
    onClick={() => {
      playUiSound(sound);
      onClick();
    }}
    className={`rounded-lg border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${toneCls[tone]}`}
  >
    {children}
  </button>
);

export const StatBar = ({
  label,
  value,
  max = 10,
  color = '#38bdf8',
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) => (
  <div className="flex items-center gap-2 text-[11px]">
    <span className="w-24 shrink-0 text-slate-400">{label}</span>
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%`, background: color }} />
    </div>
    <span className="w-6 text-right tabular-nums text-slate-300">{value}</span>
  </div>
);
