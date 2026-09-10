import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Package, Search } from 'lucide-react';
import { InventoryItem } from '../types';
import { todayStr } from '../utils/storage';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onSave: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onSave, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [q, setQ] = useState('');

  const filtered = inventory.filter(i => {
    const t = q.toLowerCase();
    return i.name.toLowerCase().includes(t) || i.itemId.toLowerCase().includes(t) || i.category.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inventory</h2>
          <p className="text-xs text-slate-500">Items the admin can assign to data collectors along with a site.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search inventory…"
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No inventory items yet.</td></tr>
              )}
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-500">{i.itemId}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {i.name}
                    {i.note && <div className="text-[11px] text-slate-400 font-normal truncate max-w-[220px]">{i.note}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{i.category || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{i.quantity || 0}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(i); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(i.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded">
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
        <InventoryModal
          item={editing}
          onClose={() => setOpen(false)}
          onSave={(it) => { onSave(it); setOpen(false); }}
        />
      )}
    </div>
  );
};

const InventoryModal: React.FC<{
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}> = ({ item, onClose, onSave }) => {
  const [itemId, setItemId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item) {
      setItemId(item.itemId); setName(item.name); setCategory(item.category);
      setQuantity(item.quantity); setNote(item.note);
    }
  }, [item]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId.trim() || !name.trim()) return;
    onSave({
      id: item ? item.id : `inv-${Date.now()}`,
      itemId: itemId.trim(),
      name: name.trim(),
      category: category.trim(),
      quantity: Number(quantity) || 0,
      note: note.trim(),
      createdAt: item ? item.createdAt : todayStr(),
    });
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><Package className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">{item ? 'Edit Item' : 'Add Inventory Item'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Item ID *</label>
              <input required autoFocus value={itemId} onChange={e => setItemId(e.target.value)} placeholder="e.g. GPS-01" className={`${field} font-mono`} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Quantity</label>
              <input type="number" min="0" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} className={field} />
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
          <div>
            <label className="block font-semibold mb-1">Note</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="optional" className={field} />
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">{item ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
