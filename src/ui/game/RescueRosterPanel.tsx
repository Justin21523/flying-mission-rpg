import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useSaveStore } from '../../stores/useSaveStore';
import { useQuestStore } from '../../stores/questStore';

// Batch E — Hub Rescue Roster. Lists the residents you've rescued (rescuedNpcIds) and lets you accept + fulfil
// each one's side-quest for a coin reward (reusing questStore + the installed reward handler). Shown during the
// Hangar/base phases next to BaseHud.
export const RescueRosterPanel = () => {
  const npcs = useEditorGameNpcStore((s) => s.items);
  const rescued = useSaveStore((s) => s.save.progress.rescuedNpcIds);
  const quests = useQuestStore((s) => s.quests);
  const startQuest = useQuestStore((s) => s.startQuest);
  const updateObjective = useQuestStore((s) => s.updateObjective);

  const residents = npcs.filter((n) => n.hubResident);
  const rescuedResidents = residents.filter((n) => rescued.includes(n.id));

  return (
    <div className="pointer-events-auto fixed right-3 top-24 z-30 w-64 rounded-xl border border-slate-700/70 bg-slate-900/85 p-3 text-xs shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-emerald-300">🏠 Rescues</span>
        <span className="text-slate-300">{rescuedResidents.length}/{residents.length}</span>
      </div>
      {rescuedResidents.length === 0 ? (
        <p className="text-[11px] text-slate-400">Clear stages to rescue survivors — they'll move into the Hangar and offer side-quests.</p>
      ) : (
        <div className="space-y-1.5">
          {rescuedResidents.map((n) => {
            const quest = n.hubSideQuestId ? quests[n.hubSideQuestId] : undefined;
            return (
              <div key={n.id} className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-200">{n.name}</span>
                  <span className="text-[10px] text-slate-400">{n.role}</span>
                </div>
                {quest && (
                  <div className="mt-1">
                    <div className="text-[11px] text-slate-300">{quest.title}</div>
                    {quest.status === 'NotStarted' && (
                      <button className="mt-1 rounded bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-sky-500" onClick={() => startQuest(quest.id)}>Accept</button>
                    )}
                    {quest.status === 'InProgress' && (
                      <button className="mt-1 rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-500" onClick={() => updateObjective(quest.id, quest.objectives[0].id, true)}>Fulfil ({quest.reward?.coins ?? 0}🪙)</button>
                    )}
                    {quest.status === 'Completed' && <div className="mt-1 text-[11px] text-emerald-400">✓ Thanked you ({quest.reward?.coins ?? 0}🪙)</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
