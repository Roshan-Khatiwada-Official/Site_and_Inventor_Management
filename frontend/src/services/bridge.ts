// Picks which backend the app talks to, at build time:
//   - VITE_API_URL is set  -> the new Postgres-backed API (apiBridge.ts)
//   - VITE_API_URL unset   -> the Google Sheets bridge (sheetsBridge.ts)
//
// This matters because the live GitHub Pages build has no .env file (CI
// never sets VITE_API_URL), and the new backend isn't hosted publicly yet —
// only local dev machines running `backend/` can reach it. Without this
// fallback, switching App.tsx's import straight to apiBridge would silently
// point the live site at "http://localhost:4000" for every visitor, which
// doesn't exist on their machine. Once the backend has a real public URL,
// set VITE_API_URL in the GitHub Pages build env (or just delete
// sheetsBridge.ts and this file, and import apiBridge.ts directly).
import * as sheetsBridge from './sheetsBridge';
import * as apiBridge from './apiBridge';
import type { BridgeConfig, AppData } from './apiBridge'; // identical shape on both sides
import type { UserAccount } from '../types';

export type { BridgeConfig, AppData } from './apiBridge';

const USE_NEW_BACKEND = !!(import.meta.env.VITE_API_URL as string | undefined);
const impl: {
  getStoredBridgeConfig: () => BridgeConfig | null;
  bridgePull: (config: BridgeConfig) => Promise<AppData>;
  bridgePush: (config: BridgeConfig, data: AppData) => Promise<string>;
  bridgeTestConnection: (config: BridgeConfig) => Promise<AppData>;
  DEFAULT_BRIDGE_CONFIG: BridgeConfig;
  login: (config: BridgeConfig, users: UserAccount[], loginId: string, password: string) =>
    Promise<{ ok: true; user: UserAccount } | { ok: false; error: string }>;
} = USE_NEW_BACKEND ? apiBridge : sheetsBridge;

export const getStoredBridgeConfig = impl.getStoredBridgeConfig;
export const bridgePull = impl.bridgePull;
export const bridgePush = impl.bridgePush;
export const bridgeTestConnection = impl.bridgeTestConnection;
export const DEFAULT_BRIDGE_CONFIG = impl.DEFAULT_BRIDGE_CONFIG;
export const login = impl.login;
