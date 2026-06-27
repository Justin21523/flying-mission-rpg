import { useEffect, useMemo, useState } from 'react';
import { ScreenFrame, Btn, panel, chip } from './screenChrome';
import { WorldMapPanel } from './WorldMapPanel';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { getEditorLocation, useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { getEditorRegion, useEditorRegionStore } from '../../stores/game/editorRegionStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useFlagStore } from '../../stores/flagStore';
import { isMissionAvailable } from '../../game/missions/missionAvailability';
import { isLocationUnlocked } from '../../game/game/regionGrouping';
import { isMissionComplete } from '../../game/missions/completedMissions';
import { evaluateCondition } from '../../game/evaluateCondition';
import type { WorldLocation } from '../../types/game/world';
import type { DialogueCondition } from '../../types/dialogue';
import { pickTestMissionId } from '../../game/game/missionSelection';
import { generateMissions } from '../../game/missions/missionGenerator';
import { collectMissionPools } from '../../game/missions/missionPools';
import { MISSION_TEMPLATES } from '../../data/game/missionTemplates';
import { playUiSound } from '../../game/audio/uiSound';
import { CampaignMap } from '../campaign/CampaignMap';
import { startRun } from '../../game/arena-run/RunDirector';

// MISSION_CONTROL — hi-tech console: world map (left) + mission notifications (right). Selecting a
// mission advances to the briefing (GameDirector reacts to mission:selected). Data is read live from the
// editable stores, so Edit Mode changes reflect immediately.
export const MissionControlScreen = () => {
  const missions = useEditorMissionStore((s) => s.items);
  const locations = useEditorLocationStore((s) => s.items);
  const regions = useEditorRegionStore((s) => s.items);
  const flags = useFlagStore((s) => s.flags); // re-evaluate locks live when progress flags change
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [featuredId, setFeaturedId] = useState<string | null>(null);

  const locked = useMemo(() => {
    // world-flag gates read the subscribed `flags` (so locks update live); other condition kinds delegate.
    const evalUnlock = (c: DialogueCondition) => (c.type === 'worldFlagSet' ? flags[c.flag] === true : evaluateCondition(c));
    const byId = new Map(regions.map((r) => [r.id, r]));
    const set = new Set<string>();
    for (const l of locations) if (!isLocationUnlocked(l, l.regionId ? byId.get(l.regionId) : undefined, evalUnlock)) set.add(l.id);
    return set;
  }, [locations, regions, flags]);

  const regionColorFor = (l: WorldLocation) => getEditorRegion(l.regionId)?.color;
  const missionCountFor = (id: string) => missions.filter((m) => m.locationId === id && isMissionAvailable(m) && !locked.has(m.locationId)).length;

  const visible = useMemo(
    () => missions.filter((m) =>
      isMissionAvailable(m)
      && !locked.has(m.locationId)
      && (!activeLocationId || m.locationId === activeLocationId)
      && (!regionId || getEditorLocation(m.locationId)?.regionId === regionId),
    ),
    [missions, activeLocationId, regionId, locked],
  );

  const accept = (id: string) => useMissionStore.getState().selectMission(id); // → MISSION_BRIEFING

  const regenerate = () => {
    const id = pickTestMissionId(missions, featuredId ?? undefined);
    setFeaturedId(id);
    const m = id ? missions.find((x) => x.id === id) : undefined;
    if (m) setActiveLocationId(m.locationId);
    playUiSound('select');
  };

  // Procedurally generate today's dispatches (rule-based generator, daily fixed seed → reproducible per day),
  // adding the validated missions into the editable store so they appear in the notification list.
  const generateDispatches = () => {
    const seed = `daily-${new Date().toISOString().slice(0, 10)}`;
    const { missions: generated } = generateMissions({ seed, count: 3 }, MISSION_TEMPLATES, collectMissionPools());
    const store = useEditorMissionStore.getState();
    for (const m of generated) store.upsert(m);
    const first = generated[0];
    if (first) { setFeaturedId(first.id); setActiveLocationId(first.locationId); }
    playUiSound('select');
  };

  // Enter accepts the featured mission (keyboard flow). Calls the store directly to avoid a closure dep.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && featuredId) useMissionStore.getState().selectMission(featuredId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [featuredId]);

  return (
    <ScreenFrame title="Mission Control" subtitle="dispatch">
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex min-h-0 flex-col gap-2">
          {regions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setRegionId(null)} className={`${chip} ${regionId === null ? 'border-sky-400/70 text-sky-100' : 'border-slate-600 text-slate-300'}`}>All regions</button>
              {[...regions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((r) => (
                <button key={r.id} onClick={() => setRegionId(regionId === r.id ? null : r.id)} className={`${chip} ${regionId === r.id ? 'text-white' : 'text-slate-300'}`} style={{ borderColor: regionId === r.id ? r.color : undefined }}>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: r.color }} />{r.name}{r.unlocked === false ? ' 🔒' : ''}
                </button>
              ))}
            </div>
          )}
          <div className="min-h-0 flex-1">
            <WorldMapPanel activeLocationId={activeLocationId} onPick={setActiveLocationId} regionColorFor={regionColorFor} lockedIds={locked} missionCountFor={missionCountFor} />
          </div>
        </div>

        <div className={`flex min-h-0 flex-col ${panel} p-3`}>
          <CampaignMap />
          <div className="my-3 border-t border-slate-700" />
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-sky-200">
              Mission Notifications
              {activeLocationId && <span className="text-slate-400"> · {getEditorLocation(activeLocationId)?.name ?? ''}</span>}
            </h2>
            <div className="flex flex-wrap gap-1">
              <Btn tone="primary" onClick={() => startRun('endless')}>🌀 Endless</Btn>
              <Btn tone="primary" onClick={() => startRun('roguelite')}>🎲 Roguelite</Btn>
              <Btn tone="ghost" onClick={generateDispatches}>Dispatches</Btn>
              <Btn tone="ghost" onClick={regenerate}>Test</Btn>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {visible.length === 0 && <div className="text-xs text-slate-500">No missions at this location.</div>}
            {visible.map((m) => {
              const loc = getEditorLocation(m.locationId);
              const featured = m.id === featuredId;
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-3 ${featured ? 'border-amber-400/60 bg-amber-500/5' : 'border-slate-700 bg-slate-900/50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-100">{m.name}{isMissionComplete(flags, m.id) ? ' ✓' : ''}</span>
                    <span className={`${chip} ${isMissionComplete(flags, m.id) ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-600 text-slate-300'}`}>{isMissionComplete(flags, m.id) ? 'done' : m.type}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-slate-400">
                    <span>📍 {loc?.name ?? m.locationId}</span>
                    <span>· Difficulty {m.difficulty}</span>
                    <span>· Weather {m.weather}</span>
                    {m.recommendedAbility && <span>· Ability {m.recommendedAbility}</span>}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Recommended: {m.recommendedCharacterIds.map((id) => getEditorCharacter(id)?.name ?? id).join(', ') || '—'}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">{m.summary}</p>
                  <div className="mt-2 flex justify-end">
                    <Btn tone="primary" onClick={() => accept(m.id)}>
                      Accept Mission
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
};
