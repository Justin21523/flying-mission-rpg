import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CanvasErrorBoundary } from '../ui/CanvasErrorBoundary';
import { Scene } from '../game/core/Scene';
import { Loading } from './Loading';
import { useUiStore } from '../stores/uiStore';
import { useSceneEditStore } from '../stores/sceneEditStore';
import { useWorldSelectStore } from '../stores/worldSelectStore';
import { usePbrPatchEditStore } from '../stores/pbrPatchEditStore';

// The single R3F <Canvas> for the whole game (one canvas = one WebGL context — see main.tsx, no
// StrictMode). Wrapped in the error boundary (recoverable crash UI) and a Suspense fallback (Loading)
// for streamed 3D assets. The Scene decides what renders (grey-box base vs. the inherited world).
export const GameCanvas = () => (
  <CanvasErrorBoundary>
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [8, 6, 10], fov: 50, near: 0.1, far: 1500 }}
      // Clicking empty space deselects both selection systems so a gizmo never gets "stuck" and the
      // next object click always lands (Edit Mode only).
      onPointerMissed={() => {
        if (!useUiStore.getState().editMode) return;
        useSceneEditStore.getState().clearSelection();
        useWorldSelectStore.getState().select(null);
        usePbrPatchEditStore.getState().select(null);
      }}
    >
      <Suspense fallback={<Loading />}>
        <Scene />
      </Suspense>
    </Canvas>
  </CanvasErrorBoundary>
);
