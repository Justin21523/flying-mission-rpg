import { describe, it, expect } from 'vitest';
import { TransformationTimelineRunner } from './TransformationTimelineRunner';
import { makeTimeline } from './testFixture';

describe('TransformationTimelineRunner', () => {
  it('full mode activates a part-transform mid-stage', () => {
    const r = new TransformationTimelineRunner(makeTimeline(), 'full');
    r.seek(0.75); // halfway through s1 (0.5..1.0)
    const wing = r.getSnapshot().parts.get('wing_left')!;
    expect(wing.rotation[2]).toBeGreaterThan(20);
    expect(wing.rotation[2]).toBeLessThan(90);
  });

  it('reveals the robot model only after its model-visibility stage', () => {
    const r = new TransformationTimelineRunner(makeTimeline(), 'full');
    r.seek(2.0);
    expect(r.getSnapshot().modelVisible.robot).toBe(false);
    r.seek(2.7);
    expect(r.getSnapshot().modelVisible.robot).toBe(true);
  });

  it('quick mode keeps only essential stages, time-scaled', () => {
    const r = new TransformationTimelineRunner(makeTimeline(), 'quick');
    expect(r.duration).toBeCloseTo(1.5);
    // the non-essential part-transform is dropped → wing stays at base even near the end
    r.seek(1.4);
    expect(r.getSnapshot().parts.get('wing_left')!.rotation[2]).toBe(0);
    // but the robot model still reveals (essential)
    expect(r.getSnapshot().modelVisible.robot).toBe(true);
  });

  it('pause stops time; resume continues', () => {
    const r = new TransformationTimelineRunner(makeTimeline(), 'full');
    r.tick(0.5);
    r.pause();
    r.tick(1.0);
    expect(r.time).toBeCloseTo(0.5);
    r.resume();
    r.tick(0.5);
    expect(r.time).toBeCloseTo(1.0);
  });

  it('fastForward completes the timeline', () => {
    const r = new TransformationTimelineRunner(makeTimeline(), 'full');
    r.fastForward();
    expect(r.isDone()).toBe(true);
    expect(r.time).toBeCloseTo(r.duration);
  });

  it('sinks the root during the exit-stage (slow descent)', () => {
    const r = new TransformationTimelineRunner(makeTimeline(), 'full');
    r.seek(3.7); // before the exit-stage (3.8..4.0)
    expect(r.getSnapshot().rootYOffset).toBe(0);
    r.seek(4.0); // exit complete → full descent distance (default 6)
    expect(r.getSnapshot().rootYOffset).toBeCloseTo(6);
  });

  it('supports arbitrary model-swap refs (multi-model sequences)', () => {
    const tl = makeTimeline();
    tl.stages.push({ id: 'ms', type: 'model-swap', startTime: 1.0, duration: 0.1, enabled: true, params: { modelRef: 'm_alt' } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(0.5);
    expect(r.getSnapshot().activeModelRef).toBeNull();
    r.seek(1.2);
    expect(r.getSnapshot().activeModelRef).toBe('m_alt');
    expect(r.getSnapshot().activeModelStageId).toBe('ms');
    // a later slot-based stage (s2 at 2.6) returns control to the robot slot
    r.seek(2.8);
    expect(r.getSnapshot().modelVisible.robot).toBe(true);
  });

  it('targets animation clips to the selected model slot', () => {
    const tl = makeTimeline();
    tl.sharedModelRef = 'm_shared';
    tl.stages.push({ id: 'clip_shared', type: 'animation-clip', startTime: 1.0, duration: 1.0, enabled: true, params: { modelSlot: 'shared', clipName: 'Wave', clipSpeed: 1.2, loop: true } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.2);
    expect(r.getSnapshot().activeModelClips).toEqual([
      expect.objectContaining({ stageId: 'clip_shared', modelSlot: 'shared', clipName: 'Wave', clipSpeed: 1.2, loop: true, localTime: expect.closeTo(0.24, 5), progress: expect.closeTo(0.2, 5) }),
    ]);
  });

  it('uses the most recent model stage for untargeted animation clips', () => {
    const tl = makeTimeline();
    tl.stages.push(
      { id: 'ms_ref', type: 'model-swap', startTime: 1.0, duration: 0.1, enabled: true, params: { modelRef: 'm_alt' } },
      { id: 'clip_auto', type: 'animation-clip', startTime: 1.2, duration: 1.0, enabled: true, params: { clipName: 'Spin' } },
    );
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.3);
    expect(r.getSnapshot().activeModelClips).toEqual([
      expect.objectContaining({ stageId: 'clip_auto', modelRef: 'm_alt', clipName: 'Spin' }),
    ]);
  });

  it('animation clips reveal the targeted slot model without creating a second model ref', () => {
    const tl = makeTimeline();
    tl.planeModelRef = 'm_plane';
    tl.stages.push({ id: 'clip_plane', type: 'animation-clip', startTime: 1, duration: 1, enabled: true, params: { modelSlot: 'plane', clipName: 'Fly' } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.2);
    const snap = r.getSnapshot();
    expect(snap.modelVisible.plane).toBe(true);
    expect(snap.activeModelRef).toBeNull();
    expect(snap.activeModelClips).toEqual([
      expect.objectContaining({ stageId: 'clip_plane', modelSlot: 'plane', clipName: 'Fly' }),
    ]);
  });

  it('animation clips only drive an arbitrary modelRef when that model is already the active model', () => {
    const tl = makeTimeline();
    tl.stages.push(
      { id: 'clip_ref', type: 'animation-clip', startTime: 0.5, duration: 1, enabled: true, params: { modelRef: 'm_alt', clipName: 'Spin' } },
      { id: 'swap_ref', type: 'model-swap', startTime: 2, duration: 0.1, enabled: true, params: { modelRef: 'm_alt' } },
      { id: 'clip_ref_visible', type: 'animation-clip', startTime: 2.1, duration: 1, enabled: true, params: { modelRef: 'm_alt', clipName: 'Spin' } },
    );
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(0.75);
    expect(r.getSnapshot().activeModelRef).toBeNull();
    r.seek(2.2);
    expect(r.getSnapshot().activeModelRef).toBe('m_alt');
    expect(r.getSnapshot().activeModelClips).toContainEqual(expect.objectContaining({ stageId: 'clip_ref_visible', modelRef: 'm_alt' }));
  });

  it('model-move accumulates an eased per-slot motion offset over time', () => {
    const tl = makeTimeline();
    tl.stages.push({ id: 'mv', type: 'model-move', startTime: 0, duration: 1, enabled: true, params: { modelSlot: 'robot', toPosition: [0, 4, 0], toScale: 2 } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(0.5);
    const mid = r.getSnapshot().modelMotion.robot;
    expect(mid.position[1]).toBeGreaterThan(0);
    expect(mid.position[1]).toBeLessThan(4);
    r.seek(1);
    const done = r.getSnapshot().modelMotion.robot;
    expect(done.position[1]).toBeCloseTo(4);
    expect(done.scale).toBeCloseTo(2);
    expect(r.getSnapshot().modelMotion.plane).toEqual({ position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 });
  });

  it('model-move + model-visibility can target the arbitrary swapped-in model (modelRef)', () => {
    const tl = makeTimeline();
    tl.stages.push(
      { id: 'ms', type: 'model-swap', startTime: 1.0, duration: 0.1, enabled: true, params: { modelRef: 'm_alt' } },
      { id: 'mv_ref', type: 'model-move', startTime: 1.2, duration: 1, enabled: true, params: { modelRef: 'm_alt', toPosition: [0, 0, 6] } },
      { id: 'hide_ref', type: 'model-visibility', startTime: 3.0, duration: 0.1, enabled: true, params: { modelRef: 'm_alt', visible: false } },
    );
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.1);
    expect(r.getSnapshot().activeModelVisible).toBe(true);
    expect(r.getSnapshot().refMotion.position[2]).toBeCloseTo(0);
    r.seek(2.2); // ref move complete
    expect(r.getSnapshot().refMotion.position[2]).toBeCloseTo(6);
    // ref-targeted move must NOT leak into the robot slot motion
    expect(r.getSnapshot().modelMotion.robot).toEqual({ position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 });
    r.seek(3.2); // after the ref hide
    expect(r.getSnapshot().activeModelVisible).toBe(false);
  });

  it('exit-stage toScale shrinks the root via exitScaleMul', () => {
    const tl = makeTimeline();
    tl.stages.push({ id: 'ex2', type: 'exit-stage', startTime: 0, duration: 1, enabled: true, params: { targetPhase: 'DESCENT', toScale: 0.2 } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(0); expect(r.getSnapshot().exitScaleMul).toBeCloseTo(1);
    r.seek(1); expect(r.getSnapshot().exitScaleMul).toBeCloseTo(0.2);
  });

  it('applies time-track overlays to the resolved snapshot', () => {
    const tl = makeTimeline({
      timeTracks: [
        {
          id: 'part:wing_left',
          target: { kind: 'part', partKey: 'wing_left' },
          keyframes: [{ time: 0.75, position: [2, 0, 0], rotation: [0, 0, 45], scale: 2 }],
        },
        {
          id: 'effect:e1',
          target: { kind: 'effect', effectId: 'e1' },
          keyframes: [{ time: 2.6, position: [1, 2, 3] }],
        },
      ],
    });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(0.75);
    const wing = r.getSnapshot().parts.get('wing_left')!;
    expect(wing.position[0]).toBeGreaterThan(1);
    expect(wing.rotation[2]).toBeGreaterThan(45);
    expect(wing.scale).toBeCloseTo(2);

    r.seek(2.6);
    expect(r.getSnapshot().activeEffects[0]).toEqual(expect.objectContaining({
      id: 'e1',
      spawnOffset: [1, 2, 3],
      localTime: expect.closeTo(0.1, 5),
      progress: expect.closeTo(1 / 3, 5),
    }));
  });

  it('stage shorthand types produce runtime snapshot outputs', () => {
    const tl = makeTimeline();
    tl.stages.push(
      { id: 'cam_stage', type: 'camera-shot', startTime: 0.2, duration: 1, enabled: true, params: { cameraShotType: 'close-up', distance: 3, height: 1, angle: 45, fov: 35 } },
      { id: 'fx_stage', type: 'energy-ring', startTime: 0.2, duration: 1, enabled: true, params: { color: '#00ffff', scale: 2 } },
      { id: 'speed_stage', type: 'speed-line-burst', startTime: 0.2, duration: 1, enabled: true, params: { intensity: 2 } },
      { id: 'voice_stage', type: 'voice-cue', startTime: 0.2, duration: 1, enabled: true, params: { text: 'Go!' } },
      { id: 'enter_stage', type: 'enter-stage', startTime: 0.2, duration: 1, enabled: true, params: { fromPosition: [0, 4, 0], fromScale: 0.5 } },
    );
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(0.7);
    const snap = r.getSnapshot();
    expect(snap.activeCameraShot).toEqual(expect.objectContaining({ id: 'stage:cam_stage', type: 'close-up', distance: 3, fov: 35 }));
    expect(snap.activeEffects).toContainEqual(expect.objectContaining({ id: 'stage:fx_stage', type: 'energy-ring', color: '#00ffff' }));
    expect(snap.speedLineIntensity).toBeGreaterThan(0);
    expect(snap.activeVoiceText).toBe('Go!');
    expect(snap.rootMotion.position[1]).toBeGreaterThan(0);
    expect(snap.rootMotion.scale).toBeGreaterThan(0.5);
  });

  it('clone-hero-burst produces a clone effect and drives the current actor clip', () => {
    const tl = makeTimeline();
    tl.stages.push({ id: 'hero_clone', type: 'clone-hero-burst', startTime: 1, duration: 1, enabled: true, params: { modelSlot: 'robot', clipName: 'HeroPose', color: '#44ccff', repeat: 60, ghostSpread: 18, scale: 14, holdFinal: true } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.5);
    const snap = r.getSnapshot();
    expect(snap.activeEffects).toContainEqual(expect.objectContaining({ id: 'stage:hero_clone', type: 'ghost-burst', color: '#44ccff', modelSlot: 'robot', repeat: 60, ghostSpread: 18, scale: 14 }));
    expect(snap.activeModelClips).toContainEqual(expect.objectContaining({ stageId: 'hero_clone', modelSlot: 'robot', clipName: 'HeroPose', localTime: expect.closeTo(0.5, 5), progress: expect.closeTo(0.5, 5) }));
    expect(snap.activeModelRef).toBeNull();
  });

  it('clone-hero-burst reveals its target actor even without a selected clip', () => {
    const tl = makeTimeline();
    tl.stages.push({ id: 'hero_clone_no_clip', type: 'clone-hero-burst', startTime: 1, duration: 1, enabled: true, params: { modelSlot: 'robot', color: '#44ccff', repeat: 60, scale: 14 } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.25);
    const snap = r.getSnapshot();
    expect(snap.modelVisible.robot).toBe(true);
    expect(snap.activeEffects).toContainEqual(expect.objectContaining({ id: 'stage:hero_clone_no_clip', type: 'ghost-burst', modelSlot: 'robot' }));
    expect(snap.activeModelClips).toEqual([]);
  });

  it('ghost-burst effect tracks reveal their target slot actor', () => {
    const tl = makeTimeline({
      effectTracks: [{ id: 'ghost_fx', type: 'ghost-burst', startTime: 1, duration: 1, modelSlot: 'robot', color: '#44ccff', scale: 14 }],
    });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.25);
    const snap = r.getSnapshot();
    expect(snap.modelVisible.robot).toBe(true);
    expect(snap.activeEffects).toContainEqual(expect.objectContaining({ id: 'ghost_fx', type: 'ghost-burst', modelSlot: 'robot' }));
  });

  it('ghost-burst effect tracks can reveal an explicit modelRef', () => {
    const tl = makeTimeline({
      effectTracks: [{ id: 'ghost_ref_fx', type: 'ghost-burst', startTime: 1, duration: 1, modelRef: 'm_hero_pose', color: '#44ccff', scale: 14 }],
    });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.25);
    const snap = r.getSnapshot();
    expect(snap.activeModelRef).toBe('m_hero_pose');
    expect(snap.activeModelVisible).toBe(true);
    expect(snap.activeEffects).toContainEqual(expect.objectContaining({ id: 'ghost_ref_fx', type: 'ghost-burst', modelRef: 'm_hero_pose' }));
  });

  it('cloud-ripple-burst produces a timeline-driven cloud ripple effect', () => {
    const tl = makeTimeline();
    tl.stages.push({ id: 'cloud_wave', type: 'cloud-ripple-burst', startTime: 0.5, duration: 2, enabled: true, params: { color: '#dbeafe', scale: 9, ringCount: 4, particleCount: 150, spawnOffset: [0, -0.2, 0] } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(1.5);
    expect(r.getSnapshot().activeEffects).toContainEqual(expect.objectContaining({
      id: 'stage:cloud_wave',
      type: 'cloud-ripple-burst',
      color: '#dbeafe',
      scale: 9,
      ringCount: 4,
      particleCount: 150,
      spawnOffset: [0, -0.2, 0],
      localTime: expect.closeTo(1, 5),
      progress: expect.closeTo(0.5, 5),
    }));
  });

  it('interactive mode holds at showcase until confirm', () => {
    const r = new TransformationTimelineRunner(makeTimeline(), 'interactive');
    r.tick(10); // past the end
    expect(r.getPhase()).toBe('showcase');
    expect(r.isDone()).toBe(false);
    r.confirm();
    expect(r.isDone()).toBe(true);
  });
});
