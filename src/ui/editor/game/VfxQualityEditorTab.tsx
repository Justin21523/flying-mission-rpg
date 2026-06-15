import { useMemo, useState } from 'react';
import { useVfxStyleProfileStore } from '../../../stores/game/useVfxStyleProfileStore';
import { usePhysicsVfxObjectStore } from '../../../stores/game/usePhysicsVfxObjectStore';
import { VFX_MOTION_LANGUAGES } from '../../../types/characterVfxStyleTypes';
import type { CharacterVfxStyleProfile } from '../../../types/characterVfxStyleTypes';
import type { PhysicsVfxObjectDefinition } from '../../../types/physicsVfxTypes';
import { PHYSICS_VFX_OBJECT_TYPES } from '../../../types/physicsVfxTypes';
import { signaturePieces } from '../../../data/cinematic-vfx/signatureEffectLibrary';
import { auditAllVfx } from '../../../game/vfx/vfxAudit';
import { thresholdFor } from '../../../game/vfx/CinematicVfxQualityScorer';
import { Field, inp, lbl, csv } from '../editorShared';

type Sub = 'style' | 'signature' | 'physics' | 'audit';
const SUBS: { id: Sub; label: string }[] = [
  { id: 'style', label: 'Style' }, { id: 'signature', label: 'Signature' },
  { id: 'physics', label: 'Physics' }, { id: 'audit', label: 'Audit' },
];

// 🎨 VFX Quality (Batch F.6) — one tab for the whole character-VFX visual-language system: per-hero Style
// profiles, the Signature piece library, the Physics-object archetypes, and the quality Audit (showcase ≥85,
// others ≥65, cross-character overlap warnings).
export const VfxQualityEditorTab = () => {
  const [sub, setSub] = useState<Sub>('style');
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-1">
        {SUBS.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)} className={`rounded px-2 py-0.5 text-[10px] ${s.id === sub ? 'bg-pink-600/30 text-pink-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s.label}</button>
        ))}
      </div>
      {sub === 'style' && <StyleSection />}
      {sub === 'signature' && <SignatureSection />}
      {sub === 'physics' && <PhysicsSection />}
      {sub === 'audit' && <AuditSection />}
    </div>
  );
};

const StyleSection = () => {
  const items = useVfxStyleProfileStore((s) => s.items);
  const update = useVfxStyleProfileStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const p = items.find((x) => x.id === sel) as (CharacterVfxStyleProfile & { id: string }) | undefined;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-0.5 text-[10px] ${x.id === sel ? 'bg-pink-600/30 text-pink-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.characterId.replace('char_', '')}</button>)}
      </div>
      {p && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Motion language">
            <select value={p.motionLanguage} onChange={(e) => update(p.id, { motionLanguage: e.target.value as CharacterVfxStyleProfile['motionLanguage'] })} className={inp}>
              {VFX_MOTION_LANGUAGES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Camera shake">
            <select value={p.cameraFeedbackStyle.screenShakeIntensity} onChange={(e) => update(p.id, { cameraFeedbackStyle: { ...p.cameraFeedbackStyle, screenShakeIntensity: e.target.value as CharacterVfxStyleProfile['cameraFeedbackStyle']['screenShakeIntensity'] } })} className={inp}>
              {(['none', 'small', 'medium', 'heavy'] as const).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Max major layers">
            <input type="number" value={p.readabilityRules.maxSimultaneousMajorLayers} onChange={(e) => update(p.id, { readabilityRules: { ...p.readabilityRules, maxSimultaneousMajorLayers: parseInt(e.target.value) || 1 } })} className={inp} />
          </Field>
          <Field label="Collision behavior">
            <input value={p.physicsObjectLanguage.collisionBehavior} readOnly className={inp + ' opacity-70'} />
          </Field>
          <div className="col-span-2 text-[10px] text-slate-400">
            <div>Shapes: {csv(p.primaryShapes)}</div>
            <div>Signature objects: {csv(p.signatureObjects)}</div>
            <div>Keywords: {csv(p.visualKeywords)}</div>
            {p.forbiddenOverusedShapes?.length ? <div className="text-amber-400">Avoid overusing: {csv(p.forbiddenOverusedShapes)}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
};

const SignatureSection = () => {
  const profiles = useVfxStyleProfileStore((s) => s.items);
  const [sel, setSel] = useState<string>(profiles[0]?.characterId ?? 'char_jett');
  const pieces = signaturePieces(sel);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {profiles.map((x) => <button key={x.id} onClick={() => setSel(x.characterId)} className={`rounded px-2 py-0.5 text-[10px] ${x.characterId === sel ? 'bg-pink-600/30 text-pink-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.characterId.replace('char_', '')}</button>)}
      </div>
      <div className="rounded-lg border border-slate-800 p-2 text-[10px] text-slate-300">
        {Object.entries(pieces).map(([key, make]) => {
          const layers = make('#33ccff');
          return <div key={key}>· <span className="text-pink-200">{key}</span> → {layers.map((l) => l.layerType).join(' + ')}</div>;
        })}
      </div>
    </div>
  );
};

const PhysicsSection = () => {
  const items = usePhysicsVfxObjectStore((s) => s.items);
  const update = usePhysicsVfxObjectStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const o = items.find((x) => x.id === sel) as PhysicsVfxObjectDefinition | undefined;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-0.5 text-[10px] ${x.id === sel ? 'bg-pink-600/30 text-pink-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.objectType}</button>)}
      </div>
      {o && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Object type">
            <select value={o.objectType} onChange={(e) => update(o.id, { objectType: e.target.value as PhysicsVfxObjectDefinition['objectType'] })} className={inp}>
              {PHYSICS_VFX_OBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Lifetime (s)"><input type="number" step={0.1} value={o.physics.lifetimeSeconds} onChange={(e) => update(o.id, { physics: { ...o.physics, lifetimeSeconds: parseFloat(e.target.value) || 0.1 } })} className={inp} /></Field>
          <Field label="Gravity scale"><input type="number" step={0.1} value={o.physics.gravityScale ?? 1} onChange={(e) => update(o.id, { physics: { ...o.physics, gravityScale: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Restitution"><input type="number" step={0.05} value={o.physics.restitution ?? 0.3} onChange={(e) => update(o.id, { physics: { ...o.physics, restitution: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)) } })} className={inp} /></Field>
          <Field label="Friction"><input type="number" step={0.05} value={o.physics.friction ?? 0.4} onChange={(e) => update(o.id, { physics: { ...o.physics, friction: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Count"><input type="number" value={o.spawn.count} onChange={(e) => update(o.id, { spawn: { ...o.spawn, count: parseInt(e.target.value) || 1 } })} className={inp} /></Field>
          <Field label="Fade-out (s)"><input type="number" step={0.05} value={o.cleanup.fadeOutSeconds} onChange={(e) => update(o.id, { cleanup: { ...o.cleanup, fadeOutSeconds: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <div className="col-span-2 text-[10px] text-slate-400">shape: {o.shape} · behavior: {o.physics.behavior ?? 'debris'} · spread: {o.spawn.spreadShape}</div>
        </div>
      )}
    </div>
  );
};

const AuditSection = () => {
  const audit = useMemo(() => auditAllVfx(), []);
  return (
    <div className="space-y-2">
      <div className={lbl}>Per-character average</div>
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-800 p-2 text-[10px]">
        {Object.entries(audit.perCharacterAverage).map(([c, avg]) => (
          <div key={c} className="text-slate-300">{c.replace('char_', '')}: <span className={avg >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{avg}</span></div>
        ))}
      </div>
      <div className={lbl}>{audit.failing.length === 0 ? <span className="text-emerald-400">✓ all abilities pass their threshold</span> : <span className="text-rose-400">✗ {audit.failing.length} failing</span>}</div>
      <div className="max-h-64 space-y-0.5 overflow-auto rounded-lg border border-slate-800 p-2 text-[10px]">
        {audit.scores.map((s) => (
          <div key={s.abilityId} className="flex items-center gap-2">
            <span className={s.passed ? 'text-emerald-400' : 'text-rose-400'}>{s.passed ? '✓' : '✗'}</span>
            <span className="w-44 text-slate-300">{s.abilityId}{s.isShowcase ? ' ★' : ''}</span>
            <span className="text-slate-400">{s.score}/{thresholdFor(s.abilityId)}</span>
            {s.warnings.length > 0 && <span className="text-amber-400/80 truncate">{s.warnings[0]}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
