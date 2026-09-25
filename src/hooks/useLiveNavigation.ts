import { useState, useEffect, useRef, useCallback } from 'react';
import { CalculatedRoute, LocationPoint, RoadSegment } from '../types';
import { 
  interpolatePositionAlongPath, 
  calculateRiskAwareRouteFromCoordinate, 
  findNextSegmentAhead 
} from '../utils/navigationUtils';

interface UseLiveNavigationProps {
  initialRoute: CalculatedRoute;
  roadSegments: RoadSegment[];
  allLocations: LocationPoint[];
  targetId: string;
  updateRoadStatus: (roadId: string, newStatus: 'OPEN' | 'RISKY' | 'BLOCKED' | 'IMPASSABLE', reason?: string) => void;
  resetAllRoads?: () => void;
}

export interface RerouteComparisonNotice {
  blockedRoadName: string;
  hazardReason: string;
  extraDistanceKm: number;
  extraTimeMinutes: number;
  newTotalKm: number;
  timestamp: string;
}

export function useLiveNavigation({
  initialRoute,
  roadSegments,
  allLocations,
  targetId,
  updateRoadStatus
}: UseLiveNavigationProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1 along current activeNavRoute
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x or 2x
  const [activeNavRoute, setActiveNavRoute] = useState<CalculatedRoute>(initialRoute);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [rerouteNotice, setRerouteNotice] = useState<RerouteComparisonNotice | null>(null);
  const [simulatedBlockedSegmentId, setSimulatedBlockedSegmentId] = useState<string | null>(null);

  // Sync initialRoute when user changes source/target in parent when not actively navigating
  useEffect(() => {
    if (!isNavigating) {
      setActiveNavRoute(initialRoute);
      setProgress(0);
      setRerouteNotice(null);
      setSimulatedBlockedSegmentId(null);
    }
  }, [initialRoute, isNavigating]);

  // Current interpolated position and bearing
  const positionData = interpolatePositionAlongPath(
    activeNavRoute.pathCoordinates || [],
    progress
  );

  // Step tracker: calculate current step index based on progress
  const totalSteps = activeNavRoute.steps?.length || 1;
  const currentStepIndex = Math.min(
    totalSteps - 1,
    Math.floor(progress * totalSteps)
  );

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Total animation duration for the whole route (e.g. 28 seconds nominal at 1x)
  const BASE_DURATION_MS = 28000;

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== null && !isPaused) {
      const delta = time - lastTimeRef.current;
      const stepProgress = (delta / (BASE_DURATION_MS / speedMultiplier));

      setProgress(prev => {
        const next = prev + stepProgress;
        if (next >= 1) {
          setIsNavigating(false);
          return 1;
        }
        return next;
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [isPaused, speedMultiplier]);

  useEffect(() => {
    if (isNavigating && !isPaused) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isNavigating, isPaused, animate]);

  const startNavigation = () => {
    setIsNavigating(true);
    setIsPaused(false);
    setProgress(0);
    setRerouteNotice(null);
    setActiveNavRoute(initialRoute);
  };

  const pauseNavigation = () => {
    setIsPaused(true);
  };

  const resumeNavigation = () => {
    setIsPaused(false);
  };

  const resetNavigation = () => {
    setIsNavigating(false);
    setIsPaused(false);
    setProgress(0);
    setRerouteNotice(null);
    setActiveNavRoute(initialRoute);
    setSimulatedBlockedSegmentId(null);
  };

  // Simulate Road Update Ahead (Feature A Core Action)
  const triggerSimulateRoadUpdate = () => {
    const currentCoord = positionData.position;

    // 1. Identify segment ahead to block
    const targetSegment = findNextSegmentAhead(currentCoord, activeNavRoute, roadSegments);
    if (!targetSegment) return;

    const segmentToBlock = targetSegment;
    setSimulatedBlockedSegmentId(segmentToBlock.id);

    // 2. Immediately update road segment state in AppContext
    const hazardMsg = `🚨 Live Satellite / Drone Telemetry: Flash flood breach & mudslide detected on ${segmentToBlock.name}!`;
    updateRoadStatus(segmentToBlock.id, 'BLOCKED', hazardMsg);

    // 3. Show instant recalculating notification
    setIsRecalculating(true);

    // 4. Recalculate route after short realistic latency (900ms)
    setTimeout(() => {
      // Re-query latest updated road segments with this segment blocked
      const updatedSegments = roadSegments.map(s =>
        s.id === segmentToBlock.id
          ? { ...s, status: 'BLOCKED' as const, hazardReason: hazardMsg }
          : s
      );

      const { reroutedRoute, extraDistanceKm, extraTimeMinutes } = calculateRiskAwareRouteFromCoordinate(
        currentCoord,
        targetId,
        updatedSegments,
        allLocations,
        activeNavRoute.totalDistanceKm
      );

      // 5. Update activeNavRoute to the new detour starting from current position
      setActiveNavRoute(reroutedRoute);

      // 6. Reset progress along the *new* route to 0 so the vehicle continues forward smoothly from its current position
      setProgress(0.01);
      setIsRecalculating(false);

      // 7. Store comparison notice
      setRerouteNotice({
        blockedRoadName: segmentToBlock.name,
        hazardReason: hazardMsg,
        extraDistanceKm,
        extraTimeMinutes,
        newTotalKm: reroutedRoute.totalDistanceKm,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }, 900);
  };

  return {
    isNavigating,
    isPaused,
    progress,
    speedMultiplier,
    setSpeedMultiplier,
    currentCoord: positionData.position,
    currentBearing: positionData.bearing,
    distanceTraveledKm: Math.round(positionData.distanceTraveledKm * 10) / 10,
    currentStepIndex,
    activeNavRoute,
    isRecalculating,
    rerouteNotice,
    simulatedBlockedSegmentId,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    resetNavigation,
    triggerSimulateRoadUpdate
  };
}
