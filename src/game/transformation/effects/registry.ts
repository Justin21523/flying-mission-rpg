import type { ComponentType } from 'react';
import type {
  ActiveEffectV2, EffectCategory, EffectParameters, EffectTypeV2,
} from '../../../types/game/transformationEffects';

// Data-driven effect registry. Every effect type registers an entry; the editor reads `editorFields` to render
// its param panel, and the host (TransformationEffectLayerV2) reads `Renderer` to draw it. Adding a new effect
// = one registerEffect() call (no switch/if-else sprawl).
export interface EffectEditorField {
  key: keyof EffectParameters;
  label: string;
  kind: 'number' | 'color' | 'bool' | 'select' | 'vec3' | 'text';
  step?: number;
  min?: number;
  max?: number;
  options?: readonly string[];
}

export interface EffectRegistryEntry {
  type: EffectTypeV2;
  label: string;
  category: EffectCategory;
  defaultParameters: EffectParameters;
  editorFields: EffectEditorField[];
  Renderer: ComponentType<{ fx: ActiveEffectV2 }>;
}

const REGISTRY = new Map<EffectTypeV2, EffectRegistryEntry>();

export function registerEffect(entry: EffectRegistryEntry): void {
  REGISTRY.set(entry.type, entry);
}
export function getEffectEntry(type: EffectTypeV2): EffectRegistryEntry | undefined {
  return REGISTRY.get(type);
}
export function allEffectEntries(): EffectRegistryEntry[] {
  return [...REGISTRY.values()];
}
export function effectEntriesByCategory(): Record<EffectCategory, EffectRegistryEntry[]> {
  const out = {} as Record<EffectCategory, EffectRegistryEntry[]>;
  for (const e of REGISTRY.values()) (out[e.category] ??= []).push(e);
  return out;
}
