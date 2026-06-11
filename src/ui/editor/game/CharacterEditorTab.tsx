import { nanoid } from 'nanoid';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { useEditorTransformationStore } from '../../../stores/game/editorTransformationStore';
import { CHARACTER_FORMS, ABILITY_KINDS } from '../../../types/game/character';
import type { CharacterDefinition, CharacterAbility } from '../../../types/game/character';
import { WEATHER_KINDS } from '../../../types/game/flight';
import { getModelAsset } from '../../../data/modelLibrary';
import { csv, parseCsv, Field, lbl } from '../editorShared';
import { ModelPicker } from '../ModelPicker';
import { useGltfClipNames } from '../useGltfClipNames';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';

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

          <Field label="Model (robot/transformer)">
            <ModelPicker value={c.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(none)" />
          </Field>

          {/* Animation clips — read live from the selected model's GLB. */}
          <div className={lbl}>Animation clips</div>
          <ClipPicker label="Idle / preview" modelAssetId={c.modelAssetId} value={c.idleAnimation} onChange={(v) => update({ idleAnimation: v })} />
          <ClipPicker label="Flight" modelAssetId={c.modelAssetId} value={c.flightAnimation} onChange={(v) => update({ flightAnimation: v })} />
          <ClipPicker label="Transform" modelAssetId={c.modelAssetId} value={c.transformAnimation} onChange={(v) => update({ transformAnimation: v })} />
          <p className="text-[10px] text-slate-500">Advanced trigger→clip rules + per-model transform: 🎬 Model Studio (same model id).</p>

          <AbilitiesEditor abilities={c.abilities} onChange={(a) => update({ abilities: a })} />

          <TextRow label="Mission suitability (csv of MissionType)" value={csv(c.missionSuitability)} onChange={(v) => update({ missionSuitability: parseCsv(v) })} />
          <SelectRow label="Transformation" value={c.transformationId ?? ''} options={[{ value: '', label: '(none)' }, ...transformations.map((t) => ({ value: t.id, label: t.name }))]} onChange={(v) => update({ transformationId: v || undefined })} />
          <TextRow label="Card image (src/assets/cards)" value={c.cardImage ?? ''} onChange={(v) => update({ cardImage: v || undefined })} />
        </>
      )}
    />
  );
};
