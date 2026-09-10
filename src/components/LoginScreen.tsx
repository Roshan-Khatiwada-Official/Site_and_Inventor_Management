import React, { useState } from 'react';
import { 
  LogIn, 
  KeyRound, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Boxes,
  ShieldCheck,
  Building2,
  HardHat
} from 'lucide-react';
import { UserAccount } from '../types';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const trimmedId = loginId.trim().toLowerCase();
    const account = users.find(u => u.loginId.toLowerCase() === trimmedId);

    if (!account) {
      setErrorMessage(`No account found with Login ID "${loginId}". Please contact the system administrator to obtain access.`);
      setIsSubmitting(false);
      return;
    }

    if (account.status === 'Suspended') {
      setErrorMessage(`Account "${loginId}" is currently suspended. Please contact your system administrator.`);
      setIsSubmitting(false);
      return;
    }

    if (account.password !== password) {
      setErrorMessage('Incorrect password. Please verify your credentials or contact the administrator.');
      setIsSubmitting(false);
      return;
    }

    // Success
    setIsSubmitting(false);
    onLoginSuccess(account);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle backdrop accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Site & Inventory Manager
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-sm">
            Operational Field Dispatch, Site Arrangements & Custody Tracking Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your assigned Login ID and password to access your role workspace.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-start gap-2.5 text-rose-200 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Login ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginId}
                  onChange={e => {
                    setLoginId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Your Login ID"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          {/* Credentials Guidance / Role Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex items-start gap-2 text-slate-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Role-Based Access Control:</strong> Only the Administrator can create new accounts and issue Login IDs & passwords.
              </p>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-600" /> Multi-Site Dispatch
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <HardHat className="w-3.5 h-3.5 text-slate-600" /> Collector Roster
          </span>
        </div>
      </div>
    </div>
  );
};
