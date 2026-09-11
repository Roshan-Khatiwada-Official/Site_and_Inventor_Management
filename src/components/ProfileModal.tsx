import React, { useState } from 'react';
import { X, User, ShieldCheck, Phone, Mail, MapPin, StickyNote, KeyRound, Clock } from 'lucide-react';
import { UserAccount } from '../types';

interface ProfileModalProps {
  user: UserAccount;
  onClose: () => void;
  onSave: (u: UserAccount) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [address, setAddress] = useState(user.address || '');
  const [notes, setNotes] = useState(user.notes || '');
  const [password, setPassword] = useState(user.password);

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      name: name.trim() || user.name,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      password: password.trim() || user.password,
    });
    setEditing(false);
  };

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-2.5 py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</div>
        <div className="text-slate-800">{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{user.name}</h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {user.role}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>

        {!editing ? (
          <div className="p-6 text-xs text-slate-700">
            <Row icon={<User className="w-3.5 h-3.5" />} label="Login ID" value={user.loginId} />
            <Row icon={<Phone className="w-3.5 h-3.5" />} label="Contact Number" value={user.phone || ''} />
            <Row icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={user.email || ''} />
            <Row icon={<MapPin className="w-3.5 h-3.5" />} label="Address" value={user.address || ''} />
            <Row icon={<StickyNote className="w-3.5 h-3.5" />} label="Notes" value={user.notes || ''} />
            <Row icon={<Clock className="w-3.5 h-3.5" />} label="Last login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : ''} />

            <div className="pt-4 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Close</button>
              <button onClick={() => setEditing(true)} className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">Edit my details</button>
            </div>
          </div>
        ) : (
          <form onSubmit={save} className="p-6 space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={field} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Contact Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={field} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Notes</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className={field} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 font-semibold mb-1"><KeyRound className="w-3.5 h-3.5 text-slate-400" /> Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} className={`${field} font-mono`} />
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
