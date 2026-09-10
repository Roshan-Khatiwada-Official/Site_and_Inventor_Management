import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, ClipboardList, Clock } from 'lucide-react';
import { Assignment, Site, InventoryItem, UserAccount } from '../types';
import { todayStr } from '../utils/storage';

interface AssignmentsViewProps {
  assignments: Assignment[];
  sites: Site[];
  inventory: InventoryItem[];
  dataCollectors: UserAccount[];
  onSave: (a: Assignment) => void;
  onDelete: (id: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments, sites, inventory, dataCollectors, onSave, onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);

  const itemName = (id: string) => inventory.find(i => i.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Assignments</h2>
          <p className="text-xs text-slate-500">Assign a data collector to a site and hand them inventory items.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Data Collector</th>
                <th className="px-4 py-2.5 font-semibold">Site</th>
                <th className="px-4 py-2.5 font-semibold">Inventory items</th>
                <th className="px-4 py-2.5 font-semibold">Hours logged</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No assignments yet.</td></tr>
              )}
              {assignments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{a.collectorName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.siteName}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {a.inventoryItemIds.length === 0 ? '—' : (
                      <div className="flex flex-wrap gap-1">
                        {a.inventoryItemIds.map(id => (
                          <span key={id} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">{itemName(id)}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      <Clock className="w-3 h-3 text-blue-500" />{a.hoursLogged.toFixed(1)}h
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      a.status === 'Active' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(a); setOpen(true); }} className="text-blue-600 hover:underline mr-3">Edit items</button>
                    <button onClick={() => onDelete(a.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <AssignmentModal
          assignment={editing}
          sites={sites}
          inventory={inventory}
          dataCollectors={dataCollectors}
          onClose={() => setOpen(false)}
          onSave={(a) => { onSave(a); setOpen(false); }}
        />
      )}
    </div>
  );
};

const AssignmentModal: React.FC<{
  assignment: Assignment | null;
  sites: Site[];
  inventory: InventoryItem[];
  dataCollectors: UserAccount[];
  onClose: () => void;
  onSave: (a: Assignment) => void;
}> = ({ assignment, sites, inventory, dataCollectors, onClose, onSave }) => {
  const [collectorId, setCollectorId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [itemIds, setItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (assignment) {
      setCollectorId(assignment.collectorId);
      setSiteId(assignment.siteId);
      setItemIds(assignment.inventoryItemIds);
    }
  }, [assignment]);

  const toggleItem = (id: string) =>
    setItemIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectorId || !siteId) return;
    const site = sites.find(s => s.id === siteId);
    const collector = dataCollectors.find(c => c.id === collectorId);
    onSave({
      id: assignment ? assignment.id : `asg-${Date.now()}`,
      siteId,
      siteName: site?.name || '',
      collectorId,
      collectorName: collector?.name || '',
      inventoryItemIds: itemIds,
      assignedById: assignment?.assignedById || '',
      assignedByName: assignment?.assignedByName || '',
      status: assignment?.status || 'Active',
      hoursLogged: assignment?.hoursLogged || 0,
      sessions: assignment?.sessions || [],
      createdAt: assignment?.createdAt || todayStr(),
    });
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><ClipboardList className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">{assignment ? 'Edit Assignment' : 'New Assignment'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Data Collector *</label>
            <select required value={collectorId} onChange={e => setCollectorId(e.target.value)} className={field}>
              <option value="">— choose —</option>
              {dataCollectors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.loginId})</option>)}
            </select>
            {dataCollectors.length === 0 && <p className="mt-1 text-[11px] text-rose-500">No active Data Collector logins yet — create one under "Logins".</p>}
          </div>

          <div>
            <label className="block font-semibold mb-1">Site *</label>
            <select required value={siteId} onChange={e => setSiteId(e.target.value)} className={field}>
              <option value="">— choose —</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name} · {s.code} {s.status === 'Assigned' ? '(assigned)' : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1.5">Inventory items ({itemIds.length} selected)</label>
            <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
              {inventory.length === 0 && <p className="px-3 py-3 text-slate-400">No inventory items yet.</p>}
              {inventory.map(i => (
                <label key={i.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={itemIds.includes(i.id)} onChange={() => toggleItem(i.id)} />
                  <span className="font-mono text-slate-500">{i.itemId}</span>
                  <span className="text-slate-800">{i.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">{assignment ? 'Save' : 'Assign'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
