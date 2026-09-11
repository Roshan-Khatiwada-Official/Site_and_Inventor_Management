import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, ShieldCheck, Package, PlusCircle, MinusCircle } from 'lucide-react';
import { UserAccount, UserRole, InventoryItem, CAN_COLLECT } from '../types';
import { todayStr, byNewest } from '../utils/storage';

interface UsersViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  inventory: InventoryItem[];
  onSave: (u: UserAccount) => void;
  onDelete: (id: string) => void;
  onSetKit: (collectorId: string, itemIds: string[]) => void;
}

const ROLES: UserRole[] = ['Admin', 'Site Finder', 'Data Collector', 'Field Worker'];

export const UsersView: React.FC<UsersViewProps> = ({ users, currentUser, inventory, onSave, onDelete, onSetKit }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Logins</h2>
          <p className="text-xs text-slate-500">Create login IDs, assign a role, and (for collectors) their equipment — via Edit.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> Add Login
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold">Contact</th>
                <th className="px-4 py-2.5 font-semibold">Login ID</th>
                <th className="px-4 py-2.5 font-semibold">Password</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Equipment</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...users].sort(byNewest).map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {u.name}{u.id === currentUser.id && <span className="ml-1 text-[10px] text-blue-600">(you)</span>}
                    {u.address && <div className="text-[11px] text-slate-400 font-normal truncate max-w-[200px]">{u.address}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {u.phone || '—'}
                    {u.email && <div className="text-[11px] text-slate-400">{u.email}</div>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{u.loginId}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{u.password}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.role}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {CAN_COLLECT.includes(u.role) ? inventory.filter(i => i.heldById === u.id).length : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(u); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded">
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
        <UserModal
          user={editing}
          inventory={inventory}
          onClose={() => setOpen(false)}
          onSave={(u) => { onSave(u); setOpen(false); }}
          onSetKit={onSetKit}
        />
      )}
    </div>
  );
};

/** Add-then-review inventory assignment: pick items one at a time into a running
 *  "assigning to X" list, then confirm with one Assign button. */
const KitModal: React.FC<{
  collector: UserAccount;
  inventory: InventoryItem[];
  onClose: () => void;
  onSave: (itemIds: string[]) => void;
}> = ({ collector, inventory, onClose, onSave }) => {
  const [picked, setPicked] = useState<string[]>(
    inventory.filter(i => i.heldById === collector.id).map(i => i.id)
  );
  const [q, setQ] = useState('');

  const add = (id: string) => setPicked(p => (p.includes(id) ? p : [...p, id]));
  const remove = (id: string) => setPicked(p => p.filter(x => x !== id));

  // Choosable now: in stock, or already this collector's, not already picked.
  const available = inventory
    .filter(i => (!i.heldById || i.heldById === collector.id) && !picked.includes(i.id))
    .filter(i => {
      const t = q.toLowerCase();
      return !t || i.name.toLowerCase().includes(t) || i.itemId.toLowerCase().includes(t);
    });
  const pickedItems = picked.map(id => inventory.find(i => i.id === id)).filter(Boolean) as InventoryItem[];

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] border border-slate-200 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><Package className="w-4 h-4" /></div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Assign Inventory</h3>
              <p className="text-[11px] text-slate-500">to <strong className="text-slate-700">{collector.name}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          {/* Assigning to (running list) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold">Assigning to {collector.name} ({pickedItems.length})</label>
            </div>
            <div className="border border-slate-200 rounded-lg min-h-[44px] max-h-40 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
              {pickedItems.length === 0 && <p className="px-3 py-3 text-slate-400">Nothing added yet — pick items below.</p>}
              {pickedItems.map(i => (
                <div key={i.id} className="flex items-center justify-between px-3 py-2 bg-white">
                  <span>
                    <span className="font-mono text-slate-500">{i.itemId}</span>{' '}
                    <span className="text-slate-800">{i.name}</span>
                    {i.condition === 'Flagged' && <span className="ml-1 text-[10px] text-rose-600">flagged</span>}
                  </span>
                  <button type="button" onClick={() => remove(i.id)} className="text-slate-400 hover:text-rose-600">
                    <MinusCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Available items to add */}
          <div>
            <label className="font-semibold mb-1.5 block">Available items</label>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              className="w-full mb-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
              {available.length === 0 && <p className="px-3 py-3 text-slate-400">Nothing left to add.</p>}
              {available.map(i => (
                <div key={i.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                  <span>
                    <span className="font-mono text-slate-500">{i.itemId}</span>{' '}
                    <span className="text-slate-800">{i.name}</span>
                  </span>
                  <button type="button" onClick={() => add(i.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">Removing an item here just returns it to stock — no condition check. Use the Returns tab when equipment physically comes back.</p>
        </div>

        <div className="shrink-0 sticky bottom-0 px-6 pt-3 pb-4 bg-white border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
          <button onClick={() => onSave(picked)} className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
            Assign ({pickedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
};

const UserModal: React.FC<{
  user: UserAccount | null;
  inventory: InventoryItem[];
  onClose: () => void;
  onSave: (u: UserAccount) => void;
  onSetKit: (collectorId: string, itemIds: string[]) => void;
}> = ({ user, inventory, onClose, onSave, onSetKit }) => {
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Data Collector');
  const [status, setStatus] = useState<'Active' | 'Suspended'>('Active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [kitOpen, setKitOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name); setLoginId(user.loginId); setPassword(user.password);
      setRole(user.role); setStatus(user.status);
      setPhone(user.phone || ''); setEmail(user.email || '');
      setAddress(user.address || ''); setNotes(user.notes || '');
    }
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Full Name is required.'); return; }
    if (!loginId.trim()) { setError('Login ID is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    onSave({
      id: user ? user.id : `usr-${Date.now()}`,
      name: name.trim(),
      loginId: loginId.trim().toLowerCase(),
      password: password.trim(),
      role,
      status,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      createdAt: user ? user.createdAt : todayStr(),
      updatedAt: user ? user.updatedAt : todayStr(),
      lastLogin: user?.lastLogin,
    });
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';
  const kitCount = user ? inventory.filter(i => i.heldById === user.id).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] border border-slate-200 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">{user ? 'Edit Login' : 'Add Login'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Login</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Login ID *</label>
              <input required value={loginId} onChange={e => setLoginId(e.target.value)} className={`${field} font-mono`} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Password *</label>
              <input required value={password} onChange={e => setPassword(e.target.value)} className={`${field} font-mono`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className={field}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as 'Active' | 'Suspended')} className={field}>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 pt-1">Personal details</p>
          <div>
            <label className="block font-semibold mb-1">Full Name *</label>
            <input required autoFocus value={name} onChange={e => setName(e.target.value)} className={field} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Contact Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +977-98XXXXXXXX" className={field} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={field} />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, city, district" className={field} />
          </div>
          <div>
            <label className="block font-semibold mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Other personal details / remarks" className={field} />
          </div>

          {user && CAN_COLLECT.includes(role) && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 pt-1 mb-1.5">Equipment</p>
              <button type="button" onClick={() => setKitOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">
                <Package className="w-3.5 h-3.5" /> Assign Inventory ({kitCount} currently assigned)
              </button>
            </div>
          )}
          {user && !CAN_COLLECT.includes(role) && kitCount > 0 && (
            <p className="text-[11px] text-amber-600">
              This login still holds {kitCount} item(s) from before. Change the role to Data Collector / Field Worker to manage them, or check them in via Returns.
            </p>
          )}

          {error && <p className="text-rose-600 text-[11px] font-medium">{error}</p>}

          <div className="sticky bottom-0 -mx-6 px-6 pt-3 pb-4 bg-white border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">{user ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>

      {kitOpen && user && (
        <KitModal
          collector={user}
          inventory={inventory}
          onClose={() => setKitOpen(false)}
          onSave={(ids) => { onSetKit(user.id, ids); setKitOpen(false); }}
        />
      )}
    </div>
  );
};
