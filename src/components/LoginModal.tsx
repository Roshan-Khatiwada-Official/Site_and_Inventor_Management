import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  KeyRound, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { UserAccount, AppUserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount | null;
  onSelectUser: (user: UserAccount) => void;
  onNotify: (msg: string) => void;
}

const ROLE_COLORS: Record<AppUserRole, { badge: string; text: string; bg: string }> = {
  'Admin': { badge: 'border-purple-500/50 bg-purple-950/60 text-purple-300', text: 'text-purple-400', bg: 'hover:bg-purple-950/30' },
  'Operations Manager': { badge: 'border-blue-500/50 bg-blue-950/60 text-blue-300', text: 'text-blue-400', bg: 'hover:bg-blue-950/30' },
  'Site Registrar': { badge: 'border-indigo-500/50 bg-indigo-950/60 text-indigo-300', text: 'text-indigo-400', bg: 'hover:bg-indigo-950/30' },
  'Site Dispatcher': { badge: 'border-amber-500/50 bg-amber-950/60 text-amber-300', text: 'text-amber-400', bg: 'hover:bg-amber-950/30' },
  'Equipment Officer': { badge: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300', text: 'text-emerald-400', bg: 'hover:bg-emerald-950/30' },
  'Field Collector': { badge: 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300', text: 'text-cyan-400', bg: 'hover:bg-cyan-950/30' },
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onNotify,
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = loginId.trim().toLowerCase();
    const account = users.find(u => u.loginId.toLowerCase() === trimmedId);

    if (!account) {
      setErrorMessage(`No account found with Login ID "${loginId}". Contact the administrator to create one.`);
      return;
    }

    if (account.status === 'Suspended') {
      setErrorMessage(`Account "${loginId}" is currently suspended. Please contact your system administrator.`);
      return;
    }

    if (account.password !== password) {
      setErrorMessage('Incorrect password. Please verify with the administrator or check your credentials.');
      return;
    }

    onSelectUser(account);
    onNotify(`Signed in as ${account.name} (${account.role})`);
    onClose();
  };

  const handleQuickSwitch = (user: UserAccount) => {
    if (user.status === 'Suspended') {
      setErrorMessage(`Account ${user.loginId} is suspended.`);
      return;
    }
    onSelectUser(user);
    onNotify(`Switched active user to ${user.name} (${user.role})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Sign In with Login ID & Password</h2>
              <p className="text-xs text-slate-400">Access operational features aligned with your assigned role</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 flex items-start gap-2.5 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Login ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={e => {
                    setLoginId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. admin or dispatcher"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Managed by Admin
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your assigned password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-10 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>
          </form>

          {/* Quick Demo Accounts Switcher */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Test Accounts (Click to Switch):</span>
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {users.map(u => {
                const isCurrent = u.id === currentUser?.id;
                const style = ROLE_COLORS[u.role] || ROLE_COLORS['Field Collector'];

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSwitch(u)}
                    className={`w-full text-left p-2 rounded-lg border border-slate-800 transition flex items-center justify-between bg-slate-800/40 ${style.bg} ${
                      isCurrent ? 'ring-1 ring-blue-500/80 bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-semibold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                        {u.loginId}
                      </span>
                      <span className="text-xs text-slate-300 font-medium truncate">
                        {u.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {u.role}
                      </span>
                      {isCurrent ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {u.password}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
