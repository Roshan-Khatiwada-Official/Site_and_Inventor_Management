import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  loadStoredData, 
  saveStoredData, 
  clearAllStorage, 
  generateOperationalAlerts,
  getActiveSessionUserId,
  setActiveSessionUserId
} from './utils/storage';
import { 
  INITIAL_SITES, 
  INITIAL_COLLECTORS, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_EQUIPMENT, 
  INITIAL_TRANSFERS,
  INITIAL_USERS
} from './mockData';
import { 
  Site, 
  DataCollector, 
  DailyAssignment, 
  Equipment, 
  TransferLog, 
  OperationalAlert, 
  AssignmentStatus, 
  EquipmentCondition, 
  EquipmentStatus,
  UserAccount,
  AppUserRole
} from './types';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { SitesTab } from './components/SitesTab';
import { AssignmentsTab } from './components/AssignmentsTab';
import { InventoryTab } from './components/InventoryTab';
import { CollectorsTab } from './components/CollectorsTab';

// Modals & Views
import { SiteModal } from './components/SiteModal';
import { AssignmentModal } from './components/AssignmentModal';
import { EquipmentModal } from './components/EquipmentModal';
import { EquipmentTransferModal } from './components/EquipmentTransferModal';
import { CollectorModal } from './components/CollectorModal';
import { AutoAssignModal } from './components/AutoAssignModal';
import { RunSheetModal } from './components/RunSheetModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { UserManagementModal } from './components/UserManagementModal';
import { LoginScreen } from './components/LoginScreen';
import { MyProfileModal } from './components/MyProfileModal';
import { FieldCollectorView } from './components/FieldCollectorView';
import { ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout as authLogout } from './services/auth';
import {
  SheetDatabaseConfig,
  getStoredSheetConfig,
  saveStoredSheetConfig
} from './services/googleSheets';
import {
  BridgeConfig,
  getStoredBridgeConfig,
  saveStoredBridgeConfig,
  bridgePull,
  bridgePush,
} from './services/sheetsBridge';

export default function App() {
  // Google Sheets database & auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sheetConfig, setSheetConfig] = useState<SheetDatabaseConfig | null>(() => getStoredSheetConfig());
  const [bridgeConfig, setBridgeConfig] = useState<BridgeConfig | null>(() => getStoredBridgeConfig());
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastBridgeSyncAt, setLastBridgeSyncAt] = useState<string | null>(() => getStoredBridgeConfig()?.lastSyncedAt || null);
  // Block the login screen until the first pull from the sheet finishes, so
  // staff accounts loaded from the sheet are available immediately.
  const [initialSyncDone, setInitialSyncDone] = useState(() => !getStoredBridgeConfig()?.webAppUrl);

  // Guards so a pull from the sheet does not immediately trigger a push back.
  const hydratingFromSheetRef = useRef(false);
  const bridgeReadyRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core operational date - defaults to 2026-09-08
  const [currentDate, setCurrentDate] = useState<string>('2026-09-08');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Stored state
  const [sites, setSites] = useState<Site[]>(() => loadStoredData('sites', INITIAL_SITES));
  const [collectors, setCollectors] = useState<DataCollector[]>(() => loadStoredData('collectors', INITIAL_COLLECTORS));
  const [equipment, setEquipment] = useState<Equipment[]>(() => loadStoredData('equipment', INITIAL_EQUIPMENT));
  const [assignments, setAssignments] = useState<DailyAssignment[]>(() => loadStoredData('assignments', INITIAL_ASSIGNMENTS));
  const [transfers, setTransfers] = useState<TransferLog[]>(() => loadStoredData('transfers', INITIAL_TRANSFERS));
  const [users, setUsers] = useState<UserAccount[]>(() => loadStoredData('users', INITIAL_USERS));
  
  // Current active login account (checks persistent active session)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const loaded = loadStoredData<UserAccount[]>('users', INITIAL_USERS);
    const activeUserId = getActiveSessionUserId();
    if (!activeUserId) return null; // Gate application behind login on other devices or first visits
    const match = loaded.find(u => u.id === activeUserId);
    if (!match || match.status === 'Suspended') return null;
    return match;
  });

  // Sync with LocalStorage on state changes
  useEffect(() => { saveStoredData('sites', sites); }, [sites]);
  useEffect(() => { saveStoredData('collectors', collectors); }, [collectors]);
  useEffect(() => { saveStoredData('equipment', equipment); }, [equipment]);
  useEffect(() => { saveStoredData('assignments', assignments); }, [assignments]);
  useEffect(() => { saveStoredData('transfers', transfers); }, [transfers]);
  useEffect(() => { saveStoredData('users', users); }, [users]);

  // ---- Google Sheet (Apps Script bridge) as the shared database ----------

  const applySheetData = (data: {
    sites: Site[];
    collectors: DataCollector[];
    assignments: DailyAssignment[];
    equipment: Equipment[];
    transfers: TransferLog[];
    users: UserAccount[];
  }) => {
    hydratingFromSheetRef.current = true;
    if (data.sites.length) setSites(data.sites);
    if (data.collectors.length) setCollectors(data.collectors);
    if (data.assignments.length) setAssignments(data.assignments);
    if (data.equipment.length) setEquipment(data.equipment);
    if (data.transfers.length) setTransfers(data.transfers);
    if (data.users.length) {
      setUsers(data.users);
      setCurrentUser(prev => (prev ? data.users.find(u => u.id === prev.id) || prev : prev));
    }
    // Release the guard after this render settles.
    setTimeout(() => { hydratingFromSheetRef.current = false; }, 0);
  };

  // On load (and whenever the bridge is (re)connected): pull the latest from the sheet.
  useEffect(() => {
    if (!bridgeConfig?.webAppUrl) {
      bridgeReadyRef.current = false;
      return;
    }
    let cancelled = false;
    bridgeReadyRef.current = false;
    setIsAutoSyncing(true);
    bridgePull(bridgeConfig)
      .then(data => {
        if (cancelled) return;
        applySheetData(data);
        setLastBridgeSyncAt(new Date().toISOString());
      })
      .catch(err => {
        console.error('Initial sheet pull failed:', err);
        showToast('Could not load data from Google Sheet. Working from local copy.');
      })
      .finally(() => {
        if (cancelled) return;
        setIsAutoSyncing(false);
        setInitialSyncDone(true);
        // Allow auto-push only after the first pull attempt has completed.
        bridgeReadyRef.current = true;
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeConfig?.webAppUrl, bridgeConfig?.token]);

  // Debounced auto-push: any change to operational data is written to the sheet.
  useEffect(() => {
    if (!bridgeConfig?.webAppUrl) return;
    if (bridgeConfig.autoSyncEnabled === false) return;
    if (!bridgeReadyRef.current) return;
    if (hydratingFromSheetRef.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        setIsAutoSyncing(true);
        const savedAt = await bridgePush(bridgeConfig, {
          sites, collectors, assignments, equipment, transfers, users,
        });
        setLastBridgeSyncAt(savedAt);
        const updated = { ...bridgeConfig, lastSyncedAt: savedAt };
        saveStoredBridgeConfig(updated);
      } catch (err) {
        console.error('Auto-sync push failed:', err);
        showToast('Auto-sync to Google Sheet failed. Will retry on next change.');
      } finally {
        setIsAutoSyncing(false);
      }
    }, 1500);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, collectors, assignments, equipment, transfers, users, bridgeConfig]);

  const handleSaveBridgeConfig = (config: BridgeConfig | null) => {
    setBridgeConfig(config);
    saveStoredBridgeConfig(config);
    setLastBridgeSyncAt(config?.lastSyncedAt || null);
  };

  const handleManualBridgePull = async () => {
    if (!bridgeConfig?.webAppUrl) return;
    setIsAutoSyncing(true);
    try {
      const data = await bridgePull(bridgeConfig);
      applySheetData(data);
      setLastBridgeSyncAt(new Date().toISOString());
      showToast('Pulled latest data from Google Sheet.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to pull from Google Sheet.');
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const handleManualBridgePush = async () => {
    if (!bridgeConfig?.webAppUrl) return;
    setIsAutoSyncing(true);
    try {
      const savedAt = await bridgePush(bridgeConfig, {
        sites, collectors, assignments, equipment, transfers, users,
      });
      setLastBridgeSyncAt(savedAt);
      handleSaveBridgeConfig({ ...bridgeConfig, lastSyncedAt: savedAt });
      showToast('Pushed all data to Google Sheet.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to push to Google Sheet.');
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Operational Alerts calculation
  const alerts: OperationalAlert[] = React.useMemo(() => {
    return generateOperationalAlerts(equipment, assignments, sites, collectors, currentDate);
  }, [equipment, assignments, sites, collectors, currentDate]);

  // Modal display states
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<DailyAssignment | null>(null);
  const [prefillSiteIdForAsg, setPrefillSiteIdForAsg] = useState<string | undefined>(undefined);
  const [prefillCollectorIdForAsg, setPrefillCollectorIdForAsg] = useState<string | undefined>(undefined);

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringEquipment, setTransferringEquipment] = useState<Equipment | null>(null);
  const [prefillSiteIdForTransfer, setPrefillSiteIdForTransfer] = useState<string | undefined>(undefined);

  const [isCollectorModalOpen, setIsCollectorModalOpen] = useState(false);
  const [editingCollector, setEditingCollector] = useState<DataCollector | null>(null);

  const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState(false);
  const [isRunSheetModalOpen, setIsRunSheetModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Listen to Firebase Google auth changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      () => {
        // If not authenticated or token needs reload
        // Keep user if state exists or prompt gracefully
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showToast(`Connected as ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      showToast(err?.message || 'Google sign in failed');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await authLogout();
      setUser(null);
      setAccessToken(null);
      showToast('Signed out of Google account');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleSaveSheetConfig = (config: SheetDatabaseConfig | null) => {
    setSheetConfig(config);
    saveStoredSheetConfig(config);
  };

  const handleUpdateAllDataFromSheet = (data: {
    sites: Site[];
    collectors: DataCollector[];
    assignments: DailyAssignment[];
    equipment: Equipment[];
    transfers: TransferLog[];
    users?: UserAccount[];
  }) => {
    setSites(data.sites);
    setCollectors(data.collectors);
    setAssignments(data.assignments);
    setEquipment(data.equipment);
    setTransfers(data.transfers);
    if (data.users && data.users.length > 0) {
      setUsers(data.users);
      // Ensure currentUser stays up to date
      setCurrentUser(prev => {
        if (!prev) return data.users![0];
        const match = data.users!.find(u => u.id === prev.id);
        return match || data.users![0];
      });
    }
  };

  // User Management handlers (Admin)
  const handleSaveUser = (userToSave: UserAccount) => {
    const exists = users.some(u => u.id === userToSave.id);
    if (exists) {
      setUsers(users.map(u => u.id === userToSave.id ? userToSave : u));
      if (currentUser?.id === userToSave.id) {
        setCurrentUser(userToSave);
      }
    } else {
      setUsers([...users, userToSave]);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      handleSignOut();
    }
  };

  const handleLoginSuccess = (loggedInUser: UserAccount) => {
    setActiveSessionUserId(loggedInUser.id);
    const nowStamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = {
      ...loggedInUser,
      lastLogin: nowStamp,
    };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));

    // Route to appropriate view based on assigned role
    if (loggedInUser.role === 'Field Collector') {
      setActiveTab('my-shift');
    } else if (loggedInUser.role === 'Equipment Officer') {
      setActiveTab('inventory');
    } else if (loggedInUser.role === 'Site Dispatcher') {
      setActiveTab('assignments');
    } else if (loggedInUser.role === 'Site Registrar') {
      setActiveTab('sites');
    } else {
      setActiveTab('overview');
    }
    showToast(`Signed in as ${loggedInUser.name} (${loggedInUser.role})`);
  };

  const handleSignOut = () => {
    setActiveSessionUserId(null);
    setCurrentUser(null);
    setIsProfileOpen(false);
    showToast('Signed out of active session.');
  };

  const handleUpdateMyPassword = (newPassword: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, password: newPassword };
    setCurrentUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
    showToast('Your personal password was updated successfully.');
  };

  // Site handlers
  const handleSaveSite = (site: Site) => {
    if (editingSite) {
      setSites(sites.map(s => s.id === site.id ? site : s));
      showToast(`Updated site arrangement: ${site.name}`);
    } else {
      setSites([...sites, site]);
      showToast(`Registered new site: ${site.name}`);
    }
  };

  const handleDeleteSite = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    if (window.confirm(`Are you sure you want to remove site arrangement "${site.name}"?`)) {
      setSites(sites.filter(s => s.id !== siteId));
      showToast(`Removed site: ${site.name}`);
    }
  };

  // Assignment handlers
  const handleSaveAssignment = (asg: DailyAssignment, equipmentIdsToDeploy: string[]) => {
    const authorName = currentUser?.name || currentUser?.loginId || 'Dispatcher';
    const stampedAsg: DailyAssignment = {
      ...asg,
      dispatchedBy: asg.dispatchedBy || authorName,
    };

    if (editingAssignment) {
      setAssignments(assignments.map(a => a.id === stampedAsg.id ? stampedAsg : a));
      showToast(`Updated daily assignment`);
    } else {
      setAssignments([...assignments, stampedAsg]);
      showToast(`Dispatched field assignment`);
    }

    // Update equipment statuses to Deployed
    if (equipmentIdsToDeploy.length > 0) {
      setEquipment(equipment.map(e => {
        if (equipmentIdsToDeploy.includes(e.id)) {
          return {
            ...e,
            status: 'Deployed',
            assignedSiteId: asg.siteId,
            assignedCollectorId: asg.collectorId,
            handledBy: authorName,
          };
        }
        return e;
      }));

      // Log transfers
      const newLogs: TransferLog[] = equipmentIdsToDeploy.map(eqId => {
        const item = equipment.find(e => e.id === eqId);
        const site = sites.find(s => s.id === asg.siteId);
        const col = collectors.find(c => c.id === asg.collectorId);
        return {
          id: `tr-${Date.now()}-${eqId}`,
          equipmentId: eqId,
          equipmentTag: item?.assetTag || 'EQ',
          equipmentName: item?.name || 'Equipment',
          fromLocation: item?.storageLocation || 'Central Depot',
          toLocation: `${site?.name || 'Site'} (${col?.name || 'Collector'})`,
          transferredBy: authorName,
          timestamp: new Date().toLocaleString(),
          condition: item?.condition || 'Good',
          notes: `Checked out for shift assignment ${asg.shift}`,
        };
      });

      setTransfers([...newLogs, ...transfers]);
    }
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
    showToast('Removed assignment from roster');
  };

  const handleUpdateAssignmentStatus = (assignmentId: string, newStatus: AssignmentStatus) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignmentId) {
        const updated = { ...a, status: newStatus };
        if (newStatus === 'On-Site' && !a.checkInTime) {
          updated.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (newStatus === 'Completed' && !a.checkOutTime) {
          updated.checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return updated;
      }
      return a;
    }));
    showToast(`Shift status changed to ${newStatus}`);
  };

  const handleIncrementUnits = (assignmentId: string, amount: number) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          unitsCollected: (a.unitsCollected || 0) + amount,
        };
      }
      return a;
    }));
    showToast(`Logged +${amount} unit(s)`);
  };

  // Equipment handlers
  const handleSaveEquipment = (item: Equipment) => {
    const handler = currentUser?.name || currentUser?.loginId || 'Equipment Officer';
    const stampedItem: Equipment = {
      ...item,
      handledBy: item.handledBy || handler,
    };

    if (editingEquipment) {
      setEquipment(equipment.map(e => e.id === stampedItem.id ? stampedItem : e));
      showToast(`Updated equipment: ${item.assetTag}`);
    } else {
      setEquipment([...equipment, stampedItem]);
      showToast(`Registered new asset: ${item.assetTag}`);
    }
  };

  const handleDeleteEquipment = (id: string) => {
    const item = equipment.find(e => e.id === id);
    if (!item) return;
    if (window.confirm(`Are you sure you want to remove asset "${item.assetTag} - ${item.name}"?`)) {
      setEquipment(equipment.filter(e => e.id !== id));
      showToast(`Deleted asset: ${item.assetTag}`);
    }
  };

  const handleConfirmTransfer = (
    item: Equipment,
    targetType: 'site' | 'collector' | 'depot',
    targetId: string,
    condition: EquipmentCondition,
    handler: string,
    notes: string
  ) => {
    let newStatus: EquipmentStatus = 'Deployed';
    let newSiteId: string | undefined = undefined;
    let newCollectorId: string | undefined = undefined;
    let destinationLabel = '';

    if (targetType === 'site') {
      newStatus = 'Deployed';
      newSiteId = targetId;
      destinationLabel = sites.find(s => s.id === targetId)?.name || 'Field Site';
    } else if (targetType === 'collector') {
      newStatus = 'Deployed';
      newCollectorId = targetId;
      destinationLabel = collectors.find(c => c.id === targetId)?.name || 'Field Collector';
    } else {
      newStatus = condition === 'Needs Repair' ? 'Maintenance' : 'Available';
      destinationLabel = targetId || 'Central Depot';
    }

    const fromLabel = item.status === 'Deployed'
      ? (sites.find(s => s.id === item.assignedSiteId)?.name || 
         collectors.find(c => c.id === item.assignedCollectorId)?.name || 
         'Field Deployed')
      : item.storageLocation || 'Central Depot';

    const actualHandler = handler || currentUser?.name || currentUser?.loginId || 'Equipment Officer';

    // Update equipment
    const updated: Equipment = {
      ...item,
      status: newStatus,
      condition,
      assignedSiteId: newSiteId,
      assignedCollectorId: newCollectorId,
      storageLocation: targetType === 'depot' ? targetId : item.storageLocation,
      handledBy: actualHandler,
    };

    setEquipment(equipment.map(e => e.id === item.id ? updated : e));

    // Append transfer log
    const log: TransferLog = {
      id: `tr-${Date.now()}`,
      equipmentId: item.id,
      equipmentTag: item.assetTag,
      equipmentName: item.name,
      fromLocation: fromLabel,
      toLocation: destinationLabel,
      transferredBy: actualHandler,
      timestamp: new Date().toLocaleString(),
      condition,
      notes: notes || 'Standard custody transfer',
    };

    setTransfers([log, ...transfers]);
    showToast(`Transferred ${item.assetTag} to ${destinationLabel}`);
  };

  const handleReturnEquipment = (item: Equipment) => {
    const handler = currentUser?.name || currentUser?.loginId || 'Equipment Officer';
    handleConfirmTransfer(item, 'depot', 'Central Depot - Storage', item.condition, handler, 'Returned from field deployment');
  };

  const handleUpdateCondition = (item: Equipment, condition: EquipmentCondition, status: EquipmentStatus) => {
    const handler = currentUser?.name || currentUser?.loginId || 'Equipment Officer';
    setEquipment(equipment.map(e => {
      if (e.id === item.id) {
        return { ...e, condition, status, handledBy: handler };
      }
      return e;
    }));
    showToast(`Updated condition for ${item.assetTag} to ${condition}`);
  };

  // Collector handlers
  const handleSaveCollector = (collector: DataCollector) => {
    if (editingCollector) {
      setCollectors(collectors.map(c => c.id === collector.id ? collector : c));
      showToast(`Updated field profile for ${collector.name}`);
    } else {
      setCollectors([...collectors, collector]);
      showToast(`Registered new collector: ${collector.name}`);
    }
  };

  const handleDeleteCollector = (collectorId: string) => {
    const col = collectors.find(c => c.id === collectorId);
    if (!col) return;
    if (window.confirm(`Are you sure you want to remove field collector "${col.name}"?`)) {
      setCollectors(collectors.filter(c => c.id !== collectorId));
      showToast(`Removed collector: ${col.name}`);
    }
  };

  // Auto-Assign Apply
  const handleApplyAutoAssign = (
    newAssignments: DailyAssignment[],
    equipmentDeployments: { equipmentId: string; siteId: string; collectorId: string }[]
  ) => {
    setAssignments([...assignments, ...newAssignments]);

    if (equipmentDeployments.length > 0) {
      setEquipment(equipment.map(eq => {
        const deployment = equipmentDeployments.find(d => d.equipmentId === eq.id);
        if (deployment) {
          return {
            ...eq,
            status: 'Deployed',
            assignedSiteId: deployment.siteId,
            assignedCollectorId: deployment.collectorId,
          };
        }
        return eq;
      }));
    }

    showToast(`Successfully created ${newAssignments.length} auto-scheduled field dispatches!`);
  };

  // Reset to Demo Data
  const handleResetData = () => {
    if (window.confirm('Reset all field sites, collector assignments, equipment, and user accounts back to default demo data?')) {
      clearAllStorage();
      setSites(INITIAL_SITES);
      setCollectors(INITIAL_COLLECTORS);
      setAssignments(INITIAL_ASSIGNMENTS);
      setEquipment(INITIAL_EQUIPMENT);
      setTransfers(INITIAL_TRANSFERS);
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
      showToast('Reset system to initial demonstration dataset.');
    }
  };

  // Export JSON
  const handleExportData = () => {
    const backup = {
      sites,
      collectors,
      assignments,
      equipment,
      transfers,
      users,
      exportTimestamp: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FieldOps_Backup_${currentDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database exported successfully.');
  };

  // Import JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.sites && parsed.collectors && parsed.equipment) {
            setSites(parsed.sites);
            setCollectors(parsed.collectors);
            setEquipment(parsed.equipment);
            setAssignments(parsed.assignments || []);
            setTransfers(parsed.transfers || []);
            if (parsed.users && Array.isArray(parsed.users)) {
              setUsers(parsed.users);
            }
            showToast('Database imported and synchronized successfully.');
          } else {
            alert('Invalid backup file format.');
          }
        } catch (err) {
          alert('Failed to parse imported JSON.');
        }
      };
    }
  };

  // Role-Based Data Visibility:
  // Admin and Operations Manager can see all data across the company.
  // Other staff (Site Dispatcher, Equipment Officer, Field Collector) can ONLY see what THEY have done / their assigned data.
  const canSeeAll =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Operations Manager' ||
    currentUser?.role === 'Site Registrar';

  // 1. Scoped Assignments
  const visibleAssignments = useMemo(() => {
    if (!currentUser || canSeeAll) return assignments;

    if (currentUser.role === 'Field Collector') {
      return assignments.filter(a => {
        if (currentUser.collectorId && a.collectorId === currentUser.collectorId) return true;
        const col = collectors.find(c => c.id === a.collectorId);
        return col && col.name.toLowerCase() === currentUser.name.toLowerCase();
      });
    }

    if (currentUser.role === 'Site Dispatcher') {
      return assignments.filter(a => {
        if (a.dispatchedBy && (
          a.dispatchedBy.toLowerCase() === currentUser.name.toLowerCase() || 
          a.dispatchedBy === currentUser.loginId
        )) {
          return true;
        }
        if (currentUser.assignedSiteId && a.siteId === currentUser.assignedSiteId) {
          return true;
        }
        return false;
      });
    }

    if (currentUser.role === 'Equipment Officer') {
      const myTransfers = transfers.filter(t => 
        t.transferredBy.toLowerCase() === currentUser.name.toLowerCase() || 
        t.transferredBy === currentUser.loginId
      );
      const myEquipmentIds = new Set([
        ...myTransfers.map(t => t.equipmentId),
        ...equipment.filter(e => e.handledBy?.toLowerCase() === currentUser.name.toLowerCase()).map(e => e.id)
      ]);
      return assignments.filter(a => a.assignedEquipmentIds.some(id => myEquipmentIds.has(id)));
    }

    return [];
  }, [assignments, currentUser, canSeeAll, collectors, transfers, equipment]);

  // 2. Scoped Equipment
  const visibleEquipment = useMemo(() => {
    if (!currentUser || canSeeAll) return equipment;

    if (currentUser.role === 'Equipment Officer') {
      const myTransferEqIds = new Set(
        transfers
          .filter(t => t.transferredBy.toLowerCase() === currentUser.name.toLowerCase() || t.transferredBy === currentUser.loginId)
          .map(t => t.equipmentId)
      );
      return equipment.filter(e => 
        myTransferEqIds.has(e.id) || 
        (e.handledBy && e.handledBy.toLowerCase() === currentUser.name.toLowerCase())
      );
    }

    if (currentUser.role === 'Field Collector') {
      const myEquipmentIds = new Set(visibleAssignments.flatMap(a => a.assignedEquipmentIds));
      const myCollectorId = currentUser.collectorId || collectors.find(c => c.name.toLowerCase() === currentUser.name.toLowerCase())?.id;
      return equipment.filter(e => myEquipmentIds.has(e.id) || (myCollectorId && e.assignedCollectorId === myCollectorId));
    }

    if (currentUser.role === 'Site Dispatcher') {
      const mySiteIds = new Set([
        ...(currentUser.assignedSiteId ? [currentUser.assignedSiteId] : []),
        ...visibleAssignments.map(a => a.siteId)
      ]);
      const myEqIds = new Set(visibleAssignments.flatMap(a => a.assignedEquipmentIds));
      return equipment.filter(e => (e.assignedSiteId && mySiteIds.has(e.assignedSiteId)) || myEqIds.has(e.id));
    }

    return [];
  }, [equipment, currentUser, canSeeAll, visibleAssignments, collectors, transfers]);

  // 3. Scoped Sites
  const visibleSites = useMemo(() => {
    if (!currentUser || canSeeAll) return sites;

    if (currentUser.role === 'Field Collector') {
      const mySiteIds = new Set(visibleAssignments.map(a => a.siteId));
      return sites.filter(s => mySiteIds.has(s.id));
    }

    if (currentUser.role === 'Site Dispatcher') {
      const mySiteIds = new Set([
        ...(currentUser.assignedSiteId ? [currentUser.assignedSiteId] : []),
        ...visibleAssignments.map(a => a.siteId)
      ]);
      return sites.filter(s => mySiteIds.has(s.id));
    }

    if (currentUser.role === 'Equipment Officer') {
      const mySiteIds = new Set(visibleEquipment.map(e => e.assignedSiteId).filter(Boolean));
      return sites.filter(s => mySiteIds.has(s.id));
    }

    return [];
  }, [sites, currentUser, canSeeAll, visibleAssignments, visibleEquipment]);

  // 4. Scoped Collectors
  const visibleCollectors = useMemo(() => {
    if (!currentUser || canSeeAll) return collectors;

    if (currentUser.role === 'Field Collector') {
      return collectors.filter(c => 
        c.id === currentUser.collectorId || 
        c.name.toLowerCase() === currentUser.name.toLowerCase()
      );
    }

    if (currentUser.role === 'Site Dispatcher') {
      const myCollectorIds = new Set(visibleAssignments.map(a => a.collectorId));
      return collectors.filter(c => myCollectorIds.has(c.id));
    }

    if (currentUser.role === 'Equipment Officer') {
      const collectorIds = new Set(visibleEquipment.map(e => e.assignedCollectorId).filter(Boolean));
      return collectors.filter(c => collectorIds.has(c.id));
    }

    return [];
  }, [collectors, currentUser, canSeeAll, visibleAssignments, visibleEquipment]);

  // 5. Scoped Transfers
  const visibleTransfers = useMemo(() => {
    if (!currentUser || canSeeAll) return transfers;

    if (currentUser.role === 'Equipment Officer') {
      return transfers.filter(t => 
        t.transferredBy.toLowerCase() === currentUser.name.toLowerCase() || 
        t.transferredBy === currentUser.loginId
      );
    }

    if (currentUser.role === 'Site Dispatcher') {
      const mySiteNames = new Set(visibleSites.map(s => s.name.toLowerCase()));
      return transfers.filter(t => 
        mySiteNames.has(t.fromLocation.toLowerCase()) || 
        mySiteNames.has(t.toLocation.toLowerCase()) ||
        t.transferredBy.toLowerCase() === currentUser.name.toLowerCase()
      );
    }

    if (currentUser.role === 'Field Collector') {
      const myEqIds = new Set(visibleEquipment.map(e => e.id));
      return transfers.filter(t => myEqIds.has(t.equipmentId));
    }

    return [];
  }, [transfers, currentUser, canSeeAll, visibleSites, visibleEquipment]);

  // While the first sync from the Google Sheet is in flight, show a loader so
  // login is attempted only against accounts that came from the sheet.
  if (!currentUser && !initialSyncDone) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading data from Google Sheet…</p>
      </div>
    );
  }

  // Gated Authentication: If not logged in, render the full Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
        <LoginScreen
          users={users}
          onLoginSuccess={handleLoginSuccess}
        />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation & Operations Control Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sites={visibleSites}
        collectors={visibleCollectors}
        equipment={visibleEquipment}
        assignments={visibleAssignments}
        sheetConfig={sheetConfig}
        bridgeConfig={bridgeConfig}
        isGoogleAuthed={!!user}
        isAutoSyncing={isAutoSyncing}
        currentUser={currentUser}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenLogin={() => setIsProfileOpen(true)}
        onOpenNewAssignment={() => {
          setEditingAssignment(null);
          setPrefillSiteIdForAsg(undefined);
          setPrefillCollectorIdForAsg(undefined);
          setIsAssignmentModalOpen(true);
        }}
        onOpenNewEquipment={() => {
          setEditingEquipment(null);
          setIsEquipmentModalOpen(true);
        }}
        onOpenAutoAssign={() => setIsAutoAssignModalOpen(true)}
        onOpenRunSheet={() => setIsRunSheetModalOpen(true)}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Role & Access Notification Banner */}
        <div className="mb-6 px-4 py-2.5 rounded-xl border bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-slate-200">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-md font-semibold text-xs border ${
              currentUser.role === 'Admin'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : currentUser.role === 'Operations Manager'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : currentUser.role === 'Site Registrar'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : currentUser.role === 'Site Dispatcher'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : currentUser.role === 'Equipment Officer'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}>
              {currentUser.role}
            </span>
            <div className="text-slate-600">
              Logged in as <strong className="text-slate-900">{currentUser.name}</strong> (<code className="font-mono text-slate-500">{currentUser.loginId}</code>).
              {currentUser.role === 'Admin' && (
                <span className="ml-1 text-slate-500">You have full administrator authority to create staff IDs, reset passwords, and manage operations.</span>
              )}
              {currentUser.role === 'Field Collector' && (
                <span className="ml-1 text-slate-500">Review your daily site dispatch, gate access codes, and log completed collection units.</span>
              )}
              {currentUser.role === 'Equipment Officer' && (
                <span className="ml-1 text-slate-500">Inspect equipment condition, log calibrations, and transfer custody.</span>
              )}
              {currentUser.role === 'Site Dispatcher' && (
                <span className="ml-1 text-slate-500">Check in/out collectors, dispatch shifts, and review site facilities.</span>
              )}
              {currentUser.role === 'Site Registrar' && (
                <span className="ml-1 text-slate-500">Find, add, and update field site details. Changes save to the Google Sheet automatically.</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser.role === 'Admin' && (
              <button
                onClick={() => setIsUserManagementOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-xs transition text-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manage Staff Accounts</span>
              </button>
            )}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="px-2.5 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition text-xs border border-slate-200 flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>My Profile</span>
            </button>
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition text-xs border border-rose-200 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        
        {/* Operations Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab
            currentDate={currentDate}
            sites={visibleSites}
            collectors={visibleCollectors}
            equipment={visibleEquipment}
            assignments={visibleAssignments}
            transfers={visibleTransfers}
            alerts={alerts}
            onNavigateTab={setActiveTab}
            onOpenNewAssignment={(siteId) => {
              setEditingAssignment(null);
              setPrefillSiteIdForAsg(siteId);
              setIsAssignmentModalOpen(true);
            }}
            onOpenAutoAssign={() => setIsAutoAssignModalOpen(true)}
            onSelectSite={(siteId) => {
              setActiveTab('sites');
            }}
          />
        )}

        {/* Sites & Arrangements Tab */}
        {activeTab === 'sites' && (
          <SitesTab
            currentDate={currentDate}
            sites={visibleSites}
            collectors={visibleCollectors}
            equipment={visibleEquipment}
            assignments={visibleAssignments}
            currentUser={currentUser}
            onAddSite={() => {
              setEditingSite(null);
              setIsSiteModalOpen(true);
            }}
            onEditSite={(site) => {
              setEditingSite(site);
              setIsSiteModalOpen(true);
            }}
            onDeleteSite={handleDeleteSite}
            onOpenNewAssignment={(siteId) => {
              setEditingAssignment(null);
              setPrefillSiteIdForAsg(siteId);
              setIsAssignmentModalOpen(true);
            }}
            onDeployEquipmentToSite={(siteId) => {
              const avail = visibleEquipment.find(e => e.status === 'Available') || equipment.find(e => e.status === 'Available');
              setTransferringEquipment(avail || visibleEquipment[0] || equipment[0] || null);
              setPrefillSiteIdForTransfer(siteId);
              setIsTransferModalOpen(true);
            }}
          />
        )}

        {/* Daily Dispatch Assignments Tab */}
        {activeTab === 'assignments' && (
          <AssignmentsTab
            currentDate={currentDate}
            assignments={visibleAssignments}
            sites={visibleSites}
            collectors={visibleCollectors}
            equipment={visibleEquipment}
            currentUser={currentUser}
            onAddAssignment={() => {
              setEditingAssignment(null);
              setPrefillSiteIdForAsg(undefined);
              setIsAssignmentModalOpen(true);
            }}
            onEditAssignment={(asg) => {
              setEditingAssignment(asg);
              setIsAssignmentModalOpen(true);
            }}
            onDeleteAssignment={handleDeleteAssignment}
            onUpdateStatus={handleUpdateAssignmentStatus}
            onIncrementUnits={handleIncrementUnits}
            onOpenAutoAssign={() => setIsAutoAssignModalOpen(true)}
            onOpenRunSheet={() => setIsRunSheetModalOpen(true)}
          />
        )}

        {/* Equipment Inventory Tab */}
        {activeTab === 'inventory' && (
          <InventoryTab
            equipment={visibleEquipment}
            sites={visibleSites}
            collectors={visibleCollectors}
            transfers={visibleTransfers}
            currentDate={currentDate}
            currentUser={currentUser}
            onAddEquipment={() => {
              setEditingEquipment(null);
              setIsEquipmentModalOpen(true);
            }}
            onEditEquipment={(item) => {
              setEditingEquipment(item);
              setIsEquipmentModalOpen(true);
            }}
            onDeleteEquipment={handleDeleteEquipment}
            onDeployEquipment={(item) => {
              setTransferringEquipment(item);
              setPrefillSiteIdForTransfer(undefined);
              setIsTransferModalOpen(true);
            }}
            onReturnEquipment={handleReturnEquipment}
            onUpdateCondition={handleUpdateCondition}
          />
        )}

        {/* Data Collectors Team Tab */}
        {activeTab === 'collectors' && (
          <CollectorsTab
            collectors={visibleCollectors}
            assignments={visibleAssignments}
            sites={visibleSites}
            equipment={visibleEquipment}
            currentDate={currentDate}
            onAddCollector={() => {
              setEditingCollector(null);
              setIsCollectorModalOpen(true);
            }}
            onEditCollector={(col) => {
              setEditingCollector(col);
              setIsCollectorModalOpen(true);
            }}
            onDeleteCollector={handleDeleteCollector}
            onDispatchCollector={(colId) => {
              setEditingAssignment(null);
              setPrefillCollectorIdForAsg(colId);
              setIsAssignmentModalOpen(true);
            }}
          />
        )}

        {/* Field Collector Exclusive Portal */}
        {activeTab === 'my-shift' && (
          <FieldCollectorView
            currentUser={currentUser}
            currentDate={currentDate}
            assignments={visibleAssignments}
            sites={visibleSites}
            equipment={visibleEquipment}
            collectors={visibleCollectors}
            onUpdateAssignment={(updatedAsg) => {
              setAssignments(assignments.map(a => a.id === updatedAsg.id ? updatedAsg : a));
            }}
            onNotify={showToast}
          />
        )}

      </main>

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* All Dialogs & Modals */}
      <SiteModal
        isOpen={isSiteModalOpen}
        site={editingSite}
        compact={currentUser?.role === 'Site Registrar'}
        onClose={() => setIsSiteModalOpen(false)}
        onSave={handleSaveSite}
      />

      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        assignment={editingAssignment}
        defaultSiteId={prefillSiteIdForAsg}
        defaultCollectorId={prefillCollectorIdForAsg}
        currentDate={currentDate}
        sites={sites}
        collectors={collectors}
        equipment={equipment}
        allAssignments={assignments}
        onClose={() => setIsAssignmentModalOpen(false)}
        onSave={handleSaveAssignment}
      />

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        equipment={editingEquipment}
        sites={sites}
        collectors={collectors}
        onClose={() => setIsEquipmentModalOpen(false)}
        onSave={handleSaveEquipment}
      />

      <EquipmentTransferModal
        isOpen={isTransferModalOpen}
        equipment={transferringEquipment}
        sites={sites}
        collectors={collectors}
        prefillSiteId={prefillSiteIdForTransfer}
        currentUser={currentUser}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirmTransfer={handleConfirmTransfer}
      />

      <CollectorModal
        isOpen={isCollectorModalOpen}
        collector={editingCollector}
        onClose={() => setIsCollectorModalOpen(false)}
        onSave={handleSaveCollector}
      />

      <AutoAssignModal
        isOpen={isAutoAssignModalOpen}
        currentDate={currentDate}
        sites={sites}
        collectors={collectors}
        equipment={equipment}
        existingAssignments={assignments}
        onClose={() => setIsAutoAssignModalOpen(false)}
        onApplyAssignments={handleApplyAutoAssign}
      />

      <RunSheetModal
        isOpen={isRunSheetModalOpen}
        currentDate={currentDate}
        assignments={visibleAssignments}
        sites={visibleSites}
        collectors={visibleCollectors}
        equipment={visibleEquipment}
        onClose={() => setIsRunSheetModalOpen(false)}
      />

      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        sheetConfig={sheetConfig}
        onSaveSheetConfig={handleSaveSheetConfig}
        bridgeConfig={bridgeConfig}
        onSaveBridgeConfig={handleSaveBridgeConfig}
        onBridgePull={handleManualBridgePull}
        onBridgePush={handleManualBridgePush}
        isAutoSyncing={isAutoSyncing}
        lastBridgeSyncAt={lastBridgeSyncAt}
        sites={sites}
        collectors={collectors}
        assignments={assignments}
        equipment={equipment}
        transfers={transfers}
        users={users}
        onUpdateAllData={handleUpdateAllDataFromSheet}
        onNotify={showToast}
      />

      {/* Admin User ID, Password & Role Management Modal */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={users}
        currentUser={currentUser}
        sites={sites}
        collectors={collectors}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
        onNotify={showToast}
      />

      {/* Logged in User Personal Profile & Password Modal */}
      {currentUser && (
        <MyProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          sites={sites}
          collectors={collectors}
          onUpdatePassword={handleUpdateMyPassword}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onSignOut={handleSignOut}
          onNotify={showToast}
        />
      )}

    </div>
  );
}
