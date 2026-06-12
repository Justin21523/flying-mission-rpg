import { useState } from 'react';
import { useEditorSupportStore } from '../../../stores/game/editorSupportStore';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { MISSION_OBJECTIVE_KINDS } from '../../../types/game/mission';
import { SUPPORT_ABILITY_TAGS, SUPPORT_DISPATCH_MODES } from '../../../types/game/support';
import type { SupportAbilityTag, SupportDispatchMode } from '../../../types/game/support';
import { validateLimitConfig, validateSupportAiProfile, validateSupportProfile } from '../../../game/support/SupportValidation';
import { NumRow, SelectRow, TextRow, ColorRow } from './CollectionEditor';
import { MultiCheck } from './MultiCheck';
import { Check, lbl } from '../editorShared';

type Section = 'dispatch' | 'abilities' | 'ai' | 'limits';
const SECTIONS: readonly Section[] = ['dispatch', 'abilities', 'ai', 'limits'];

export const SupportEditorTab = () => {
  const [section, setSection] = useState<Section>('dispatch');
  const profiles = useEditorSupportStore((s) => s.profiles);
  const aiProfiles = useEditorSupportStore((s) => s.aiProfiles);
  const limits = useEditorSupportStore((s) => s.limits);
  const selectedCharacterId = useEditorSupportStore((s) => s.selectedCharacterId);
  const selectedAiProfileId = useEditorSupportStore((s) => s.selectedAiProfileId);
  const setSelectedCharacter = useEditorSupportStore((s) => s.setSelectedCharacter);
  const setSelectedAiProfile = useEditorSupportStore((s) => s.setSelectedAiProfile);
  const updateProfile = useEditorSupportStore((s) => s.updateProfile);
  const updateAiProfile = useEditorSupportStore((s) => s.updateAiProfile);
  const updateLimits = useEditorSupportStore((s) => s.updateLimits);
  const duplicateProfile = useEditorSupportStore((s) => s.duplicateProfile);
  const characters = useEditorCharacterStore((s) => s.items);
  const profile = profiles.find((p) => p.characterId === selectedCharacterId) ?? profiles[0] ?? null;
  const aiProfile = aiProfiles.find((p) => p.id === selectedAiProfileId) ?? (profile ? aiProfiles.find((p) => p.id === profile.aiProfileId) : undefined) ?? aiProfiles[0] ?? null;
  const characterIds = new Set(characters.map((c) => c.id));
  const aiProfileIds = new Set(aiProfiles.map((p) => p.id));
  const objectiveTypes = new Set(MISSION_OBJECTIVE_KINDS);
  const profileErrors = profile ? validateSupportProfile(profile, { characterIds, aiProfileIds, objectiveTypes }) : [];
  const aiErrors = aiProfile ? validateSupportAiProfile(aiProfile) : [];
  const limitErrors = validateLimitConfig(limits);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Support Dispatch · Multi Character AI</div>
        <div className="flex gap-1">
          {SECTIONS.map((s) => (
            <button key={s} onClick={() => setSection(s)} className={`rounded px-2 py-1 text-[11px] ${section === s ? 'bg-sky-700/40 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>
          ))}
        </div>
      </div>

      {(profileErrors.length > 0 || aiErrors.length > 0 || limitErrors.length > 0) && (
        <div className="rounded bg-rose-950/50 p-2 text-[10px] text-rose-200">
          {[...profileErrors, ...aiErrors, ...limitErrors].map((e) => <div key={e}>Warning: {e}</div>)}
        </div>
      )}

      {section !== 'limits' && (
        <div className="grid grid-cols-[14rem_minmax(0,1fr)] gap-3">
          <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {profiles.map((p) => {
              const c = characters.find((ch) => ch.id === p.characterId);
              return (
                <button key={p.id} onClick={() => { setSelectedCharacter(p.characterId); setSelectedAiProfile(p.aiProfileId); }} className={`w-full rounded px-2 py-1 text-left ${profile?.id === p.id ? 'bg-sky-700/30 text-sky-100' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'}`}>
                  <div className="truncate font-semibold">{c?.name ?? p.characterId}</div>
                  <div className="text-[10px] text-slate-500">{p.defaultDispatchMode} · {p.aiProfileId}</div>
                </button>
              );
            })}
          </div>
          <div className="min-w-0 space-y-2">
            {profile && section === 'dispatch' && (
              <>
                <SelectRow label="Character" value={profile.characterId} options={characters.map((c) => ({ value: c.id, label: c.name }))} onChange={(v) => updateProfile(profile.id, { characterId: v })} />
                <Check label="Can be dispatched" checked={profile.canBeDispatched} onChange={(v) => updateProfile(profile.id, { canBeDispatched: v })} />
                <SelectRow label="Default mode" value={profile.defaultDispatchMode} options={SUPPORT_DISPATCH_MODES.map((m) => ({ value: m, label: m }))} onChange={(v) => updateProfile(profile.id, { defaultDispatchMode: v as SupportDispatchMode })} />
                <SelectRow label="AI profile" value={profile.aiProfileId} options={aiProfiles.map((a) => ({ value: a.id, label: a.name }))} onChange={(v) => updateProfile(profile.id, { aiProfileId: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <NumRow label="Base delay" value={profile.baseDispatchDelaySeconds} step={0.25} min={0} onChange={(v) => updateProfile(profile.id, { baseDispatchDelaySeconds: v })} />
                  <NumRow label="Launch seconds" value={profile.launchDurationSeconds} step={0.25} min={0} onChange={(v) => updateProfile(profile.id, { launchDurationSeconds: v })} />
                  <NumRow label="Flight seconds" value={profile.flightDurationSeconds} step={0.25} min={0} onChange={(v) => updateProfile(profile.id, { flightDurationSeconds: v })} />
                  <NumRow label="Transform seconds" value={profile.transformDurationSeconds} step={0.25} min={0} onChange={(v) => updateProfile(profile.id, { transformDurationSeconds: v })} />
                  <NumRow label="Arrival seconds" value={profile.arrivalDurationSeconds} step={0.25} min={0} onChange={(v) => updateProfile(profile.id, { arrivalDurationSeconds: v })} />
                  <NumRow label="Quick total" value={profile.quickModeTotalSeconds} step={0.25} min={0.1} onChange={(v) => updateProfile(profile.id, { quickModeTotalSeconds: v })} />
                  <NumRow label="Active cost" value={profile.activeTierCost} step={1} min={0} onChange={(v) => updateProfile(profile.id, { activeTierCost: v })} />
                  <NumRow label="Standby cost" value={profile.standbyTierCost} step={1} min={0} onChange={(v) => updateProfile(profile.id, { standbyTierCost: v })} />
                  <NumRow label="Max instances" value={profile.maxSimultaneousInstances ?? 1} step={1} min={1} onChange={(v) => updateProfile(profile.id, { maxSimultaneousInstances: v })} />
                </div>
                <TextRow label="Notes" area value={profile.editorMeta?.notes ?? ''} onChange={(v) => updateProfile(profile.id, { editorMeta: { ...profile.editorMeta, notes: v } })} />
                <button onClick={() => duplicateProfile(profile.id)} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">Duplicate profile</button>
              </>
            )}
            {profile && section === 'abilities' && (
              <>
                <MultiCheck label="Support abilities" options={SUPPORT_ABILITY_TAGS.map((a) => ({ id: a, label: a }))} selected={profile.abilities} onChange={(ids) => updateProfile(profile.id, { abilities: ids as SupportAbilityTag[] })} />
                <MultiCheck label="Recommended objective types" options={MISSION_OBJECTIVE_KINDS.map((k) => ({ id: k, label: k }))} selected={profile.recommendedObjectiveTypes} onChange={(ids) => updateProfile(profile.id, { recommendedObjectiveTypes: ids })} />
                <MultiCheck label="Unsuitable objective types" options={MISSION_OBJECTIVE_KINDS.map((k) => ({ id: k, label: k }))} selected={profile.unsuitableObjectiveTypes ?? []} onChange={(ids) => updateProfile(profile.id, { unsuitableObjectiveTypes: ids })} />
                <TextRow label="Card badge" value={profile.editorMeta?.cardBadge ?? ''} onChange={(v) => updateProfile(profile.id, { editorMeta: { ...profile.editorMeta, cardBadge: v } })} />
                <ColorRow label="Card colour" value={profile.editorMeta?.displayColor ?? '#38bdf8'} onChange={(v) => updateProfile(profile.id, { editorMeta: { ...profile.editorMeta, displayColor: v } })} />
              </>
            )}
            {aiProfile && section === 'ai' && (
              <>
                <SelectRow label="AI profile" value={aiProfile.id} options={aiProfiles.map((a) => ({ value: a.id, label: a.name }))} onChange={setSelectedAiProfile} />
                <TextRow label="Name" value={aiProfile.name} onChange={(v) => updateAiProfile(aiProfile.id, { name: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <NumRow label="Follow distance" value={aiProfile.followDistance} step={0.25} min={0.1} onChange={(v) => updateAiProfile(aiProfile.id, { followDistance: v })} />
                  <NumRow label="Standby distance" value={aiProfile.standbyDistance} step={0.25} min={0} onChange={(v) => updateAiProfile(aiProfile.id, { standbyDistance: v })} />
                  <NumRow label="Avoidance radius" value={aiProfile.avoidanceRadius} step={0.1} min={0} onChange={(v) => updateAiProfile(aiProfile.id, { avoidanceRadius: v })} />
                  <NumRow label="Move speed" value={aiProfile.moveSpeed} step={0.25} min={0.1} onChange={(v) => updateAiProfile(aiProfile.id, { moveSpeed: v })} />
                  <NumRow label="Stuck timeout" value={aiProfile.stuckTimeoutSeconds} step={0.25} min={0.1} onChange={(v) => updateAiProfile(aiProfile.id, { stuckTimeoutSeconds: v })} />
                  <NumRow label="Work time (s)" value={aiProfile.workTimeSeconds ?? 1.6} step={0.25} min={0.1} onChange={(v) => updateAiProfile(aiProfile.id, { workTimeSeconds: v })} />
                  <NumRow label="Arrive distance" value={aiProfile.arriveDistance ?? 2.4} step={0.1} min={0.5} onChange={(v) => updateAiProfile(aiProfile.id, { arriveDistance: v })} />
                </div>
                <Check label="Assist behavior enabled" checked={aiProfile.assistBehaviorEnabled} onChange={(v) => updateAiProfile(aiProfile.id, { assistBehaviorEnabled: v })} />
                <Check label="Reposition fallback enabled" checked={aiProfile.repositionFallbackEnabled} onChange={(v) => updateAiProfile(aiProfile.id, { repositionFallbackEnabled: v })} />
              </>
            )}
          </div>
        </div>
      )}

      {section === 'limits' && (
        <div className="grid grid-cols-2 gap-2">
          <NumRow label="Max active" value={limits.maxActiveCharacters} step={1} min={1} onChange={(v) => updateLimits({ maxActiveCharacters: v })} />
          <NumRow label="Max standby" value={limits.maxStandbyCharacters} step={1} min={0} onChange={(v) => updateLimits({ maxStandbyCharacters: v })} />
          <NumRow label="Active AI tick" value={limits.aiTickRateActive} step={1} min={0.1} onChange={(v) => updateLimits({ aiTickRateActive: v })} />
          <NumRow label="Standby AI tick" value={limits.aiTickRateStandby} step={1} min={0.1} onChange={(v) => updateLimits({ aiTickRateStandby: v })} />
          <NumRow label="Remote update seconds" value={limits.remoteUpdateIntervalSeconds} step={0.5} min={0.1} onChange={(v) => updateLimits({ remoteUpdateIntervalSeconds: v })} />
          <Check label="Auto demote over limit" checked={limits.autoDemoteWhenOverLimit} onChange={(v) => updateLimits({ autoDemoteWhenOverLimit: v })} />
        </div>
      )}
    </div>
  );
};
