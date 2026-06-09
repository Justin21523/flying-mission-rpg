import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useAnimClipStore } from '../../stores/animClipStore';

// Loads a model GLB via drei's useGLTF (DRACO / meshopt aware — same loader the player uses) purely to record
// its animation clip names into animClipStore, so editor track dropdowns list the model's REAL clips. A bare
// GLTFLoader fails on compressed models (clips come back empty / "not detected"); useGLTF handles them.
// Must be rendered inside <Suspense>. Keyed by the resolved asset path (read back via getClipsForPaths).
export const AssetClipLoader = ({ path }: { path: string }) => {
  const { animations } = useGLTF(encodeURI(path));
  useEffect(() => { useAnimClipStore.getState().setClips(path, (animations ?? []).map((c) => c.name)); }, [path, animations]);
  return null;
};
