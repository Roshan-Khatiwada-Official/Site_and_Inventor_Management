import { Site, DataCollector, DailyAssignment, Equipment, TransferLog, UserAccount } from '../types';

/**
 * Client for the Google Apps Script "database bridge" (see /apps-script/Code.gs).
 *
 * The Apps Script Web App is deployed as "Anyone" access and authenticates
 * requests with a shared secret token. It stores the authoritative JSON in a
 * hidden `_raw` tab and also renders human-readable tabs for each collection.
 */

export interface BridgeConfig {
  webAppUrl: string;
  token: string;
  lastSyncedAt?: string;
  autoSyncEnabled?: boolean;
}

export interface AllOperationalData {
  sites: Site[];
  collectors: DataCollector[];
  assignments: DailyAssignment[];
  equipment: Equipment[];
  transfers: TransferLog[];
  users: UserAccount[];
}

const BRIDGE_STORAGE_KEY = 'site_mgr_sheets_bridge_config';

/**
 * Built-in default connection so every device/browser talks to the same
 * Google Sheet database out of the box — no manual URL/token entry, and the
 * login screen can load real accounts from the sheet on first run.
 *
 * NOTE: this token ships in the client bundle, so it is effectively shared
 * with everyone who can open the app. That matches how this app is used
 * (one shared operational database). Rotate it by editing SECRET_TOKEN in
 * the Apps Script, redeploying the same deployment, and updating this value.
 */
export const DEFAULT_BRIDGE_CONFIG: BridgeConfig = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbxWTKqd5PMYjHHlxqjj391JNQmvd5U0sU5ZljMXUQJw6ngxmgz9cQajZF07glcet6Ax3g/exec',
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
  return DEFAULT_BRIDGE_CONFIG.webAppUrl ? { ...DEFAULT_BRIDGE_CONFIG } : null;
}

export function saveStoredBridgeConfig(config: BridgeConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(BRIDGE_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving bridge config:', e);
  }
}

function normalize(raw: any): AllOperationalData {
  const d = raw || {};
  return {
    sites: Array.isArray(d.sites) ? d.sites : [],
    collectors: Array.isArray(d.collectors) ? d.collectors : [],
    assignments: Array.isArray(d.assignments) ? d.assignments : [],
    equipment: Array.isArray(d.equipment) ? d.equipment : [],
    transfers: Array.isArray(d.transfers) ? d.transfers : [],
    users: Array.isArray(d.users) ? d.users : [],
  };
}

/** Read the full dataset from the Google Sheet. */
export async function bridgePull(config: BridgeConfig): Promise<AllOperationalData> {
  const url = `${config.webAppUrl}?action=read&token=${encodeURIComponent(config.token)}`;
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });

  if (!res.ok) {
    throw new Error(`Sheet bridge read failed (HTTP ${res.status}). Check the Web app URL.`);
  }

  const json = await res.json().catch(() => {
    throw new Error('Sheet bridge returned an invalid response. Re-check the deployment URL and access = "Anyone".');
  });

  if (!json.ok) {
    throw new Error(json.error || 'Sheet bridge rejected the read request.');
  }

  return normalize(json.data);
}

/** Overwrite the full dataset in the Google Sheet with the app's current data. */
export async function bridgePush(config: BridgeConfig, data: AllOperationalData): Promise<string> {
  const res = await fetch(config.webAppUrl, {
    method: 'POST',
    // text/plain keeps this a "simple" CORS request (no preflight), which
    // Apps Script Web Apps support.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    redirect: 'follow',
    body: JSON.stringify({ action: 'write', token: config.token, data }),
  });

  if (!res.ok) {
    throw new Error(`Sheet bridge write failed (HTTP ${res.status}).`);
  }

  const json = await res.json().catch(() => {
    throw new Error('Sheet bridge returned an invalid response during write.');
  });

  if (!json.ok) {
    throw new Error(json.error || 'Sheet bridge rejected the write request.');
  }

  return json.savedAt || new Date().toISOString();
}

/** Quick connectivity + auth check used by the "Connect" button. */
export async function bridgeTestConnection(config: BridgeConfig): Promise<AllOperationalData> {
  return bridgePull(config);
}
