import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  Car, 
  Compass, 
  CornerDownRight, 
  Info, 
  MapPin, 
  Navigation, 
  Route, 
  ShieldAlert, 
  Sparkles, 
  Timer, 
  Zap 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ALL_LOCATIONS, calculateRiskAwareRoute, INITIAL_ROAD_SEGMENTS } from '../data/nerGeography';
import { CalculatedRoute, LocationPoint } from '../types';
import { MapComponent } from './MapComponent';
import { useLiveNavigation } from '../hooks/useLiveNavigation';
import { LiveNavigationPanel } from './LiveNavigationPanel';

export const GeneralNavigationView: React.FC = () => {
  const { roadSegments, depots, villages, updateRoadStatus, role, requests } = useApp();
  const { t, translateRoadStatus } = useLanguage();

  // All navigable points in the North-East road network
  const allLocations: LocationPoint[] = useMemo(() => {
    return ALL_LOCATIONS;
  }, []);

  // Source and Destination state
  const [sourceId, setSourceId] = useState<string>('depot-guwahati'); // Guwahati Hub
  const [targetId, setTargetId] = useState<string>('vil-dhemaji-sissiborgaon'); // Sissiborgaon or Lakhimpur

  // Quick preset trips for demo
  const PRESET_TRIPS: { label: string; src: string; dst: string; desc: string }[] = [
    {
      label: 'Guwahati ➔ Sissiborgaon (Dhemaji)',
      src: 'depot-guwahati',
      dst: 'vil-dhemaji-sissiborgaon',
      desc: 'Demonstrates auto-bypass avoiding flooded NH-15'
    },
    {
      label: 'Guwahati ➔ Cherrapunji Gorges',
      src: 'depot-guwahati',
      dst: 'vil-cherrapunji-sohra',
      desc: 'Mountain highway with high-rain caution'
    },
    {
      label: 'Tezpur ➔ Majuli Island',
      src: 'depot-tezpur',
      dst: 'vil-majuli-kamalabari',
      desc: 'Highway + Ro-Pax river waterway crossing'
    },
    {
      label: 'Guwahati ➔ Haflong (Dima Hasao)',
      src: 'depot-guwahati',
      dst: 'vil-haflong-jatinga',
      desc: 'Shows blocked/impassable road warning'
    }
  ];

  // Calculate base route with risk awareness
  const baseCalculatedRoute: CalculatedRoute = useMemo(() => {
    return calculateRiskAwareRoute(sourceId, targetId, roadSegments, allLocations);
  }, [sourceId, targetId, roadSegments, allLocations]);

  // Live Navigation Hook (Feature A)
  const {
    isNavigating,
    isPaused,
    progress,
    speedMultiplier,
    setSpeedMultiplier,
    currentCoord,
    currentBearing,
    distanceTraveledKm,
    currentStepIndex,
    activeNavRoute,
    isRecalculating,
    rerouteNotice,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    resetNavigation,
    triggerSimulateRoadUpdate
  } = useLiveNavigation({
    initialRoute: baseCalculatedRoute,
    roadSegments,
    allLocations,
    targetId,
    updateRoadStatus
  });

  const handleSwap = () => {
    if (isNavigating) resetNavigation();
    const temp = sourceId;
    setSourceId(targetId);
    setTargetId(temp);
  };

  const handleResetRoads = () => {
    INITIAL_ROAD_SEGMENTS.forEach(r => {
      updateRoadStatus(r.id, r.status, r.hazardReason);
    });
    resetNavigation();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t('publicCommuter')}
              </span>
              <span className="text-xs text-slate-500 font-medium">{t('commuterSubtitle')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {t('routePlanner')}
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              {t('routePlannerDesc')}
            </p>
          </div>

          {/* Quick Demo Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('quickPresets')}:</span>
            {PRESET_TRIPS.slice(0, 3).map((trip, i) => (
              <button
                key={i}
                onClick={() => {
                  if (isNavigating) resetNavigation();
                  setSourceId(trip.src);
                  setTargetId(trip.dst);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title={trip.desc}
              >
                {trip.label.split('➔')[1]?.trim() || trip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Route Planning Panel & Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input Form & Live Controls & Turn Directions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Journey Selector Box (Google Maps style) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>{t('planRoute')}</span>
              </div>
              <button
                onClick={handleSwap}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                ⇄ {t('swapLocations')}
              </button>
            </div>

            {/* Origin Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('origin')}
              </label>
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-600 absolute left-3.5 top-3.5 ring-2 ring-emerald-100"></div>
                <select
                  value={sourceId}
                  onChange={(e) => {
                    if (isNavigating) resetNavigation();
                    setSourceId(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {allLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.district ? `(${loc.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('destination')}
              </label>
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-rose-600 absolute left-3.5 top-3.5 ring-2 ring-rose-100"></div>
                <select
                  value={targetId}
                  onChange={(e) => {
                    if (isNavigating) resetNavigation();
                    setTargetId(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {allLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.district ? `(${loc.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Route Stats Summary Pill */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  {activeNavRoute.totalDistanceKm} km
                </div>
                <div className="text-xs text-slate-500">
                  {t('etaRemaining')}: <strong>~{activeNavRoute.estimatedMinutes} {t('mins')}</strong>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  activeNavRoute.overallRisk === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : activeNavRoute.overallRisk === 'RISKY'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {translateRoadStatus(activeNavRoute.overallRisk)}
                </span>
              </div>
            </div>
          </div>

          {/* FEATURE A: Live Navigation Simulator & Re-Route Controls */}
          <LiveNavigationPanel
            isNavigating={isNavigating}
            isPaused={isPaused}
            progress={progress}
            speedMultiplier={speedMultiplier}
            setSpeedMultiplier={setSpeedMultiplier}
            distanceTraveledKm={distanceTraveledKm}
            activeNavRoute={activeNavRoute}
            isRecalculating={isRecalculating}
            rerouteNotice={rerouteNotice}
            startNavigation={startNavigation}
            pauseNavigation={pauseNavigation}
            resumeNavigation={resumeNavigation}
            resetNavigation={resetNavigation}
            triggerSimulateRoadUpdate={triggerSimulateRoadUpdate}
            onResetRoads={handleResetRoads}
            modeLabel="Commuter Live Navigation"
          />

          {/* REROUTE & HAZARD WARNING BANNERS (When not already shown by live panel) */}
          {activeNavRoute.isReroutedDueToBlockade && activeNavRoute.blockedRoadName && !rerouteNotice && (
            <div className="bg-amber-50 border-2 border-amber-400/60 rounded-2xl p-4 text-amber-950 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <div className="font-extrabold text-sm text-amber-950">
                    {t('autoRerouteActiveTitle')}
                  </div>
                  <p className="mt-1">
                    {t('routeBlockedDesc', { road: activeNavRoute.blockedRoadName })}
                  </p>
                  {activeNavRoute.extraDistanceKm && activeNavRoute.extraDistanceKm > 0 ? (
                    <div className="mt-2 font-bold text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-lg inline-block">
                      {t('safeAlternateBypassSummary', {
                        km: activeNavRoute.extraDistanceKm,
                        mins: activeNavRoute.extraTimeMinutes
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {activeNavRoute.warningMessage && !activeNavRoute.isReroutedDueToBlockade && !rerouteNotice && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-950 text-xs shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{activeNavRoute.warningMessage}</span>
              </div>
            </div>
          )}

          {/* Turn-by-Turn Navigation Steps Panel with Live Step Tracking */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="font-extrabold text-sm text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700" />
                <span>{t('turnGuidance')}</span>
              </div>
              {isNavigating && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {currentStepIndex + 1} / {activeNavRoute.steps.length}
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
              {activeNavRoute.steps.map((step, idx) => {
                const isCurrentStep = isNavigating && idx === currentStepIndex;
                const isPastStep = isNavigating && idx < currentStepIndex;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isCurrentStep
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-200'
                        : isPastStep
                        ? 'bg-slate-50/60 border-slate-100 opacity-60'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isCurrentStep
                          ? 'bg-emerald-700 text-white animate-bounce'
                          : isPastStep
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPastStep ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`leading-snug ${isCurrentStep ? 'font-black text-emerald-950 text-[13px]' : 'font-semibold text-slate-800'}`}>
                        {step.instruction}
                      </div>
                      {step.hazardNote && (
                        <div className="text-[11px] text-amber-700 font-medium mt-1">
                          ⚠️ {step.hazardNote}
                        </div>
                      )}
                      {isCurrentStep && (
                        <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          <span>{t('currentDrivingStep')}</span>
                        </div>
                      )}
                    </div>
                    {step.distanceKm > 0 && (
                      <span className="text-[11px] font-mono text-slate-500 font-bold shrink-0">
                        {step.distanceKm} km
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Map with Route Highlight & Moving Marker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <MapComponent
              depots={depots}
              villages={villages}
              roadSegments={roadSegments}
              activeRoute={activeNavRoute}
              selectedSourceId={sourceId}
              selectedTargetId={targetId}
              role={role}
              requests={requests}
              travelerMarker={{
                position: currentCoord,
                bearing: currentBearing,
                isNavigating
              }}
              onSelectLocation={(loc) => {
                if (isNavigating) resetNavigation();
                setTargetId(loc.id);
              }}
              heightClass="h-[560px] sm:h-[660px]"
            />
          </div>
        </div>

      </div>

    </div>
  );
};

