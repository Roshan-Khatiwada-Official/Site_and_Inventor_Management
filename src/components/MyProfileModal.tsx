import React, { useState } from 'react';
import { 
  X, 
  User, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Mail, 
  Clock, 
  Calendar,
  Users
} from 'lucide-react';
import { UserAccount, Site, DataCollector } from '../types';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  sites: Site[];
  collectors: DataCollector[];
  onUpdatePassword: (newPassword: string) => void;
  onOpenUserManagement?: () => void;
  onSignOut: () => void;
  onNotify: (msg: string) => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sites,
  collectors,
  onUpdatePassword,
  onOpenUserManagement,
  onSignOut,
  onNotify,
}) => {
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!isOpen) return null;

  const assignedSite = sites.find(s => s.id === currentUser.assignedSiteId);
  const linkedCollector = collectors.find(c => c.id === currentUser.collectorId);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (currentPasswordInput !== currentUser.password) {
      setPasswordError('Current password is not correct.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    onUpdatePassword(newPassword);
    setPasswordSuccess('Password updated successfully!');
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
    onNotify('Your password has been changed successfully.');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Operations Manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Site Dispatcher':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Equipment Officer':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{currentUser.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(currentUser.role)}`}>
                  {currentUser.role}
                </span>
                <span className="text-xs text-slate-400 font-mono">@{currentUser.loginId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Account Details Card */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Account Credentials & Role
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Login ID / Username</span>
                <span className="font-mono text-white font-medium">{currentUser.loginId}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Assigned Role</span>
                <span className="text-slate-200 font-semibold">{currentUser.role}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Email Address</span>
                <span className="text-slate-200 truncate block">{currentUser.email || 'Not provided'}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Account Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>

              {assignedSite && (
                <div className="col-span-2">
                  <span className="text-slate-400 block">Assigned Home Facility</span>
                  <span className="text-slate-200 font-medium">{assignedSite.name} ({assignedSite.code})</span>
                </div>
              )}

              {linkedCollector && (
                <div className="col-span-2">
                  <span className="text-slate-400 block">Linked Field Collector Record</span>
                  <span className="text-slate-200 font-medium">{linkedCollector.name} ({linkedCollector.badgeNumber})</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block">Member Since</span>
                <span className="text-slate-300 font-mono">{currentUser.createdAt}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Last Active</span>
                <span className="text-slate-300 font-mono">{currentUser.lastLogin || 'Current Session'}</span>
              </div>
            </div>
          </div>

          {/* Admin Fast Access: Manage Users */}
          {currentUser.role === 'Admin' && onOpenUserManagement && (
            <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  Administrator Controls
                </h4>
                <p className="text-[11px] text-purple-300/80 mt-0.5">
                  Create new staff accounts, set Login IDs, and assign roles.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenUserManagement();
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Manage Staff
              </button>
            </div>
          )}

          {/* Change Password Form */}
          <div className="border-t border-slate-800 pt-4">
            {!isChangingPassword ? (
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change My Password</span>
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    Update Password
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordError(null);
                    }}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {passwordError && (
                  <div className="p-2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPasswordInput}
                    onChange={e => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  Save New Password
                </button>
              </form>
            )}

            {passwordSuccess && (
              <div className="mt-2 p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              End session on this device
            </div>
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
