import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  CheckCircle, 
  CheckCircle2,
  ChevronRight, 
  Clock, 
  Compass, 
  CornerDownRight, 
  Eye, 
  Flame, 
  Layers, 
  LifeBuoy, 
  MapPin, 
  Navigation, 
  Package, 
  Radio, 
  Send, 
  ShieldCheck, 
  Truck, 
  Zap,
  Boxes,
  Droplets,
  HeartPulse,
  Tent,
  BarChart3,
  Activity,
  Map as MapIcon,
  AlertOctagon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ALL_LOCATIONS, calculateRiskAwareRoute, INITIAL_ROAD_SEGMENTS } from '../data/nerGeography';
import { CalculatedRoute, Depot, EscalationLevel, ReliefRequest, RoadSegment, Village, ProviderInventoryItem } from '../types';
import { RESOURCE_METADATA } from '../data/initialData';
import { MapComponent } from './MapComponent';
import { useLiveNavigation } from '../hooks/useLiveNavigation';
import { LiveNavigationPanel } from './LiveNavigationPanel';

export const ResourceProviderView: React.FC = () => {
  const {
    depots,
    villages,
    roadSegments,
    userRequests,
    userInventory,
    checkResourceAvailability,
    updateInventoryStock,
    dispatchRequest,
    selectedRequestId,
    setSelectedRequestId,
    updateRoadStatus,
    role,
    currentUser
  } = useApp();

  const {
    t,
    translateResourceType,
    translateResourceCategory,
    translateUnit,
    translateDepotName,
    translateVillageName,
    translateDistrict,
    translateState,
    translateVehicle,
    translateHazard,
    translateFulfillment,
    translateTime,
    formatNumber,
    formatDate,
    translateRoadStatus,
    translateEscalationLevel,
    translateRequestStatus,
    translateUrgency
  } = useLanguage();

  // Active Provider View Sub-Tab: 'dashboard' (Operations Overview) | 'inventory' (Depot Stocks & Reserves) | 'map_dispatch' (Dispatch Queue & Navigation)
  const [providerSubTab, setProviderSubTab] = useState<'dashboard' | 'inventory' | 'map_dispatch'>('dashboard');

  // Active Assigned Depot: Authenticated provider identity is the source of truth
  const [selectedDepotId, setSelectedDepotId] = useState<string>(currentUser?.depotId || depots[0]?.id);

  useEffect(() => {
    if (currentUser?.depotId) {
      setSelectedDepotId(currentUser.depotId);
    }
  }, [currentUser?.depotId]);

  const activeDepot = depots.find(d => d.id === selectedDepotId) || depots[0];

  // Active Selected Target Village / Request
  const [selectedTargetVillageId, setSelectedTargetVillageId] = useState<string>(villages[0]?.id);
  const activeVillage = villages.find(v => v.id === selectedTargetVillageId) || villages[0];

  // Filter in operational queue for Map view: 'pending' | 'in_transit' | 'delivered' | 'all'
  const [queueTab, setQueueTab] = useState<'pending' | 'in_transit' | 'delivered' | 'all'>('pending');
  const [dashboardFilter, setDashboardFilter] = useState<'active' | 'in_transit' | 'pending' | 'delivered' | 'all'>('active');
  const [selectedRoadModal, setSelectedRoadModal] = useState<RoadSegment | null>(null);

  // Dispatch feedback banner state
  const [dispatchFeedback, setDispatchFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // Stock adjustment modal state
  const [editingStockItem, setEditingStockItem] = useState<ProviderInventoryItem | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>('');
  const [stockError, setStockError] = useState<string | null>(null);

  // Real-time counts for Live Operations Dashboard (strictly scoped to this depot)
  const activeDeliveriesCount = useMemo(() => {
    return userRequests.filter(r => r.status === 'MATCHED' || r.status === 'IN_TRANSIT').length;
  }, [userRequests]);

  const pendingMatchCount = useMemo(() => {
    return userRequests.filter(r => r.status === 'VERIFIED').length;
  }, [userRequests]);

  const deliveredTodayCount = useMemo(() => {
    return userRequests.filter(r => r.status === 'DELIVERED').length;
  }, [userRequests]);

  // At-risk deliveries: in-transit requests whose computed route encounters a Risky, Blocked, or Impassable road segment
  const atRiskDeliveries = useMemo(() => {
    return userRequests.filter(req => {
      if (req.status !== 'IN_TRANSIT' && req.status !== 'MATCHED') return false;
      const depotId = req.assignedDepotId || selectedDepotId;
      const route = calculateRiskAwareRoute(depotId, req.villageId, roadSegments, ALL_LOCATIONS);
      return (
        route.overallRisk === 'RISKY' ||
        route.overallRisk === 'BLOCKED' ||
        route.overallRisk === 'IMPASSABLE' ||
        route.segments.some(s => s.status !== 'OPEN')
      );
    });
  }, [userRequests, selectedDepotId, roadSegments]);

  const atRiskDeliveriesCount = atRiskDeliveries.length;

  // Filter verified / active requests for Map View (strictly scoped to this depot)
  const activeOperationalRequests = useMemo(() => {
    return userRequests.filter(r => {
      if (queueTab === 'pending') return r.status === 'VERIFIED';
      if (queueTab === 'in_transit') return r.status === 'IN_TRANSIT';
      if (queueTab === 'delivered') return r.status === 'DELIVERED';
      return r.status !== 'REJECTED';
    });
  }, [userRequests, queueTab]);

  // Filtered requests for the Live Operations Dashboard list (strictly scoped to this depot)
  const dashboardRequests = useMemo(() => {
    return userRequests.filter(r => {
      if (dashboardFilter === 'active') return r.status === 'IN_TRANSIT' || r.status === 'MATCHED' || r.status === 'VERIFIED';
      if (dashboardFilter === 'in_transit') return r.status === 'IN_TRANSIT';
      if (dashboardFilter === 'pending') return r.status === 'VERIFIED';
      if (dashboardFilter === 'delivered') return r.status === 'DELIVERED';
      return r.status !== 'REJECTED';
    });
  }, [userRequests, dashboardFilter]);

  // Current calculated base route for the selected source depot + target village
  const baseCalculatedRoute: CalculatedRoute = useMemo(() => {
    return calculateRiskAwareRoute(
      selectedDepotId,
      selectedTargetVillageId,
      roadSegments,
      ALL_LOCATIONS
    );
  }, [selectedDepotId, selectedTargetVillageId, roadSegments]);

  // Live Navigation Hook for Provider Dispatch Tracking (Feature A)
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
    allLocations: ALL_LOCATIONS,
    targetId: selectedTargetVillageId,
    updateRoadStatus
  });

  // Handle selecting a request from the list
  const handleSelectRequest = (req: ReliefRequest) => {
    if (isNavigating) resetNavigation();
    setSelectedRequestId(req.id);
    setSelectedTargetVillageId(req.villageId);
    if (req.assignedDepotId) {
      setSelectedDepotId(req.assignedDepotId);
    }
  };

  const handleJumpToMapWithRequest = (req: ReliefRequest) => {
    handleSelectRequest(req);
    setProviderSubTab('map_dispatch');
  };

  const handleResetRoads = () => {
    INITIAL_ROAD_SEGMENTS.forEach(r => {
      updateRoadStatus(r.id, r.status, r.hazardReason);
    });
    resetNavigation();
  };

  // Helper to render plain-language escalation level badge
  const renderEscalationBadge = (level: EscalationLevel, relayKm?: number, relayMethod?: string) => {
    if (level === 'LEVEL_1_VEHICLE') {
      return (
        <div className="bg-blue-600/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-900 flex items-start gap-2 text-xs font-semibold">
          <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>{t('escLevel1VehicleDesc')}</span>
        </div>
      );
    }
    if (level === 'LEVEL_2_RELAY') {
      return (
        <div className="bg-amber-600/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-900 flex items-start gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{t('escLevel2RelayDesc', { km: relayKm || 8, method: relayMethod || 'boat / porter' })}</span>
        </div>
      );
    }
    return (
      <div className="bg-red-600/10 p-2.5 rounded-lg border border-red-500/20 text-red-900 flex items-start gap-2 text-xs font-semibold">
        <Zap className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <span>{t('escLevel3AirdropDesc')}</span>
      </div>
    );
  };

  // Handle dispatch execution with inventory checking and feedback
  const handleExecuteDispatch = (req: ReliefRequest, depotId: string, customAmount?: number) => {
    const res = dispatchRequest(req.id, depotId, '4x4 Relief Unit (AS-01-T-8821)', customAmount);
    if (res.success) {
      setDispatchFeedback({
        type: res.shortage > 0 ? 'warning' : 'success',
        message: res.shortage > 0
          ? t('partialDispatchedMessage', { allocated: formatNumber(res.allocated), shortage: formatNumber(res.shortage) })
          : t('dispatchedMessage', { count: formatNumber(res.allocated) })
      });
    } else {
      setDispatchFeedback({
        type: 'error',
        message: res.message
      });
    }
  };

  // Open stock adjustment modal
  const handleOpenStockModal = (item: ProviderInventoryItem) => {
    setEditingStockItem(item);
    setNewStockValue(item.totalStock.toString());
    setStockError(null);
  };

  // Save stock adjustment
  const handleSaveStockModal = () => {
    if (!editingStockItem) return;
    const parsed = parseInt(newStockValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setStockError(t('stockQuantityMustBeNonNegative'));
      return;
    }
    if (parsed < editingStockItem.reservedQuantity) {
      setStockError(
        t('cannotReduceStockBelowReserved', { reserved: formatNumber(editingStockItem.reservedQuantity) })
      );
      return;
    }
    const result = updateInventoryStock(editingStockItem.id, parsed);
    if (!result.success) {
      setStockError(result.error || t('failedToUpdateStock'));
      return;
    }
    setDispatchFeedback({
      type: 'success',
      message: t('inventoryUpdatedSuccess', {
        resource: translateResourceType(editingStockItem.resourceName),
        depot: translateDepotName(editingStockItem.depotName),
        total: formatNumber(parsed),
        unit: translateUnit(editingStockItem.unit),
        available: formatNumber(parsed - editingStockItem.reservedQuantity)
      })
    });
    setEditingStockItem(null);
  };

  // Filtered Inventory list: Strictly scoped to the authenticated provider's assigned depot
  const filteredInventory = userInventory;

  // Overall inventory metrics for this assigned depot
  const totalStockUnits = useMemo(() => userInventory.reduce((a, c) => a + c.totalStock, 0), [userInventory]);
  const totalReservedUnits = useMemo(() => userInventory.reduce((a, c) => a + c.reservedQuantity, 0), [userInventory]);
  const totalAvailableUnits = useMemo(() => userInventory.reduce((a, c) => a + c.availableQuantity, 0), [userInventory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Header & Alert Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
              {t('providerTitle')}
            </span>
            <span className="text-xs text-slate-500 font-medium">{t('providerSub')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {t('operationsOverview')}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs text-slate-600">
            <span>{t('commanderLabel')}: <strong>{currentUser?.name || activeDepot.commanderName}</strong></span>
            <span>•</span>
            <span>{t('userIdLabel')}: <strong className="font-mono text-slate-800">{currentUser?.userId || 'usr-prov'}</strong></span>
            <span>•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
              🔒 {t('scopedToLabel', { depot: translateDepotName(activeDepot.name) })}
            </span>
          </div>
        </div>

        {/* Active Assigned Depot Identity Badge */}
        <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs text-xs">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{t('logisticsBaseLabel')}</div>
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{translateDepotName(activeDepot.name)}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">{activeDepot.code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Sub-Navigation Tabs: Live Operations Dashboard vs Inventory vs Dispatch & Map */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setProviderSubTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            providerSubTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
              : 'bg-white text-slate-600 hover:text-blue-700 border border-slate-200 hover:bg-blue-50/50'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${providerSubTab === 'dashboard' ? 'text-white' : 'text-blue-600'}`} />
          <span>{t('operationsOverview')}</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${providerSubTab === 'dashboard' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
            {formatNumber(activeDeliveriesCount)} {t('activeDispatches')}
          </span>
        </button>

        <button
          onClick={() => setProviderSubTab('inventory')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            providerSubTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
              : 'bg-white text-slate-600 hover:text-blue-700 border border-slate-200 hover:bg-blue-50/50'
          }`}
        >
          <Boxes className={`w-4 h-4 ${providerSubTab === 'inventory' ? 'text-white' : 'text-blue-600'}`} />
          <span>{t('depotStocksReserves')}</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${providerSubTab === 'inventory' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
            {formatNumber(totalAvailableUnits)} {t('stockAvailable')}
          </span>
        </button>

        <button
          onClick={() => setProviderSubTab('map_dispatch')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            providerSubTab === 'map_dispatch'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
              : 'bg-white text-slate-600 hover:text-blue-700 border border-slate-200 hover:bg-blue-50/50'
          }`}
        >
          <MapIcon className={`w-4 h-4 ${providerSubTab === 'map_dispatch' ? 'text-white' : 'text-blue-600'}`} />
          <span>{t('dispatchQueueNav')}</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${providerSubTab === 'map_dispatch' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {formatNumber(activeOperationalRequests.length)}
          </span>
        </button>
      </div>

      {/* Real-Time Dispatch / Stock Update Feedback Alert Banner */}
      {dispatchFeedback && (
        <div className={`mb-5 p-4 rounded-2xl border shadow-xs flex items-start justify-between gap-3 text-xs font-semibold animate-in fade-in ${
          dispatchFeedback.type === 'success'
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : dispatchFeedback.type === 'warning'
            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
            : 'bg-rose-50/90 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-start gap-2.5">
            {dispatchFeedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {dispatchFeedback.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {dispatchFeedback.type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            <div>
              <div className="font-extrabold text-sm tracking-tight">{dispatchFeedback.message}</div>
              {dispatchFeedback.details && (
                <div className="text-[11px] text-slate-600 mt-0.5 font-normal">{dispatchFeedback.details}</div>
              )}
            </div>
          </div>
          <button
            onClick={() => setDispatchFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-0.5 rounded-lg hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: LIVE OPERATIONS DASHBOARD */}
      {providerSubTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top 4 Summary Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. ACTIVE DELIVERIES */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {t('activeDeliveriesLabel')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {formatNumber(activeDeliveriesCount)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>{t('activeDeliveriesDesc')}</span>
              </div>
            </div>

            {/* 2. PENDING MATCH */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {t('pendingMatchLabel')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {formatNumber(pendingMatchCount)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{t('pendingMatchDesc')}</span>
              </div>
            </div>

            {/* 3. DELIVERED TODAY */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {t('deliveredTodayLabel')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-blue-700 mt-2">
                {formatNumber(deliveredTodayCount)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{t('deliveredTodayDesc')}</span>
              </div>
            </div>

            {/* 4. AT-RISK DELIVERIES */}
            <div className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden ${
              atRiskDeliveriesCount > 0 
                ? 'bg-rose-50/50 border-rose-200 text-rose-950' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${atRiskDeliveriesCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                  {t('atRiskDeliveriesLabel')}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  atRiskDeliveriesCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-3xl font-black mt-2 ${atRiskDeliveriesCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {formatNumber(atRiskDeliveriesCount)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${atRiskDeliveriesCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`}></span>
                <span>{atRiskDeliveriesCount > 0 ? t('atRiskEnRouteDesc') : t('allClearDesc')}</span>
              </div>
            </div>

          </div>

          {/* Active Deliveries Live Overview Card & Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Header & Filter Controls */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>{t('realtimeOperationsRoster')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('realtimeOperationsRosterDesc')}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  onClick={() => setDashboardFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dashboardFilter === 'active' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('filterActive')} ({formatNumber(userRequests.filter(r => r.status === 'IN_TRANSIT' || r.status === 'MATCHED' || r.status === 'VERIFIED').length)})
                </button>
                <button
                  onClick={() => setDashboardFilter('in_transit')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dashboardFilter === 'in_transit' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('filterInTransit')} ({formatNumber(userRequests.filter(r => r.status === 'IN_TRANSIT').length)})
                </button>
                <button
                  onClick={() => setDashboardFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dashboardFilter === 'pending' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('filterPending')} ({formatNumber(userRequests.filter(r => r.status === 'VERIFIED').length)})
                </button>
                <button
                  onClick={() => setDashboardFilter('delivered')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dashboardFilter === 'delivered' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t('filterDelivered')} ({formatNumber(deliveredTodayCount)})
                </button>
              </div>
            </div>

            {/* Active Deliveries Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">{t('colMissionAndVillage')}</th>
                    <th className="px-5 py-3.5">{t('colResourceUrgency')}</th>
                    <th className="px-5 py-3.5">{t('colCurrentStage')}</th>
                    <th className="px-5 py-3.5">{t('colStagingTransport')}</th>
                    <th className="px-5 py-3.5">{t('colRouteHazard')}</th>
                    <th className="px-5 py-3.5 text-right">{t('colProviderAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {dashboardRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">
                        {t('noRequestsInFilter')}
                      </td>
                    </tr>
                  ) : (
                    dashboardRequests.map(req => {
                      // Check route risk
                      const reqDepotId = req.assignedDepotId || selectedDepotId;
                      const targetDepot = depots.find(d => d.id === reqDepotId) || activeDepot;
                      const reqRoute = calculateRiskAwareRoute(reqDepotId, req.villageId, roadSegments, ALL_LOCATIONS);
                      const isRouteRisky = reqRoute.overallRisk !== 'OPEN';

                      // Check inventory matching against assigned staging base
                      const matchCheck = checkResourceAvailability(
                        targetDepot.id,
                        req.resourceType,
                        req.requestedUnits || 1
                      );

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          
                          {/* Code & Village */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-700">{req.trackingCode}</span>
                              {req.autoDetected && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                  {t('autoDetectedBadge')}
                                </span>
                              )}
                            </div>
                            <div className="font-extrabold text-slate-900 mt-0.5">
                              {translateVillageName(req.villageName)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {translateDistrict(req.district)}, {translateState(req.state)}
                            </div>
                          </td>

                          {/* Resource & Stock Matching */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900">{translateResourceType(req.resourceType)}</div>
                            <div className="text-xs text-slate-600 mt-0.5 font-medium">
                              {t('requestedLabel')}: <strong>{formatNumber(req.requestedUnits || req.quantity)} {translateUnit(req.unitLabel || t('units'))}</strong>
                            </div>

                            {/* Inventory Availability & Shortage breakdown */}
                            {req.status === 'VERIFIED' ? (
                              <div className="mt-1.5">
                                {matchCheck.isFull ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    <CheckCircle className="w-3 h-3 text-blue-600 shrink-0" />
                                    <span>{t('fullStockAvailableWithCount', { count: formatNumber(matchCheck.available), unit: translateUnit(matchCheck.unit) })}</span>
                                  </span>
                                ) : matchCheck.isPartial ? (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-[11px] text-amber-950 font-semibold space-y-0.5">
                                    <div className="flex items-center gap-1 text-amber-900 font-extrabold">
                                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>{t('partialStockWithCount', { available: formatNumber(matchCheck.available), requested: formatNumber(req.requestedUnits || 0), unit: translateUnit(matchCheck.unit) })}</span>
                                    </div>
                                    <div className="text-rose-700 font-bold">
                                      {t('shortageWithCount', { count: formatNumber(matchCheck.shortage), unit: translateUnit(matchCheck.unit) })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5 text-[11px] text-rose-950 font-semibold space-y-0.5">
                                    <div className="flex items-center gap-1 text-rose-800 font-extrabold">
                                      <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>{t('stockDepletedWithCount')}</span>
                                    </div>
                                    <div className="text-rose-700 text-[10px]">
                                      {t('shortageWithCount', { count: formatNumber(req.requestedUnits || 0), unit: translateUnit(matchCheck.unit) })}
                                    </div>
                                    {matchCheck.alternativeDepots.length > 0 && (
                                      <div className="text-[10px] text-slate-600 font-normal">
                                        {t('alternativeDepots')} {matchCheck.alternativeDepots.map(a => `${translateDepotName(a.depotName)}: ${formatNumber(a.available)}`).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : req.status === 'IN_TRANSIT' ? (
                              <div className="mt-1.5 text-[11px]">
                                <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                                  <span>{t('allocatedWithCount', { count: formatNumber(req.allocatedUnits || 0), unit: translateUnit(req.unitLabel || t('units')) })}</span>
                                </span>
                                {req.fulfillmentStatus === 'PARTIAL' && (
                                  <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                                    ⚠️ {t('shortageLoggedNote', { shortage: formatNumber(req.shortageUnits || 0) })}
                                  </div>
                                )}
                              </div>
                            ) : req.status === 'DELIVERED' ? (
                              <div className="mt-1.5 text-[11px]">
                                <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                                  <span>{t('deliveredWithCount', { count: formatNumber(req.allocatedUnits || 0), unit: translateUnit(req.unitLabel || t('units')) })}</span>
                                </span>
                                {req.fulfillmentStatus === 'PARTIAL' && (
                                  <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                                    ⚠️ {t('partialDispatchedMessage', { allocated: formatNumber(req.allocatedUnits || 0), shortage: formatNumber(req.shortageUnits || 0) })}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-1.5 ${
                              req.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {translateUrgency(req.urgency)}
                            </span>
                          </td>

                          {/* Stage */}
                          <td className="px-5 py-4">
                            {req.status === 'DELIVERED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span>{translateRequestStatus('DELIVERED')}</span>
                              </span>
                            ) : req.status === 'IN_TRANSIT' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>{translateRequestStatus('IN_TRANSIT')}</span>
                              </span>
                            ) : req.status === 'MATCHED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Package className="w-3.5 h-3.5 text-amber-600" />
                                <span>{translateRequestStatus('MATCHED')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{translateRequestStatus('VERIFIED')}</span>
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              {req.status === 'DELIVERED' 
                                ? translateTime(req.deliveredTime) 
                                : req.status === 'IN_TRANSIT' 
                                ? t('dispatchedAtTimeNote', { time: translateTime(req.dispatchedTime) || '' }) 
                                : t('verifiedByNote', { verifier: translateTime(req.verifiedTime || req.submissionTime) || '' })}
                            </div>
                          </td>

                          {/* Staging Depot / Transport */}
                          <td className="px-5 py-4 text-xs">
                            <div className="font-bold text-slate-800">
                              {translateDepotName(req.assignedDepotName) || translateDepotName(targetDepot.name)}
                            </div>
                            <div className="text-slate-500 mt-0.5 text-[11px]">
                              {translateVehicle(req.assignedVehicle || '4x4 Relief Unit (AS-01-T-8821)')}
                            </div>
                            <div className="text-slate-400 font-mono text-[10px] mt-0.5">
                              {t('estimatedTransitTimeLabel')}: ~{formatNumber(req.estimatedDriveTimeMins || reqRoute.estimatedMinutes)} {t('mins')} ({formatNumber(req.totalDistanceKm || reqRoute.totalDistanceKm)} {t('km')})
                            </div>
                          </td>

                          {/* Route Hazard Status */}
                          <td className="px-5 py-4 text-xs">
                            {isRouteRisky ? (
                              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold text-[11px]">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{t('hazardBypassActive')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold text-[11px]">
                                <Check className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>{t('clearRoadCorridor')}</span>
                              </span>
                            )}
                            {req.escalationLevel !== 'LEVEL_1_VEHICLE' && (
                              <div className="text-[10px] font-bold text-blue-700 mt-1">
                                {req.escalationLevel === 'LEVEL_2_RELAY' ? t('relayMethodTag', { method: req.relayMethod?.toUpperCase() || 'RELAY' }) : t('airdropEscalationTag')}
                              </div>
                            )}
                          </td>

                          {/* Action Column */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'IN_TRANSIT' ? (
                                <div className="text-right">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                                    <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                    <span>{translateRequestStatus('IN_TRANSIT')}</span>
                                  </span>
                                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                    {t('awaitingConfirmation')}
                                  </div>
                                </div>
                              ) : req.status === 'VERIFIED' ? (
                                matchCheck.isUnavailable ? (
                                  <button
                                    disabled
                                    className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                                    title={t('zeroStockCannotAssign', { resource: translateResourceType(req.resourceType) })}
                                  >
                                    <AlertOctagon className="w-3 h-3 text-slate-400" />
                                    <span>{t('stockDepletedBtn')}</span>
                                  </button>
                                ) : matchCheck.isPartial ? (
                                  <button
                                    onClick={() => handleExecuteDispatch(req, targetDepot.id)}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                                    title={t('allocateAvailableLogShortage', { available: formatNumber(matchCheck.canFulfill), shortage: formatNumber(matchCheck.shortage) })}
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{t('dispatchPartialBtn')} ({formatNumber(matchCheck.canFulfill)})</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleExecuteDispatch(req, targetDepot.id)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{t('acceptDispatchBtn')}</span>
                                  </button>
                                )
                              ) : req.status === 'DELIVERED' ? (
                                <div className="text-right">
                                  <span className="text-xs text-blue-700 font-bold flex items-center gap-1 justify-end">
                                    <Check className="w-3.5 h-3.5" /> {t('handoverComplete')}
                                  </span>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {req.confirmedBy ? t('confirmedByNote', { name: req.confirmedBy }) : t('deliveredAtNote', { time: translateTime(req.deliveredTime) || '' })}
                                  </div>
                                </div>
                              ) : null}

                              <button
                                onClick={() => handleJumpToMapWithRequest(req)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                                title={t('inspectRouteBtn')}
                              >
                                <Compass className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Dashboard Footer Summary */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>{t('showingMissionsCount', { count: formatNumber(dashboardRequests.length) })}</span>
              <span className="font-semibold text-slate-700">{t('disasterStagingNode', { code: activeDepot.code })}</span>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PROVIDER INVENTORY & DEPOT STOCKS */}
      {providerSubTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Inventory Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Managed Stock */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {t('totalInventoryStockLabel')}
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {formatNumber(totalStockUnits)}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t('totalStockDesc')}
              </p>
            </div>

            {/* Card 2: Reserved in Active Missions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                  {t('reservedInMissionsLabel')}
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-amber-600 mt-2 font-mono">
                {formatNumber(totalReservedUnits)}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t('reservedInMissionsDesc')}
              </p>
            </div>

            {/* Card 3: Immediately Available */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                  {t('immediatelyAvailableLabel')}
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-blue-600 mt-2 font-mono">
                {formatNumber(totalAvailableUnits)}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t('immediatelyAvailableDesc')}
              </p>
            </div>

            {/* Card 4: Operating Bases */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {t('activeStagingHubsLabel')}
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-blue-900 mt-2 font-mono">
                {formatNumber(depots.length)}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {t('stagingHubsDesc')}
              </p>
            </div>
          </div>

          {/* Inventory Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-blue-600" />
                  <span>{t('depotInventoryLedgerTitle')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('availableCalculationHint')}
                </p>
              </div>

              {/* Staging Base Indicator - Strictly scoped to this depot */}
              <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="font-bold text-blue-950">{t('assignedStagingBaseLabel')}:</span>
                <span className="font-extrabold text-blue-800">{translateDepotName(activeDepot.name)}</span>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                  {t('categoriesCount', { count: formatNumber(filteredInventory.length) })}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">{t('colResourceCategory')}</th>
                    <th className="px-5 py-3.5">{t('colStagingDepot')}</th>
                    <th className="px-5 py-3.5">{t('colTotalStock')}</th>
                    <th className="px-5 py-3.5">{t('colReservedQuantity')}</th>
                    <th className="px-5 py-3.5">{t('colAvailableForDispatch')}</th>
                    <th className="px-5 py-3.5">{t('colLastStockAudit')}</th>
                    <th className="px-5 py-3.5 text-right">{t('colAdjustment')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-xs">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-slate-700">{t('noInventoryRecords')}</div>
                        <p className="text-slate-400 text-[11px] max-w-sm mx-auto mt-0.5">
                          {t('noInventoryRecordsDesc', { depot: translateDepotName(activeDepot.name) })}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => {
                    const availPct = item.totalStock > 0 ? Math.round((item.availableQuantity / item.totalStock) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Resource */}
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-slate-900">{translateResourceType(item.resourceName)}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                              {translateResourceCategory(item.category)}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {t('units')}: {translateUnit(item.unit)}
                            </span>
                          </div>
                        </td>

                        {/* Staging Depot */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">{translateDepotName(item.depotName)}</div>
                          <div className="text-[11px] text-slate-500">{translateDistrict(activeDepot.district)}, {translateState(activeDepot.state)}</div>
                        </td>

                        {/* Total Stock */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-sm font-extrabold text-slate-900">
                            {formatNumber(item.totalStock)}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">{translateUnit(item.unit)}</span>
                        </td>

                        {/* Reserved Quantity */}
                        <td className="px-5 py-4">
                          <span className={`font-mono text-sm font-extrabold ${item.reservedQuantity > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {formatNumber(item.reservedQuantity)}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">{translateUnit(item.unit)}</span>
                          {item.reservedQuantity > 0 && (
                            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              {t('inActiveTransitNote')}
                            </div>
                          )}
                        </td>

                        {/* Available Quantity */}
                        <td className="px-5 py-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`font-mono text-base font-extrabold ${
                              item.availableQuantity === 0 ? 'text-rose-600' : item.availableQuantity < 50 ? 'text-amber-600' : 'text-blue-700'
                            }`}>
                              {formatNumber(item.availableQuantity)}
                            </span>
                            <span className="text-xs text-slate-500">{translateUnit(item.unit)}</span>
                          </div>
                          
                          {/* Availability visual bar */}
                          <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.availableQuantity === 0
                                  ? 'bg-rose-500'
                                  : availPct < 30
                                  ? 'bg-amber-500'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${availPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {t('pctAvailableNote', { percent: formatNumber(availPct) })}
                          </span>
                        </td>

                        {/* Last Update */}
                        <td className="px-5 py-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{translateTime(item.lastUpdated)}</span>
                          </div>
                        </td>

                        {/* Action: Stock adjustment */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleOpenStockModal(item)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            {t('adjustStockBtn')}
                          </button>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>{t('showingResourceLines', { count: formatNumber(filteredInventory.length) })}</span>
              <span className="text-slate-600 font-semibold">{t('zeroDoubleAllocation')}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCH QUEUE & LIVE NAVIGATION MAP (Existing 2-Column Interface) */}
      {providerSubTab === 'map_dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* LEFT COLUMN: Incoming Verified Requests & Live Navigation (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Requests Queue Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-700" />
                  <span>{t('operationalRequisitionsQueue')}</span>
                </div>

                {/* Queue Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    onClick={() => setQueueTab('pending')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      queueTab === 'pending'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('filterPending')} ({userRequests.filter(r => r.status === 'VERIFIED').length})
                  </button>
                  <button
                    onClick={() => setQueueTab('in_transit')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      queueTab === 'in_transit'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('filterInTransit')} ({userRequests.filter(r => r.status === 'IN_TRANSIT').length})
                  </button>
                  <button
                    onClick={() => setQueueTab('delivered')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      queueTab === 'delivered'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('filterDelivered')} ({deliveredTodayCount})
                  </button>
                </div>
              </div>

              {/* Request Cards List */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {activeOperationalRequests.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    {t('noOperationalRequests')}
                  </div>
                ) : (
                  activeOperationalRequests.map(req => {
                    const isSelected = selectedTargetVillageId === req.villageId;
                    return (
                      <div
                        key={req.id}
                        onClick={() => handleSelectRequest(req)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-100'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-600">{req.trackingCode}</span>
                              {req.autoDetected && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                  {t('autoDetectedBadge')}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                req.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {translateUrgency(req.urgency)}
                              </span>
                            </div>
                            <div className="font-extrabold text-sm text-slate-900 mt-1">
                              {translateVillageName(req.villageName)}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              <strong>{t('requestedLabel')}:</strong> {translateResourceType(req.resourceType)} ({formatNumber(req.requestedUnits || req.quantity)} {translateUnit(req.unitLabel || 'units')})
                            </div>

                            {/* Inventory availability indicator */}
                            {(() => {
                              const matchCheck = checkResourceAvailability(
                                activeDepot.id,
                                req.resourceType,
                                req.requestedUnits || 1
                              );
                              if (req.status === 'VERIFIED') {
                                return (
                                  <div className="mt-1">
                                    {matchCheck.isFull ? (
                                      <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                        {t('availableAtBaseCount', { count: formatNumber(matchCheck.available) })}
                                      </span>
                                    ) : matchCheck.isPartial ? (
                                      <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        {t('partialAtBaseCount', { available: formatNumber(matchCheck.available), shortage: formatNumber(matchCheck.shortage) })}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                        {t('outOfStockAtBase')}
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                              if (req.status === 'IN_TRANSIT') {
                                return (
                                  <div className="mt-1 text-[11px] font-semibold text-blue-800">
                                    {t('allocatedWithCount', { count: formatNumber(req.allocatedUnits || 0), unit: translateUnit(req.unitLabel || 'units') })} {req.fulfillmentStatus === 'PARTIAL' ? `(⚠️ ${t('shortage')}: ${formatNumber(req.shortageUnits || 0)})` : '✅ Full'}
                                  </div>
                                );
                              }
                              if (req.status === 'DELIVERED') {
                                return (
                                  <div className="mt-1 text-[11px] font-semibold text-blue-800">
                                    {t('deliveredWithCount', { count: formatNumber(req.allocatedUnits || 0), unit: translateUnit(req.unitLabel || 'units') })} {req.fulfillmentStatus === 'PARTIAL' ? `(⚠️ Partial: ${formatNumber(req.shortageUnits || 0)} shortage)` : '✅ Full'}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {formatNumber(req.totalDistanceKm || 45)} {t('km')}
                            </span>
                          </div>
                        </div>

                        {/* Escalation Level */}
                        <div className="mt-2.5">
                          {renderEscalationBadge(req.escalationLevel, req.relayDistanceKm, req.relayMethod)}
                        </div>

                        {/* Action Button: Dispatch or Confirm Delivery */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500">
                            {req.status === 'DELIVERED'
                              ? `✅ ${t('deliveredAtNote', { time: translateTime(req.deliveredTime) || '' })}`
                              : req.status === 'IN_TRANSIT'
                              ? t('dispatchedAtTimeNote', { time: translateTime(req.dispatchedTime) || '' })
                              : t('verifiedByNote', { verifier: req.verifiedBy || 'DDMA' })}
                          </span>

                          {req.status === 'VERIFIED' ? (
                            (() => {
                              const matchCheck = checkResourceAvailability(
                                activeDepot.id,
                                req.resourceType,
                                req.requestedUnits || 1
                              );
                              if (matchCheck.isUnavailable) {
                                return (
                                  <button
                                    disabled
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed border border-slate-200"
                                    title={`No stock available at ${translateDepotName(activeDepot.name)}`}
                                  >
                                    <span>{t('stockDepletedBtn')}</span>
                                  </button>
                                );
                              }
                              if (matchCheck.isPartial) {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExecuteDispatch(req, activeDepot.id);
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                                    title={`Allocate all ${matchCheck.canFulfill} available units; log ${matchCheck.shortage} shortage`}
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{t('dispatchPartialBtn')} ({formatNumber(matchCheck.canFulfill)})</span>
                                  </button>
                                );
                              }
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExecuteDispatch(req, activeDepot.id);
                                  }}
                                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>{t('acceptDispatchBtn')}</span>
                                </button>
                              );
                            })()
                          ) : req.status === 'IN_TRANSIT' ? (
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>{translateRequestStatus('IN_TRANSIT')}</span>
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                {t('receiverSignoffRequired')}
                              </div>
                            </div>
                          ) : req.status === 'DELIVERED' ? (
                            <div className="text-right">
                              <span className="text-xs text-blue-700 font-bold flex items-center gap-1 justify-end">
                                <Check className="w-3.5 h-3.5" /> {t('handoverComplete')}
                              </span>
                              {req.confirmedBy && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {t('confirmedByNote', { name: req.confirmedBy })}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* FEATURE A: Live Navigation Simulator & Mid-Journey Reroute Controls */}
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
              modeLabel={t('dispatchConvoyNavMode')}
            />

            {/* Working Navigation Step-by-Step Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-700" />
                  <span>{t('turnGuidance')}</span>
                </div>
                <div className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  {formatNumber(activeNavRoute.totalDistanceKm)} {t('km')} • ~{formatNumber(activeNavRoute.estimatedMinutes)} {t('mins')}
                </div>
              </div>

              {/* Route Summary Metrics */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span><strong>{t('origin')}:</strong> {translateDepotName(activeNavRoute.sourceName)}</span>
                  <span><strong>{t('destination')}:</strong> {translateVillageName(activeNavRoute.targetName)}</span>
                </div>

                {activeNavRoute.warningMessage && !rerouteNotice && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold mb-2.5 flex items-start gap-2 ${
                    activeNavRoute.overallRisk === 'IMPASSABLE'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{activeNavRoute.warningMessage}</span>
                  </div>
                )}
              </div>

              {/* Steps List with Live Step Highlighting */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {activeNavRoute.steps.map((step, idx) => {
                  const isCurrentStep = isNavigating && idx === currentStepIndex;
                  const isPastStep = isNavigating && idx < currentStepIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                        isCurrentStep
                          ? 'bg-blue-50 border-blue-500 shadow-xs ring-2 ring-blue-200'
                          : isPastStep
                          ? 'bg-slate-50/60 border-slate-100 opacity-60'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                          isCurrentStep
                            ? 'bg-blue-600 text-white animate-bounce'
                            : isPastStep
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isPastStep ? '✓' : formatNumber(idx + 1)}
                      </div>
                      <div className="flex-1">
                        <div className={`leading-snug ${isCurrentStep ? 'font-black text-blue-950' : 'font-semibold text-slate-800'}`}>
                          {step.instruction}
                        </div>
                        {step.hazardNote && (
                          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                            ⚠️ {step.hazardNote}
                          </div>
                        )}
                      </div>
                      {step.distanceKm > 0 && (
                        <span className="text-[11px] font-mono text-slate-500 font-bold shrink-0">
                          {formatNumber(step.distanceKm)} {t('km')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Operational Map with Feature B Stock/Need Indicators (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Destination Selector Bar & Get Route Action */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
                  {t('targetVillageLabel')}
                </span>
                <select
                  value={selectedTargetVillageId}
                  onChange={(e) => {
                    if (isNavigating) resetNavigation();
                    setSelectedTargetVillageId(e.target.value);
                  }}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>
                      {translateVillageName(v.name)} ({v.riskZone} {t('zone')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (isNavigating) resetNavigation();
                    setSelectedTargetVillageId(selectedTargetVillageId);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t('drawHighlightRouteBtn')}</span>
                </button>
              </div>
            </div>

            {/* Interactive Map with Feature B Visual Badges & Moving Vehicle */}
            <div className="relative">
              <MapComponent
                depots={depots}
                villages={villages}
                roadSegments={roadSegments}
                activeRoute={activeNavRoute}
                selectedSourceId={selectedDepotId}
                selectedTargetId={selectedTargetVillageId}
                role={role}
                requests={userRequests}
                travelerMarker={{
                  position: currentCoord,
                  bearing: currentBearing,
                  isNavigating
                }}
                onSelectLocation={(loc) => {
                  if (isNavigating) resetNavigation();
                  if (loc.type === 'depot') setSelectedDepotId(loc.id);
                  if (loc.type === 'village') setSelectedTargetVillageId(loc.id);
                }}
                onSelectRoad={(road) => setSelectedRoadModal(road)}
                heightClass="h-[540px] sm:h-[640px]"
              />
            </div>

          </div>

        </div>
      )}

      {/* Stock Adjustment / Restock Modal */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <span>{t('updateInventoryTitle')}</span>
              </div>
              <button
                onClick={() => setEditingStockItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-1.5 py-0.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{translateResourceType(editingStockItem.resourceName)}</div>
                <div className="text-slate-600">{translateDepotName(editingStockItem.depotName)}</div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span>{t('currentTotalLabel')}: <strong>{formatNumber(editingStockItem.totalStock)} {translateUnit(editingStockItem.unit)}</strong></span>
                  <span className="text-amber-700">{t('currentReservedUnitsLabel')}: <strong>{formatNumber(editingStockItem.reservedQuantity)} {translateUnit(editingStockItem.unit)}</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('totalPhysicalStockLabel')}:
                </label>
                <input
                  type="number"
                  min={editingStockItem.reservedQuantity}
                  value={newStockValue}
                  onChange={(e) => {
                    setNewStockValue(e.target.value);
                    setStockError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder={t('enterNonNegativeStockPlaceholder')}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {t('mustBeAtLeastReservedHint', { reserved: formatNumber(editingStockItem.reservedQuantity) })}
                </p>
              </div>

              {/* Real-time calculation preview */}
              {(() => {
                const parsed = parseInt(newStockValue, 10);
                const isValid = !isNaN(parsed) && parsed >= editingStockItem.reservedQuantity;
                const newAvailable = isValid ? parsed - editingStockItem.reservedQuantity : 0;
                return (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                    <div className="text-[11px] text-slate-600 font-medium">{t('previewNewAvailableStock')}</div>
                    <div className="font-mono text-base font-extrabold text-blue-800">
                      {isValid ? `${formatNumber(newAvailable)} ${translateUnit(editingStockItem.unit)}` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t('stockFormulaExplanation', { total: formatNumber(parsed || 0), reserved: formatNumber(editingStockItem.reservedQuantity), available: isValid ? formatNumber(newAvailable) : '0' })}
                    </div>
                  </div>
                );
              })()}

              {stockError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{stockError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingStockItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveStockModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                {t('saveUpdatedStockBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

