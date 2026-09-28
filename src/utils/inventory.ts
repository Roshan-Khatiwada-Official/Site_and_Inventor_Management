import { InventoryItem, InventoryHolder, InventoryIssue, ReturnRecord } from '../types';

const ISSUE_CONDITIONS = ['Flagged', 'Damaged', 'Lost'];

/**
 * Fills in fields added after data may have already been cached (e.g. in
 * localStorage from an older build, or before the sheet migration ran) so
 * `.holders`/`.issues`/`.returnLog` are never undefined. Older builds held a
 * single heldById/heldByName pair for the whole row, and a single
 * condition/conditionNote for the whole row's quantity — both are migrated
 * into the per-unit holders/issues lists.
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
  let issues: InventoryIssue[] = Array.isArray(raw.issues)
    ? raw.issues.map((x: any) => ({
        id: String(x?.id || `iss-legacy-${raw.id}-${Math.random().toString(36).slice(2)}`),
        condition: ISSUE_CONDITIONS.includes(x?.condition) ? x.condition : 'Flagged',
        quantity: Number(x?.quantity) || 0,
        note: x?.note || '',
        reportedAt: x?.reportedAt || '',
      })).filter((x: InventoryIssue) => x.quantity > 0)
    : [];
  if (!issues.length && ISSUE_CONDITIONS.includes(raw.condition)) {
    issues = [{
      id: `iss-legacy-${raw.id}`,
      condition: raw.condition,
      quantity: Math.max(1, Number(raw.quantity) || 1),
      note: raw.conditionNote || '',
      reportedAt: raw.updatedAt || raw.createdAt || '',
    }];
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
    issues,
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

/** Total units currently flagged / damaged / lost (optionally just one of those). */
export function issueQuantity(item: InventoryItem, condition?: InventoryIssue['condition']): number {
  return item.issues
    .filter(x => !condition || x.condition === condition)
    .reduce((sum, x) => sum + (x.quantity || 0), 0);
}

/**
 * Units still sitting in stock, unassigned, and safe to hand out. Units
 * reported Flagged/Damaged/Lost are carved out of this — only the genuinely
 * fine ones count.
 */
export function availableQuantity(item: InventoryItem): number {
  return Math.max(0, (item.quantity || 0) - heldQuantity(item) - issueQuantity(item));
}

export function holderQuantity(item: InventoryItem, collectorId: string): number {
  return item.holders.find(h => h.collectorId === collectorId)?.quantity || 0;
}
