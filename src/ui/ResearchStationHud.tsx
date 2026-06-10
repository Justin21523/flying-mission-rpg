import { useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useJinResearchStore } from '../stores/jinResearchStore';
import { useToolStore } from '../stores/toolStore';
import { getEditorTool } from '../stores/editorToolStore';
import { usePoll } from './usePoll';
import { useT } from '../i18n/useT';

// POLI — Jin's Research Station (play mode). A button appears when the player is at Rescue HQ (Jin's lab);
// opening it lists research projects you can fund with research points (earned from rescues + quests) to
// unlock rescue tools / abilities / areas. Funding takes the project's durationSec; only one runs at a time.
// Projects are editable in the 🔬 Research tab.
const STATION_AREA = 'rescue_hq';
const nowSec = () => performance.now() / 1000;

export const ResearchStationHud = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const t = useT();
  usePoll(250); // refresh the active-research timer
  const points = useJinResearchStore((s) => s.researchPoints);
  const completed = useJinResearchStore((s) => s.completed);
  const projects = useJinResearchStore((s) => s.projects);
  const active = useJinResearchStore((s) => s.active);
  const [open, setOpen] = useState(false);

  if (areaId !== STATION_AREA) return null;

  return (
    <div className="pointer-events-auto absolute bottom-24 left-1/2 z-30 -translate-x-1/2 select-none">
      {!open ? (
        <button onClick={() => setOpen(true)} className="rounded-full border border-emerald-500/60 bg-emerald-700/40 px-4 py-2 text-sm font-bold text-emerald-50 shadow-xl backdrop-blur-md hover:bg-emerald-700/60">
          🔬 {t('jinStation')} · {points} {t('pts')}
        </button>
      ) : (
        <div className="w-80 rounded-2xl border border-emerald-600/50 bg-slate-950/90 p-3 text-slate-100 shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-200">🔬 {t('researchStation')}</span>
            <span className="rounded bg-emerald-800/50 px-2 py-0.5 text-xs">{points} {t('pts')}</span>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">✕</button>
          </div>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {projects.map((p) => {
              const done = completed.includes(p.id);
              const can = useJinResearchStore.getState().canResearch(p.id);
              const lockedBy = p.prerequisiteProjectIds.filter((pre) => !completed.includes(pre));
              const tool = getEditorTool(p.unlocksToolId);
              const isActive = active?.id === p.id;
              const remaining = isActive ? Math.max(0, active!.endsAt - nowSec()) : 0;
              const progress = isActive && active!.durationSec > 0 ? 1 - remaining / active!.durationSec : 0;
              // Reward summary: tool / ability / area.
              const rewards = [tool ? `${tool.icon} ${tool.name}` : p.unlocksToolId, p.unlocksAbilityType ? `⚡ ${p.unlocksAbilityType}` : '', p.unlocksAreaId ? `🗺 ${p.unlocksAreaId}` : ''].filter(Boolean).join(' · ');
              return (
                <div key={p.id} className={`rounded-lg border p-2 ${done ? 'border-emerald-700/40 bg-emerald-900/20' : isActive ? 'border-amber-600/50 bg-amber-900/15' : 'border-slate-700/60 bg-slate-900/50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-semibold">{p.name}{p.repeatable ? ' ♻' : ''}</span>
                    <span className="text-[10px] text-slate-400">{p.cost} {t('pts')}{p.durationSec ? ` · ${p.durationSec}s` : ''}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{p.description}</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="flex-1 truncate text-[10px] text-sky-300">{rewards}</span>
                    {isActive ? <span className="text-[10px] font-semibold text-amber-300">⏳ {Math.ceil(remaining)}s</span>
                      : done && !p.repeatable ? <span className="text-[10px] text-emerald-300">✓ {t('researched')}</span>
                        : lockedBy.length > 0 ? <span className="text-[10px] text-slate-500">{t('needsPrereq')}</span>
                          : <button disabled={!can} onClick={() => useJinResearchStore.getState().startProject(p.id)} className="rounded bg-emerald-600/70 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">{p.durationSec ? `${t('research')} (${p.durationSec}s)` : t('research')}</button>}
                  </div>
                  {isActive && (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-amber-400 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {useToolStore.getState().unlockedTools.length > 0 && (
            <div className="mt-2 text-[10px] text-slate-500">{t('unlockedToolsHint')}</div>
          )}
        </div>
      )}
    </div>
  );
};
