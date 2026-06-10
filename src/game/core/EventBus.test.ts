import { describe, it, expect, vi } from 'vitest';
import { gameEventBus } from './EventBus';

describe('EventBus', () => {
  it('delivers typed payloads to subscribers and the disposer unsubscribes', () => {
    const fn = vi.fn();
    const off = gameEventBus.on('mission:selected', fn);
    gameEventBus.emit('mission:selected', { missionId: 'm1' });
    expect(fn).toHaveBeenCalledWith({ missionId: 'm1' });

    off();
    gameEventBus.emit('mission:selected', { missionId: 'm2' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('isolates handlers per event name', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = gameEventBus.on('character:selected', a);
    const offB = gameEventBus.on('mission:selected', b);
    gameEventBus.emit('character:selected', { characterId: 'char_jett' });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    offA();
    offB();
  });
});
