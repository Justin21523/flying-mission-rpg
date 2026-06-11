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
      expect.objectContaining({ stageId: 'clip_shared', modelSlot: 'shared', clipName: 'Wave', clipSpeed: 1.2, loop: true }),
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

  it('exit-stage toScale shrinks the root via exitScaleMul', () => {
    const tl = makeTimeline();
    tl.stages.push({ id: 'ex2', type: 'exit-stage', startTime: 0, duration: 1, enabled: true, params: { targetPhase: 'DESCENT', toScale: 0.2 } });
    const r = new TransformationTimelineRunner(tl, 'full');
    r.seek(0); expect(r.getSnapshot().exitScaleMul).toBeCloseTo(1);
    r.seek(1); expect(r.getSnapshot().exitScaleMul).toBeCloseTo(0.2);
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
