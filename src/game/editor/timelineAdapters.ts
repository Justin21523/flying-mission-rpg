import { nanoid } from 'nanoid';
import { createDefaultEffectConfig } from '../transformation/effects/createEffect';
import type { TransformationEffectConfig } from '../../types/game/transformationEffects';
import type { FlightTimelineEvent, FlightCameraKeyframe } from '../../types/game/flightPhase';
import type { SkillTimelineEvent } from '../../types/game/combat';
import type { PresetKind } from '../../types/game/editorPreset';

// Thin per-system glue so the SHARED preset / version / clipboard layer can operate on each timeline's EXISTING
// config sub-trees without those systems sharing a type. The only behaviour an adapter must provide is re-keying:
// when a fragment is pasted or a preset is applied, its ids must be regenerated so it can coexist with (or be
// duplicated alongside) the originals — and so it can be applied to a DIFFERENT character/form safely.
// Runners and config types are untouched; this is purely additive.
export interface TimelineAdapter<Event> {
  kind: string;
  eventPresetKind: PresetKind;
  fullPresetKind: PresetKind;
  rekeyEvent: (e: Event) => Event;
  rekeyEvents: (list: Event[]) => Event[];
}

// ── Transformation effects ──────────────────────────────────────────────────
// Reuses the EXACT re-key pattern already used by EffectsV2Editor's duplicate button
// (`createDefaultEffectConfig(type).effectId`) so behaviour is identical and proven.
export function rekeyEffect(e: TransformationEffectConfig): TransformationEffectConfig {
  return { ...e, effectId: createDefaultEffectConfig(e.effectType).effectId };
}

export function rekeyEffects(list: TransformationEffectConfig[]): TransformationEffectConfig[] {
  return list.map(rekeyEffect);
}

export const transformationEffectAdapter: TimelineAdapter<TransformationEffectConfig> = {
  kind: 'transformation',
  eventPresetKind: 'transformation.effect',
  fullPresetKind: 'transformation.full',
  rekeyEvent: rekeyEffect,
  rekeyEvents: rekeyEffects,
};

// ── Flight timeline events + camera keyframes ───────────────────────────────
// Mirror the store's id convention (`uid(p) = `${p}_${nanoid(6)}``: events `ev_`, cameras `cam_`).
export function rekeyFlightEvent(e: FlightTimelineEvent): FlightTimelineEvent {
  return { ...e, eventId: `ev_${nanoid(6)}` };
}

export function rekeyFlightCameraKey(k: FlightCameraKeyframe): FlightCameraKeyframe {
  // Clear nodeId so a pasted/inserted copy is an independent free keyframe — never double-binds one path node.
  return { ...k, keyframeId: `cam_${nanoid(6)}`, nodeId: undefined };
}

// ── Skill timeline events ───────────────────────────────────────────────────
export function rekeySkillEvent(e: SkillTimelineEvent): SkillTimelineEvent {
  return { ...e, eventId: `sev_${nanoid(6)}` };
}
