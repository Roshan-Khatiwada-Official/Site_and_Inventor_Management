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
  ReturnRecord,
} from './types';
import {
  BridgeConfig,
  AppData,
  getStoredBridgeConfig,
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
import { ReturnsView } from './components/ReturnsView';
import { ProfileModal } from './components/ProfileModal';
import { LoadingOverlay } from './components/LoadingOverlay';

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

  const [activeTab, setActiveTab] = useState<string>(() => loadStoredData('active_tab', ''));
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Remember the open tab across refreshes; keep it valid for the current role.
  useEffect(() => { if (activeTab) saveStoredData('active_tab', activeTab); }, [activeTab]);
  useEffect(() => {
    if (!currentUser) return;
    const valid = roleTabIds(currentUser.role);
    if (!valid.includes(activeTab)) setActiveTab(valid[0]);
  }, [currentUser, activeTab]);

  // ---- persistence to localStorage ----
  useEffect(() => { saveStoredData('sites', sites); }, [sites]);
  useEffect(() => { saveStoredData('inventory', inventory); }, [inventory]);
  useEffect(() => { saveStoredData('assignments', assignments); }, [assignments]);
  useEffect(() => { saveStoredData('requests', requests); }, [requests]);
  useEffect(() => { saveStoredData('users', users); }, [users]);

  // ---- Google Sheet sync ----
  const [bridgeConfig] = useState<BridgeConfig | null>(() => getStoredBridgeConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [blockingLoad, setBlockingLoad] = useState<string | null>(null); // label while a big blocking load runs
  const [initialSyncDone, setInitialSyncDone] = useState(() => !getStoredBridgeConfig()?.webAppUrl);
  const hydratingRef = useRef(false);
  const bridgeReadyRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushPendingRef = useRef(false);
  const busyRef = useRef(false);            // a pull/push request is in flight
  const snapshotRef = useRef('');           // JSON of the last data known to match the sheet

  const POLL_MS = 12000;

  const snapshotOf = (d: { sites: any; inventory: any; assignments: any; requests: any; users: any }) =>
    JSON.stringify([d.sites, d.inventory, d.assignments, d.requests, d.users]);

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
    snapshotRef.current = snapshotOf(d);
    setTimeout(() => { hydratingRef.current = false; }, 0);
  };

  // Initial load
  useEffect(() => {
    if (!bridgeConfig?.webAppUrl) { bridgeReadyRef.current = true; return; }
    let cancelled = false;
    setIsSyncing(true);
    setBlockingLoad('Loading your data…');
    busyRef.current = true;
    bridgePull(bridgeConfig)
      .then(d => { if (!cancelled) applySheetData(d); })
      .catch(err => {
        console.error('Initial sheet pull failed:', err);
        showToast('Could not load from Google Sheet — using local copy.');
      })
      .finally(() => {
        if (cancelled) return;
        busyRef.current = false;
        setIsSyncing(false);
        setBlockingLoad(null);
        setInitialSyncDone(true);
        bridgeReadyRef.current = true;
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push on local change
  useEffect(() => {
    if (!bridgeConfig?.webAppUrl || bridgeConfig.autoSyncEnabled === false) return;
    if (!bridgeReadyRef.current || hydratingRef.current) return;

    const current = snapshotOf({ sites, inventory, assignments, requests, users });
    if (current === snapshotRef.current) return; // nothing actually changed

    pushPendingRef.current = true;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        busyRef.current = true;
        await bridgePush(bridgeConfig, { sites, inventory, assignments, requests, users });
        snapshotRef.current = current;
      } catch (err) {
        console.error('Auto-sync failed:', err);
        showToast('Auto-sync to Google Sheet failed — will retry on next change.');
      } finally {
        busyRef.current = false;
        pushPendingRef.current = false;
        setIsSyncing(false);
      }
    }, 1200);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, inventory, assignments, requests, users]);

  // Near-real-time: poll the sheet so changes from other people show up here.
  useEffect(() => {
    if (!bridgeConfig?.webAppUrl) return;

    const poll = async () => {
      if (document.hidden) return;
      if (pushPendingRef.current || busyRef.current || hydratingRef.current) return;
      try {
        busyRef.current = true;
        const d = await bridgePull(bridgeConfig);
        if (pushPendingRef.current) return; // a local edit landed while fetching
        const incoming = snapshotOf(d);
        if (incoming !== snapshotRef.current) {
          applySheetData(d);
        }
      } catch {
        /* transient — try again next tick */
      } finally {
        busyRef.current = false;
      }
    };

    const timer = window.setInterval(poll, POLL_MS);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeConfig]);

  const manualPull = async () => {
    if (!bridgeConfig?.webAppUrl) return;
    setIsSyncing(true);
    setBlockingLoad('Refreshing from Google Sheet…');
    busyRef.current = true;
    try {
      applySheetData(await bridgePull(bridgeConfig));
      showToast('Loaded latest data from Google Sheet.');
    } catch (err: any) {
      showToast(err?.message || 'Pull failed.');
    } finally {
      busyRef.current = false;
      setIsSyncing(false);
      setBlockingLoad(null);
    }
  };

  // ---- auth ----
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogin = (u: UserAccount) => {
    setActiveSessionUserId(u.id);
    const stamped = { ...u, lastLogin: new Date().toISOString() };
    setCurrentUser(stamped);
    setUsers(prev => prev.map(x => (x.id === u.id ? stamped : x)));
    const valid = roleTabIds(u.role);
    if (!valid.includes(activeTab)) setActiveTab(valid[0]);
    showToast(`Signed in as ${u.name} (${u.role})`);
  };

  const handleLogout = () => {
    setActiveSessionUserId(null);
    setCurrentUser(null);
    setIsProfileOpen(false);
  };

  // ---- site handlers ----
  const saveSite = (draft: Site) => {
    setSites(prev => (prev.some(s => s.id === draft.id) ? prev.map(s => (s.id === draft.id ? draft : s)) : [...prev, draft]));
    showToast(`Saved site: ${draft.name}`);
  };
  const deleteSite = (id: string) => {
    if (!window.confirm('Delete this site? Related assignments and requests will remain but point to a missing site.')) return;
    setSites(prev => prev.filter(s => s.id !== id));
    showToast('Site deleted.');
  };

  // ---- inventory handlers ----
  const saveInventoryItem = (draft: InventoryItem) => {
    setInventory(prev => (prev.some(i => i.id === draft.id) ? prev.map(i => (i.id === draft.id ? draft : i)) : [...prev, draft]));
    showToast(`Saved item: ${draft.name}`);
  };
  const deleteInventoryItem = (id: string) => {
    if (assignments.some(a => a.inventoryItemIds.includes(id))) {
      showToast('That item is still out — check it in first (Returns tab).');
      return;
    }
    if (!window.confirm('Delete this inventory item?')) return;
    setInventory(prev => prev.filter(i => i.id !== id));
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
    setAssignments(prev => (prev.some(a => a.id === full.id) ? prev.map(a => (a.id === full.id ? full : a)) : [...prev, full]));
    setSites(prev => prev.map(s => (s.id === full.siteId ? { ...s, status: 'Assigned' } : s)));
    showToast(`Assigned ${full.collectorName} to ${full.siteName}.`);
  };

  const deleteAssignment = (id: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    setAssignments(prev => {
      const removed = prev.find(a => a.id === id);
      const rest = prev.filter(a => a.id !== id);
      if (removed && !rest.some(a => a.siteId === removed.siteId)) {
        setSites(ps => ps.map(s => (s.id === removed.siteId ? { ...s, status: 'Available' } : s)));
      }
      return rest;
    });
    showToast('Assignment deleted.');
  };

  // Data collector: enter hours and finish the site in one action.
  const finishAssignment = (assignmentId: string, session: CollectionSession | null) => {
    setAssignments(prev => prev.map(a => {
      if (a.id !== assignmentId) return a;
      const sessions = session ? [...a.sessions, session] : a.sessions;
      return {
        ...a,
        sessions,
        hoursLogged: sessions.reduce((s, x) => s + (Number(x.hours) || 0), 0),
        status: 'Completed',
      };
    }));
    showToast(session ? `Submitted ${session.hours}h — site marked done.` : 'Site marked done.');
  };

  const reopenAssignment = (assignmentId: string) => {
    setAssignments(prev => prev.map(a => (a.id === assignmentId ? { ...a, status: 'Active' } : a)));
    showToast('Assignment re-opened.');
  };

  // Return one inventory item from an assignment, with a condition check.
  const returnInventoryItem = (assignmentId: string, itemId: string, ok: boolean, note: string) => {
    const item = inventory.find(i => i.id === itemId);
    const record: ReturnRecord = {
      itemId,
      itemName: item?.name || itemId,
      date: todayStr(),
      ok,
      note: ok ? '' : note.trim(),
      byName: currentUser?.name || 'Admin',
    };
    setAssignments(prev => prev.map(a => (
      a.id === assignmentId
        ? { ...a, inventoryItemIds: a.inventoryItemIds.filter(x => x !== itemId), returnedItems: [...a.returnedItems, record] }
        : a
    )));
    setInventory(prev => prev.map(i => (
      i.id === itemId ? { ...i, condition: ok ? 'OK' : 'Flagged', conditionNote: ok ? '' : note.trim() } : i
    )));
    showToast(ok ? `Checked in "${record.itemName}".` : `Checked in "${record.itemName}" — flagged.`);
  };

  const clearItemFlag = (itemId: string) => {
    setInventory(prev => prev.map(i => (i.id === itemId ? { ...i, condition: 'OK', conditionNote: '' } : i)));
    showToast('Flag cleared.');
  };

  // ---- request handlers ----
  const collectorHasOpenWork = (collectorId: string) =>
    requests.some(r => r.collectorId === collectorId && r.status === 'Pending') ||
    assignments.some(a => a.collectorId === collectorId && a.status === 'Active');

  const createRequest = (siteId: string) => {
    if (!currentUser) return;
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    if (collectorHasOpenWork(currentUser.id)) {
      showToast('Finish your current site first — one request/site at a time.');
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
    setRequests(prev => [...prev, req]);
    showToast(`Requested "${site.name}".`);
  };

  const decideRequest = (requestId: string, approve: boolean, itemIds: string[] = []) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    setRequests(prev => prev.map(r => (r.id === requestId
      ? { ...r, status: approve ? 'Approved' : 'Rejected', decidedAt: new Date().toISOString() }
      : r)));
    if (approve) {
      const already = assignments.some(a => a.siteId === req.siteId && a.collectorId === req.collectorId && a.status === 'Active');
      if (!already) {
        saveAssignment({
          id: uid('asg'),
          siteId: req.siteId,
          siteName: req.siteName,
          collectorId: req.collectorId,
          collectorName: req.collectorName,
          inventoryItemIds: itemIds,
          assignedById: currentUser?.id || '',
          assignedByName: currentUser?.name || '',
          status: 'Active',
          hoursLogged: 0,
          sessions: [],
          returnedItems: [],
          createdAt: todayStr(),
        });
      } else {
        setSites(prev => prev.map(s => (s.id === req.siteId ? { ...s, status: 'Assigned' } : s)));
      }
    }
    showToast(approve ? 'Request approved — assignment created.' : 'Request rejected.');
  };

  // ---- user handlers ----
  const saveUser = (draft: UserAccount) => {
    setUsers(prev => (prev.some(u => u.id === draft.id) ? prev.map(u => (u.id === draft.id ? draft : u)) : [...prev, draft]));
    if (currentUser?.id === draft.id) setCurrentUser(draft);
    showToast(`Saved ${draft.name}.`);
  };
  const deleteUser = (id: string) => {
    if (id === currentUser?.id) { showToast("You can't delete your own account."); return; }
    if (!window.confirm('Delete this login?')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
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

  // Which inventory items are still out (in any assignment's item list, whatever its
  // status) — an item is only "available" again once the admin checks it in.
  const itemsOut = useMemo(() => {
    const m = new Map<string, { collectorName: string; siteName: string; assignmentId: string }>();
    assignments.forEach(a => {
      a.inventoryItemIds.forEach(id =>
        m.set(id, { collectorName: a.collectorName, siteName: a.siteName, assignmentId: a.id })
      );
    });
    return m;
  }, [assignments]);

  const outCount = itemsOut.size;
  const myOpenWork = currentUser ? collectorHasOpenWork(currentUser.id) : false;

  // ---- render gates ----
  const toastEl = toast && (
    <div className="fixed bottom-5 right-5 z-[60] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <span>{toast}</span>
    </div>
  );

  if (!currentUser && !initialSyncDone) {
    return <LoadingOverlay show label="Loading data from Google Sheet…" />;
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
        onOpenProfile={() => setIsProfileOpen(true)}
        isSyncing={isSyncing}
        onManualPull={manualPull}
        pendingRequestCount={pendingRequestCount}
        outCount={outCount}
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
          <InventoryView
            inventory={inventory}
            itemsOut={itemsOut}
            onSave={saveInventoryItem}
            onDelete={deleteInventoryItem}
            onClearFlag={clearItemFlag}
          />
        )}
        {role === 'Admin' && activeTab === 'returns' && (
          <ReturnsView assignments={assignments} inventory={inventory} onReturn={returnInventoryItem} />
        )}
        {role === 'Admin' && activeTab === 'assignments' && (
          <AssignmentsView
            assignments={assignments}
            sites={sites}
            inventory={inventory}
            itemsOut={itemsOut}
            dataCollectors={dataCollectors}
            onSave={saveAssignment}
            onDelete={deleteAssignment}
          />
        )}
        {role === 'Admin' && activeTab === 'requests' && (
          <RequestsView requests={requests} inventory={inventory} itemsOut={itemsOut} onDecide={decideRequest} />
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
            assignments={assignments}
            hasOpenWork={myOpenWork}
            onRequest={createRequest}
          />
        )}
        {role === 'Data Collector' && activeTab === 'mywork' && (
          <MyWorkView
            assignments={myAssignments}
            sites={sites}
            inventory={inventory}
            onFinish={finishAssignment}
            onReopen={reopenAssignment}
          />
        )}
      </main>

      {isProfileOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsProfileOpen(false)}
          onSave={(u: UserAccount) => { saveUser(u); setIsProfileOpen(false); }}
        />
      )}

      <LoadingOverlay show={blockingLoad !== null} label={blockingLoad || undefined} />
      {toastEl}
    </div>
  );
}

function roleTabIds(role: UserAccount['role']): string[] {
  if (role === 'Admin') return ['sites', 'inventory', 'returns', 'assignments', 'requests', 'reports', 'users'];
  if (role === 'Site Finder') return ['mysites'];
  return ['available', 'mywork'];
}
