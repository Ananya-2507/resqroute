import { CalculatedRoute, LocationPoint, RoadSegment, TurnStep } from '../types';
import { calculateRiskAwareRoute } from '../data/nerGeography';

/**
 * Calculates distance between two coordinates in km using Haversine formula
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates heading / bearing between two coordinates in degrees (0 = North, 90 = East, etc.)
 */
export function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Interpolates vehicle position along a path given progress (0.0 to 1.0)
 */
export function interpolatePositionAlongPath(
  coords: [number, number][],
  progress: number
): {
  position: [number, number];
  bearing: number;
  coordIndex: number;
  distanceTraveledKm: number;
  totalDistanceKm: number;
} {
  if (!coords || coords.length === 0) {
    return {
      position: [26.1445, 91.7362],
      bearing: 0,
      coordIndex: 0,
      distanceTraveledKm: 0,
      totalDistanceKm: 0
    };
  }

  if (coords.length === 1 || progress <= 0) {
    const bearing = coords.length > 1
      ? calculateBearingDegrees(coords[0][0], coords[0][1], coords[1][0], coords[1][1])
      : 0;
    return {
      position: coords[0],
      bearing,
      coordIndex: 0,
      distanceTraveledKm: 0,
      totalDistanceKm: 0
    };
  }

  if (progress >= 1) {
    const lastIdx = coords.length - 1;
    const bearing = coords.length > 1
      ? calculateBearingDegrees(coords[lastIdx - 1][0], coords[lastIdx - 1][1], coords[lastIdx][0], coords[lastIdx][1])
      : 0;
    return {
      position: coords[lastIdx],
      bearing,
      coordIndex: lastIdx,
      distanceTraveledKm: 0,
      totalDistanceKm: 0
    };
  }

  // Calculate cumulative segment lengths
  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const d = haversineDistanceKm(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    segmentLengths.push(d);
    totalLength += d;
  }

  const targetDist = progress * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDist || i === segmentLengths.length - 1) {
      const remainingDistInSeg = targetDist - accumulated;
      const t = segLen > 0 ? Math.min(1, Math.max(0, remainingDistInSeg / segLen)) : 0;

      const p1 = coords[i];
      const p2 = coords[i + 1];

      const lat = p1[0] + t * (p2[0] - p1[0]);
      const lng = p1[1] + t * (p2[1] - p1[1]);
      const bearing = calculateBearingDegrees(p1[0], p1[1], p2[0], p2[1]);

      return {
        position: [lat, lng],
        bearing,
        coordIndex: i,
        distanceTraveledKm: targetDist,
        totalDistanceKm: totalLength
      };
    }
    accumulated += segLen;
  }

  return {
    position: coords[coords.length - 1],
    bearing: 0,
    coordIndex: coords.length - 1,
    distanceTraveledKm: totalLength,
    totalDistanceKm: totalLength
  };
}

/**
 * Finds the nearest navigable node/junction to a coordinate
 */
export function findNearestPassableNode(
  coord: [number, number],
  locations: LocationPoint[],
  segments: RoadSegment[]
): LocationPoint {
  let closestLoc: LocationPoint = locations[0];
  let minDistance = Infinity;

  // Filter nodes that have at least one OPEN or RISKY segment
  const passableNodeIds = new Set<string>();
  segments
    .filter(s => s.status === 'OPEN' || s.status === 'RISKY')
    .forEach(s => {
      passableNodeIds.add(s.fromNodeId);
      passableNodeIds.add(s.toNodeId);
    });

  for (const loc of locations) {
    // Prefer passable nodes
    const isPassable = passableNodeIds.has(loc.id);
    const dist = haversineDistanceKm(coord[0], coord[1], loc.lat, loc.lng);
    const adjustedDist = isPassable ? dist : dist + 20; // Bias towards passable nodes

    if (adjustedDist < minDistance) {
      minDistance = adjustedDist;
      closestLoc = loc;
    }
  }

  return closestLoc;
}

/**
 * Calculates a fresh risk-aware route originating directly from the current traveler position en route
 */
export function calculateRiskAwareRouteFromCoordinate(
  currentCoord: [number, number],
  targetId: string,
  segments: RoadSegment[],
  locations: LocationPoint[],
  originalTotalDistanceKm: number
): {
  reroutedRoute: CalculatedRoute;
  extraDistanceKm: number;
  extraTimeMinutes: number;
} {
  // 1. Find nearest suitable intermediate node to branch from
  const nearestNode = findNearestPassableNode(currentCoord, locations, segments);
  const targetLoc = locations.find(l => l.id === targetId) || locations[0];

  // 2. Calculate path from nearestNode to targetId
  const subRoute = calculateRiskAwareRoute(nearestNode.id, targetId, segments, locations);

  // 3. Connect currentCoord to nearestNode
  const directLegDist = haversineDistanceKm(
    currentCoord[0],
    currentCoord[1],
    nearestNode.lat,
    nearestNode.lng
  );

  // Prepend current coordinate to path coordinates
  const fallbackCoords: [number, number][] = [
    [nearestNode.lat, nearestNode.lng],
    [targetLoc.lat, targetLoc.lng]
  ];
  const newPathCoords: [number, number][] = [
    currentCoord,
    ...(subRoute.pathCoordinates.length > 0 ? subRoute.pathCoordinates : fallbackCoords)
  ];

  const totalDistance = Math.round((directLegDist + subRoute.totalDistanceKm) * 10) / 10;
  const extraDist = Math.max(0, Math.round((totalDistance - (originalTotalDistanceKm * 0.5)) * 10) / 10);
  const extraMinutes = Math.round((extraDist / 45) * 60) || 15;

  const currentPosStep: TurnStep = {
    instruction: `Depart current vehicle position en route towards ${nearestNode.name} (${Math.round(directLegDist * 10) / 10} km)`,
    roadName: 'En-Route Transition Link',
    distanceKm: Math.round(directLegDist * 10) / 10,
    status: 'OPEN'
  };

  const reroutedRoute: CalculatedRoute = {
    ...subRoute,
    sourceId: 'coord-current-pos',
    sourceName: 'Current Position (En Route)',
    pathCoordinates: newPathCoords,
    totalDistanceKm: totalDistance,
    estimatedMinutes: Math.round((totalDistance / 45) * 60),
    steps: [currentPosStep, ...subRoute.steps],
    isReroutedDueToBlockade: true,
    extraDistanceKm: extraDist,
    extraTimeMinutes: extraMinutes
  };

  return {
    reroutedRoute,
    extraDistanceKm: extraDist,
    extraTimeMinutes: extraMinutes
  };
}

/**
 * Finds the next road segment ahead of the current traveler position to simulate a hazard
 */
export function findNextSegmentAhead(
  currentCoord: [number, number],
  route: CalculatedRoute,
  allSegments: RoadSegment[]
): RoadSegment | null {
  if (!route || !route.segments || route.segments.length === 0) {
    // Fallback to a notable segment in network
    return allSegments.find(s => s.status === 'OPEN') || allSegments[0] || null;
  }

  // Find segments ahead of current position
  for (const seg of route.segments) {
    if (seg.status === 'OPEN' || seg.status === 'RISKY') {
      return seg;
    }
  }

  return route.segments[0] || null;
}
