import React, { useEffect } from 'react';
import { AlertCircle, MapPin, X } from 'lucide-react';

interface LocationToastProps {
  message: string | null;
  onClose: () => void;
  onEnableLocation?: () => void;
}

export const LocationToast: React.FC<LocationToastProps> = ({
  message,
  onClose,
  onEnableLocation,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <aside
      id="location-alert-toast"
      aria-label="Location Alert"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-lg bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 transition-all duration-300"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-400/30">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
          {message}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onEnableLocation && (
          <button
            id="toast-enable-location-btn"
            type="button"
            onClick={() => {
              onEnableLocation();
              onClose();
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enable</span>
          </button>
        )}
        <button
          id="toast-dismiss-btn"
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
