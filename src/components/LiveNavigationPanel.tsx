import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Flame,
  Zap,
  Sparkles,
  Compass,
  Navigation,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
  Car,
  Clock,
  Radio,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RerouteComparisonNotice } from '../hooks/useLiveNavigation';
import { CalculatedRoute } from '../types';

interface LiveNavigationPanelProps {
  isNavigating: boolean;
  isPaused: boolean;
  progress: number;
  speedMultiplier: number;
  setSpeedMultiplier: (speed: number) => void;
  distanceTraveledKm: number;
  activeNavRoute: CalculatedRoute;
  isRecalculating: boolean;
  rerouteNotice: RerouteComparisonNotice | null;
  startNavigation: () => void;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  resetNavigation: () => void;
  triggerSimulateRoadUpdate: () => void;
  onResetRoads?: () => void;
  modeLabel?: string;
}

export const LiveNavigationPanel: React.FC<LiveNavigationPanelProps> = ({
  isNavigating,
  isPaused,
  progress,
  speedMultiplier,
  setSpeedMultiplier,
  distanceTraveledKm,
  activeNavRoute,
  isRecalculating,
  rerouteNotice,
  startNavigation,
  pauseNavigation,
  resumeNavigation,
  resetNavigation,
  triggerSimulateRoadUpdate,
  onResetRoads,
  modeLabel = 'Commuter Navigation'
}) => {
  const { t } = useLanguage();
  const [showSimDrawer, setShowSimDrawer] = useState<boolean>(true);

  const percent = Math.round(progress * 100);
  const remainingKm = Math.max(0, Math.round((activeNavRoute.totalDistanceKm - distanceTraveledKm) * 10) / 10);
  const remainingMins = Math.round((remainingKm / 45) * 60);

  return (
    <div className="space-y-4">
      {/* 1. Main Navigation Playback Control Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isNavigating ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
            <span className="font-extrabold text-sm text-slate-900">
              {isNavigating ? t('startNavigation') : t('routePlanner')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSpeedMultiplier(1)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                  speedMultiplier === 1 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setSpeedMultiplier(2)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                  speedMultiplier === 2 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                2x
              </button>
            </div>
          </div>
        </div>

        {/* Play / Pause / Reset Action Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isNavigating ? (
            <button
              onClick={startNavigation}
              className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{t('startNavigation')}</span>
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeNavigation}
                  className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t('resumeNavigation')}</span>
                </button>
              ) : (
                <button
                  onClick={pauseNavigation}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>{t('pauseNavigation')}</span>
                </button>
              )}

              <button
                onClick={resetNavigation}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title={t('resetTripBackToStart')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('resetRoute')}</span>
              </button>
            </>
          )}
        </div>

        {/* Live Trip Progress Bar & Stats */}
        {isNavigating && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('distanceTraveledLabel')}: <strong>{distanceTraveledKm} km</strong> ({percent}%)</span>
              </span>
              <span className="font-bold text-slate-600">
                {t('distanceRemainingLabel')}: <strong>~{remainingKm} km ({remainingMins}m)</strong>
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-150"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. RECALCULATING FLASH NOTIFICATION */}
      {isRecalculating && (
        <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-md flex items-center gap-3 animate-pulse border border-amber-600">
          <Activity className="w-5 h-5 animate-spin" />
          <div className="text-xs">
            <div className="font-black uppercase tracking-wider text-[11px]">{t('recalculatingTitle')}</div>
            <div>{t('recalculatingDesc')}</div>
          </div>
        </div>
      )}

      {/* 3. LIVE REROUTE COMPARISON BANNER */}
      {rerouteNotice && !isRecalculating && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-400 shadow-md text-amber-950 space-y-2 animate-in zoom-in-95">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase tracking-wider text-amber-900">
                  ⚡ {t('autoRerouteTriggered')}
                </span>
                <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-200/70 px-1.5 py-0.5 rounded">
                  {rerouteNotice.timestamp}
                </span>
              </div>
              <p className="text-xs mt-1 text-slate-800 leading-snug">
                {t('roadAheadBlockedDesc', { road: rerouteNotice.blockedRoadName })}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-amber-200/80 text-amber-950 font-black rounded-lg border border-amber-300">
                  {t('reroutedAddsSummary', {
                    km: rerouteNotice.extraDistanceKm,
                    mins: rerouteNotice.extraTimeMinutes
                  })}
                </span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('rerouteDetourNote')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SIMULATIONS PANEL / DRAWER (Feature A Demo Trigger) */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        <div
          onClick={() => setShowSimDrawer(!showSimDrawer)}
          className="p-3.5 sm:p-4 bg-slate-950/80 flex items-center justify-between cursor-pointer hover:bg-slate-950 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
              🧪
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
                <span>{t('simulationsDrawerTitle')}</span>
                <span className="text-[9px] bg-purple-950 text-purple-200 border border-purple-700 px-1.5 py-0.2 rounded font-black tracking-wider uppercase">
                  {t('featureABadge')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{t('simulationsDrawerSubtitle')}</p>
            </div>
          </div>

          <button className="text-slate-400 hover:text-white">
            {showSimDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showSimDrawer && (
          <div className="p-4 space-y-3 bg-slate-900 border-t border-slate-800 text-xs">
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {t('clickBelowToSimulate')}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={triggerSimulateRoadUpdate}
                className="flex-1 px-3.5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-98 text-white rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>{t('simulateBlockadeBtn')}</span>
              </button>

              {onResetRoads && (
                <button
                  onClick={onResetRoads}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  title={t('resetRoadsBaselineTitle')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('clearHazardsBtn')}</span>
                </button>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1">
                <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                <span>{t('demoWalkthroughTitle')}</span>
              </div>
              <p>
                {t('demoStep1Instruction')}
              </p>
              <p>
                {t('demoStep2Instruction')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
