import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Package, Search, AlertTriangle, ListPlus, UserPlus } from 'lucide-react';
import { InventoryItem, UserAccount } from '../types';
import { todayStr, byNewest } from '../utils/storage';
import { heldQuantity, availableQuantity } from '../utils/inventory';

interface InventoryViewProps {
  inventory: InventoryItem[];
  dataCollectors: UserAccount[];
  onSave: (item: InventoryItem) => void;
  onAddBatch: (items: InventoryItem[]) => void;
  onDelete: (id: string) => void;
  onClearFlag: (id: string) => void;
  onAssign: (itemId: string, collectorId: string, quantity: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory, dataCollectors, onSave, onAddBatch, onDelete, onClearFlag, onAssign }) => {
  const [open, setOpen] = useState(false);
  const [seqOpen, setSeqOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [assigning, setAssigning] = useState<InventoryItem | null>(null);
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'In stock' | 'Assigned'>('');
  const [workerFilter, setWorkerFilter] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(inventory.map(i => i.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [inventory]
  );

  const filtered = inventory.filter(i => {
    const t = q.toLowerCase();
    const matchesQ = i.name.toLowerCase().includes(t) || i.itemId.toLowerCase().includes(t) || i.category.toLowerCase().includes(t);
    const matchesCategory = !categoryFilter || i.category === categoryFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'Assigned' ? heldQuantity(i) > 0 : availableQuantity(i) > 0);
    const matchesWorker = !workerFilter || i.holders.some(h => h.collectorId === workerFilter);
    return matchesQ && matchesCategory && matchesStatus && matchesWorker;
  }).sort(byNewest);

  const workerCounts = useMemo(() => {
    const map = new Map<string, number>();
    inventory.forEach(i => i.holders.forEach(h => map.set(h.collectorId, (map.get(h.collectorId) || 0) + h.quantity)));
    return map;
  }, [inventory]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inventory</h2>
          <p className="text-xs text-slate-500">Items the admin assigns to data collectors. One item's stock can be split across several people at once.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSeqOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm">
            <ListPlus className="w-4 h-4" /> Add Sequential Items
          </button>
          <button onClick={() => { setEditing(null); setOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search inventory…"
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option>
          <option value="In stock">In stock</option>
          <option value="Assigned">Assigned</option>
        </select>
        <select value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All field workers</option>
          {dataCollectors.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({workerCounts.get(c.id) || 0})</option>
          ))}
        </select>
        {(categoryFilter || statusFilter || workerFilter) && (
          <button onClick={() => { setCategoryFilter(''); setStatusFilter(''); setWorkerFilter(''); }}
            className="text-xs text-blue-600 hover:underline">Clear filters</button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Item ID</th>
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold">Category</th>
                <th className="px-4 py-2.5 font-semibold">Qty</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No inventory items yet.</td></tr>
              )}
              {filtered.map(i => {
                const held = heldQuantity(i);
                const available = availableQuantity(i);
                return (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{i.itemId}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {i.name}
                      {i.note && <div className="text-[11px] text-slate-400 font-normal truncate max-w-[220px]">{i.note}</div>}
                      {i.condition === 'Flagged' && (
                        <div className="text-[11px] text-rose-600 font-normal flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> {i.conditionNote || 'Reported problem'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{i.category || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{i.quantity || 0}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {available > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {available} in stock
                          </span>
                        )}
                        {held > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            {held} assigned
                          </span>
                        )}
                        {held === 0 && available === 0 && i.condition === 'Flagged' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Flagged</span>
                        )}
                      </div>
                      {i.holders.length > 0 && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          {i.holders.map(h => `${h.collectorName || '—'}: ${h.quantity}`).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {i.condition === 'Flagged' && held === 0 && (
                        <button onClick={() => onClearFlag(i.id)} className="text-emerald-600 hover:underline mr-3">Clear flag</button>
                      )}
                      {available > 0 && dataCollectors.length > 0 && (
                        <button onClick={() => setAssigning(i)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded" title="Assign to a field worker">
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => { setEditing(i); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(i.id)} disabled={held > 0}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded disabled:opacity-30"
                        title={held > 0 ? 'Item is with a collector' : 'Delete'}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <InventoryModal
          item={editing}
          dataCollectors={dataCollectors}
          onClose={() => setOpen(false)}
          onSave={(it) => { onSave(it); setOpen(false); }}
        />
      )}
      {seqOpen && (
        <SequentialModal
          dataCollectors={dataCollectors}
          onClose={() => setSeqOpen(false)}
          onAdd={(items) => { onAddBatch(items); setSeqOpen(false); }}
        />
      )}
      {assigning && (
        <AssignModal
          item={assigning}
          dataCollectors={dataCollectors}
          onClose={() => setAssigning(null)}
          onAssign={(collectorId, qty) => { onAssign(assigning.id, collectorId, qty); setAssigning(null); }}
        />
      )}
    </div>
  );
};

/** Give some (not necessarily all) of an item's remaining stock to one field worker. */
const AssignModal: React.FC<{
  item: InventoryItem;
  dataCollectors: UserAccount[];
  onClose: () => void;
  onAssign: (collectorId: string, quantity: number) => void;
}> = ({ item, dataCollectors, onClose, onAssign }) => {
  const available = availableQuantity(item);
  const [collectorId, setCollectorId] = useState('');
  const [quantity, setQuantity] = useState<number>(Math.min(1, available));
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!collectorId) { setError('Choose a field worker.'); return; }
    if (quantity <= 0) { setError('Quantity must be at least 1.'); return; }
    if (quantity > available) { setError(`Only ${available} left in stock.`); return; }
    onAssign(collectorId, quantity);
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-sm h-full sm:h-auto border border-slate-200 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><UserPlus className="w-4 h-4" /></div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Assign Stock</h3>
              <p className="text-[11px] text-slate-500">{item.name} · {available} available</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Field worker *</label>
            <select required autoFocus value={collectorId} onChange={e => setCollectorId(e.target.value)} className={`${field} bg-white`}>
              <option value="">Choose…</option>
              {dataCollectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Quantity *</label>
            <input type="number" min={1} max={available} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} className={field} />
            <p className="mt-1 text-[10px] text-slate-400">Up to {available} — the rest stays in stock, or can go to someone else.</p>
          </div>

          {error && <p className="text-rose-600 text-[11px] font-medium">{error}</p>}

          <div className="sticky bottom-0 -mx-6 px-6 pt-3 pb-4 bg-white border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">Assign</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryModal: React.FC<{
  item: InventoryItem | null;
  dataCollectors: UserAccount[];
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}> = ({ item, dataCollectors, onClose, onSave }) => {
  const [itemId, setItemId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const held = item ? item.holders.reduce((s, h) => s + h.quantity, 0) : 0;

  useEffect(() => {
    if (item) {
      setItemId(item.itemId); setName(item.name); setCategory(item.category);
      setQuantity(item.quantity); setNote(item.note);
    }
  }, [item]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!itemId.trim()) { setError('Item ID is required.'); return; }
    if (!name.trim()) { setError('Name is required.'); return; }
    const qty = Number(quantity) || 0;
    if (item && qty < held) { setError(`Quantity can't be less than the ${held} already assigned out.`); return; }
    const collector = !item ? dataCollectors.find(c => c.id === assignTo) : null;
    onSave({
      id: item ? item.id : `inv-${Date.now()}`,
      itemId: itemId.trim(),
      name: name.trim(),
      category: category.trim(),
      quantity: qty,
      note: note.trim(),
      condition: item ? item.condition : 'OK',
      conditionNote: item ? item.conditionNote : '',
      holders: item ? item.holders : (collector ? [{ collectorId: collector.id, collectorName: collector.name, quantity: qty }] : []),
      returnLog: item ? item.returnLog : [],
      createdAt: item ? item.createdAt : todayStr(),
      updatedAt: item ? item.updatedAt : todayStr(),
    });
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] border border-slate-200 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><Package className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">{item ? 'Edit Item' : 'Add Inventory Item'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Item ID *</label>
              <input required autoFocus value={itemId} onChange={e => setItemId(e.target.value)} placeholder="e.g. GPS-01" className={`${field} font-mono`} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Quantity</label>
              <input type="number" min={held} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} className={field} />
              {held > 0 && <p className="mt-1 text-[10px] text-slate-400">{held} already assigned out — can't drop below that.</p>}
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. GNSS Receiver" className={field} />
          </div>
          <div>
            <label className="block font-semibold mb-1">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="optional" className={field} />
          </div>
          {!item && (
            <div>
              <label className="block font-semibold mb-1">Assign to (optional)</label>
              <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className={`${field} bg-white`}>
                <option value="">— unassigned, in stock —</option>
                {dataCollectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <p className="mt-1 text-[10px] text-slate-400">Sends the whole quantity to one person now. To split it across several people, add it unassigned and use the Assign button per person instead.</p>
            </div>
          )}
          {item && item.holders.length > 0 && (
            <div>
              <label className="block font-semibold mb-1">Currently assigned</label>
              <p className="text-[11px] text-slate-500">{item.holders.map(h => `${h.collectorName || '—'}: ${h.quantity}`).join(' · ')}</p>
              <p className="mt-1 text-[10px] text-slate-400">Manage who holds how much from the Assign button (Inventory list) or check items in via Returns.</p>
            </div>
          )}
          <div>
            <label className="block font-semibold mb-1">Note</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="optional" className={field} />
          </div>

          {error && <p className="text-rose-600 text-[11px] font-medium">{error}</p>}

          <div className="sticky bottom-0 -mx-6 px-6 pt-3 pb-4 bg-white border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">{item ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** Bulk-create a run of sequentially numbered items, e.g. NP_001 … NP_010. */
const SequentialModal: React.FC<{
  dataCollectors: UserAccount[];
  onClose: () => void;
  onAdd: (items: InventoryItem[]) => void;
}> = ({ dataCollectors, onClose, onAdd }) => {
  const [prefix, setPrefix] = useState('NP_');
  const [start, setStart] = useState('001');
  const [end, setEnd] = useState('010');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantityEach, setQuantityEach] = useState<number>(1);
  const [note, setNote] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const digits = Math.max(start.replace(/\D/g, '').length, end.replace(/\D/g, '').length, 1);
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);
  const count = Number.isFinite(startNum) && Number.isFinite(endNum) ? endNum - startNum + 1 : 0;

  const ids = useMemo(() => {
    if (!Number.isFinite(startNum) || !Number.isFinite(endNum) || startNum > endNum) return [];
    const out: string[] = [];
    for (let n = startNum; n <= endNum && out.length < 500; n++) {
      out.push(`${prefix}${String(n).padStart(digits, '0')}`);
    }
    return out;
  }, [prefix, startNum, endNum, digits]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!ids.length) { setError('Start must be less than or equal to End.'); return; }
    if (count > 500) { setError('That is more than 500 items at once — narrow the range.'); return; }
    const collector = dataCollectors.find(c => c.id === assignTo);
    const now = todayStr();
    const items: InventoryItem[] = ids.map((itemId, idx) => ({
      id: `inv-${Date.now()}-${idx}`,
      itemId,
      name: name.trim(),
      category: category.trim(),
      quantity: Number(quantityEach) || 0,
      note: note.trim(),
      condition: 'OK',
      conditionNote: '',
      holders: collector ? [{ collectorId: collector.id, collectorName: collector.name, quantity: Number(quantityEach) || 0 }] : [],
      returnLog: [],
      createdAt: now,
      updatedAt: now,
    }));
    onAdd(items);
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] border border-slate-200 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center"><ListPlus className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">Add Sequential Items</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          <p className="text-slate-500">Creates one item per number, e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">NP_001 … NP_010</code>.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Prefix</label>
              <input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="NP_" className={`${field} font-mono`} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Start</label>
              <input value={start} onChange={e => setStart(e.target.value)} placeholder="001" className={`${field} font-mono`} />
            </div>
            <div>
              <label className="block font-semibold mb-1">End</label>
              <input value={end} onChange={e => setEnd(e.target.value)} placeholder="010" className={`${field} font-mono`} />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {ids.length > 0
              ? <>Will create <strong className="text-slate-800">{ids.length}</strong> items: <span className="font-mono">{ids[0]}</span> … <span className="font-mono">{ids[ids.length - 1]}</span></>
              : 'Enter a valid Start and End.'}
          </p>

          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Network Probe" className={field} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="optional" className={field} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Quantity (each)</label>
              <input type="number" min="0" value={quantityEach} onChange={e => setQuantityEach(parseInt(e.target.value) || 0)} className={field} />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Assign all to (optional)</label>
            <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className={`${field} bg-white`}>
              <option value="">— unassigned, in stock —</option>
              {dataCollectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Note</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="optional, applied to every item" className={field} />
          </div>

          {error && <p className="text-rose-600 text-[11px] font-medium">{error}</p>}

          <div className="sticky bottom-0 -mx-6 px-6 pt-3 pb-4 bg-white border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
              Create {ids.length || ''} items
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
