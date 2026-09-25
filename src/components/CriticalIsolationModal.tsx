import React, { useEffect, useState } from 'react';
import { Radio, X, Clock, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { AlertNotification } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const ISOLATION_ALERT_AUTO_DISMISS_SECONDS = 5.5;

interface CriticalIsolationModalProps {
  alert: AlertNotification | null;
  onDismiss: () => void;
  autoDismissSeconds?: number;
}

export const CriticalIsolationModal: React.FC<CriticalIsolationModalProps> = ({
  alert,
  onDismiss,
  autoDismissSeconds = ISOLATION_ALERT_AUTO_DISMISS_SECONDS
}) => {
  const { t } = useLanguage();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoDismissSeconds);

  useEffect(() => {
    if (!alert) return;

    setSecondsRemaining(autoDismissSeconds);
    const startTime = Date.now();
    const durationMs = autoDismissSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, (durationMs - elapsed) / 1000);
      setSecondsRemaining(left);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [alert, autoDismissSeconds, onDismiss]);

  if (!alert) return null;

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / autoDismissSeconds) * 100));

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        // Allow manual dismiss by tapping outside the card
        if (e.target === e.currentTarget) {
          onDismiss();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="critical-isolation-title"
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border-2 border-rose-300 max-w-lg w-full p-6 sm:p-8 relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Emergency Indicator Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600" />

        {/* Top Header Row with Icon and Close Button */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>{t('criticalIsolationAlertBadge')}</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{alert.timestamp}</span>
                {alert.villageName && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{alert.villageName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Manual Dismiss Top-Right Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Dismiss Alert"
            aria-label="Close interrupt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Title */}
        <h2 
          id="critical-isolation-title"
          className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3"
        >
          {alert.title}
        </h2>

        {/* Alert Description (Exact text from alert system) */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-slate-800 text-sm leading-relaxed mb-6">
          <p className="font-medium text-slate-800">
            {alert.message}
          </p>
          <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs text-rose-900 font-semibold">
            <span>{t('autoReliefProtocolLevel2')}</span>
          </div>
        </div>

        {/* Action Controls & Auto-Dismiss Timer Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span className="text-[11px]">{t('autoDismissingIn', { seconds: Math.ceil(secondsRemaining) })}</span>
            <span className="text-[11px] text-slate-400">{t('loggedToIncidentAlertCenter')}</span>
          </div>

          {/* Smooth Auto-Dismiss Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-rose-600 h-full transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Bottom Dismiss / Acknowledge Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{t('acknowledgeAndClose')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
