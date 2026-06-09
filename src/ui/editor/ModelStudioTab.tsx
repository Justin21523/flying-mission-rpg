import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF, Grid } from '@react-three/drei';
import { AnimationMixer, LoopRepeat, type Group, type AnimationAction } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { MODEL_ASSET_LIST, type ModelAsset } from '../../data/modelLibrary';
import { useModelStudioStore, resolveModelAsset, type Vec3 } from '../../stores/modelStudioStore';
import { Field, inp, lbl } from './editorShared';
import { AnimRuleList } from './AnimRuleList';

// 🎬 Model Studio — a dedicated page to tune any discovered model: size / position / rotation via a 3D gizmo
// (+ numeric), and preview its animation clips. Saves to modelStudioStore (localStorage), which the in-world
// GLB renderers already merge, so changes show everywhere. Yokai size/animation are tuned in the 👹 Yokai
// panel (Mini-games tab); characters in the 🤖 POLI tab.

type GizmoMode = 'translate' | 'rotate' | 'scale';
const RAD = Math.PI / 180;

export const ModelStudioTab = () => {
  const overrides = useModelStudioStore((s) => s.overrides);
  const [selId, setSelId] = useState<string>(MODEL_ASSET_LIST[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<GizmoMode>('translate');
  const [clip, setClip] = useState<string>('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? MODEL_ASSET_LIST.filter((a) => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)) : MODEL_ASSET_LIST;
  }, [query]);
  const asset = resolveModelAsset(selId);
  const ov = overrides[selId];
  const set = useModelStudioStore.getState().setTransform;
  const reset = useModelStudioStore.getState().resetAsset;

  const pos = (ov?.position ?? asset?.position ?? [0, 0, 0]) as Vec3;
  const rot = (ov?.rotation ?? asset?.rotation ?? [0, 0, 0]) as Vec3;
  const scale = ov?.scale ?? asset?.scale ?? 1;

  const setPos = (i: number, v: number) => { const n = [...pos] as Vec3; n[i] = v; set(selId, { position: n }); };
  const setRot = (i: number, v: number) => { const n = [...rot] as Vec3; n[i] = v * RAD; set(selId, { rotation: n }); };

  return (
    <div className="flex gap-3 text-xs" style={{ height: '64vh' }}>
      {/* Model list */}
      <div className="flex w-52 shrink-0 flex-col gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search models…" className={inp} />
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => { setSelId(a.id); setClip(''); }}
              className={`block w-full truncate rounded px-2 py-1 text-left ${selId === a.id ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'}`}>
              {a.label} <span className="text-[9px] text-slate-500">· {a.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview + controls */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {asset ? (
          <>
            <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <Canvas camera={{ position: [3, 2.5, 3.5], fov: 45 }} dpr={[1, 1.5]}>
                <ambientLight intensity={0.9} />
                <hemisphereLight args={['#ffffff', '#90a0b0', 0.8]} />
                <directionalLight position={[5, 8, 4]} intensity={1.2} />
                <Grid args={[20, 20]} cellColor="#334155" sectionColor="#475569" infiniteGrid fadeDistance={28} position={[0, 0, 0]} />
                <Suspense fallback={null}>
                  <PreviewStage asset={asset} pos={pos} rot={rot} scale={scale} mode={mode} clip={clip}
                    onTransform={(p) => set(selId, p)} />
                </Suspense>
                <OrbitControls makeDefault />
              </Canvas>
              <div className="pointer-events-none absolute left-2 top-2 rounded bg-slate-900/70 px-2 py-0.5 text-[10px] text-slate-300">{asset.label}</div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={lbl}>Gizmo:</span>
              {(['translate', 'rotate', 'scale'] as GizmoMode[]).map((mDot) => (
                <button key={mDot} onClick={() => setMode(mDot)} className={`rounded px-2 py-0.5 text-[11px] ${mode === mDot ? 'bg-violet-600/40 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{mDot}</button>
              ))}
              <button onClick={() => reset(selId)} className="ml-auto rounded px-2 py-0.5 text-[11px] text-amber-300 hover:bg-slate-800">Reset</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Field label="scale"><input type="number" step={0.05} min={0.01} className={inp} value={Math.round(scale * 1000) / 1000} onChange={(e) => set(selId, { scale: parseFloat(e.target.value) || 0.01 })} /></Field>
              <ClipPicker asset={asset} clip={clip} setClip={setClip} />
              <div />
              {(['x', 'y', 'z'] as const).map((axis, i) => (
                <Field key={`p${axis}`} label={`pos ${axis}`}><input type="number" step={0.1} className={inp} value={Math.round(pos[i] * 100) / 100} onChange={(e) => setPos(i, parseFloat(e.target.value) || 0)} /></Field>
              ))}
              {(['x', 'y', 'z'] as const).map((axis, i) => (
                <Field key={`r${axis}`} label={`rot ${axis}°`}><input type="number" step={5} className={inp} value={Math.round((rot[i] / RAD) * 10) / 10} onChange={(e) => setRot(i, parseFloat(e.target.value) || 0)} /></Field>
              ))}
            </div>
            <ModelAnimSection assetId={selId} path={asset.path} />
            <div className="text-[10px] text-slate-500">Drag the gizmo or edit numbers — saved automatically (localStorage), applied to every placement of this model. Animation rules (trigger → clip/track, custom name, timing) drive in-world set-pieces. Yokai: 👹 Yokai panel; characters: 🤖 POLI tab.</div>
          </>
        ) : <p className="text-[11px] text-slate-500">No models found in src/assets/models or public/models.</p>}
      </div>
    </div>
  );
};

// Animation-rules editor for the selected model — author trigger→clip rules (drive in-world set-pieces).
const ModelAnimSection = ({ assetId, path }: { assetId: string; path: string }) => {
  const ov = useModelStudioStore((s) => s.overrides[assetId]);
  const clips = useClipNames(path);
  return <AnimRuleList rules={ov?.animations ?? []} clips={clips} onChange={(next) => useModelStudioStore.getState().setAnimations(assetId, next)} />;
};

// Clip dropdown — populated from the model's animation names (reported by PreviewStage via onClips on load).
const ClipPicker = ({ asset, clip, setClip }: { asset: ModelAsset; clip: string; setClip: (c: string) => void }) => {
  const names = useClipNames(asset.path);
  return (
    <Field label="preview clip">
      <select className={inp} value={clip} onChange={(e) => setClip(e.target.value)}>
        <option value="">(first / none)</option>
        {names.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </Field>
  );
};

// Read clip names from the cached GLTF (already loaded by the preview).
function useClipNames(path: string): string[] {
  const { animations } = useGLTF(encodeURI(path));
  return useMemo(() => (animations ?? []).map((a) => a.name), [animations]);
}

// The previewed model: normalized clone driven by the live override transform, with a gizmo bound to it and a
// chosen clip playing. onTransform writes back the gizmo's transform; onClips reports nothing (names come from
// useClipNames) — kept for symmetry.
const PreviewStage = ({ asset, pos, rot, scale, mode, clip, onTransform }: {
  asset: ModelAsset; pos: Vec3; rot: Vec3; scale: number; mode: GizmoMode; clip: string;
  onTransform: (p: { scale?: number; position?: Vec3; rotation?: Vec3 }) => void;
}) => {
  const { scene, animations } = useGLTF(encodeURI(asset.path));
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const [obj, setObj] = useState<Group | null>(null);

  // Animation mixer — play the chosen clip (or the first).
  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);
  useEffect(() => {
    const clips = animations ?? [];
    if (clips.length === 0) return;
    const c = clips.find((x) => x.name === clip) ?? clips[0];
    const a: AnimationAction = mixer.clipAction(c);
    a.reset(); a.setLoop(LoopRepeat, Infinity); a.play();
    return () => { mixer.stopAllAction(); };
  }, [mixer, animations, clip]);
  useEffect(() => {
    let raf = 0; let last = performance.now();
    const tick = () => { const t = performance.now(); mixer.update((t - last) / 1000); last = t; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mixer]);

  // On gizmo release, write the group's transform back to the store.
  const commit = () => {
    if (!obj) return;
    onTransform({ position: [obj.position.x, obj.position.y, obj.position.z], rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z], scale: obj.scale.x });
  };

  return (
    <>
      <group ref={setObj} position={pos} rotation={rot} scale={scale}>
        <primitive object={clone} />
      </group>
      {obj && <TransformControls object={obj} mode={mode} onMouseUp={commit} />}
    </>
  );
};
