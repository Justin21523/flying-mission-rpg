import { Html } from '@react-three/drei';

// Suspense fallback rendered inside the <Canvas> while async 3D resources (GLTF models, textures,
// the Rapier WASM) stream in. Uses drei's <Html> so a normal DOM spinner can live in the R3F tree.
export const Loading = () => (
  <Html center>
    <div className="pointer-events-none flex select-none flex-col items-center gap-3 text-slate-200">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      <div className="text-xs font-semibold tracking-wide">Loading…</div>
    </div>
  </Html>
);
