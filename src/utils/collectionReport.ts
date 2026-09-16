import { Assignment, CollectionSession, InventoryItem, Site } from '../types';

/** Sum of actual (verified) hours on an assignment — falls back to entered hours per session until verified. */
export function actualHoursOf(a: Assignment): number {
  return a.sessions.reduce((sum, s) => sum + (s.actualHours != null ? s.actualHours : Number(s.hours) || 0), 0);
}

/** One logged session, flattened with its site/collector context for reporting. */
export interface FlatSession {
  assignmentId: string;
  sessionId: string;
  date: string;              // YYYY-MM-DD, exactly as the collector entered it — never shifts on approval
  claimedHours: number;      // what the collector entered
  actualHours?: number;      // what the admin verified, if reviewed yet
  effectiveHours: number;    // actualHours if verified, else claimedHours — used for the category/site/task totals
  task: string;
  cameraCode: string;        // the camera's itemId (e.g. "CAM-001")
  cameraName: string;
  siteId: string;
  siteName: string;
  siteCategory: string;      // the site's Type
  collectorId: string;
  collectorName: string;
}

export function flattenSessions(assignments: Assignment[], sites: Site[], inventory: InventoryItem[] = []): FlatSession[] {
  const siteById = new Map(sites.map(s => [s.id, s]));
  const itemById = new Map(inventory.map(i => [i.id, i]));
  const rows: FlatSession[] = [];
  assignments.forEach(a => {
    const site = siteById.get(a.siteId);
    a.sessions.forEach((s: CollectionSession) => {
      if (!s.date) return;
      const claimed = Number(s.hours) || 0;
      const actual = s.actualHours;
      const cam = s.cameraId ? itemById.get(s.cameraId) : undefined;
      rows.push({
        assignmentId: a.id,
        sessionId: s.id,
        date: s.date,
        claimedHours: claimed,
        actualHours: actual,
        effectiveHours: actual != null ? actual : claimed,
        task: s.task || '(no task recorded)',
        cameraCode: cam?.itemId || s.cameraId || '(no camera recorded)',
        cameraName: s.cameraName || cam?.name || '(no camera recorded)',
        siteId: a.siteId,
        siteName: site ? site.name : (a.siteName || '(missing site)'),
        siteCategory: site ? site.category : '(uncategorised)',
        collectorId: a.collectorId,
        collectorName: a.collectorName,
      });
    });
  });
  return rows;
}

export type ReportScope = 'day' | 'week' | 'month' | 'all';

/** Monday-start ISO week range (inclusive) containing refDate. */
function weekRange(refDate: string): [string, string] {
  const d = new Date(refDate + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return [fmt(start), fmt(end)];
}

/** Returns [startDate, endDate] inclusive for the given scope, or null for 'all'. */
export function scopeRange(scope: ReportScope, refDate: string): [string, string] | null {
  if (scope === 'day') return [refDate, refDate];
  if (scope === 'week') return weekRange(refDate);
  if (scope === 'month') {
    const ym = refDate.slice(0, 7); // YYYY-MM
    const parts = ym.split('-').map(Number);
    const y = parts[0];
    const m = parts[1];
    const lastDay = new Date(y, m, 0).getDate();
    return [ym + '-01', ym + '-' + String(lastDay).padStart(2, '0')];
  }
  return null;
}

export function filterByScope(rows: FlatSession[], scope: ReportScope, refDate: string): FlatSession[] {
  const range = scopeRange(scope, refDate);
  if (!range) return rows;
  const start = range[0];
  const end = range[1];
  return rows.filter(r => r.date >= start && r.date <= end);
}

export interface TaskAgg { task: string; claimed: number; actual: number; }
export interface SiteAgg { siteId: string; siteName: string; claimed: number; actual: number; tasks: TaskAgg[]; }
export interface CategoryAgg { category: string; claimed: number; actual: number; sites: SiteAgg[]; }

/** Category -> Site -> Task hours tree — entered (claimed) and actual (verified-if-available) hours, side by side. */
export function buildCategoryTree(rows: FlatSession[]): CategoryAgg[] {
  const catMap = new Map<string, Map<string, { siteName: string; tasks: Map<string, { claimed: number; actual: number }> }>>();
  rows.forEach(r => {
    if (!catMap.has(r.siteCategory)) catMap.set(r.siteCategory, new Map());
    const siteMap = catMap.get(r.siteCategory)!;
    if (!siteMap.has(r.siteId)) siteMap.set(r.siteId, { siteName: r.siteName, tasks: new Map() });
    const entry = siteMap.get(r.siteId)!;
    const cur = entry.tasks.get(r.task) || { claimed: 0, actual: 0 };
    entry.tasks.set(r.task, { claimed: cur.claimed + r.claimedHours, actual: cur.actual + r.effectiveHours });
  });

  const cats: CategoryAgg[] = [...catMap.entries()].map(([category, siteMap]) => {
    const sites: SiteAgg[] = [...siteMap.entries()].map(([siteId, entry]) => {
      const tasks: TaskAgg[] = [...entry.tasks.entries()]
        .map(([task, h]) => ({ task, claimed: h.claimed, actual: h.actual }))
        .sort((a, b) => b.actual - a.actual);
      return {
        siteId, siteName: entry.siteName,
        claimed: tasks.reduce((s, t) => s + t.claimed, 0),
        actual: tasks.reduce((s, t) => s + t.actual, 0),
        tasks,
      };
    }).sort((a, b) => b.actual - a.actual);
    return {
      category,
      claimed: sites.reduce((s, x) => s + x.claimed, 0),
      actual: sites.reduce((s, x) => s + x.actual, 0),
      sites,
    };
  }).sort((a, b) => b.actual - a.actual);

  return cats;
}

export interface CollectorTotal { collectorId: string; collectorName: string; claimed: number; actual: number; }
export interface CollectorDay { collectorId: string; collectorName: string; date: string; claimed: number; actual: number; }

export function buildCollectorTotals(rows: FlatSession[]): CollectorTotal[] {
  const m = new Map<string, CollectorTotal>();
  rows.forEach(r => {
    if (!m.has(r.collectorId)) m.set(r.collectorId, { collectorId: r.collectorId, collectorName: r.collectorName, claimed: 0, actual: 0 });
    const e = m.get(r.collectorId)!;
    e.claimed += r.claimedHours;
    e.actual += r.actualHours != null ? r.actualHours : r.claimedHours;
  });
  return [...m.values()].sort((a, b) => b.claimed - a.claimed);
}

export function buildCollectorDaily(rows: FlatSession[]): CollectorDay[] {
  const m = new Map<string, CollectorDay>();
  rows.forEach(r => {
    const key = r.collectorId + ' ' + r.date;
    if (!m.has(key)) m.set(key, { collectorId: r.collectorId, collectorName: r.collectorName, date: r.date, claimed: 0, actual: 0 });
    const e = m.get(key)!;
    e.claimed += r.claimedHours;
    e.actual += r.actualHours != null ? r.actualHours : r.claimedHours;
  });
  return [...m.values()].sort((a, b) => b.date.localeCompare(a.date) || a.collectorName.localeCompare(b.collectorName));
}

/** Shoot log CSV: Date, Data Collector, Cam Code, Task Name, Hour, Type, Site — one row per logged entry. */
export function sessionsToCsv(rows: FlatSession[]): string {
  const header = ['Date', 'Data Collector', 'Cam Code', 'Task Name', 'Hour', 'Actual Hour', 'Type', 'Site'];
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [header.map(esc).join(',')];
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.collectorName.localeCompare(b.collectorName));
  sorted.forEach(r => {
    lines.push([
      r.date, r.collectorName, r.cameraCode, r.task,
      r.claimedHours.toFixed(2), r.actualHours != null ? r.actualHours.toFixed(2) : '',
      r.siteCategory, r.siteName,
    ].map(esc).join(','));
  });
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
