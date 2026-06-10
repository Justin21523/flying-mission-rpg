import type { ReactionAction, ReactionTarget } from '../../types/collision';
import { PATH_CONTROL_MODES, type PathControlMode } from '../../types/path';
import { inp, lbl, useAnimationOptions, usePathOptions, useDialogueOptions, useNpcOptions } from './editorShared';
import { IdSelect } from './idPickers';

// Phase D — editor for a single ReactionAction (one entry in a CollisionReactionRule's action chain). A kind
// <select> swaps to per-kind fields (mirrors ConditionEditor). Defaults keep the discriminated union valid when
// switching kinds. The valid SFX cues match audio/sfx.ts SfxName.
type Kind = ReactionAction['type'];
const KIND_LABEL: Record<Kind, string> = {
  playAnimation: 'play animation', playSound: 'play sound', spawnEffect: 'spawn effect', applyForce: 'apply force',
  changeState: 'change state', startDialogue: 'start dialogue', triggerNpcReaction: 'npc reaction',
  startIncident: 'start incident', enterPathFollow: 'enter path-follow', exitPathFollow: 'exit path-follow',
  modifyRelationship: 'modify relationship', emitGameEvent: 'emit game event',
};
const KINDS = Object.keys(KIND_LABEL) as Kind[];
const SFX = ['transform', 'ability', 'rescueSuccess', 'rescueFail', 'incident', 'questComplete', 'ui'];
const TARGETS: ReactionTarget[] = ['source', 'target'];

function defaultFor(k: Kind): ReactionAction {
  switch (k) {
    case 'playAnimation': return { type: 'playAnimation', on: 'source', animationId: '' };
    case 'playSound': return { type: 'playSound', soundId: 'ui' };
    case 'spawnEffect': return { type: 'spawnEffect', effectId: '' };
    case 'applyForce': return { type: 'applyForce', on: 'source', direction: [0, 0, 0], strength: 4 };
    case 'changeState': return { type: 'changeState', on: 'target', state: '' };
    case 'startDialogue': return { type: 'startDialogue', dialogueTreeId: '' };
    case 'triggerNpcReaction': return { type: 'triggerNpcReaction', reaction: '' };
    case 'startIncident': return { type: 'startIncident', incidentId: '' };
    case 'enterPathFollow': return { type: 'enterPathFollow', pathId: '', mode: 'forwardLocked' };
    case 'exitPathFollow': return { type: 'exitPathFollow' };
    case 'modifyRelationship': return { type: 'modifyRelationship', characterId: '', amount: 1 };
    case 'emitGameEvent': return { type: 'emitGameEvent', event: '' };
  }
}

const TargetSelect = ({ value, onChange }: { value: ReactionTarget; onChange: (v: ReactionTarget) => void }) => (
  <select value={value} onChange={(e) => onChange(e.target.value as ReactionTarget)} className={inp + ' w-24'}>
    {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
  </select>
);

export const ActionEditor = ({ value, onChange, onRemove }: { value: ReactionAction; onChange: (v: ReactionAction) => void; onRemove: () => void }) => {
  const anims = useAnimationOptions();
  const paths = usePathOptions();
  const dialogues = useDialogueOptions();
  const npcs = useNpcOptions();
  const a = value;

  return (
    <div className="flex flex-wrap items-end gap-1.5 rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
      <label className="flex flex-col gap-0.5">
        <span className={lbl}>action</span>
        <select value={a.type} onChange={(e) => onChange(defaultFor(e.target.value as Kind))} className={inp}>
          {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </label>

      {a.type === 'playAnimation' && (<>
        <TargetSelect value={a.on} onChange={(on) => onChange({ ...a, on })} />
        <div className="min-w-[8rem] flex-1"><IdSelect value={a.animationId} onChange={(v) => onChange({ ...a, animationId: v ?? '' })} options={anims} placeholder="(animation)" /></div>
      </>)}
      {a.type === 'playSound' && (
        <select value={a.soundId} onChange={(e) => onChange({ ...a, soundId: e.target.value })} className={inp + ' flex-1'}>
          {SFX.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {a.type === 'spawnEffect' && (
        <input value={a.effectId} onChange={(e) => onChange({ ...a, effectId: e.target.value })} placeholder="effect id" className={inp + ' flex-1'} />
      )}
      {a.type === 'applyForce' && (<>
        <TargetSelect value={a.on} onChange={(on) => onChange({ ...a, on })} />
        <label className="flex flex-col gap-0.5"><span className={lbl}>strength</span>
          <input type="number" step={0.5} value={a.strength} onChange={(e) => onChange({ ...a, strength: parseFloat(e.target.value) || 0 })} className={inp + ' w-20'} /></label>
        <span className="text-[9px] text-slate-500">dir 0,0,0 = push away from contact</span>
      </>)}
      {a.type === 'changeState' && (<>
        <TargetSelect value={a.on} onChange={(on) => onChange({ ...a, on })} />
        <input value={a.state} onChange={(e) => onChange({ ...a, state: e.target.value })} placeholder="state name" className={inp + ' flex-1'} />
      </>)}
      {a.type === 'startDialogue' && (
        <div className="min-w-[8rem] flex-1"><IdSelect value={a.dialogueTreeId} onChange={(v) => onChange({ ...a, dialogueTreeId: v ?? '' })} options={dialogues} placeholder="(dialogue tree)" /></div>
      )}
      {a.type === 'triggerNpcReaction' && (
        <input value={a.reaction} onChange={(e) => onChange({ ...a, reaction: e.target.value })} placeholder="reaction key" className={inp + ' flex-1'} />
      )}
      {a.type === 'startIncident' && (
        <input value={a.incidentId} onChange={(e) => onChange({ ...a, incidentId: e.target.value })} placeholder="incident id" className={inp + ' flex-1'} />
      )}
      {a.type === 'enterPathFollow' && (<>
        <div className="min-w-[8rem] flex-1"><IdSelect value={a.pathId} onChange={(v) => onChange({ ...a, pathId: v ?? '' })} options={paths} placeholder="(path)" /></div>
        <select value={a.mode} onChange={(e) => onChange({ ...a, mode: e.target.value as PathControlMode })} className={inp + ' w-36'}>
          {PATH_CONTROL_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </>)}
      {a.type === 'modifyRelationship' && (<>
        <div className="min-w-[8rem] flex-1"><IdSelect value={a.characterId} onChange={(v) => onChange({ ...a, characterId: v ?? '' })} options={npcs} placeholder="(character)" /></div>
        <label className="flex flex-col gap-0.5"><span className={lbl}>amount</span>
          <input type="number" step={1} value={a.amount} onChange={(e) => onChange({ ...a, amount: parseInt(e.target.value, 10) || 0 })} className={inp + ' w-20'} /></label>
      </>)}
      {a.type === 'emitGameEvent' && (
        <input value={a.event} onChange={(e) => onChange({ ...a, event: e.target.value })} placeholder="event name" className={inp + ' flex-1'} />
      )}

      <button onClick={onRemove} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
    </div>
  );
};
