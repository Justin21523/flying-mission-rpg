import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { poseModelPreloadPaths } from './selectedCharacterPosePreload';

export const SelectedCharacterPosePreloader = () => {
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const characters = useEditorCharacterStore((s) => s.items);
  const poseModels = characters.find((character) => character.id === selectedCharacterId)?.poseModels;
  const paths = useMemo(() => poseModelPreloadPaths(poseModels), [poseModels]);

  useEffect(() => {
    for (const path of paths) useGLTF.preload(path);
  }, [paths]);

  return null;
};
