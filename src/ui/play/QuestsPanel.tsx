import { useMemo } from 'react';
import { useQuestStore } from '../../stores/questStore';
import { PanelCard, closePanel } from './playShared';
import { useT } from '../../i18n/useT';

// Kit — play-mode 📜 Quests: all known quests grouped by status, each with its objectives (✓ / ○).
const STATUS_ORDER = ['InProgress', 'NotStarted', 'Completed', 'Failed'] as const;
const STATUS_KEY: Record<string, string> = { InProgress: 'qs_inProgress', NotStarted: 'qs_available', Completed: 'qs_completed', Failed: 'qs_failed' };
const STATUS_COLOR: Record<string, string> = { InProgress: 'text-cyan-200', NotStarted: 'text-slate-300', Completed: 'text-emerald-300', Failed: 'text-red-300' };

export const QuestsPanel = () => {
  const quests = useQuestStore((s) => s.quests);
  const t = useT();
  const list = useMemo(() => Object.values(quests), [quests]);
  return (
    <PanelCard title={t('panel_quests')} icon="📜" onClose={closePanel} width="26rem">
      {list.length === 0 ? <p className="text-xs text-slate-500">{t('quests_none')}</p> : (
        <div className="space-y-3">
          {STATUS_ORDER.map((st) => {
            const group = list.filter((q) => q.status === st);
            if (group.length === 0) return null;
            return (
              <div key={st}>
                <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[st]}`}>{t(STATUS_KEY[st])} · {group.length}</div>
                <ul className="space-y-1">
                  {group.map((q) => (
                    <li key={q.id} className="rounded bg-slate-900/60 px-2 py-1 text-xs">
                      <div className="font-semibold text-slate-100">{q.title}</div>
                      {q.description && <div className="text-[10px] text-slate-500">{q.description}</div>}
                      <ul className="ml-3 mt-0.5 text-[11px] text-slate-400">
                        {q.objectives.map((o) => <li key={o.id}>{o.isCompleted ? '✓' : '○'} {o.description}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
};
