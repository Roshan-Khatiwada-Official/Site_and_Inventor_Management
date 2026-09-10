import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  loadStoredData,
  saveStoredData,
  getActiveSessionUserId,
  setActiveSessionUserId,
  todayStr,
} from './utils/storage';
import {
  INITIAL_SITES,
  INITIAL_INVENTORY,
  INITIAL_ASSIGNMENTS,
  INITIAL_REQUESTS,
  INITIAL_USERS,
} from './mockData';
import {
  Site,
  InventoryItem,
  Assignment,
  SiteRequest,
  UserAccount,
  CollectionSession,
} from './types';
import {
  BridgeConfig,
  AppData,
  getStoredBridgeConfig,
  saveStoredBridgeConfig,
  bridgePull,
  bridgePush,
} from './services/sheetsBridge';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { SitesView } from './components/SitesView';
import { InventoryView } from './components/InventoryView';
import { AssignmentsView } from './components/AssignmentsView';
import { RequestsView } from './components/RequestsView';
import { ReportsView } from './components/ReportsView';
import { AvailableSitesView } from './components/AvailableSitesView';
import { MyWorkView } from './components/MyWorkView';
import { UsersView } from './components/UsersView';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export default function App() {
  // ---- data ----
  const [sites, setSites] = useState<Site[]>(() => loadStoredData('sites', INITIAL_SITES));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadStoredData('inventory', INITIAL_INVENTORY));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadStoredData('assignments', INITIAL_ASSIGNMENTS));
  const [requests, setRequests] = useState<SiteRequest[]>(() => loadStoredData('requests', INITIAL_REQUESTS));
  const [users, setUsers] = useState<UserAccount[]>(() => loadStoredData('users', INITIAL_USERS));

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const loaded = loadStoredData<UserAccount[]>('users', INITIAL_USERS);
    const activeId = getActiveSessionUserId();
    if (!activeId) return null;
    const match = loaded.find(u => u.id === activeId);
    return match && match.status !== 'Suspended' ? match : null;
  });

  const [activeTab, setActiveTab] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // ---- persistence to localStorage ----
  useEffect(() => { saveStoredData('sites', sites); }, [sites]);
  useEffect(() => { saveStoredData('inventory', inventory); }, [inventory]);
  useEffect(() => { saveStoredData('assignments', assignments); }, [assignments]);
  useEffect(() => { saveStoredData('requests', requests); }, [requests]);
  useEffect(() => { saveStoredData('users', users); }, [users]);

  // ---- Google Sheet sync ----
  const [bridgeConfig] = useState<BridgeConfig | null>(() => getStoredBridgeConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(() => !getStoredBridgeConfig()?.webAppUrl);
  const hydratingRef = useRef(false);
  const bridgeReadyRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySheetData = (d: AppData) => {
    hydratingRef.current = true;
    setSites(d.sites);
    setInventory(d.inventory);
    setAssignments(d.assignments);
    setRequests(d.requests);
    if (d.users.length) {
      setUsers(d.users);
      setCurrentUser(prev => (prev ? d.users.find(u => u.id === prev.id) || null : null));
    }
    setTimeout(() => { hydratingRef.current = false; }, 0);
  };

  useEffect(() => {
    if (!bridgeConfig?.webAppUrl) { bridgeReadyRef.current = true; return; }
    let cancelled = false;
    setIsSyncing(true);
    bridgePull(bridgeConfig)
      .then(d => { if (!cancelled) applySheetData(d); })
      .catch(err => {
        console.error('Initial sheet pull failed:', err);
        showToast('Could not load from Google Sheet — using local copy.');
      })
      .finally(() => {
        if (cancelled) return;
        setIsSyncing(false);
        setInitialSyncDone(true);
        bridgeReadyRef.current = true;
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bridgeConfig?.webAppUrl || bridgeConfig.autoSyncEnabled === false) return;
    if (!bridgeReadyRef.current || hydratingRef.current) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await bridgePush(bridgeConfig, { sites, inventory, assignments, requests, users });
      } catch (err) {
        console.error('Auto-sync failed:', err);
        showToast('Auto-sync to Google Sheet failed — will retry on next change.');
      } finally {
        setIsSyncing(false);
      }
    }, 1500);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, inventory, assignments, requests, users]);

  const manualPull = async () => {
    if (!bridgeConfig?.webAppUrl) return;
    setIsSyncing(true);
    try {
      applySheetData(await bridgePull(bridgeConfig));
      showToast('Loaded latest data from Google Sheet.');
    } catch (err: any) {
      showToast(err?.message || 'Pull failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ---- auth ----
  const handleLogin = (u: UserAccount) => {
    setActiveSessionUserId(u.id);
    const stamped = { ...u, lastLogin: new Date().toISOString() };
    setCurrentUser(stamped);
    setUsers(prev => prev.map(x => (x.id === u.id ? stamped : x)));
    setActiveTab(defaultTabFor(u.role));
    showToast(`Signed in as ${u.name} (${u.role})`);
  };

  const handleLogout = () => {
    setActiveSessionUserId(null);
    setCurrentUser(null);
    setActiveTab('');
  };

  // ---- site handlers ----
  const saveSite = (draft: Site) => {
    const exists = sites.some(s => s.id === draft.id);
    if (exists) {
      setSites(sites.map(s => (s.id === draft.id ? draft : s)));
      showToast(`Updated site: ${draft.name}`);
    } else {
      setSites([...sites, draft]);
      showToast(`Added site: ${draft.name}`);
    }
  };
  const deleteSite = (id: string) => {
    if (!window.confirm('Delete this site? Related assignments and requests will remain but point to a missing site.')) return;
    setSites(sites.filter(s => s.id !== id));
    showToast('Site deleted.');
  };

  // ---- inventory handlers ----
  const saveInventoryItem = (draft: InventoryItem) => {
    const exists = inventory.some(i => i.id === draft.id);
    setInventory(exists ? inventory.map(i => (i.id === draft.id ? draft : i)) : [...inventory, draft]);
    showToast(exists ? `Updated item: ${draft.name}` : `Added item: ${draft.name}`);
  };
  const deleteInventoryItem = (id: string) => {
    if (!window.confirm('Delete this inventory item?')) return;
    setInventory(inventory.filter(i => i.id !== id));
    setAssignments(assignments.map(a => ({ ...a, inventoryItemIds: a.inventoryItemIds.filter(x => x !== id) })));
    showToast('Inventory item deleted.');
  };

  // ---- assignment handlers ----
  const denormAssignment = (a: Assignment): Assignment => {
    const site = sites.find(s => s.id === a.siteId);
    const collector = users.find(u => u.id === a.collectorId);
    return {
      ...a,
      siteName: site?.name || a.siteName || '(missing site)',
      collectorName: collector?.name || a.collectorName || '(missing collector)',
      assignedById: currentUser?.id || a.assignedById,
      assignedByName: currentUser?.name || a.assignedByName,
    };
  };

  const saveAssignment = (draft: Assignment) => {
    const full = denormAssignment(draft);
    const exists = assignments.some(a => a.id === full.id);
    setAssignments(exists ? assignments.map(a => (a.id === full.id ? full : a)) : [...assignments, full]);
    setSites(sites.map(s => (s.id === full.siteId ? { ...s, status: 'Assigned' } : s)));
    showToast(exists ? 'Assignment updated.' : `Assigned ${full.collectorName} to ${full.siteName}.`);
  };

  const deleteAssignment = (id: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    const removed = assignments.find(a => a.id === id);
    const rest = assignments.filter(a => a.id !== id);
    setAssignments(rest);
    if (removed && !rest.some(a => a.siteId === removed.siteId)) {
      setSites(sites.map(s => (s.id === removed.siteId ? { ...s, status: 'Available' } : s)));
    }
    showToast('Assignment deleted.');
  };

  const logHours = (assignmentId: string, session: CollectionSession) => {
    setAssignments(assignments.map(a => {
      if (a.id !== assignmentId) return a;
      const sessions = [...a.sessions, session];
      return { ...a, sessions, hoursLogged: sessions.reduce((s, x) => s + (Number(x.hours) || 0), 0) };
    }));
    showToast(`Logged ${session.hours}h for this site.`);
  };

  const setAssignmentStatus = (assignmentId: string, status: Assignment['status']) => {
    setAssignments(assignments.map(a => (a.id === assignmentId ? { ...a, status } : a)));
    showToast(`Assignment marked ${status}.`);
  };

  // ---- request handlers ----
  const createRequest = (siteId: string) => {
    if (!currentUser) return;
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    if (requests.some(r => r.siteId === siteId && r.collectorId === currentUser.id && r.status === 'Pending')) {
      showToast('You already have a pending request for this site.');
      return;
    }
    const req: SiteRequest = {
      id: uid('req'),
      siteId,
      siteName: site.name,
      collectorId: currentUser.id,
      collectorName: currentUser.name,
      status: 'Pending',
      requestedAt: new Date().toISOString(),
    };
    setRequests([...requests, req]);
    showToast(`Requested "${site.name}".`);
  };

  const decideRequest = (requestId: string, approve: boolean) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    setRequests(requests.map(r => (r.id === requestId
      ? { ...r, status: approve ? 'Approved' : 'Rejected', decidedAt: new Date().toISOString() }
      : r)));
    if (approve) {
      const already = assignments.some(a => a.siteId === req.siteId && a.collectorId === req.collectorId);
      if (!already) {
        saveAssignment({
          id: uid('asg'),
          siteId: req.siteId,
          siteName: req.siteName,
          collectorId: req.collectorId,
          collectorName: req.collectorName,
          inventoryItemIds: [],
          assignedById: currentUser?.id || '',
          assignedByName: currentUser?.name || '',
          status: 'Active',
          hoursLogged: 0,
          sessions: [],
          createdAt: todayStr(),
        });
      } else {
        setSites(sites.map(s => (s.id === req.siteId ? { ...s, status: 'Assigned' } : s)));
      }
    }
    showToast(approve ? 'Request approved — assignment created.' : 'Request rejected.');
  };

  // ---- user handlers ----
  const saveUser = (draft: UserAccount) => {
    const exists = users.some(u => u.id === draft.id);
    setUsers(exists ? users.map(u => (u.id === draft.id ? draft : u)) : [...users, draft]);
    if (currentUser?.id === draft.id) setCurrentUser(draft);
    showToast(exists ? `Updated ${draft.name}.` : `Created login "${draft.loginId}".`);
  };
  const deleteUser = (id: string) => {
    if (id === currentUser?.id) { showToast("You can't delete your own account."); return; }
    if (!window.confirm('Delete this login?')) return;
    setUsers(users.filter(u => u.id !== id));
    showToast('Login deleted.');
  };

  // ---- scoped data ----
  const mySites = useMemo(
    () => (currentUser ? sites.filter(s => s.foundById === currentUser.id) : []),
    [sites, currentUser]
  );
  const myAssignments = useMemo(
    () => (currentUser ? assignments.filter(a => a.collectorId === currentUser.id) : []),
    [assignments, currentUser]
  );
  const myRequests = useMemo(
    () => (currentUser ? requests.filter(r => r.collectorId === currentUser.id) : []),
    [requests, currentUser]
  );
  const availableSites = useMemo(() => sites.filter(s => s.status === 'Available'), [sites]);
  const dataCollectors = useMemo(() => users.filter(u => u.role === 'Data Collector' && u.status === 'Active'), [users]);
  const pendingRequestCount = requests.filter(r => r.status === 'Pending').length;

  // ---- render gates ----
  const toastEl = toast && (
    <div className="fixed bottom-5 right-5 z-[60] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <span>{toast}</span>
    </div>
  );

  if (!currentUser && !initialSyncDone) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading data from Google Sheet…</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
        <LoginScreen users={users} onLoginSuccess={handleLogin} />
        {toastEl}
      </div>
    );
  }

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        onManualPull={manualPull}
        pendingRequestCount={pendingRequestCount}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {role === 'Admin' && activeTab === 'sites' && (
          <SitesView
            mode="admin"
            sites={sites}
            users={users}
            onSave={saveSite}
            onDelete={deleteSite}
            currentUser={currentUser}
          />
        )}
        {role === 'Admin' && activeTab === 'inventory' && (
          <InventoryView inventory={inventory} onSave={saveInventoryItem} onDelete={deleteInventoryItem} />
        )}
        {role === 'Admin' && activeTab === 'assignments' && (
          <AssignmentsView
            assignments={assignments}
            sites={sites}
            inventory={inventory}
            dataCollectors={dataCollectors}
            onSave={saveAssignment}
            onDelete={deleteAssignment}
          />
        )}
        {role === 'Admin' && activeTab === 'requests' && (
          <RequestsView requests={requests} onDecide={decideRequest} />
        )}
        {role === 'Admin' && activeTab === 'reports' && (
          <ReportsView sites={sites} assignments={assignments} users={users} />
        )}
        {role === 'Admin' && activeTab === 'users' && (
          <UsersView users={users} currentUser={currentUser} onSave={saveUser} onDelete={deleteUser} />
        )}

        {role === 'Site Finder' && (
          <SitesView
            mode="finder"
            sites={mySites}
            users={users}
            onSave={saveSite}
            onDelete={deleteSite}
            currentUser={currentUser}
          />
        )}

        {role === 'Data Collector' && activeTab === 'available' && (
          <AvailableSitesView
            sites={availableSites}
            myRequests={myRequests}
            onRequest={createRequest}
          />
        )}
        {role === 'Data Collector' && activeTab === 'mywork' && (
          <MyWorkView
            assignments={myAssignments}
            sites={sites}
            inventory={inventory}
            onLogHours={logHours}
            onSetStatus={setAssignmentStatus}
          />
        )}
      </main>

      {toastEl}
    </div>
  );
}

function defaultTabFor(role: UserAccount['role']): string {
  if (role === 'Admin') return 'sites';
  if (role === 'Site Finder') return 'mysites';
  return 'available';
}
