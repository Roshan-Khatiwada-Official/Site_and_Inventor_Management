import { Site, InventoryItem, Assignment, SiteRequest, UserAccount, ReturnRecord } from '../types';

/**
 * Client for the Google Apps Script "database bridge" (see /apps-script/Code.gs).
 * The Web App authenticates with a shared token and stores the authoritative
 * JSON in a hidden `_raw` tab (plus readable per-collection tabs).
 */

export interface BridgeConfig {
  webAppUrl: string;
  token: string;
  lastSyncedAt?: string;
  autoSyncEnabled?: boolean;
}

export interface AppData {
  sites: Site[];
  inventory: InventoryItem[];
  assignments: Assignment[];
  requests: SiteRequest[];
  users: UserAccount[];
}

/**
 * Built-in connection so every device talks to the same Google Sheet out of
 * the box. This token ships in the client bundle — it is effectively shared
 * with everyone who can open the app (rotate it in the Apps Script).
 *
 * The Web app URL must point at a deployment running the generic
 * `apps-script/Code.gs` (returns all collections, no fixed list).
 */
export const DEFAULT_BRIDGE_CONFIG: BridgeConfig = {
  webAppUrl:
    'https://script.google.com/macros/s/AKfycby53NMy0jCyI_DVccA87xVOjAIYkDaX-uSQ0w6c_QPeXoBvXhIk4iJ69drzuG9Q2yiPug/exec',
  token: 'siteops-db-key-Kq93ZmXp7RtY2wLn',
  autoSyncEnabled: true,
};

export function getStoredBridgeConfig(): BridgeConfig | null {
  return { ...DEFAULT_BRIDGE_CONFIG };
}

function arr<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

const VALID_ROLES = ['Admin', 'Site Finder', 'Data Collector'];

function normalize(raw: any): AppData {
  const d = raw || {};
  return {
    sites: arr<any>(d.sites).map((s: any): Site => ({
      id: s.id,
      code: s.code || '',
      name: s.name || '',
      latitude: Number(s.latitude ?? s.coordinates?.lat) || 0,
      longitude: Number(s.longitude ?? s.coordinates?.lng) || 0,
      supervisor: s.supervisor || '',
      supervisorContact: s.supervisorContact || s.contactPhone || '',
      workerCount: Number(s.workerCount) || 0,
      note: s.note || s.safetyNotes || '',
      foundById: s.foundById || '',
      foundByName: s.foundByName || '',
      status: s.status === 'Assigned' ? 'Assigned' : 'Available',
      createdAt: s.createdAt || '',
    })),
    inventory: arr<any>(d.inventory).map((i: any): InventoryItem => ({
      id: i.id,
      itemId: i.itemId || '',
      name: i.name || '',
      category: i.category || '',
      quantity: Number(i.quantity) || 0,
      note: i.note || '',
      condition: i.condition === 'Flagged' ? 'Flagged' : 'OK',
      conditionNote: i.conditionNote || '',
      heldById: i.heldById || '',
      heldByName: i.heldByName || '',
      returnLog: arr<ReturnRecord>(i.returnLog),
      createdAt: i.createdAt || '',
    })),
    assignments: arr<any>(d.assignments).map((a: any): Assignment => ({
      id: a.id,
      siteId: a.siteId || '',
      siteName: a.siteName || '',
      collectorId: a.collectorId || '',
      collectorName: a.collectorName || '',
      assignedById: a.assignedById || '',
      assignedByName: a.assignedByName || '',
      status: a.status === 'Completed' ? 'Completed' : 'Active',
      hoursLogged: Number(a.hoursLogged) || 0,
      sessions: arr<any>(a.sessions),
      createdAt: a.createdAt || '',
    })),
    requests: arr<SiteRequest>(d.requests),
    users: arr<any>(d.users).map((u: any): UserAccount => ({
      ...u,
      role: VALID_ROLES.includes(u.role) ? u.role : 'Data Collector',
      status: u.status === 'Suspended' ? 'Suspended' : 'Active',
      phone: u.phone || '',
      email: u.email || '',
      address: u.address || '',
      notes: u.notes || '',
    })),
  };
}

/** Read the full dataset from the Google Sheet. */
export async function bridgePull(config: BridgeConfig): Promise<AppData> {
  const url = `${config.webAppUrl}?action=read&token=${encodeURIComponent(config.token)}`;
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  if (!res.ok) throw new Error(`Sheet read failed (HTTP ${res.status}). Check the Web app URL.`);

  const json = await res.json().catch(() => {
    throw new Error('Sheet returned an invalid response. Check the deployment URL and access = "Anyone".');
  });
  if (!json.ok) throw new Error(json.error || 'Sheet rejected the read request.');

  return normalize(json.data);
}

/** Overwrite the full dataset in the Google Sheet. */
export async function bridgePush(config: BridgeConfig, data: AppData): Promise<string> {
  const res = await fetch(config.webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    redirect: 'follow',
    body: JSON.stringify({ action: 'write', token: config.token, data }),
  });
  if (!res.ok) throw new Error(`Sheet write failed (HTTP ${res.status}).`);

  const json = await res.json().catch(() => {
    throw new Error('Sheet returned an invalid response during write.');
  });
  if (!json.ok) throw new Error(json.error || 'Sheet rejected the write request.');

  return json.savedAt || new Date().toISOString();
}

export async function bridgeTestConnection(config: BridgeConfig): Promise<AppData> {
  return bridgePull(config);
}
