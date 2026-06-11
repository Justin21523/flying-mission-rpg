import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorCameraStore, getPhaseCamera } from './editorCameraStore';
import { DEFAULT_PHASE_CAMERA } from '../../types/game/cameraConfig';

describe('editorCameraStore', () => {
  beforeEach(() => useEditorCameraStore.getState().reset());

  it('set/get/clear a phase camera', () => {
    expect(getPhaseCamera('NPC_GREETING')).toBeUndefined();
    useEditorCameraStore.getState().setPhase('NPC_GREETING', { ...DEFAULT_PHASE_CAMERA, distance: 14 });
    expect(getPhaseCamera('NPC_GREETING')?.distance).toBe(14);
    useEditorCameraStore.getState().clearPhase('NPC_GREETING');
    expect(getPhaseCamera('NPC_GREETING')).toBeUndefined();
  });

  it('importState round-trips and replaces the map', () => {
    useEditorCameraStore.getState().setPhase('HANGAR', { ...DEFAULT_PHASE_CAMERA, fov: 70 });
    useEditorCameraStore.getState().importState({ byPhase: { LANDING: { ...DEFAULT_PHASE_CAMERA, distance: 5 } } });
    expect(getPhaseCamera('HANGAR')).toBeUndefined();
    expect(getPhaseCamera('LANDING')?.distance).toBe(5);
  });
});
