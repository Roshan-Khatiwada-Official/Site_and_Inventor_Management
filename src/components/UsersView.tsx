import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, ShieldCheck } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { todayStr } from '../utils/storage';

interface UsersViewProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onSave: (u: UserAccount) => void;
  onDelete: (id: string) => void;
}

const ROLES: UserRole[] = ['Admin', 'Site Finder', 'Data Collector'];

export const UsersView: React.FC<UsersViewProps> = ({ users, currentUser, onSave, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Logins</h2>
          <p className="text-xs text-slate-500">Create login IDs and assign one of the three roles.</p>
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
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
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
        <UserModal user={editing} onClose={() => setOpen(false)} onSave={(u) => { onSave(u); setOpen(false); }} />
      )}
    </div>
  );
};

const UserModal: React.FC<{
  user: UserAccount | null;
  onClose: () => void;
  onSave: (u: UserAccount) => void;
}> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Data Collector');
  const [status, setStatus] = useState<'Active' | 'Suspended'>('Active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

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
    if (!name.trim() || !loginId.trim() || !password.trim()) return;
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
      lastLogin: user?.lastLogin,
    });
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">{user ? 'Edit Login' : 'Add Login'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Login</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Login ID *</label>
              <input required value={loginId} onChange={e => setLoginId(e.target.value)} className={`${field} font-mono`} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Password *</label>
              <input required value={password} onChange={e => setPassword(e.target.value)} className={`${field} font-mono`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">{user ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
