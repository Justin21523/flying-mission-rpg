import { nanoid } from 'nanoid';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { useEditorTransformationStore } from '../../../stores/game/editorTransformationStore';
import { CHARACTER_FORMS, ABILITY_KINDS, GROUND_ABILITY_LIBRARY_KINDS, GROUND_EXTRA_ABILITY_KINDS } from '../../../types/game/character';
import type { CharacterDefinition, CharacterAbility, GroundAbilityConfig, GroundAbilityDefinition, GroundExtraAbilitySlot } from '../../../types/game/character';
import { WEATHER_KINDS } from '../../../types/game/flight';
import { getModelAsset } from '../../../data/modelLibrary';
import { SUPER_KINDS, SUPER_KIND_LABEL } from '../../../types/character';
import type { SuperMove } from '../../../types/character';
import { csv, parseCsv, Field, inp, lbl, Check, MoveButtons } from '../editorShared';
import { moveItem } from '../../../game/editor/arrayMove';
import { ModelPicker } from '../ModelPicker';
import { useGltfClipNames } from '../useGltfClipNames';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';
import { AnimationRulesEditor } from './AnimationRulesEditor';
import { cloneGroundAbilityConfig, getGroundAbilityConfig } from '../../../game/destination/groundAbilityConfig';
import { getGroundAbilityLibrary, validateGroundAbilityLibrary } from '../../../game/destination/groundAbilityLibrary';
import { GROUND_BASE_SCALE } from '../../../game/destination/groundCharacterScale';

const makeNew = (): CharacterDefinition => ({
  id: `char_${nanoid(6)}`,
  codename: 'New Flyer',
  name: 'New Character',
  role: '',
  description: '',
  sourceConfidence: 'GameAdaptation',
  color: '#38bdf8',
  defaultForm: 'plane',
  stats: { flightSpeed: 5, agility: 5, controlDifficulty: 5, durability: 5 },
  abilities: [],
  missionSuitability: [],
  homeBaseLocationId: 'loc_homebase',
});

// Animation-clip picker — lists the model's real GLB clip names (falls back to free text if not loaded yet).
const ClipPicker = ({ label, modelAssetId, value, onChange }: { label: string; modelAssetId?: string; value?: string; onChange: (v?: string) => void }) => {
  const asset = modelAssetId ? getModelAsset(modelAssetId) : undefined;
  const clips = useGltfClipNames(asset?.path);
  if (clips.length === 0) return <TextRow label={`${label} (type clip name)`} value={value ?? ''} onChange={(v) => onChange(v || undefined)} />;
  return (
    <SelectRow
      label={label}
      value={value ?? ''}
      options={[{ value: '', label: '(first / default)' }, ...clips.map((c) => ({ value: c, label: c }))]}
      onChange={(v) => onChange(v || undefined)}
    />
  );
};

// Abilities sub-editor — add / edit / remove a character's rescue helpers (name + kind + description).
const AbilitiesEditor = ({ abilities, onChange }: { abilities: CharacterAbility[]; onChange: (a: CharacterAbility[]) => void }) => {
  const add = () => onChange([...abilities, { id: `ab_${nanoid(5)}`, name: 'New Ability', kind: 'boost', description: '' }]);
  const patch = (id: string, p: Partial<CharacterAbility>) => onChange(abilities.map((a) => (a.id === id ? { ...a, ...p } : a)));
  const remove = (id: string) => onChange(abilities.filter((a) => a.id !== id));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className={lbl}>Abilities · {abilities.length}</div>
        <button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Ability</button>
      </div>
      <div className="mt-1 space-y-1.5">
        {abilities.map((a) => (
          <div key={a.id} className="rounded bg-slate-900/60 p-1.5">
            <TextRow label="Name" value={a.name} onChange={(v) => patch(a.id, { name: v })} />
            <SelectRow label="Kind" value={a.kind} options={ABILITY_KINDS.map((k) => ({ value: k, label: k }))} onChange={(v) => patch(a.id, { kind: v as CharacterAbility['kind'] })} />
            <TextRow label="Description" area value={a.description} onChange={(v) => patch(a.id, { description: v })} />
            <button onClick={() => remove(a.id)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
          </div>
        ))}
        {abilities.length === 0 && <div className="text-[11px] text-slate-500">No abilities.</div>}
      </div>
    </div>
  );
};

const ClipMultiPicker = ({
  modelAssetId,
  selected,
  onChange,
}: {
  modelAssetId?: string;
  selected: string[];
  onChange: (clips: string[]) => void;
}) => {
  const asset = modelAssetId ? getModelAsset(modelAssetId) : undefined;
  const clips = useGltfClipNames(asset?.path);
  const available = clips.filter((clip) => !selected.includes(clip));
  return (
    <div>
      <div className={lbl}>Energized animation clips</div>
      <select
        value=""
        disabled={available.length === 0}
        onChange={(e) => {
          const clip = e.target.value;
          if (clip) onChange([...selected, clip]);
        }}
        className={inp}
      >
        <option value="">{clips.length === 0 ? '(load a model with clips)' : '+ add clip...'}</option>
        {available.map((clip) => <option key={clip} value={clip}>{clip}</option>)}
      </select>
      <div className="mt-1 flex flex-wrap gap-1">
        {selected.map((clip) => (
          <button key={clip} onClick={() => onChange(selected.filter((c) => c !== clip))} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-rose-900/50">
            {clip} ×
          </button>
        ))}
        {selected.length === 0 && <span className="text-[10px] text-slate-500">Idle clip is used when no energized clips are selected.</span>}
      </div>
    </div>
  );
};

const GroundAbilityEditor = ({ character, update }: { character: CharacterDefinition; update: (p: Partial<CharacterDefinition>) => void }) => {
  const config = getGroundAbilityConfig(character);
  const save = (next: GroundAbilityConfig) => update({ groundAbility: cloneGroundAbilityConfig(next) });
  const patchCloud = (patch: Partial<GroundAbilityConfig['cloudRally']>) => save({ ...config, cloudRally: { ...config.cloudRally, ...patch } });
  const patchSurge = (patch: Partial<GroundAbilityConfig['rescueSurge']>) => save({ ...config, rescueSurge: { ...config.rescueSurge, ...patch } });
  const patchExtra = (id: string, patch: Partial<GroundExtraAbilitySlot>) => save({ ...config, extraSlots: config.extraSlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)) });
  const addExtra = () => save({
    ...config,
    extraSlots: [
      ...config.extraSlots,
      {
        id: `extra_${nanoid(5)}`,
        name: 'New Power',
        kind: 'scan_pulse',
        keyCode: `Digit${Math.min(9, config.extraSlots.length + 1)}`,
        color: character.color,
        durationSec: 1,
        cooldownSec: 4,
        radius: 7,
        strength: 1,
      },
    ],
  });
  const removeExtra = (id: string) => save({ ...config, extraSlots: config.extraSlots.filter((slot) => slot.id !== id) });
  return (
    <div className="space-y-2 rounded-lg border border-cyan-700/40 bg-cyan-950/15 p-2">
      <div className={lbl}>Ground super powers</div>
      <div className="rounded border border-slate-800 bg-slate-900/50 p-1.5">
        <div className="text-[11px] font-semibold text-cyan-100">Cloud Rally</div>
        <div className="grid grid-cols-2 gap-1.5">
          <TextRow label="Name" value={config.cloudRally.name} onChange={(v) => patchCloud({ name: v })} />
          <TextRow label="Key code" value={config.cloudRally.keyCode} onChange={(v) => patchCloud({ keyCode: v })} />
          <NumRow label="Duration (s)" value={config.cloudRally.durationSec} step={0.05} min={0.1} onChange={(v) => patchCloud({ durationSec: v })} />
          <NumRow label="Cooldown (s)" value={config.cloudRally.cooldownSec} step={0.1} min={0} onChange={(v) => patchCloud({ cooldownSec: v })} />
          <NumRow label="Radius" value={config.cloudRally.radius} step={0.5} min={0.5} onChange={(v) => patchCloud({ radius: v })} />
          <NumRow label="Strength" value={config.cloudRally.strength} step={0.1} min={0} onChange={(v) => patchCloud({ strength: v })} />
          <ColorRow label="Cloud colour" value={config.cloudRally.cloudColor} onChange={(v) => patchCloud({ cloudColor: v })} />
          <ColorRow label="Ripple colour" value={config.cloudRally.rippleColor} onChange={(v) => patchCloud({ rippleColor: v })} />
          <NumRow label="Energized time (s)" value={config.cloudRally.energizedDurationSec} step={0.25} min={0} onChange={(v) => patchCloud({ energizedDurationSec: v })} />
          <NumRow label="Energized speed ×" value={config.cloudRally.energizedSpeedMultiplier} step={0.05} min={0.1} onChange={(v) => patchCloud({ energizedSpeedMultiplier: v })} />
          <NumRow label="Random clip interval" value={config.cloudRally.randomAnimationIntervalSec} step={0.05} min={0.1} onChange={(v) => patchCloud({ randomAnimationIntervalSec: v })} />
        </div>
        <div className="mt-1">
          <ClipMultiPicker modelAssetId={character.modelAssetId} selected={config.cloudRally.energizedAnimationClips} onChange={(clips) => patchCloud({ energizedAnimationClips: clips })} />
        </div>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/50 p-1.5">
        <div className="text-[11px] font-semibold text-sky-100">Rescue Surge</div>
        <div className="grid grid-cols-2 gap-1.5">
          <TextRow label="Name" value={config.rescueSurge.name} onChange={(v) => patchSurge({ name: v })} />
          <TextRow label="Key code" value={config.rescueSurge.keyCode} onChange={(v) => patchSurge({ keyCode: v })} />
          <NumRow label="Duration (s)" value={config.rescueSurge.durationSec} step={0.05} min={0.1} onChange={(v) => patchSurge({ durationSec: v })} />
          <NumRow label="Cooldown (s)" value={config.rescueSurge.cooldownSec} step={0.1} min={0} onChange={(v) => patchSurge({ cooldownSec: v })} />
          <NumRow label="Dash speed" value={config.rescueSurge.speed} step={1} min={1} onChange={(v) => patchSurge({ speed: v })} />
          <NumRow label="Ghost count" value={config.rescueSurge.afterimageCount} step={1} min={1} max={32} onChange={(v) => patchSurge({ afterimageCount: v })} />
          <NumRow label="Ghost interval" value={config.rescueSurge.afterimageIntervalSec} step={0.005} min={0.01} onChange={(v) => patchSurge({ afterimageIntervalSec: v })} />
          <NumRow label="Ghost life (s)" value={config.rescueSurge.afterimageLifeSec} step={0.05} min={0.1} onChange={(v) => patchSurge({ afterimageLifeSec: v })} />
          <NumRow label="Ghost opacity" value={config.rescueSurge.afterimageOpacity} step={0.05} min={0} max={1} onChange={(v) => patchSurge({ afterimageOpacity: v })} />
          <ColorRow label="Ghost colour" value={config.rescueSurge.afterimageColor} onChange={(v) => patchSurge({ afterimageColor: v })} />
          <Field label="Direction">
            <select value={config.rescueSurge.lockDirection ? 'locked' : 'live'} onChange={(e) => patchSurge({ lockDirection: e.target.value === 'locked' })} className={inp}>
              <option value="locked">locked at key press</option>
              <option value="live">follow current facing</option>
            </select>
          </Field>
        </div>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/50 p-1.5">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[11px] font-semibold text-amber-100">Extra powers</div>
          <button onClick={addExtra} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">+ Power</button>
        </div>
        <div className="space-y-1.5">
          {config.extraSlots.map((slot) => (
            <div key={slot.id} className="rounded border border-slate-800/80 p-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <TextRow label="Name" value={slot.name} onChange={(v) => patchExtra(slot.id, { name: v })} />
                <TextRow label="Key code" value={slot.keyCode} onChange={(v) => patchExtra(slot.id, { keyCode: v })} />
                <SelectRow label="Kind" value={slot.kind} options={GROUND_EXTRA_ABILITY_KINDS.map((kind) => ({ value: kind, label: kind }))} onChange={(v) => patchExtra(slot.id, { kind: v as GroundExtraAbilitySlot['kind'] })} />
                <ColorRow label="Colour" value={slot.color} onChange={(v) => patchExtra(slot.id, { color: v })} />
                <NumRow label="Duration (s)" value={slot.durationSec} step={0.05} min={0.1} onChange={(v) => patchExtra(slot.id, { durationSec: v })} />
                <NumRow label="Cooldown (s)" value={slot.cooldownSec} step={0.1} min={0} onChange={(v) => patchExtra(slot.id, { cooldownSec: v })} />
                <NumRow label="Radius" value={slot.radius} step={0.5} min={0.5} onChange={(v) => patchExtra(slot.id, { radius: v })} />
                <NumRow label="Strength" value={slot.strength} step={0.1} min={0} onChange={(v) => patchExtra(slot.id, { strength: v })} />
              </div>
              <button onClick={() => removeExtra(slot.id)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GroundAbilityLibraryEditor = ({ character, update }: { character: CharacterDefinition; update: (p: Partial<CharacterDefinition>) => void }) => {
  const library = getGroundAbilityLibrary(character);
  const errors = validateGroundAbilityLibrary(library);
  const save = (next: GroundAbilityDefinition[]) => update({ groundAbilityLibrary: next.map((ability) => ({ ...ability, animationPool: ability.animationPool ? [...ability.animationPool] : undefined })) });
  const patch = (id: string, p: Partial<GroundAbilityDefinition>) => save(library.map((ability) => (ability.id === id ? { ...ability, ...p } : ability)));
  const add = () => save([
    ...library,
    {
      id: `ability_${nanoid(5)}`,
      name: 'New Ability',
      kind: 'rescue-field',
      keyCode: `Digit${Math.min(9, library.length + 1)}`,
      durationSec: 1,
      cooldownSec: 4,
      color: character.color,
      radius: 6,
      strength: 1,
      aiUsable: true,
    },
  ]);
  const remove = (id: string) => save(library.filter((ability) => ability.id !== id));
  return (
    <div className="space-y-2 rounded-lg border border-fuchsia-700/40 bg-fuchsia-950/10 p-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className={lbl}>Ability library · {library.length}</div>
          <div className="text-[10px] text-slate-500">Runtime maps this library to Q/R/extra FX while keeping old groundAbility data compatible.</div>
        </div>
        <button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">+ Ability</button>
      </div>
      {errors.length > 0 && <div className="rounded bg-rose-950/30 p-1.5 text-[10px] text-rose-200">{errors.map((error) => <div key={error}>{error}</div>)}</div>}
      <div className="space-y-1.5">
        {library.map((ability, index) => (
          <div key={ability.id} className="rounded border border-slate-800 bg-slate-900/55 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <TextRow label="Name" value={ability.name} onChange={(v) => patch(ability.id, { name: v })} />
              <TextRow label="Key code" value={ability.keyCode} onChange={(v) => patch(ability.id, { keyCode: v })} />
              <SelectRow label="Kind" value={ability.kind} options={GROUND_ABILITY_LIBRARY_KINDS.map((kind) => ({ value: kind, label: kind }))} onChange={(v) => patch(ability.id, { kind: v as GroundAbilityDefinition['kind'] })} />
              <ColorRow label="FX colour" value={ability.color} onChange={(v) => patch(ability.id, { color: v })} />
              <NumRow label="Duration (s)" value={ability.durationSec} step={0.05} min={0.05} onChange={(v) => patch(ability.id, { durationSec: v })} />
              <NumRow label="Cooldown (s)" value={ability.cooldownSec} step={0.1} min={0} onChange={(v) => patch(ability.id, { cooldownSec: v })} />
              <NumRow label="Radius" value={ability.radius} step={0.5} min={0} onChange={(v) => patch(ability.id, { radius: v })} />
              <NumRow label="Strength" value={ability.strength} step={0.1} min={0} onChange={(v) => patch(ability.id, { strength: v })} />
              <NumRow label="Speed" value={ability.speed ?? 0} step={1} min={0} onChange={(v) => patch(ability.id, { speed: v || undefined })} />
              <NumRow label="Ghost count" value={ability.afterimageCount ?? 0} step={1} min={0} max={32} onChange={(v) => patch(ability.id, { afterimageCount: v || undefined })} />
              <NumRow label="Ghost life (s)" value={ability.afterimageLifeSec ?? 0} step={0.05} min={0} onChange={(v) => patch(ability.id, { afterimageLifeSec: v || undefined })} />
              <NumRow label="Ghost opacity" value={ability.afterimageOpacity ?? 0} step={0.05} min={0} max={1} onChange={(v) => patch(ability.id, { afterimageOpacity: v || undefined })} />
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Check label="AI can use" checked={ability.aiUsable ?? false} onChange={(v) => patch(ability.id, { aiUsable: v })} />
              <Check label="Lock dash direction" checked={ability.lockDirection ?? false} onChange={(v) => patch(ability.id, { lockDirection: v })} />
            </div>
            <div className="mt-1">
              <ClipMultiPicker modelAssetId={character.modelAssetId} selected={ability.animationPool ?? []} onChange={(clips) => patch(ability.id, { animationPool: clips })} />
            </div>
            <div className="mt-1 flex gap-1.5">
              <MoveButtons index={index} count={library.length} onMove={(d) => save(moveItem(library, index, d))} />
              <button onClick={() => remove(ability.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Super moves sub-editor — up to 6 offensive supers bound to keys 1–6 for the destination yokai hunt. Reuses
// the POLI SuperMove/SuperKind model; each row picks an attack kind + tunes colour/damage/radius/range/cooldown.
const SuperMovesEditor = ({ supers, onChange }: { supers: SuperMove[]; onChange: (s: SuperMove[]) => void }) => {
  const add = () => { if (supers.length < 6) onChange([...supers, { id: `sm_${nanoid(5)}`, name: 'New Super', kind: 'nova', color: '#38bdf8', damage: 30, radius: 8, range: 14, cooldownSec: 4, duration: 0.8, count: 4 }]); };
  const patch = (id: string, p: Partial<SuperMove>) => onChange(supers.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = (id: string) => onChange(supers.filter((s) => s.id !== id));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className={lbl}>Super moves · {supers.length}/6 (keys 1–6)</div>
        <button onClick={add} disabled={supers.length >= 6} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50 disabled:opacity-40">➕ Super</button>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-500">Fired at the destination (keys 1–6). Attack kind sets the VFX + how it hits yokai (Batch 3).</p>
      <div className="mt-1 space-y-1.5">
        {supers.map((s, i) => (
          <div key={s.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow label={`Key ${i + 1} · kind`} value={s.kind} options={SUPER_KINDS.map((k) => ({ value: k, label: SUPER_KIND_LABEL[k] }))} onChange={(v) => patch(s.id, { kind: v as SuperMove['kind'] })} />
              <TextRow label="Name" value={s.name} onChange={(v) => patch(s.id, { name: v })} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <ColorRow label="Colour" value={s.color} onChange={(v) => patch(s.id, { color: v })} />
              <NumRow label="Damage" value={s.damage} step={1} min={0} onChange={(v) => patch(s.id, { damage: v })} />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <NumRow label="Radius" value={s.radius ?? 8} step={0.5} min={0} onChange={(v) => patch(s.id, { radius: v })} />
              <NumRow label="Range" value={s.range ?? 14} step={0.5} min={0} onChange={(v) => patch(s.id, { range: v })} />
              <NumRow label="Cooldown s" value={s.cooldownSec} step={0.5} min={0} onChange={(v) => patch(s.id, { cooldownSec: v })} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <NumRow label="Duration s" value={s.duration ?? 0.8} step={0.1} min={0} onChange={(v) => patch(s.id, { duration: v })} />
              <NumRow label="Count" value={s.count ?? 4} step={1} min={1} onChange={(v) => patch(s.id, { count: v })} />
            </div>
            <div className="mt-1 flex gap-1.5">
              <MoveButtons index={i} count={supers.length} onMove={(d) => onChange(moveItem(supers, i, d))} />
              <button onClick={() => remove(s.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
            </div>
          </div>
        ))}
        {supers.length === 0 && <div className="text-[11px] text-slate-500">No supers — ➕ to add (keys 1–6).</div>}
      </div>
    </div>
  );
};

// 🛩 Characters — full authoring: identity, stats, abilities, the model, animation clips (idle / flight /
// transform) read live from the GLB, plus flavour. Advanced trigger→clip animation RULES + per-model
// transform live in the 🎬 Model Studio tab (it targets the same model id).
export const CharacterEditorTab = () => {
  const transformations = useEditorTransformationStore((s) => s.items);
  return (
    <CollectionEditor<CharacterDefinition>
      title="Characters"
      store={useEditorCharacterStore}
      makeNew={makeNew}
      getLabel={(c) => `${c.name} · ${c.codename}`}
      renderFields={(c, update) => (
        <>
          <TextRow label="Codename" value={c.codename} onChange={(v) => update({ codename: v })} />
          <TextRow label="Name" value={c.name} onChange={(v) => update({ name: v })} />
          <TextRow label="Role" value={c.role} onChange={(v) => update({ role: v })} />
          <TextRow label="Description" area value={c.description} onChange={(v) => update({ description: v })} />
          <TextRow label="Catchphrase" value={c.catchphrase ?? ''} onChange={(v) => update({ catchphrase: v || undefined })} />
          <ConfidenceRow value={c.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
          <ColorRow label="Colour" value={c.color} onChange={(v) => update({ color: v })} />
          <SelectRow label="Default form" value={c.defaultForm} options={CHARACTER_FORMS.map((f) => ({ value: f, label: f }))} onChange={(v) => update({ defaultForm: v as CharacterDefinition['defaultForm'] })} />
          <SelectRow label="Preferred weather" value={c.preferredWeather ?? ''} options={[{ value: '', label: '(none)' }, ...WEATHER_KINDS.map((w) => ({ value: w, label: w }))]} onChange={(v) => update({ preferredWeather: (v || undefined) as CharacterDefinition['preferredWeather'] })} />

          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Flight speed" value={c.stats.flightSpeed} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, flightSpeed: v } })} />
            <NumRow label="Agility" value={c.stats.agility} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, agility: v } })} />
            <NumRow label="Control difficulty" value={c.stats.controlDifficulty} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, controlDifficulty: v } })} />
            <NumRow label="Durability" value={c.stats.durability} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, durability: v } })} />
          </div>

          <Field label="Robot model (ground / mission / robot form)">
            <ModelPicker value={c.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(none)" />
          </Field>
          <Field label="Plane model (flight / vehicle form — empty = use robot model)">
            <ModelPicker value={c.planeModelAssetId} onChange={(v) => update({ planeModelAssetId: v })} noneLabel="(use robot model)" />
          </Field>
          <NumRow label="Ground model scale (landing/mission + afterimages)" value={c.modelScale ?? GROUND_BASE_SCALE} step={0.1} min={0.1} onChange={(v) => update({ modelScale: v })} />
          <Check label="Can fly at destination (F toggle — Space up / Shift down / Shift+move fast). On by default." checked={c.canFly !== false} onChange={(v) => update({ canFly: v })} />

          {/* Animation clips — read live from the selected model's GLB. Single-clip fallbacks when no rules. */}
          <div className={lbl}>Animation clips (fallback)</div>
          <ClipPicker label="Idle / preview" modelAssetId={c.modelAssetId} value={c.idleAnimation} onChange={(v) => update({ idleAnimation: v })} />
          <ClipPicker label="Flight" modelAssetId={c.planeModelAssetId ?? c.modelAssetId} value={c.flightAnimation} onChange={(v) => update({ flightAnimation: v })} />
          <ClipPicker label="Transform" modelAssetId={c.modelAssetId} value={c.transformAnimation} onChange={(v) => update({ transformAnimation: v })} />

          {/* Custom animation rules (POLI engine) — define which clip plays under which condition. */}
          <AnimationRulesEditor rules={c.animationRules ?? []} modelAssetId={c.modelAssetId} onChange={(r) => update({ animationRules: r })} />
          <p className="text-[10px] text-slate-500">Per-model transform: 🎬 Model Studio (same model id).</p>

          <AbilitiesEditor abilities={c.abilities} onChange={(a) => update({ abilities: a })} />
          <SuperMovesEditor supers={c.supers ?? []} onChange={(s) => update({ supers: s })} />
          <GroundAbilityLibraryEditor character={c} update={update} />
          <GroundAbilityEditor character={c} update={update} />

          <TextRow label="Mission suitability (csv of MissionType)" value={csv(c.missionSuitability)} onChange={(v) => update({ missionSuitability: parseCsv(v) })} />
          <SelectRow label="Transformation" value={c.transformationId ?? ''} options={[{ value: '', label: '(none)' }, ...transformations.map((t) => ({ value: t.id, label: t.name }))]} onChange={(v) => update({ transformationId: v || undefined })} />
          <TextRow label="Card image (src/assets/cards)" value={c.cardImage ?? ''} onChange={(v) => update({ cardImage: v || undefined })} />
        </>
      )}
    />
  );
};
