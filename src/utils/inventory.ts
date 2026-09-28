import { InventoryItem, InventoryHolder, ReturnRecord } from '../types';

/**
 * Fills in fields added after data may have already been cached (e.g. in
 * localStorage from an older build, or before the sheet migration ran) so
 * `.holders`/`.returnLog` are never undefined — items saved back then only
 * had a single heldById/heldByName pair for the whole row.
 */
export function sanitizeInventoryItem(raw: any): InventoryItem {
  let holders: InventoryHolder[] = Array.isArray(raw.holders)
    ? raw.holders.map((h: any) => ({
        collectorId: String(h?.collectorId || ''),
        collectorName: h?.collectorName || '',
        quantity: Number(h?.quantity) || 0,
      })).filter((h: InventoryHolder) => h.collectorId && h.quantity > 0)
    : [];
  if (!holders.length && raw.heldById) {
    holders = [{ collectorId: raw.heldById, collectorName: raw.heldByName || '', quantity: Number(raw.quantity) || 1 }];
  }
  const returnLog: ReturnRecord[] = Array.isArray(raw.returnLog)
    ? raw.returnLog.map((r: any): ReturnRecord => ({
        date: r?.date || '',
        ok: r?.ok !== false,
        note: r?.note || '',
        byName: r?.byName || '',
        fromCollectorId: r?.fromCollectorId || '',
        fromCollectorName: r?.fromCollectorName || '',
        quantity: Number(r?.quantity) || 1,
      }))
    : [];
  return {
    id: String(raw.id),
    itemId: raw.itemId || '',
    name: raw.name || '',
    category: raw.category || '',
    quantity: Number(raw.quantity) || 0,
    note: raw.note || '',
    condition: raw.condition === 'Flagged' ? 'Flagged' : 'OK',
    conditionNote: raw.conditionNote || '',
    holders,
    returnLog,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || raw.createdAt || '',
  };
}

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
