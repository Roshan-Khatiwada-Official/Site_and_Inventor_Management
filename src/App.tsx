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
  CAN_FIND_SITES,
  CAN_COLLECT,
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

const nowIso = () => new Date().toISOString();

/** Union two lists by id; the local copy wins on conflict. Keeps concurrent
 *  additions from other people instead of overwriting them. */
function mergeById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const map = new Map<string, T>();
  remote.forEach(x => map.set(x.id, x));
  local.forEach(x => map.set(x.id, x));
  return [...map.values()];
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
  const pushSeqRef = useRef(0);             // token so a finished push doesn't clear a newer pending one
  const busyRef = useRef(false);            // a pull/push request is in flight
  const snapshotRef = useRef('');           // JSON of the last data known to match the sheet

  const POLL_MS = 6000;

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

  // Debounced push on local change. Before writing we pull the sheet and merge,
  // so two people editing at the same time don't overwrite each other's rows.
  useEffect(() => {
    if (!bridgeConfig?.webAppUrl || bridgeConfig.autoSyncEnabled === false) return;
    if (!bridgeReadyRef.current || hydratingRef.current) return;

    const current = snapshotOf({ sites, inventory, assignments, requests, users });
    if (current === snapshotRef.current) return; // nothing actually changed

    pushPendingRef.current = true;
    const mySeq = ++pushSeqRef.current;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        setBlockingLoad('Saving…');
        busyRef.current = true;

        let remote: AppData | null = null;
        try { remote = await bridgePull(bridgeConfig); } catch { /* offline — push local as-is */ }

        const merged: AppData = remote
          ? {
              sites: mergeById(remote.sites, sites),
              inventory: mergeById(remote.inventory, inventory),
              assignments: mergeById(remote.assignments, assignments),
              requests: mergeById(remote.requests, requests),
              users: mergeById(remote.users, users),
            }
          : { sites, inventory, assignments, requests, users };

        await bridgePush(bridgeConfig, merged);
        snapshotRef.current = snapshotOf(merged);

        // adopt the merged result so other people's concurrent additions appear here
        if (mySeq === pushSeqRef.current) {
          hydratingRef.current = true;
          setSites(merged.sites);
          setInventory(merged.inventory);
          setAssignments(merged.assignments);
          setRequests(merged.requests);
          setUsers(merged.users);
          setCurrentUser(prev => (prev ? merged.users.find(u => u.id === prev.id) || prev : prev));
          setTimeout(() => { hydratingRef.current = false; }, 0);
        }
      } catch (err) {
        console.error('Auto-sync failed:', err);
        showToast('Auto-sync to Google Sheet failed — will retry on next change.');
      } finally {
        busyRef.current = false;
        if (mySeq === pushSeqRef.current) pushPendingRef.current = false;
        setIsSyncing(false);
        setBlockingLoad(null);
      }
    }, 900);
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
        if (incoming === snapshotRef.current) return;
        // Merge (local wins by id) so an in-flight local edit is never dropped.
        setBlockingLoad('Updating…');
        hydratingRef.current = true;
        setSites(prev => mergeById(d.sites, prev));
        setInventory(prev => mergeById(d.inventory, prev));
        setAssignments(prev => mergeById(d.assignments, prev));
        setRequests(prev => mergeById(d.requests, prev));
        setUsers(prev => (d.users.length ? mergeById(d.users, prev) : prev));
        setCurrentUser(prev => (prev ? d.users.find(u => u.id === prev.id) || prev : prev));
        snapshotRef.current = incoming;
        setTimeout(() => { hydratingRef.current = false; setBlockingLoad(null); }, 350);
      } catch {
        /* transient — try again next tick */
      } finally {
        busyRef.current = false;
      }
    };

    const timer = window.setInterval(poll, POLL_MS);
    const onVisible = () => { if (!document.hidden) poll(); };
    // Refresh the moment the user comes back to / touches the screen.
    let lastNudge = 0;
    const nudge = () => {
      const t = Date.now();
      if (t - lastNudge > 4000) { lastNudge = t; poll(); }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pointerdown', nudge);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pointerdown', nudge);
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
    const s: Site = { ...draft, updatedAt: nowIso() };

    // "I will collect this myself" was just ticked on an open site -> put it
    // straight into that person's My Work instead of making them request it.
    const selfAssigning =
      s.reservedById &&
      s.status === 'Available' &&
      !assignments.some(a => a.siteId === s.id && a.collectorId === s.reservedById && a.status === 'Active');

    if (selfAssigning) {
      s.status = 'Assigned';
      const newAsg: Assignment = {
        id: uid('asg'),
        siteId: s.id,
        siteName: s.name,
        collectorId: s.reservedById,
        collectorName: s.reservedByName,
        assignedById: s.reservedById,
        assignedByName: s.reservedByName,
        status: 'Active',
        hoursLogged: 0,
        sessions: [],
        createdAt: todayStr(),
        updatedAt: nowIso(),
      };
      setAssignments(prev => [...prev, newAsg]);
    }

    setSites(prev => (prev.some(x => x.id === s.id) ? prev.map(x => (x.id === s.id ? s : x)) : [...prev, s]));
    showToast(selfAssigning ? `Added "${s.name}" to your My Work.` : `Saved site: ${s.name}`);
  };
  const deleteSite = (id: string) => {
    if (assignments.some(a => a.siteId === id)) {
      showToast('This site has assignments — it can’t be deleted.');
      return;
    }
    if (requests.some(r => r.siteId === id && r.status === 'Pending')) {
      showToast('This site has a pending request — decide on it first.');
      return;
    }
    if (!window.confirm('Delete this site?')) return;
    setSites(prev => prev.filter(s => s.id !== id));
    showToast('Site deleted.');
  };

  // ---- inventory handlers ----
  const saveInventoryItem = (draft: InventoryItem) => {
    const it: InventoryItem = { ...draft, updatedAt: nowIso() };
    setInventory(prev => (prev.some(i => i.id === it.id) ? prev.map(i => (i.id === it.id ? it : i)) : [...prev, it]));
    showToast(`Saved item: ${it.name}`);
  };
  const addInventoryBatch = (items: InventoryItem[]) => {
    const stamped = items.map(i => ({ ...i, updatedAt: nowIso() }));
    setInventory(prev => [...prev, ...stamped]);
    showToast(`Added ${items.length} item${items.length === 1 ? '' : 's'}.`);
  };

  const deleteInventoryItem = (id: string) => {
    if (inventory.find(i => i.id === id)?.heldById) {
      showToast('That item is held by a collector — check it in first (Returns tab).');
      return;
    }
    if (!window.confirm('Delete this inventory item?')) return;
    setInventory(prev => prev.filter(i => i.id !== id));
    showToast('Inventory item deleted.');
  };

  // Set exactly which items a data collector holds. Items they hold now but that
  // are not in `itemIds` go back to stock; newly listed available items go to them.
  const setCollectorKit = (collectorId: string, itemIds: string[]) => {
    const collector = users.find(u => u.id === collectorId);
    setInventory(prev => prev.map(i => {
      const shouldHold = itemIds.includes(i.id);
      if (shouldHold && i.heldById !== collectorId && !i.heldById) {
        return { ...i, heldById: collectorId, heldByName: collector?.name || '', updatedAt: nowIso() };
      }
      if (!shouldHold && i.heldById === collectorId) {
        return { ...i, heldById: '', heldByName: '', updatedAt: nowIso() };
      }
      return i;
    }));
    showToast(`Updated ${collector?.name || 'collector'}'s equipment.`);
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
    const full = { ...denormAssignment(draft), updatedAt: nowIso() };
    setAssignments(prev => (prev.some(a => a.id === full.id) ? prev.map(a => (a.id === full.id ? full : a)) : [...prev, full]));
    setSites(prev => prev.map(s => (s.id === full.siteId ? { ...s, status: 'Assigned', updatedAt: nowIso() } : s)));
    showToast(`Assigned ${full.collectorName} to ${full.siteName}.`);
  };

  const deleteAssignment = (id: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    const removed = assignments.find(a => a.id === id);
    setAssignments(prev => prev.filter(a => a.id !== id));
    if (removed) {
      const siteStillUsed = assignments.some(a => a.id !== id && a.siteId === removed.siteId);
      if (!siteStillUsed) {
        setSites(prev => prev.map(s => (s.id === removed.siteId ? { ...s, status: 'Available', updatedAt: nowIso() } : s)));
      }
    }
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
        updatedAt: nowIso(),
      };
    }));
    showToast(session ? `Submitted ${session.hours}h — site marked done.` : 'Site marked done.');
  };

  const reopenAssignment = (assignmentId: string) => {
    setAssignments(prev => prev.map(a => (a.id === assignmentId ? { ...a, status: 'Active', updatedAt: nowIso() } : a)));
    showToast('Assignment re-opened.');
  };

  // Check an item back in from whoever holds it, with a condition check.
  const returnInventoryItem = (itemId: string, ok: boolean, note: string) => {
    setInventory(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const record: ReturnRecord = {
        date: todayStr(),
        ok,
        note: ok ? '' : note.trim(),
        byName: currentUser?.name || 'Admin',
        fromCollectorName: i.heldByName || '',
      };
      return {
        ...i,
        heldById: '',
        heldByName: '',
        condition: ok ? 'OK' : 'Flagged',
        conditionNote: ok ? '' : note.trim(),
        returnLog: [record, ...i.returnLog].slice(0, 50),
        updatedAt: nowIso(),
      };
    }));
    const nm = inventory.find(i => i.id === itemId)?.name || 'item';
    showToast(ok ? `Checked in "${nm}".` : `Checked in "${nm}" — flagged.`);
  };

  const clearItemFlag = (itemId: string) => {
    setInventory(prev => prev.map(i => (i.id === itemId ? { ...i, condition: 'OK', conditionNote: '', updatedAt: nowIso() } : i)));
    showToast('Flag cleared.');
  };

  // ---- request handlers ----
  // Collectors may hold several sites at once — just no duplicate pending
  // request for the same site.
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
      requestedAt: nowIso(),
      updatedAt: nowIso(),
    };
    setRequests(prev => [...prev, req]);
    showToast(`Requested "${site.name}".`);
  };

  // A collector can withdraw their own pending request.
  const cancelRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req || req.status !== 'Pending' || req.collectorId !== currentUser?.id) return;
    setRequests(prev => prev.filter(r => r.id !== requestId));
    showToast('Request cancelled.');
  };

  const decideRequest = (requestId: string, approve: boolean) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    setRequests(prev => prev.map(r => (r.id === requestId
      ? { ...r, status: approve ? 'Approved' : 'Rejected', decidedAt: nowIso(), updatedAt: nowIso() }
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
          assignedById: currentUser?.id || '',
          assignedByName: currentUser?.name || '',
          status: 'Active',
          hoursLogged: 0,
          sessions: [],
          createdAt: todayStr(),
          updatedAt: nowIso(),
        });
      } else {
        setSites(prev => prev.map(s => (s.id === req.siteId ? { ...s, status: 'Assigned', updatedAt: nowIso() } : s)));
      }
    }
    showToast(approve ? 'Request approved — assignment created.' : 'Request rejected.');
  };

  // ---- user handlers ----
  const saveUser = (draft: UserAccount) => {
    const u: UserAccount = { ...draft, updatedAt: nowIso() };
    setUsers(prev => (prev.some(x => x.id === u.id) ? prev.map(x => (x.id === u.id ? u : x)) : [...prev, u]));
    if (currentUser?.id === u.id) setCurrentUser(u);
    showToast(`Saved ${u.name}.`);
  };
  const deleteUser = (id: string) => {
    if (id === currentUser?.id) { showToast("You can't delete your own account."); return; }
    if (inventory.some(i => i.heldById === id)) {
      showToast('Check in this collector’s equipment first (Returns tab).');
      return;
    }
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
  // Sites this person may collect at: open pool + any reserved for them.
  const availableSites = useMemo(
    () => sites.filter(s => s.status === 'Available' && (!s.reservedById || s.reservedById === currentUser?.id)),
    [sites, currentUser]
  );
  const dataCollectors = useMemo(
    () => users.filter(u => CAN_COLLECT.includes(u.role) && u.status === 'Active'),
    [users]
  );
  const pendingRequestCount = requests.filter(r => r.status === 'Pending').length;
  const canFind = currentUser ? CAN_FIND_SITES.includes(currentUser.role) : false;
  const canCollect = currentUser ? CAN_COLLECT.includes(currentUser.role) : false;

  // Items currently held by a collector (fixed kit, kept across all their sites).
  const itemsOutCount = useMemo(() => inventory.filter(i => i.heldById).length, [inventory]);
  const myKit = useMemo(
    () => (currentUser ? inventory.filter(i => i.heldById === currentUser.id) : []),
    [inventory, currentUser]
  );
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
        outCount={itemsOutCount}
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
            dataCollectors={dataCollectors}
            onSave={saveInventoryItem}
            onAddBatch={addInventoryBatch}
            onDelete={deleteInventoryItem}
            onClearFlag={clearItemFlag}
          />
        )}
        {role === 'Admin' && activeTab === 'returns' && (
          <ReturnsView inventory={inventory} onReturn={returnInventoryItem} />
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
          <UsersView
            users={users}
            currentUser={currentUser}
            inventory={inventory}
            onSave={saveUser}
            onDelete={deleteUser}
            onSetKit={setCollectorKit}
          />
        )}

        {canFind && activeTab === 'mysites' && (
          <SitesView
            mode="finder"
            sites={mySites}
            users={users}
            onSave={saveSite}
            onDelete={deleteSite}
            currentUser={currentUser}
            canReserve={canCollect}
          />
        )}

        {canCollect && activeTab === 'available' && (
          <AvailableSitesView
            sites={availableSites}
            myRequests={myRequests}
            assignments={assignments}
            onRequest={createRequest}
            onCancelRequest={cancelRequest}
          />
        )}
        {canCollect && activeTab === 'mywork' && (
          <MyWorkView
            assignments={myAssignments}
            sites={sites}
            myKit={myKit}
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
  if (role === 'Field Worker') return ['mysites', 'available', 'mywork'];
  return ['available', 'mywork'];
}
