// Kit — item model. Items are referenced by id from inventory, quests, dialogue, shops + gifts.
export type ItemCategory = 'key' | 'consumable' | 'material' | 'tool' | 'quest' | 'gift' | 'currency' | 'misc';
export const ITEM_CATEGORIES: ItemCategory[] = ['key', 'consumable', 'material', 'tool', 'quest', 'gift', 'currency', 'misc'];
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const ITEM_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// What consuming the item does (inventoryStore.useItem).
export type ItemUseKind = 'none' | 'heal' | 'coins' | 'exp' | 'flag';
export const ITEM_USE_KINDS: ItemUseKind[] = ['none', 'heal', 'coins', 'exp', 'flag'];
export interface ItemUseEffect { kind: ItemUseKind; amount?: number; flag?: string }

export interface Item {
  id: string;
  name: string;
  description: string;
  icon?: string;          // emoji or short glyph for the HUD
  consumable?: boolean;
  category?: ItemCategory;
  rarity?: ItemRarity;
  value?: number;         // coin price (vendor shops)
  sellable?: boolean;     // can be sold (ignored when questItem)
  questItem?: boolean;    // story item — never sold
  maxStack?: number;      // inventory stack cap (0/undefined = unlimited)
  useEffect?: ItemUseEffect; // applied on consume
  giftTrust?: number;     // giving it to an NPC raises trust by this (giftItem dialogue effect)
}
