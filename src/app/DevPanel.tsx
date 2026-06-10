import { Leva, useControls } from 'leva';
import { useDevStore, type SceneMode } from '../stores/devStore';

// Leva dev panel (top-right). Hidden in production builds; in dev it exposes engineering toggles.
// Batch 0 ships one control: which scene the canvas renders — the new grey-box base ('greybox')
// or the inherited POLI kit world ('world', dormant by default). Later batches add FSM jumps here.
export const DevPanel = () => {
  useControls('Dev', {
    scene: {
      label: 'Scene',
      value: useDevStore.getState().sceneMode,
      options: ['greybox', 'world'] as SceneMode[],
      onChange: (v: SceneMode) => useDevStore.getState().setSceneMode(v),
    },
  });

  return <Leva collapsed hidden={!import.meta.env.DEV} />;
};
