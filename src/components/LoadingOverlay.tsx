import React from 'react';

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
}

/**
 * Full-screen blocking loader — large and clearly visible on phones.
 * Blocks all interaction while shown.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, label = 'Loading…' }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-emerald-400 animate-spin" />
      <p className="text-base font-semibold text-white">{label}</p>
      <p className="text-xs text-slate-400">Please wait — do not close the app.</p>
    </div>
  );
};
