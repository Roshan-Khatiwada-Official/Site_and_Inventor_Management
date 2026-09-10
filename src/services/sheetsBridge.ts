import { Site, InventoryItem, Assignment, SiteRequest, UserAccount } from '../types';

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

const BRIDGE_STORAGE_KEY = 'site_mgr_sheets_bridge_config';

/**
 * Built-in default connection so every device talks to the same Google Sheet
 * out of the box. This token ships in the client bundle — it is effectively
 * shared with everyone who can open the app (rotate it in the Apps Script).
 */
export const DEFAULT_BRIDGE_CONFIG: BridgeConfig = {
  webAppUrl:
    'https://script.google.com/macros/s/AKfycbxWTKqd5PMYjHHlxqjj391JNQmvd5U0sU5ZljMXUQJw6ngxmgz9cQajZF07glcet6Ax3g/exec',
  token: 'siteops-db-key-Kq93ZmXp7RtY2wLn',
  autoSyncEnabled: true,
};

export function getStoredBridgeConfig(): BridgeConfig | null {
  try {
    const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BridgeConfig;
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_BRIDGE_CONFIG };
}

export function saveStoredBridgeConfig(config: BridgeConfig | null): void {
  try {
    if (config) localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(config));
    else localStorage.removeItem(BRIDGE_STORAGE_KEY);
  } catch (e) {
    console.error('Error saving bridge config:', e);
  }
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
    inventory: arr<InventoryItem>(d.inventory),
    assignments: arr<any>(d.assignments).map((a: any) => ({
      ...a,
      inventoryItemIds: arr<string>(a.inventoryItemIds),
      sessions: arr<any>(a.sessions),
      hoursLogged: Number(a.hoursLogged) || 0,
      status: a.status === 'Completed' ? 'Completed' : 'Active',
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
