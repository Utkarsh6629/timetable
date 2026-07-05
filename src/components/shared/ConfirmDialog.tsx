import { AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary">{title}</h3>
            <p className="text-sm text-muted mt-1">{message}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95"
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
