/**
 * ResQRoute Core Type Definitions
 * Role-based Risk-Aware Road Navigation & Emergency Resource Routing (NER India)
 */

export type UserRole = 'requester' | 'provider' | 'official' | 'guest';

export type UserPermission = 
  | 'VIEW_VILLAGE_DATA'
  | 'SUBMIT_VILLAGE_REQUEST'
  | 'CONFIRM_VILLAGE_DELIVERY'
  | 'VIEW_DEPOT_INVENTORY'
  | 'MANAGE_DEPOT_STOCK'
  | 'DISPATCH_DEPOT_RESOURCES'
  | 'VIEW_DEPOT_DISPATCHES'
  | 'SYSTEM_WIDE_ACCESS'
  | 'VERIFY_REQUESTS'
  | 'ADMIN_ALL_DATA'
  | 'VIEW_ALL_DEPOTS'
  | 'VIEW_ALL_VILLAGES';

export interface UserSession {
  userId: string;
  role: UserRole;
  name: string;
  phone?: string;
  villageId?: string;
  villageName?: string;
  designation?: 'Panchayat Head' | 'DDMA Officer' | string;
  district?: string;
  depotId?: string;
  depotName?: string;
  contactPerson?: string;
  permissions: UserPermission[];
  organization?: string;
}

export type MainTab = 'dashboard' | 'navigate' | 'ledger' | 'about';

export type RoadStatus = 'OPEN' | 'RISKY' | 'BLOCKED' | 'IMPASSABLE';

export type RequestStatus = 
  | 'SUBMITTED' 
  | 'VERIFIED' 
  | 'MATCHED' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'REJECTED';

export type EscalationLevel = 
  | 'LEVEL_1_VEHICLE'    // ✅ Vehicle route available
  | 'LEVEL_2_RELAY'      // ⚠️ Vehicle can reach partway — relay needed for final [X] km via porter/boat
  | 'LEVEL_3_AIRDROP';   // 🚫 No ground route available — escalate for air-drop coordination

export type ResourceType =
  | 'Drinking Water & Purification Kits'
  | 'Emergency Medical Supplies & First Aid'
  | 'Dry Rations & Baby Food'
  | 'Tarpaulins & Flood Shelter Kits'
  | 'Search & Rescue Gear / Inflatable Boats'
  | 'High-Capacity Power Generators & Comms';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface LocationPoint {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  type: 'village' | 'town' | 'depot' | 'junction';
}

export interface Village extends LocationPoint {
  type: 'village';
  population: number;
  contactPerson: string;
  phone: string;
  lastCheckInMinutesAgo: number;
  isAutoDetectedIsolated: boolean;
  riskZone: RoadStatus;
  elevationMeters: number;
  vulnerabilityFactor: 'River Flood' | 'Landslide' | 'Road Washout' | 'High-Water Inundation' | 'Normal';
}

export interface Depot extends LocationPoint {
  type: 'depot';
  code: string;
  capacityTonnes: number;
  availableVehicles: string[];
  commanderName: string;
  contactNumber: string;
  stockSummary: {
    waterKits: number;
    medKits: number;
    rationsTons: number;
    shelterTarps: number;
    boats: number;
  };
}

export interface RoadSegment {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  fromName: string;
  toName: string;
  coordinates: [number, number][]; // [[lat, lng], ...]
  distanceKm: number;
  status: RoadStatus;
  hazardReason: string;
  lastUpdated: string;
  elevationGainMeters: number;
  recommendedSpeedKmh: number;
}

export interface ProviderInventoryItem {
  id: string;
  depotId: string;
  depotName: string;
  resourceName: ResourceType;
  category: string;
  unit: string;
  totalStock: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
}

export interface DeliveryTimelineEvent {
  stage: string;
  timestamp: string;
  actor?: string;
  note?: string;
}

export interface ReliefRequest {
  id: string;
  trackingCode: string;
  villageId: string;
  villageName: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  resourceType: ResourceType;
  quantity: string;
  requestedUnits: number;
  allocatedUnits?: number;
  shortageUnits?: number;
  fulfillmentStatus?: 'PENDING_MATCH' | 'FULL' | 'PARTIAL' | 'UNFULFILLED';
  unitLabel?: string;
  reservationId?: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  submittedBy: string;
  submittedRole: 'villager' | 'official' | 'auto_system';
  contactPhone: string;
  detailsNote?: string;
  submissionTime: string;
  verifiedTime?: string;
  verifiedBy?: string;
  assignedDepotId?: string;
  assignedDepotName?: string;
  assignedVehicle?: string;
  dispatchedTime?: string;
  deliveredTime?: string;
  confirmedBy?: string;
  confirmedTime?: string;
  confirmationNotes?: string;
  deliveryTimeline?: DeliveryTimelineEvent[];
  rejectionReason?: string;
  // Routing analysis attached to request
  escalationLevel: EscalationLevel;
  relayDistanceKm?: number;
  relayMethod?: 'porter' | 'boat' | 'drone' | 'none';
  estimatedDriveTimeMins?: number;
  totalDistanceKm?: number;
  autoDetected?: boolean;
}

export interface TurnStep {
  instruction: string;
  roadName: string;
  distanceKm: number;
  status: RoadStatus;
  hazardNote?: string;
}

export interface CalculatedRoute {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  totalDistanceKm: number;
  estimatedMinutes: number;
  pathCoordinates: [number, number][];
  segments: RoadSegment[];
  steps: TurnStep[];
  overallRisk: RoadStatus;
  isReroutedDueToBlockade: boolean;
  blockedRoadName?: string;
  extraDistanceKm?: number;
  extraTimeMinutes?: number;
  escalationLevel: EscalationLevel;
  relayStartNodeName?: string;
  relayDistanceKm?: number;
  relayMethod?: 'porter' | 'boat' | 'drone';
  warningMessage?: string;
}

export interface AlertNotification {
  id: string;
  type: 'ISOLATION' | 'LANDSLIDE' | 'FLOOD' | 'ROAD_BLOCKED' | 'WEATHER';
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  villageId?: string;
  villageName?: string;
  roadId?: string;
  read: boolean;
  requiresAction?: boolean;
}

export interface CompletedLedgerItem {
  id: string;
  trackingCode: string;
  villageName: string;
  district: string;
  state: string;
  resource: ResourceType;
  quantity: string;
  requestedUnits?: number;
  allocatedUnits?: number;
  shortageUnits?: number;
  fulfillmentType?: 'Full' | 'Partial';
  sourceDepot: string;
  status: 'Delivered';
  dispatchedDate: string;
  completedDate: string;
  beneficiariesCount: number;
  transportMethod: string;
  confirmedBy?: string;
  confirmationNotes?: string;
}
