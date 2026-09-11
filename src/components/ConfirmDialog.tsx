import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmState {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  state: ConfirmState | null;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onCancel }) => {
  if (!state) return null;
  const danger = state.danger !== false;

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-sm border border-slate-200 shadow-xl">
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{state.title || 'Are you sure?'}</h3>
              <p className="mt-1 text-slate-600">{state.message}</p>
            </div>
            <button onClick={onCancel} className="ml-auto p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 shrink-0"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onCancel} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button
              onClick={() => { state.onConfirm(); onCancel(); }}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {state.confirmLabel || 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
