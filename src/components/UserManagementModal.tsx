import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Lock, 
  UserCheck, 
  AlertCircle,
  Briefcase,
  Users,
  ShieldAlert
} from 'lucide-react';
import { UserAccount, AppUserRole, Site, DataCollector } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount | null;
  sites: Site[];
  collectors: DataCollector[];
  onSaveUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onNotify: (msg: string) => void;
}

const ROLES: { role: AppUserRole; color: string; bg: string; border: string; desc: string }[] = [
  {
    role: 'Admin',
    color: 'text-purple-300',
    bg: 'bg-purple-950/60',
    border: 'border-purple-600/40',
    desc: 'Full administrative access: manage login IDs, set passwords, assign roles, and configure Google Sheets database sync.',
  },
  {
    role: 'Operations Manager',
    color: 'text-blue-300',
    bg: 'bg-blue-950/60',
    border: 'border-blue-600/40',
    desc: 'Operational authority over all sites, daily rosters, collector schedules, and equipment allocation.',
  },
  {
    role: 'Site Registrar',
    color: 'text-indigo-300',
    bg: 'bg-indigo-950/60',
    border: 'border-indigo-600/40',
    desc: 'Finds, adds, and updates field site details only. All site edits sync to the Google Sheet automatically. No access to collectors, equipment, dispatch, or users.',
  },
  {
    role: 'Site Dispatcher',
    color: 'text-amber-300',
    bg: 'bg-amber-950/60',
    border: 'border-amber-600/40',
    desc: 'Manages daily field dispatches, check-in / check-out times, units collected, and prints run-sheets.',
  },
  {
    role: 'Equipment Officer',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-600/40',
    desc: 'Controls equipment inventory, calibration logs, condition status, and inter-site custody transfers.',
  },
  {
    role: 'Field Collector',
    color: 'text-cyan-300',
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-600/40',
    desc: 'Specialized view for field collectors to check daily shift details, site access codes, and log collected units.',
  },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  sites,
  collectors,
  onSaveUser,
  onDeleteUser,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [formLoginId, setFormLoginId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<AppUserRole>('Field Collector');
  const [formStatus, setFormStatus] = useState<'Active' | 'Suspended'>('Active');
  const [formSiteId, setFormSiteId] = useState<string>('');
  const [formCollectorId, setFormCollectorId] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Visible passwords toggles for rows
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (loginId: string, pass: string) => {
    navigator.clipboard.writeText(`Login ID: ${loginId}\nPassword: ${pass}`);
    setCopiedId(loginId);
    onNotify(`Credentials for ${loginId} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(result);
    setShowPassword(true);
  };

  const handleStartCreate = () => {
    setEditingUser(null);
    setFormLoginId('');
    setFormPassword('pass' + Math.floor(1000 + Math.random() * 9000));
    setFormName('');
    setFormEmail('');
    setFormRole('Field Collector');
    setFormStatus('Active');
    setFormSiteId('');
    setFormCollectorId('');
    setFormNotes('');
    setShowPassword(true);
    setIsEditing(true);
  };

  const handleStartEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormLoginId(user.loginId);
    setFormPassword(user.password);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormSiteId(user.assignedSiteId || '');
    setFormCollectorId(user.collectorId || '');
    setFormNotes(user.notes || '');
    setShowPassword(true);
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLoginId.trim()) {
      alert('Please provide a valid Login ID.');
      return;
    }
    if (!formPassword.trim()) {
      alert('Please provide a password for this user.');
      return;
    }

    // Check duplicate login ID
    const duplicate = users.find(
      u => u.loginId.toLowerCase() === formLoginId.trim().toLowerCase() && u.id !== editingUser?.id
    );
    if (duplicate) {
      alert(`The Login ID "${formLoginId}" is already taken by ${duplicate.name}. Please choose another.`);
      return;
    }

    const userToSave: UserAccount = {
      id: editingUser ? editingUser.id : `usr-${Date.now().toString(36)}`,
      loginId: formLoginId.trim().toLowerCase(),
      password: formPassword.trim(),
      name: formName.trim() || formLoginId.trim(),
      email: formEmail.trim(),
      role: formRole,
      status: formStatus,
      assignedSiteId: formSiteId || undefined,
      collectorId: formCollectorId || undefined,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split('T')[0],
      notes: formNotes.trim(),
    };

    onSaveUser(userToSave);
    onNotify(editingUser ? `Updated account for ${userToSave.name}` : `Created account for ${userToSave.name}`);
    setIsEditing(false);
  };

  const handleDelete = (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own logged-in administrator account.');
      return;
    }
    if (confirm(`Are you sure you want to delete login account "${user.loginId}" (${user.name})?`)) {
      onDeleteUser(user.id);
      onNotify(`Deleted account ${user.loginId}`);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = 
      u.loginId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">ID, Password & Role Management</h2>
                <span className="text-[11px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage login accounts, configure passwords, and assign system roles across staff.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Quick Reference Cards */}
        <div className="px-4 sm:px-6 pt-4 pb-2 bg-slate-950/40 border-b border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Role Permissions Overview</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pb-2">
            {ROLES.map(r => (
              <div 
                key={r.role} 
                className={`p-2.5 rounded-lg border ${r.bg} ${r.border} flex flex-col justify-between`}
              >
                <div>
                  <div className={`text-xs font-bold ${r.color} flex items-center justify-between`}>
                    <span>{r.role}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {users.filter(u => u.role === r.role).length} active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body: Form OR Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isEditing ? (
            /* CREATE / EDIT FORM */
            <form onSubmit={handleSaveForm} className="space-y-4 max-w-2xl mx-auto bg-slate-800/60 p-5 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-semibold text-white">
                    {editingUser ? `Edit Account: ${editingUser.loginId}` : 'Create New User Account'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Login ID */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Login ID (Username) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formLoginId}
                      onChange={e => setFormLoginId(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      placeholder="e.g. j.smith or inspector01"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Alphanumeric, dots, hyphens only. Used to log into the platform.
                  </span>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="Set password for this ID"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Admin sets or resets passwords directly.
                  </span>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Staff Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. s.jenkins@operations.org"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Specified Role */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Specified Role <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as AppUserRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {ROLES.map(r => (
                      <option key={r.role} value={r.role}>
                        {r.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Active">Active (Permitted to Log In)</option>
                    <option value="Suspended">Suspended (Access Blocked)</option>
                  </select>
                </div>

                {/* Optional Site Link */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Home Site (Optional)
                  </label>
                  <select
                    value={formSiteId}
                    onChange={e => setFormSiteId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- None / Cross-Site Access --</option>
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Field Collector Profile Link */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Link to Collector Profile (Optional)
                  </label>
                  <select
                    value={formCollectorId}
                    onChange={e => setFormCollectorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- None / System Staff --</option>
                    {collectors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Administrative Notes & Permissions Scope
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Notes on security clearance, shift allocations, or contact arrangements..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-md transition"
                >
                  {editingUser ? 'Save Account Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          ) : (
            /* USERS TABLE & ACTIONS */
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by Login ID, Name, or Email..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    {ROLES.map(r => (
                      <option key={r.role} value={r.role}>
                        {r.role}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleStartCreate}
                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-sm transition self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New Login Account</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 font-medium">
                        <th className="py-2.5 px-3">Login ID</th>
                        <th className="py-2.5 px-3">Password</th>
                        <th className="py-2.5 px-3">Staff Name & Contact</th>
                        <th className="py-2.5 px-3">Specified Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Assignment Link</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No user accounts found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => {
                          const isRevealed = !!revealedPasswords[u.id];
                          const roleInfo = ROLES.find(r => r.role === u.role) || ROLES[0];
                          const isCurrent = u.id === currentUser?.id;
                          const linkedCollector = collectors.find(c => c.id === u.collectorId);
                          const linkedSite = sites.find(s => s.id === u.assignedSiteId);

                          return (
                            <tr 
                              key={u.id}
                              className={`hover:bg-slate-800/40 transition ${
                                isCurrent ? 'bg-purple-950/20' : ''
                              }`}
                            >
                              {/* Login ID */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-semibold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                    {u.loginId}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                      You
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Password */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs text-slate-300 min-w-[70px]">
                                    {isRevealed ? u.password : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordReveal(u.id)}
                                    title={isRevealed ? 'Hide password' : 'Show password'}
                                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                                  >
                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopyCredentials(u.loginId, u.password)}
                                    title="Copy Login ID & Password"
                                    className="p-1 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded transition"
                                  >
                                    {copiedId === u.loginId ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Staff Name & Email */}
                              <td className="py-3 px-3">
                                <div className="font-medium text-white">{u.name}</div>
                                {u.email && (
                                  <div className="text-[11px] text-slate-400">{u.email}</div>
                                )}
                              </td>

                              {/* Role */}
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleInfo.bg} ${roleInfo.color} ${roleInfo.border}`}>
                                  {u.role}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                    u.status === 'Active'
                                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                                      : 'bg-red-950/60 text-red-300 border-red-600/40'
                                  }`}
                                >
                                  {u.status}
                                </span>
                              </td>

                              {/* Linked Assignment */}
                              <td className="py-3 px-3">
                                {linkedSite && (
                                  <div className="text-[11px] text-slate-300 truncate max-w-[140px]" title={linkedSite.name}>
                                    Site: <span className="font-medium text-white">{linkedSite.code}</span>
                                  </div>
                                )}
                                {linkedCollector && (
                                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]" title={linkedCollector.name}>
                                    Collector: <span className="font-medium text-slate-200">{linkedCollector.name}</span>
                                  </div>
                                )}
                                {!linkedSite && !linkedCollector && (
                                  <span className="text-slate-500 text-[11px]">System-wide</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleStartEdit(u)}
                                    title="Edit Login ID, Password, or Role"
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(u)}
                                    title={isCurrent ? "Cannot delete own admin account" : "Delete account"}
                                    disabled={isCurrent}
                                    className={`p-1.5 rounded transition ${
                                      isCurrent 
                                        ? 'text-slate-600 cursor-not-allowed' 
                                        : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
                                    }`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Info footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 gap-2">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <KeyRound className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    Admins can manage passwords and assign roles at any time. When using the Google Sheets database, these user accounts are automatically synchronized to the <strong>Users</strong> sheet tab.
                  </span>
                </div>
                <div className="font-mono text-slate-400 shrink-0">
                  Total Accounts: {users.length}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
