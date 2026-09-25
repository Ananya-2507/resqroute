// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  Polyline,
  useMap
} from '@vis.gl/react-google-maps';
import { useLanguage } from '../context/LanguageContext';
import {
  CalculatedRoute,
  Depot,
  LocationPoint,
  ReliefRequest,
  RoadSegment,
  RoadStatus,
  UserRole,
  Village
} from '../types';
import {
  Car,
  RotateCcw,
  Navigation,
  AlertTriangle,
  Layers,
  MapPin,
  Building2,
  PackageCheck,
  ShieldAlert,
  Phone
} from 'lucide-react';

interface MapComponentProps {
  depots: Depot[];
  villages: Village[];
  roadSegments: RoadSegment[];
  activeRoute: CalculatedRoute | null;
  selectedSourceId?: string | null;
  selectedTargetId?: string | null;
  onSelectLocation?: (location: LocationPoint) => void;
  onSelectRoad?: (road: RoadSegment) => void;
  heightClass?: string;
  showAllVillages?: boolean;
  simplifiedView?: boolean;
  role?: UserRole;
  requests?: ReliefRequest[];
  travelerMarker?: {
    position: [number, number];
    bearing: number;
    isNavigating: boolean;
  } | null;
}

const STATUS_COLORS: Record<RoadStatus, { color: string; label: string; opacity: number }> = {
  OPEN: { color: '#10b981', label: 'Open / Passable', opacity: 0.85 },
  RISKY: { color: '#f59e0b', label: 'Risky / Heavy Rain Caution', opacity: 0.9 },
  BLOCKED: { color: '#ef4444', label: 'Blocked / Flood Overflow', opacity: 0.95 },
  IMPASSABLE: { color: '#64748b', label: 'Impassable / Washed Out', opacity: 0.85 }
};

export function getDepotStockHealth(depot: Depot): { status: 'healthy' | 'low'; label: string; ringColor: string } {
  if (!depot.stockSummary) return { status: 'healthy', label: 'Stock Available', ringColor: '#10b981' };
  const s = depot.stockSummary;
  const isLow = s.waterKits < 2500 || s.medKits < 800 || s.rationsTons < 22 || s.boats < 4;
  if (isLow) {
    return { status: 'low', label: 'Stock Limited', ringColor: '#f59e0b' };
  }
  return { status: 'healthy', label: 'Well Stocked', ringColor: '#10b981' };
}

export function getVillageUrgencyStatus(village: Village, requestsList: ReliefRequest[] = []): {
  status: 'critical' | 'pending' | 'normal';
  label: string;
  ringColor: string;
  activeRequests: ReliefRequest[];
} {
  const vRequests = requestsList.filter(
    r => r.villageId === village.id && r.status !== 'DELIVERED' && r.status !== 'REJECTED'
  );
  const hasCritical = vRequests.some(r => r.urgency === 'CRITICAL') || village.isAutoDetectedIsolated;
  const hasPending = vRequests.length > 0;

  if (hasCritical) {
    return { status: 'critical', label: 'Critical Need', ringColor: '#ef4444', activeRequests: vRequests };
  }
  if (hasPending) {
    return { status: 'pending', label: 'Relief In Transit', ringColor: '#f59e0b', activeRequests: vRequests };
  }
  return { status: 'normal', label: 'Normal / Stable', ringColor: '#10b981', activeRequests: vRequests };
}

// Controller component to interact with Google Map instance programmatically
interface MapControllerProps {
  activeRoute: CalculatedRoute | null;
  resetTrigger: number;
}

const MapController: React.FC<MapControllerProps> = ({ activeRoute, resetTrigger }) => {
  const map = useMap();

  // Fit bounds when active route updates
  useEffect(() => {
    if (!map || !activeRoute || !activeRoute.pathCoordinates || activeRoute.pathCoordinates.length === 0) return;
    try {
      const bounds = new google.maps.LatLngBounds();
      activeRoute.pathCoordinates.forEach(([lat, lng]) => {
        bounds.extend({ lat, lng });
      });
      map.fitBounds(bounds, 50);
    } catch (e) {
      console.error('Fit bounds error:', e);
    }
  }, [map, activeRoute]);

  // Center on reset trigger
  useEffect(() => {
    if (!map || resetTrigger === 0) return;
    map.setCenter({ lat: 26.40, lng: 93.10 });
    map.setZoom(8);
  }, [map, resetTrigger]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  depots,
  villages,
  roadSegments,
  activeRoute,
  selectedSourceId,
  selectedTargetId,
  onSelectLocation,
  onSelectRoad,
  heightClass = 'h-[540px] md:h-[620px]',
  showAllVillages = true,
  simplifiedView = false,
  role,
  requests = [],
  travelerMarker
}) => {
  const { t } = useLanguage();
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [resetCount, setResetCount] = useState<number>(0);

  // InfoWindow and tooltip states
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(null);
  const [roadPopupPosition, setRoadPopupPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isTravelerPopupOpen, setIsTravelerPopupOpen] = useState(false);
  const [hoveredRoad, setHoveredRoad] = useState<RoadSegment | null>(null);

  const isPrivilegedRole = role === 'provider' || role === 'official';

  const handleResetCenter = useCallback(() => {
    setResetCount(c => c + 1);
  }, []);

  const handleDepotClick = (depot: Depot) => {
    setSelectedDepot(depot);
    setSelectedVillage(null);
    setSelectedRoad(null);
    setIsTravelerPopupOpen(false);
    if (onSelectLocation) onSelectLocation(depot);
  };

  const handleVillageClick = (vil: Village) => {
    setSelectedVillage(vil);
    setSelectedDepot(null);
    setSelectedRoad(null);
    setIsTravelerPopupOpen(false);
    if (onSelectLocation) onSelectLocation(vil);
  };

  const handleRoadClick = (road: RoadSegment) => {
    setSelectedRoad(road);
    const midIdx = Math.floor(road.coordinates.length / 2);
    setRoadPopupPosition({ lat: road.coordinates[midIdx][0], lng: road.coordinates[midIdx][1] });
    setSelectedDepot(null);
    setSelectedVillage(null);
    setIsTravelerPopupOpen(false);
    if (onSelectRoad) onSelectRoad(road);
  };

  // Convert road coordinates to Google Maps LatLngLiteral array
  const formattedRoads = useMemo(() => {
    return roadSegments.map(road => {
      const isPartOfActiveRoute = activeRoute?.segments.some(s => s.id === road.id);
      const styleConfig = STATUS_COLORS[road.status];
      const path = road.coordinates.map(([lat, lng]) => ({ lat, lng }));
      const midIdx = Math.floor(road.coordinates.length / 2);
      const midCoord = road.coordinates[midIdx];

      return {
        road,
        path,
        midCoord: { lat: midCoord[0], lng: midCoord[1] },
        isPartOfActiveRoute,
        styleConfig
      };
    });
  }, [roadSegments, activeRoute]);

  // Convert active route path to LatLngLiteral array
  const activeRoutePath = useMemo(() => {
    if (!activeRoute || !activeRoute.pathCoordinates) return [];
    return activeRoute.pathCoordinates.map(([lat, lng]) => ({ lat, lng }));
  }, [activeRoute]);

  const activeRouteColor = useMemo(() => {
    if (!activeRoute) return '#2563eb';
    if (activeRoute.escalationLevel === 'LEVEL_3_AIRDROP') return '#7c3aed';
    if (activeRoute.escalationLevel === 'LEVEL_2_RELAY') return '#d97706';
    return '#2563eb';
  }, [activeRoute]);

  const activeRouteGlowColor = useMemo(() => {
    if (!activeRoute) return '#3b82f6';
    if (activeRoute.escalationLevel === 'LEVEL_3_AIRDROP') return '#8b5cf6';
    if (activeRoute.escalationLevel === 'LEVEL_2_RELAY') return '#f59e0b';
    return '#3b82f6';
  }, [activeRoute]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100`}>
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200 shadow-md">
        {/* Map Type Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setMapTypeId('roadmap')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              mapTypeId === 'roadmap' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('roadmapStyle')}
          </button>
          <button
            type="button"
            onClick={() => setMapTypeId('terrain')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              mapTypeId === 'terrain' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('terrainStyle')}
          </button>
          <button
            type="button"
            onClick={() => setMapTypeId('satellite')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              mapTypeId === 'satellite' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('satelliteStyle')}
          </button>
          <button
            type="button"
            onClick={() => setMapTypeId('hybrid')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              mapTypeId === 'hybrid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hybrid
          </button>
        </div>

        {/* Reset View Button */}
        <button
          type="button"
          onClick={handleResetCenter}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
          title="Center map on North-East India"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>{t('resetViewBtn')}</span>
        </button>
      </div>

      {/* Floating Hover Card for Road Segments */}
      {hoveredRoad && (
        <div className="absolute top-16 left-3 z-30 bg-slate-950/90 text-white backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl max-w-xs text-xs pointer-events-none animate-in fade-in">
          <div className="font-extrabold text-sm">{hoveredRoad.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: STATUS_COLORS[hoveredRoad.status].color }}
            />
            <span className="font-bold">{hoveredRoad.status}</span>
            <span className="text-slate-400">• {hoveredRoad.distanceKm} km</span>
          </div>
          {hoveredRoad.status !== 'OPEN' && (
            <div className="text-rose-300 text-[11px] mt-1.5 font-medium">
              ⚠️ {hoveredRoad.hazardReason}
            </div>
          )}
        </div>
      )}

      {/* Map Legend Overlay Bottom-Left */}
      <div className="absolute bottom-3 left-3 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs">
        <div className="font-bold text-slate-800 mb-1.5 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t('resqrouteNetwork')}</span>
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Google Maps Platform
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
            <span>{t('legendOpen')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded-full inline-block"></span>
            <span>{t('legendRisky')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded-full inline-block"></span>
            <span>{t('legendBlocked')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-slate-500 rounded-full inline-block"></span>
            <span>{t('legendImpassable')}</span>
          </div>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="w-full h-full">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: 26.40, lng: 93.10 }}
          defaultZoom={8}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeId={mapTypeId}
          style={{ width: '100%', height: '100%' }}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* Map programmatic controller */}
          <MapController activeRoute={activeRoute} resetTrigger={resetCount} />

          {/* Road Segment Polylines */}
          {formattedRoads.map(({ road, path, isPartOfActiveRoute, styleConfig }) => (
            <Polyline
              key={road.id}
              path={path}
              strokeColor={styleConfig.color}
              strokeOpacity={styleConfig.opacity}
              strokeWeight={isPartOfActiveRoute ? 6 : (simplifiedView ? 3.5 : 4.5)}
              onClick={() => handleRoadClick(road)}
              onMouseOver={() => setHoveredRoad(road)}
              onMouseOut={() => setHoveredRoad(null)}
            />
          ))}

          {/* Active Route Polylines */}
          {activeRoutePath.length > 0 && (
            <>
              {/* Glowing underlay */}
              <Polyline
                key="active-route-glow"
                path={activeRoutePath}
                strokeColor={activeRouteGlowColor}
                strokeOpacity={0.4}
                strokeWeight={12}
              />
              {/* Sharp primary route */}
              <Polyline
                key="active-route-main"
                path={activeRoutePath}
                strokeColor={activeRouteColor}
                strokeOpacity={0.95}
                strokeWeight={5.5}
              />
            </>
          )}

          {/* Hazard Pins on Blocked / Impassable Roads */}
          {!simplifiedView &&
            formattedRoads
              .filter(r => r.road.status === 'BLOCKED' || r.road.status === 'IMPASSABLE')
              .map(({ road, midCoord }) => (
                <AdvancedMarker
                  key={`hazard-${road.id}`}
                  position={midCoord}
                  title={`Road Hazard: ${road.hazardReason}`}
                  onClick={() => handleRoadClick(road)}
                >
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white border-2 border-white shadow-md flex items-center justify-center font-black text-xs cursor-pointer hover:scale-110 transition-transform">
                    ✕
                  </div>
                </AdvancedMarker>
              ))}

          {/* Depot Advanced Markers */}
          {depots.map(depot => {
            const isSelected = selectedSourceId === depot.id;
            const stockHealth = getDepotStockHealth(depot);

            return (
              <AdvancedMarker
                key={depot.id}
                position={{ lat: depot.lat, lng: depot.lng }}
                title={`${depot.name} (${stockHealth.label})`}
                zIndex={isSelected ? 1000 : 500}
                onClick={() => handleDepotClick(depot)}
              >
                <div
                  className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] border-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md transition-all ${
                    isSelected
                      ? 'bg-blue-950 text-white border-blue-400 ring-4 ring-blue-400/50'
                      : 'bg-slate-900 text-white border-blue-500'
                  }`}
                  style={{
                    boxShadow: !isSelected && isPrivilegedRole ? `0 0 0 2px ${stockHealth.ringColor}` : undefined
                  }}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{depot.name.split(' ')[0]} Hub</span>
                  {isPrivilegedRole && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        stockHealth.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      title={stockHealth.label}
                    />
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Village Advanced Markers */}
          {showAllVillages &&
            villages.map(vil => {
              const isSelected = selectedTargetId === vil.id;
              const isIsolated = vil.isAutoDetectedIsolated;
              const urgencyInfo = getVillageUrgencyStatus(vil, requests);

              const badgeColor = isPrivilegedRole
                ? urgencyInfo.ringColor
                : (vil.riskZone === 'OPEN' ? '#10b981' : vil.riskZone === 'RISKY' ? '#f59e0b' : '#ef4444');

              return (
                <AdvancedMarker
                  key={vil.id}
                  position={{ lat: vil.lat, lng: vil.lng }}
                  title={`${vil.name} (${isPrivilegedRole ? urgencyInfo.label : vil.riskZone + ' ZONE'})`}
                  zIndex={isSelected ? 900 : (isIsolated ? 800 : 400)}
                  onClick={() => handleVillageClick(vil)}
                >
                  <div
                    className={`px-2 py-0.5 rounded-full font-bold text-[11px] border-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm transition-all ${
                      isSelected
                        ? 'bg-rose-950 text-white border-rose-400 ring-4 ring-rose-400/50'
                        : isIsolated
                        ? 'bg-rose-600 text-white border-rose-300 shadow-rose-500/50'
                        : 'bg-white text-slate-900 border-slate-300'
                    }`}
                    style={{ borderColor: badgeColor }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: badgeColor }}
                    />
                    <span>{vil.name.split('(')[0].trim()}</span>
                    {isIsolated && (
                      <span className="text-[9px] bg-rose-950 text-rose-200 px-1 py-0.5 rounded font-black tracking-wider">
                        ISOLATED
                      </span>
                    )}
                    {isPrivilegedRole && urgencyInfo.activeRequests.length > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                          urgencyInfo.status === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {urgencyInfo.activeRequests.length} need
                      </span>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

          {/* Traveler / Moving Convoy Marker */}
          {travelerMarker && travelerMarker.position && (
            <AdvancedMarker
              position={{ lat: travelerMarker.position[0], lng: travelerMarker.position[1] }}
              zIndex={2000}
              onClick={() => setIsTravelerPopupOpen(true)}
            >
              <div className="relative flex items-center justify-center cursor-pointer">
                <div className="absolute w-11 h-11 rounded-full bg-blue-500/35 pulsing-marker-red" />
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-indigo-700 text-white border-2 border-white shadow-lg flex items-center justify-center transition-transform duration-100"
                  style={{ transform: `rotate(${travelerMarker.bearing}deg)` }}
                >
                  <Navigation className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="absolute -top-6 whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/95 text-white text-[9.5px] font-extrabold tracking-wide border border-slate-700 shadow-md">
                  🚗 {t('vehicleEnRoute')}
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Depot Popup */}
          {selectedDepot && (
            <InfoWindow
              position={{ lat: selectedDepot.lat, lng: selectedDepot.lng }}
              onCloseClick={() => setSelectedDepot(null)}
            >
              <div className="p-2 max-w-xs text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <strong className="text-sm text-blue-900">{selectedDepot.name}</strong>
                  {isPrivilegedRole && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        getDepotStockHealth(selectedDepot).status === 'healthy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {getDepotStockHealth(selectedDepot).label}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mb-2">
                  {selectedDepot.district}, {selectedDepot.state}
                </div>

                {selectedDepot.stockSummary && (
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg mb-2 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>📦 Stock Capacity:</span>
                      <span className="text-blue-600">{selectedDepot.capacityTonnes}t</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10.5px] text-slate-600 pt-1 border-t border-slate-200">
                      <div>💧 Water: <strong>{selectedDepot.stockSummary.waterKits.toLocaleString()}</strong></div>
                      <div>💊 Meds: <strong>{selectedDepot.stockSummary.medKits.toLocaleString()}</strong></div>
                      <div>🍞 Rations: <strong>{selectedDepot.stockSummary.rationsTons}t</strong></div>
                      <div>⛺ Tarps: <strong>{selectedDepot.stockSummary.shelterTarps.toLocaleString()}</strong></div>
                      <div className="col-span-2 text-blue-700">🚤 Boats: <strong>{selectedDepot.stockSummary.boats} units</strong></div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div><strong>Commander:</strong> {selectedDepot.commanderName}</div>
                  <div><strong>Contact:</strong> {selectedDepot.contactNumber}</div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Village Popup */}
          {selectedVillage && (
            <InfoWindow
              position={{ lat: selectedVillage.lat, lng: selectedVillage.lng }}
              onCloseClick={() => setSelectedVillage(null)}
            >
              <div className="p-2 max-w-xs text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <strong className="text-sm text-slate-900">{selectedVillage.name}</strong>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      selectedVillage.riskZone === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedVillage.riskZone === 'RISKY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedVillage.riskZone}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2">
                  {selectedVillage.district}, {selectedVillage.state} • Pop: {selectedVillage.population?.toLocaleString() || 'N/A'}
                </div>

                {isPrivilegedRole && (
                  <div className="mb-2">
                    {(() => {
                      const activeReqs = requests.filter(
                        r => r.villageId === selectedVillage.id && r.status !== 'DELIVERED' && r.status !== 'REJECTED'
                      );
                      if (activeReqs.length > 0) {
                        return (
                          <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-[11px]">
                            <div className="font-bold text-amber-800 mb-1 flex justify-between">
                              <span>🚨 Active Requisitions:</span>
                              <span className="font-mono text-[10px]">{activeReqs[0].trackingCode}</span>
                            </div>
                            {activeReqs.map(r => (
                              <div key={r.id} className="border-t border-amber-200 pt-1 mt-1">
                                <div className="font-semibold text-slate-900">{r.resourceType}</div>
                                <div className="text-slate-500">
                                  Qty: <strong>{r.quantity}</strong> • Urgency: <strong className="text-rose-700">{r.urgency}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-1.5 rounded-lg text-[11px] font-semibold">
                          ✓ No outstanding emergency requests
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px] text-slate-600 space-y-0.5">
                  <div><strong>Hazard:</strong> {selectedVillage.vulnerabilityFactor}</div>
                  <div><strong>Contact:</strong> {selectedVillage.contactPerson} ({selectedVillage.phone})</div>
                  {selectedVillage.isAutoDetectedIsolated && (
                    <div className="text-rose-600 font-bold mt-1">
                      ⚠️ Auto-Detected Cut Off from Road Network
                    </div>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Road Segment Popup */}
          {selectedRoad && roadPopupPosition && (
            <InfoWindow
              position={roadPopupPosition}
              onCloseClick={() => {
                setSelectedRoad(null);
                setRoadPopupPosition(null);
              }}
            >
              <div className="p-2 min-w-[200px] text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <strong className="text-sm text-slate-900">{selectedRoad.name}</strong>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase"
                    style={{
                      backgroundColor: `${STATUS_COLORS[selectedRoad.status].color}22`,
                      color: STATUS_COLORS[selectedRoad.status].color,
                      border: `1px solid ${STATUS_COLORS[selectedRoad.status].color}55`
                    }}
                  >
                    {selectedRoad.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2">
                  Distance: <strong>{selectedRoad.distanceKm} km</strong>
                </div>
                {selectedRoad.status !== 'OPEN' ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-1.5 rounded-lg text-[11px] font-semibold">
                    ⚠️ {selectedRoad.hazardReason}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-1.5 rounded-lg text-[11px] font-semibold">
                    ✓ Road clear for heavy convoys & transit
                  </div>
                )}
              </div>
            </InfoWindow>
          )}

          {/* Traveler Convoy Popup */}
          {isTravelerPopupOpen && travelerMarker && (
            <InfoWindow
              position={{ lat: travelerMarker.position[0], lng: travelerMarker.position[1] }}
              onCloseClick={() => setIsTravelerPopupOpen(false)}
            >
              <div className="p-2 min-w-[200px] text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="text-blue-600 font-bold text-xs mb-1 flex items-center gap-1">
                  🚚 {t('liveNavDispatch')}
                </div>
                <strong className="text-sm text-slate-900">{t('reliefConvoyEnRoute')}</strong>
                <div className="text-[11px] text-slate-500 mt-1">
                  Lat: {travelerMarker.position[0].toFixed(4)}° N, Lng: {travelerMarker.position[1].toFixed(4)}° E
                </div>
                <div className="mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10.5px] text-blue-800 font-semibold">
                  Status: {travelerMarker.isNavigating ? t('convoyStatusActive') : t('convoyStatusPaused')}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </div>
  );
};
