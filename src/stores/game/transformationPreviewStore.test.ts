import { describe, expect, it } from 'vitest';
import { useTransformationPreviewStore } from './transformationPreviewStore';

describe('transformationPreviewStore', () => {
  it('plays a bounded stage range and stops at the range end', () => {
    const st = useTransformationPreviewStore.getState();
    st.stop();
    st.playRange(2, 3);

    useTransformationPreviewStore.getState().advance(0.4, 10);
    expect(useTransformationPreviewStore.getState().time).toBeCloseTo(2.4);
    expect(useTransformationPreviewStore.getState().playing).toBe(true);

    useTransformationPreviewStore.getState().advance(1, 10);
    expect(useTransformationPreviewStore.getState().time).toBeCloseTo(3);
    expect(useTransformationPreviewStore.getState().playing).toBe(false);
    expect(useTransformationPreviewStore.getState().rangeEnd).toBeNull();
  });

  it('can replay an effect range without taking over the edit camera', () => {
    const st = useTransformationPreviewStore.getState();
    st.stop();
    st.setPreviewCamera(true);
    st.playRange(4, 5, false);

    const next = useTransformationPreviewStore.getState();
    expect(next.time).toBe(4);
    expect(next.playing).toBe(true);
    expect(next.rangeEnd).toBe(5);
    expect(next.previewCamera).toBe(false);
  });
});
