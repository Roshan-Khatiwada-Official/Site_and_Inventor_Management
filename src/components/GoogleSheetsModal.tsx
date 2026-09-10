import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  LogOut, 
  PlusCircle, 
  Link as LinkIcon, 
  Database,
  Table,
  Check,
  HelpCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  SheetDatabaseConfig, 
  createMasterSpreadsheet, 
  verifySpreadsheet, 
  ensureSheetTabsExist, 
  writeAllDataToSpreadsheet, 
  readAllDataFromSpreadsheet, 
  extractSpreadsheetId,
  HEADERS,
  SHEET_NAMES
} from '../services/googleSheets';
import { Site, DataCollector, DailyAssignment, Equipment, TransferLog, UserAccount } from '../types';
import { BridgeConfig, bridgeTestConnection } from '../services/sheetsBridge';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  sheetConfig: SheetDatabaseConfig | null;
  onSaveSheetConfig: (config: SheetDatabaseConfig | null) => void;
  bridgeConfig: BridgeConfig | null;
  onSaveBridgeConfig: (config: BridgeConfig | null) => void;
  onBridgePull: () => void;
  onBridgePush: () => void;
  isAutoSyncing: boolean;
  lastBridgeSyncAt: string | null;
  sites: Site[];
  collectors: DataCollector[];
  assignments: DailyAssignment[];
  equipment: Equipment[];
  transfers: TransferLog[];
  users: UserAccount[];
  onUpdateAllData: (data: {
    sites: Site[];
    collectors: DataCollector[];
    assignments: DailyAssignment[];
    equipment: Equipment[];
    transfers: TransferLog[];
    users?: UserAccount[];
  }) => void;
  onNotify: (msg: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onSignIn,
  onSignOut,
  sheetConfig,
  onSaveSheetConfig,
  bridgeConfig,
  onSaveBridgeConfig,
  onBridgePull,
  onBridgePush,
  isAutoSyncing,
  lastBridgeSyncAt,
  sites,
  collectors,
  assignments,
  equipment,
  transfers,
  users,
  onUpdateAllData,
  onNotify,
}) => {
  const [existingInput, setExistingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSchemaTab, setActiveSchemaTab] = useState<string>('Sites');
  const [confirmPushOpen, setConfirmPushOpen] = useState(false);
  const [confirmPullOpen, setConfirmPullOpen] = useState(false);

  // Apps Script bridge (recommended DB path)
  const [bridgeUrlInput, setBridgeUrlInput] = useState(bridgeConfig?.webAppUrl || '');
  const [bridgeTokenInput, setBridgeTokenInput] = useState(bridgeConfig?.token || '');
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectBridge = async () => {
    const url = bridgeUrlInput.trim();
    const token = bridgeTokenInput.trim();
    setBridgeError(null);
    if (!/^https:\/\/script\.google\.com\/.+/.test(url)) {
      setBridgeError('Enter the Web app URL from your Apps Script deployment (starts with https://script.google.com/).');
      return;
    }
    if (!token) {
      setBridgeError('Enter the same secret token you set in the Apps Script (SECRET_TOKEN).');
      return;
    }
    setBridgeBusy(true);
    try {
      const existing = await bridgeTestConnection({ webAppUrl: url, token });
      onSaveBridgeConfig({
        webAppUrl: url,
        token,
        autoSyncEnabled: true,
        lastSyncedAt: new Date().toISOString(),
      });
      const sheetIsEmpty =
        existing.sites.length === 0 &&
        existing.collectors.length === 0 &&
        existing.assignments.length === 0 &&
        existing.equipment.length === 0 &&
        existing.transfers.length === 0 &&
        existing.users.length === 0;
      if (sheetIsEmpty) {
        // Seed the fresh sheet with whatever the app currently holds.
        setTimeout(() => onBridgePush(), 0);
        onNotify('Google Sheet connected. Seeding it with current data…');
      } else {
        onNotify('Google Sheet connected as the live database. Auto-sync is on.');
      }
    } catch (err: any) {
      setBridgeError(err?.message || 'Could not reach the Apps Script Web App.');
    } finally {
      setBridgeBusy(false);
    }
  };

  const handleDisconnectBridge = () => {
    if (window.confirm('Disconnect the Google Sheet database? Your app keeps its current data locally; the sheet is untouched.')) {
      onSaveBridgeConfig(null);
      setBridgeUrlInput('');
      setBridgeTokenInput('');
      onNotify('Google Sheet database disconnected.');
    }
  };

  const toggleBridgeAutoSync = () => {
    if (!bridgeConfig) return;
    const next = bridgeConfig.autoSyncEnabled === false;
    onSaveBridgeConfig({ ...bridgeConfig, autoSyncEnabled: next });
    onNotify(next ? 'Auto-sync to Google Sheet enabled.' : 'Auto-sync paused — use manual Push / Pull.');
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setError('Please sign in with Google first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const config = await createMasterSpreadsheet(accessToken, 'Site & Inventory Operations Database');
      // Seed initial data
      await writeAllDataToSpreadsheet(accessToken, config.spreadsheetId, {
        sites,
        collectors,
        assignments,
        equipment,
        transfers,
      });
      onSaveSheetConfig(config);
      onNotify('Google Sheet created and populated with 5 operational database tabs!');
    } catch (err: any) {
      setError(err?.message || 'Failed to create spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError('Please sign in with Google first.');
      return;
    }
    const id = extractSpreadsheetId(existingInput);
    if (!id) {
      setError('Please enter a valid Google Spreadsheet URL or ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { title, sheetNames } = await verifySpreadsheet(accessToken, id);
      await ensureSheetTabsExist(accessToken, id, sheetNames);

      const config: SheetDatabaseConfig = {
        spreadsheetId: id,
        spreadsheetTitle: title,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
        lastSyncedAt: new Date().toISOString(),
        autoSyncEnabled: true,
      };

      onSaveSheetConfig(config);
      onNotify(`Connected to "${title}" successfully!`);
      setExistingInput('');
    } catch (err: any) {
      setError(err?.message || 'Could not verify spreadsheet. Check permissions.');
    } finally {
      setLoading(false);
    }
  };

  const executePushToSheet = async () => {
    if (!accessToken || !sheetConfig) return;
    setLoading(true);
    setError(null);
    setConfirmPushOpen(false);
    try {
      await writeAllDataToSpreadsheet(accessToken, sheetConfig.spreadsheetId, {
        sites,
        collectors,
        assignments,
        equipment,
        transfers,
        users,
      });
      const updatedConfig = {
        ...sheetConfig,
        lastSyncedAt: new Date().toISOString(),
      };
      onSaveSheetConfig(updatedConfig);
      onNotify('Successfully pushed all records to Google Sheet!');
    } catch (err: any) {
      setError(err?.message || 'Failed to sync to Google Sheet');
    } finally {
      setLoading(false);
    }
  };

  const executePullFromSheet = async () => {
    if (!accessToken || !sheetConfig) return;
    setLoading(true);
    setError(null);
    setConfirmPullOpen(false);
    try {
      const freshData = await readAllDataFromSpreadsheet(accessToken, sheetConfig.spreadsheetId);
      onUpdateAllData(freshData);
      const updatedConfig = {
        ...sheetConfig,
        lastSyncedAt: new Date().toISOString(),
      };
      onSaveSheetConfig(updatedConfig);
      onNotify('App updated with latest data from Google Sheet!');
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch data from Google Sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect this spreadsheet from the app? Your data in Google Sheets will remain intact.')) {
      onSaveSheetConfig(null);
      onNotify('Google Sheet disconnected.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Sheets Database Sync
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Workspace API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Use Google Sheets as your primary cloud database for sites, collectors, shifts, and equipment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Error: </span>
                {error}
              </div>
            </div>
          )}

          {/* Recommended: Google Sheet as live database via Apps Script bridge */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Use Google Sheet as the Live Database
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">RECOMMENDED</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Connect once with an Apps Script Web App. No Google login for staff, no hourly expiry —
                  every change in the app is written to the sheet automatically, and the app loads from the
                  sheet on start.
                </p>
              </div>
            </div>

            {bridgeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div><span className="font-semibold">Error: </span>{bridgeError}</div>
              </div>
            )}

            {bridgeConfig?.webAppUrl ? (
              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-lg p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Connected to Google Sheet database
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 break-all">
                    {bridgeConfig.webAppUrl}
                  </div>
                  {(lastBridgeSyncAt || bridgeConfig.lastSyncedAt) && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Last sync:{' '}
                      <span className="text-emerald-300">
                        {new Date(lastBridgeSyncAt || bridgeConfig.lastSyncedAt!).toLocaleString()}
                      </span>
                      {isAutoSyncing && <span className="ml-2 text-blue-300">• syncing…</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-lg border border-emerald-500/20">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${bridgeConfig.autoSyncEnabled !== false ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <div>
                      <div className="text-xs font-semibold text-white">Automatic sync</div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        {bridgeConfig.autoSyncEnabled !== false
                          ? 'Every edit is saved to the Google Sheet within ~2 seconds.'
                          : 'Paused. Changes stay local until you click "Push to Sheet".'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleBridgeAutoSync}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${bridgeConfig.autoSyncEnabled !== false ? 'bg-emerald-600' : 'bg-slate-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${bridgeConfig.autoSyncEnabled !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={onBridgePush}
                    disabled={isAutoSyncing}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Push to Sheet now</span>
                  </button>
                  <button
                    onClick={onBridgePull}
                    disabled={isAutoSyncing}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    <DownloadCloud className="w-4 h-4 text-blue-400" />
                    <span>Pull from Sheet now</span>
                  </button>
                </div>

                <button
                  onClick={handleDisconnectBridge}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Disconnect Google Sheet database
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <ol className="text-[11px] text-slate-400 list-decimal list-inside space-y-1 leading-relaxed">
                  <li>Open your Google Sheet → <strong className="text-slate-300">Extensions → Apps Script</strong>.</li>
                  <li>Paste the script from <code className="text-slate-300">apps-script/Code.gs</code>, set your own <code className="text-slate-300">SECRET_TOKEN</code>, Save.</li>
                  <li><strong className="text-slate-300">Deploy → New deployment → Web app</strong>; run as <strong className="text-slate-300">Me</strong>, access <strong className="text-slate-300">Anyone</strong>.</li>
                  <li>Copy the Web app URL and paste it below with the same token.</li>
                </ol>
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Web app URL</label>
                  <input
                    type="text"
                    value={bridgeUrlInput}
                    onChange={e => setBridgeUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Secret token</label>
                  <input
                    type="text"
                    value={bridgeTokenInput}
                    onChange={e => setBridgeTokenInput(e.target.value)}
                    placeholder="the SECRET_TOKEN string from Code.gs"
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={handleConnectBridge}
                  disabled={bridgeBusy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                >
                  {bridgeBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>{bridgeBusy ? 'Testing connection…' : 'Connect Google Sheet database'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-4">
            The options below are the older OAuth method (sign in with Google each session). You can ignore them if you use the bridge above.
          </div>

          {/* Step 1: Authentication State */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Google Account Authentication</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in to grant the app permission to read and write your operational Google Spreadsheets.
                </p>
              </div>

              {!user ? (
                <button
                  onClick={onSignIn}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-slate-300 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white">{user.displayName || 'Google User'}</div>
                    <div className="text-[11px] text-slate-400">{user.email}</div>
                  </div>
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt="User avatar"
                      className="w-8 h-8 rounded-full border border-slate-600"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <button
                    onClick={onSignOut}
                    title="Sign out of Google account"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Linked Spreadsheet Status & Controls */}
          {user && (
            <div className="space-y-4">
              {sheetConfig ? (
                /* Connected Sheet Card */
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-base font-bold text-white">{sheetConfig.spreadsheetTitle}</h4>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>ID: <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded text-[11px]">{sheetConfig.spreadsheetId}</code></span>
                        {sheetConfig.lastSyncedAt && (
                          <span>Last synced: <span className="text-emerald-300">{new Date(sheetConfig.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={sheetConfig.spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-2 rounded-lg transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Open in Google Sheets</span>
                      </a>
                      <button
                        onClick={handleDisconnect}
                        className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-2 hover:bg-slate-800/80 rounded-lg transition"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {/* Auto-Sync Toggle Control */}
                  <div className="mt-4 pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-lg border border-emerald-500/20">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${sheetConfig.autoSyncEnabled !== false ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <span>Automatic Cloud Sync (Real-time)</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            sheetConfig.autoSyncEnabled !== false 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {sheetConfig.autoSyncEnabled !== false ? 'AUTO-SYNC ON' : 'MANUAL ONLY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                          {sheetConfig.autoSyncEnabled !== false
                            ? 'Every site edit, collector assignment, shift check-in, or equipment transfer automatically syncs to your Google Sheet without manual pushing.'
                            : 'Automatic background sync is paused. Changes stay in your app until you manually click "Push App Data to Google Sheet".'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextEnabled = sheetConfig.autoSyncEnabled === false ? true : false;
                        const updated = { ...sheetConfig, autoSyncEnabled: nextEnabled };
                        onSaveSheetConfig(updated);
                        onNotify(nextEnabled ? 'Automatic Google Sheets sync enabled!' : 'Automatic sync paused (manual push only).');
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out self-end sm:self-center ${
                        sheetConfig.autoSyncEnabled !== false ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                      title={sheetConfig.autoSyncEnabled !== false ? 'Disable auto-sync' : 'Enable auto-sync'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          sheetConfig.autoSyncEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Manual Sync Actions */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setConfirmPushOpen(true)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Push App Data to Google Sheet</span>
                    </button>

                    <button
                      onClick={() => setConfirmPullOpen(true)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      <DownloadCloud className="w-4 h-4 text-blue-400" />
                      <span>Pull Latest from Google Sheet</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Setup Options */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Automatic Creation */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Create New Master Sheet</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Generates a pre-structured Google Spreadsheet in your Google Drive with 5 formatted tabs: Sites, Collectors, Daily Assignments, Equipment, and Transfers.
                      </p>
                    </div>

                    <button
                      onClick={handleCreateNewSheet}
                      disabled={loading}
                      className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                      <span>Create & Sync Database</span>
                    </button>
                  </div>

                  {/* Option 2: Connect Existing */}
                  <form onSubmit={handleConnectExisting} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between hover:border-blue-500/40 transition">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                        <LinkIcon className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Connect Existing Sheet</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Have an existing spreadsheet? Paste its link or Spreadsheet ID below. We'll ensure the 5 operational tabs exist.
                      </p>

                      <div className="mt-3">
                        <input
                          type="text"
                          value={existingInput}
                          onChange={e => setExistingInput(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !existingInput.trim()}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                      <span>Link Spreadsheet</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Database Schema & Tab Architecture Explorer */}
          <div className="border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Google Sheet Architecture & Field Plan</h4>
              </div>
              <span className="text-[11px] text-slate-400">5 synchronized tabs</span>
            </div>

            <div className="flex gap-1 border-b border-slate-800 mb-3 overflow-x-auto pb-1">
              {Object.values(SHEET_NAMES).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSchemaTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                    activeSchemaTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="bg-slate-950/60 rounded-lg border border-slate-800 p-3">
              <div className="flex items-center gap-2 mb-2 text-xs text-slate-300 font-medium">
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span>Columns in Tab <strong className="text-white">"{activeSchemaTab}"</strong>:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(HEADERS[activeSchemaTab as keyof typeof HEADERS] || []).map((col, idx) => (
                  <span
                    key={col}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300"
                  >
                    <span className="text-[10px] text-slate-500 font-mono">{idx + 1}.</span>
                    <span>{col}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Confirmation Modal: Push to Sheet (Mandatory destructive confirmation) */}
        {confirmPushOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full text-slate-100 shadow-2xl">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Sync to Google Sheet</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                This operation will overwrite the current rows in your Google Spreadsheet (<strong>{sheetConfig?.spreadsheetTitle}</strong>) with your app's current data:
              </p>
              <ul className="text-xs text-slate-400 mt-2 space-y-1 list-disc list-inside">
                <li>{sites.length} Site arrangements</li>
                <li>{collectors.length} Field collectors</li>
                <li>{assignments.length} Shift assignments</li>
                <li>{equipment.length} Equipment inventory units</li>
                <li>{transfers.length} Transfer records</li>
                <li>{users.length} User accounts & credentials</li>
              </ul>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmPushOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={executePushToSheet}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition"
                >
                  Confirm & Overwrite Sheet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal: Pull from Sheet */}
        {confirmPullOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full text-slate-100 shadow-2xl">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Pull from Google Sheet</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                This will read all rows from your Google Spreadsheet (<strong>{sheetConfig?.spreadsheetTitle}</strong>) and replace your in-app working dataset with the values found in the spreadsheet.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmPullOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={executePullFromSheet}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow transition"
                >
                  Confirm & Replace App Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Changes you make in Google Sheets sync directly back via "Pull Latest"</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
