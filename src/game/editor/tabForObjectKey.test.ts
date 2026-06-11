import { describe, it, expect } from 'vitest';
import { tabForObjectKey } from './tabForObjectKey';
import { FLIGHT_PATH_ID } from '../../data/game/flightPath';

describe('tabForObjectKey', () => {
  it('maps sceneEditStore area keys to tabs', () => {
    expect(tabForObjectKey('transform#structure#xf1__wing_left')).toBe('gxform');
    expect(tabForObjectKey('base#structure#b1')).toBe('gbase');
    expect(tabForObjectKey('exterior#structure#e1')).toBe('gexterior');
    expect(tabForObjectKey('destination#structure#dst_parcel')).toBe('gdest');
    expect(tabForObjectKey('destination#npc#npc_mina')).toBe('gnpc');
  });
  it('maps the flight crafts', () => {
    expect(tabForObjectKey('flight#prop#base_craft')).toBe('gflight');
    expect(tabForObjectKey('flight#prop#world_craft')).toBe('gworld');
  });
  it('maps path nodes by their path id', () => {
    expect(tabForObjectKey(`${FLIGHT_PATH_ID}#node#fp0`)).toBe('gflight');
    expect(tabForObjectKey('world_route#node#n0')).toBe('gworld');
  });
  it('unknown / empty → null', () => {
    expect(tabForObjectKey('yokai#scatter#x')).toBeNull();
    expect(tabForObjectKey(null)).toBeNull();
    expect(tabForObjectKey('')).toBeNull();
  });
});
