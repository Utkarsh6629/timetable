import { Rocket, Download, X, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import type { UpdateInfo } from '../../hooks/useAppUpdate';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  checkError: string | null;
  onDownload: () => void;
}

export function UpdateModal({ isOpen, onClose, updateInfo, checkError, onDownload }: Props) {
  if (!isOpen) return null;

  const isAvailable = updateInfo?.available;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md card border border-violet-500/30 shadow-2xl p-6 overflow-hidden animate-slide-up z-10">
        {/* Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-primary hover:bg-secondary-surface transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {isAvailable ? (
          /* ── Update Available State ────────────────────────────────────────── */
          <div>
            {/* Header Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                <Rocket size={24} className="text-white animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">New Update Available!</h3>
                <p className="text-xs text-muted">A newer version of Life Planner is ready</p>
              </div>
            </div>

            {/* Version Diff Banner */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Current:</span>
                <span className="font-mono font-semibold text-secondary">v{updateInfo.currentVersion}</span>
              </div>
              <ArrowRight size={14} className="text-violet-400 shrink-0" />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Latest:</span>
                <span className="font-mono font-bold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-md">
                  v{updateInfo.latestVersion}
                </span>
              </div>
            </div>

            {/* Release Notes */}
            {updateInfo.releaseNotes ? (
              <div className="mb-5">
                <p className="text-xs font-semibold text-secondary mb-1.5">What's New:</p>
                <div className="max-h-36 overflow-y-auto rounded-lg bg-primary-surface/60 border border-base p-3 text-xs text-secondary whitespace-pre-line leading-relaxed font-sans scrollbar-thin">
                  {updateInfo.releaseNotes}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted mb-5">
                Includes recent enhancements, bug fixes, and performance improvements.
              </p>
            )}

            {/* Download & Installation Instructions */}
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 mb-5 space-y-1.5">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <span>📲</span> How to install after downloading:
              </p>
              <ol className="text-[11px] text-secondary space-y-1 list-decimal list-inside leading-relaxed">
                <li>Tap <strong className="text-violet-400">Download & Update</strong> below.</li>
                <li>Once downloaded, <strong>swipe down your phone's top notification bar</strong>.</li>
                <li>Tap <strong>life-planner.apk</strong> (or tap <strong>Open</strong>) and press <strong>Update</strong>.</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-muted hover:text-primary hover:bg-secondary-surface transition-colors"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => {
                  onDownload();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 shadow-md shadow-violet-500/25 transition-all"
              >
                <Download size={15} />
                <span>Download & Update</span>
              </button>
            </div>
          </div>
        ) : checkError ? (
          /* ── Error State ─────────────────────────────────────────────────── */
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3 text-red-400">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-primary mb-1">Update Check</h3>
            <p className="text-xs text-muted mb-5 px-2">{checkError}</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-secondary hover:text-primary bg-secondary-surface transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Up to Date State ────────────────────────────────────────────── */
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-primary mb-1">You're Up to Date!</h3>
            <p className="text-xs text-muted mb-5">
              Life Planner <span className="font-mono font-semibold text-secondary">v{updateInfo?.currentVersion ?? '1.0.0'}</span> is currently the latest version.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-secondary hover:text-primary bg-secondary-surface transition-colors"
            >
              Great!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
