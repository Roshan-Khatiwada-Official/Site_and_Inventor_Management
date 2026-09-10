import React from 'react';
import { 
  Building2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Sparkles, 
  Plus, 
  RotateCcw, 
  Download, 
  Upload, 
  HardHat, 
  Boxes, 
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  User,
  KeyRound,
  LogIn,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Site, DataCollector, Equipment, DailyAssignment, UserAccount } from '../types';
import { SheetDatabaseConfig } from '../services/googleSheets';
import { BridgeConfig } from '../services/sheetsBridge';

interface HeaderProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  sites: Site[];
  collectors: DataCollector[];
  equipment: Equipment[];
  assignments: DailyAssignment[];
  sheetConfig: SheetDatabaseConfig | null;
  bridgeConfig?: BridgeConfig | null;
  isGoogleAuthed: boolean;
  isAutoSyncing?: boolean;
  currentUser: UserAccount | null;
  onOpenGoogleSheets: () => void;
  onOpenUserManagement: () => void;
  onOpenLogin: () => void;
  onOpenNewAssignment: () => void;
  onOpenNewEquipment: () => void;
  onOpenAutoAssign: () => void;
  onOpenRunSheet: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  activeTab,
  onTabChange,
  sites,
  collectors,
  equipment,
  assignments,
  sheetConfig,
  bridgeConfig,
  isGoogleAuthed,
  isAutoSyncing,
  currentUser,
  onOpenGoogleSheets,
  onOpenUserManagement,
  onOpenLogin,
  onOpenNewAssignment,
  onOpenNewEquipment,
  onOpenAutoAssign,
  onOpenRunSheet,
  onResetData,
  onExportData,
  onImportData,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Compute quick counters
  const activeSitesCount = sites.filter(s => s.status === 'Active').length;
  const todayAssignments = assignments.filter(a => a.date === currentDate && a.status !== 'Cancelled');
  const deployedCollectorsCount = new Set(todayAssignments.map(a => a.collectorId)).size;
  const deployedEquipmentCount = equipment.filter(e => e.status === 'Deployed').length;

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange('2026-09-08');
  };

  const formattedDisplayDate = React.useMemo(() => {
    try {
      const parts = currentDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return currentDate;
    }
  }, [currentDate]);

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner with Brand and Operations Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Platform Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Site & Inventory Manager
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Site arrangements, collector daily dispatch & cross-site equipment tracking
              </p>
            </div>
          </div>

          {/* Center Date Navigator */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg p-1.5 shadow-sm">
            <div className="flex items-center text-xs text-slate-400 pl-2 pr-1 font-medium">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              <span>Shift Date:</span>
            </div>
            <button
              onClick={handlePrevDay}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-100 px-1.5 min-w-[130px] text-center">
              {formattedDisplayDate}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded font-medium transition"
            >
              Today
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Google Sheet database sync status (Apps Script bridge) */}
            {bridgeConfig?.webAppUrl && (currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager' || currentUser?.role === 'Site Registrar') && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border transition ${
                  isAutoSyncing
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : bridgeConfig.autoSyncEnabled === false
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                }`}
                title={
                  bridgeConfig.autoSyncEnabled === false
                    ? 'Google Sheet connected — auto-sync paused (manual only)'
                    : 'Google Sheet is the live database — changes sync automatically'
                }
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isAutoSyncing
                    ? 'Syncing…'
                    : bridgeConfig.autoSyncEnabled === false
                    ? 'Sheet DB (manual)'
                    : 'Sheet DB synced'}
                </span>
              </span>
            )}

            {/* Google Sheets Live Link (Directly view spreadsheet - Admin & Operations Manager only) */}
            {sheetConfig && (currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager') && (
              <a
                href={sheetConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1.5 rounded-md transition shadow-xs"
                title="Open live Google Sheet in a new browser tab"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Open Google Sheet</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            )}

            {/* Google Sheets DB Link / Sync Dialog (Admin & Ops Manager) */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager') && (
              <button
                onClick={onOpenGoogleSheets}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border shadow-xs transition ${
                  sheetConfig
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                    : isGoogleAuthed
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Connect or sync database with Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{sheetConfig ? 'Sheets Sync' : 'Connect Google Sheet'}</span>
                {sheetConfig ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Connected"></span>
                ) : null}
              </button>
            )}

            {/* Admin Only: Manage IDs, Passwords & Roles */}
            {currentUser?.role === 'Admin' && (
              <button
                onClick={onOpenUserManagement}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-500/40 px-3 py-1.5 rounded-md shadow-xs transition animate-in fade-in"
                title="Admin: Manage IDs, Passwords, and assign roles to users"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Manage IDs & Roles</span>
              </button>
            )}

            {/* Auto-Roster (Admin & Ops Manager only) */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager') && (
              <button
                onClick={onOpenAutoAssign}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-md shadow transition"
                title="Auto-match available collectors to active sites"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Roster</span>
              </button>
            )}

            {/* Daily Run Sheet (Admin, Ops Manager, Site Dispatcher) */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager' || currentUser?.role === 'Site Dispatcher') && (
              <button
                onClick={onOpenRunSheet}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md transition"
                title="View & print today's daily dispatch manifest"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Daily Run Sheet</span>
              </button>
            )}

            {/* Dispatch Collector (Admin, Ops Manager, Site Dispatcher) */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager' || currentUser?.role === 'Site Dispatcher') && (
              <button
                onClick={onOpenNewAssignment}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dispatch Collector</span>
              </button>
            )}

            {/* User Account Profile Button (Opens My Profile modal) */}
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 px-2.5 py-1 rounded-md transition shadow-xs"
              title="Click to view your personal account profile or sign out"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-xs">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-xs font-semibold text-slate-100 truncate max-w-[120px]">
                  {currentUser ? currentUser.name : 'Sign In'}
                </span>
                <span className="text-[10px] text-purple-300 font-medium">
                  {currentUser ? currentUser.role : 'Guest'}
                </span>
              </div>
            </button>

            {/* Utility actions menu */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager') && (
              <div className="flex items-center border-l border-slate-700 pl-2 ml-1 gap-1">
                <button
                  onClick={onExportData}
                  title="Export database to JSON"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Import backup JSON"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onImportData} 
                  accept=".json" 
                  className="hidden" 
                />
                <button
                  onClick={onResetData}
                  title="Reset to initial demo data"
                  className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Operational Telemetry Pill Strip */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Active Sites:</span>
              <span className="font-semibold text-white">{activeSitesCount} / {sites.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              <span>Field Staff Deployed:</span>
              <span className="font-semibold text-white">{deployedCollectorsCount} collectors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>Equipment in Field:</span>
              <span className="font-semibold text-white">{deployedEquipmentCount} / {equipment.length} items</span>
            </div>
          </div>

          {/* Navigation Tab Pills - Role Restricted */}
          <nav className="flex items-center gap-1 bg-slate-800/70 p-1 rounded-lg border border-slate-700/60">
            {/* Field Collector Exclusive Tab */}
            {currentUser?.role === 'Field Collector' && (
              <button
                onClick={() => onTabChange('my-shift')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  activeTab === 'my-shift'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                My Field Shift
              </button>
            )}

            {/* Equipment Officer Tab */}
            {currentUser?.role === 'Equipment Officer' && (
              <button
                onClick={() => onTabChange('inventory')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  activeTab === 'inventory'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Equipment Inventory ({equipment.length})
              </button>
            )}

            {/* Site Dispatcher Tabs */}
            {currentUser?.role === 'Site Dispatcher' && (
              <>
                <button
                  onClick={() => onTabChange('assignments')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    activeTab === 'assignments'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Daily Dispatch ({todayAssignments.length})
                </button>
                <button
                  onClick={() => onTabChange('sites')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    activeTab === 'sites'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Sites & Access ({sites.length})
                </button>
              </>
            )}

            {/* Site Registrar Tab (sites only) */}
            {currentUser?.role === 'Site Registrar' && (
              <button
                onClick={() => onTabChange('sites')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  activeTab === 'sites'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Sites &amp; Details ({sites.length})
              </button>
            )}

            {/* Admin & Operations Manager Tabs */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager') && (
              <>
                <button
                  onClick={() => onTabChange('overview')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    activeTab === 'overview'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Operations Overview
                </button>
                <button
                  onClick={() => onTabChange('sites')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    activeTab === 'sites'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Sites & Arrangements ({sites.length})
                </button>
                <button
                  onClick={() => onTabChange('assignments')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    activeTab === 'assignments'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Daily Dispatch ({todayAssignments.length})
                </button>
                <button
                  onClick={() => onTabChange('inventory')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    activeTab === 'inventory'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Equipment Inventory ({equipment.length})
                </button>
                <button
                  onClick={() => onTabChange('collectors')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    activeTab === 'collectors'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Collectors Team ({collectors.length})
                </button>
              </>
            )}
          </nav>
        </div>

      </div>
    </header>
  );
};
