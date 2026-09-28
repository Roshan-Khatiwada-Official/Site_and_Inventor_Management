import { InventoryItem } from '../types';

/** Total units of an item currently held by field workers/collectors. */
export function heldQuantity(item: InventoryItem): number {
  return item.holders.reduce((sum, h) => sum + (h.quantity || 0), 0);
}

/** Units still sitting in stock, unassigned. */
export function availableQuantity(item: InventoryItem): number {
  return Math.max(0, (item.quantity || 0) - heldQuantity(item));
}

export function holderQuantity(item: InventoryItem, collectorId: string): number {
  return item.holders.find(h => h.collectorId === collectorId)?.quantity || 0;
}
