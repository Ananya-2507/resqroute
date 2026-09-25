import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ALL_LOCATIONS,
  calculateRiskAwareRoute,
  INITIAL_DEPOTS,
  INITIAL_ROAD_SEGMENTS,
  INITIAL_VILLAGES
} from '../data/nerGeography';
import {
  INITIAL_ALERTS,
  INITIAL_LEDGER,
  INITIAL_PROVIDER_INVENTORY,
  INITIAL_REQUESTS,
  RESOURCE_METADATA
} from '../data/initialData';
import {
  AlertNotification,
  CalculatedRoute,
  CompletedLedgerItem,
  DeliveryTimelineEvent,
  Depot,
  MainTab,
  ProviderInventoryItem,
  ReliefRequest,
  ResourceType,
  RoadSegment,
  RoadStatus,
  UrgencyLevel,
  UserPermission,
  UserRole,
  UserSession,
  Village
} from '../types';

export interface DemoUserAccount {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  locationLabel: string;
  session: UserSession;
}

export const DEMO_USER_ACCOUNTS: DemoUserAccount[] = [
  {
    id: 'biren-kamalabari',
    name: 'Biren Saikia',
    role: 'requester',
    title: 'Village Gaonburha (Representative)',
    locationLabel: 'Kamalabari Ghat (Majuli Island)',
    session: {
      userId: 'usr-vil-biren',
      role: 'requester',
      name: 'Biren Saikia (Gaonburha)',
      villageId: 'vil-majuli-kamalabari',
      villageName: 'Kamalabari Ghat (Majuli Island)',
      phone: '+91 98540-12345',
      permissions: ['VIEW_VILLAGE_DATA', 'SUBMIT_VILLAGE_REQUEST', 'CONFIRM_VILLAGE_DELIVERY'],
      organization: 'Kamalabari Gaon Panchayat'
    }
  },
  {
    id: 'ramesh-chariduar',
    name: 'Ramesh Karmakar',
    role: 'requester',
    title: 'Tea Settlement Local Representative',
    locationLabel: 'Chariduar Tea Settlement (Sonitpur)',
    session: {
      userId: 'usr-vil-ramesh',
      role: 'requester',
      name: 'Ramesh Karmakar (Local Rep)',
      villageId: 'vil-balipara-foothill',
      villageName: 'Chariduar Tea Settlement',
      phone: '+91 98545-67890',
      permissions: ['VIEW_VILLAGE_DATA', 'SUBMIT_VILLAGE_REQUEST', 'CONFIRM_VILLAGE_DELIVERY'],
      organization: 'Chariduar Relief Committee'
    }
  },
  {
    id: 'nath-tezpur',
    name: 'Maj. S. K. Nath',
    role: 'provider',
    title: 'Tezpur Staging Base Logistics Officer',
    locationLabel: 'Tezpur Disaster Base (TZ-BASE-02)',
    session: {
      userId: 'usr-prov-tezpur',
      role: 'provider',
      name: 'Maj. S. K. Nath',
      depotId: 'depot-tezpur',
      depotName: 'Tezpur Disaster Response Staging Base',
      contactPerson: 'Maj. S. K. Nath',
      permissions: ['VIEW_DEPOT_INVENTORY', 'MANAGE_DEPOT_STOCK', 'DISPATCH_DEPOT_RESOURCES', 'VIEW_DEPOT_DISPATCHES'],
      organization: 'Tezpur Disaster Response Base'
    }
  },
  {
    id: 'baruah-guwahati',
    name: 'Col. R. K. Baruah',
    role: 'provider',
    title: 'NDRF Central Hub Logistics Commander',
    locationLabel: 'Guwahati NDRF Hub (GH-HUB-01)',
    session: {
      userId: 'usr-prov-guwahati',
      role: 'provider',
      name: 'Col. R. K. Baruah',
      depotId: 'depot-guwahati',
      depotName: 'Guwahati NDRF Central Logistics Hub',
      contactPerson: 'Col. R. K. Baruah',
      permissions: ['VIEW_DEPOT_INVENTORY', 'MANAGE_DEPOT_STOCK', 'DISPATCH_DEPOT_RESOURCES', 'VIEW_DEPOT_DISPATCHES'],
      organization: '1st Battalion NDRF Guwahati'
    }
  },
  {
    id: 'sharma-official',
    name: 'Dr. Arindam Sharma',
    role: 'official',
    title: 'DDMA Disaster Officer / State Control',
    locationLabel: 'State Emergency Operations Center (All Jurisdictions)',
    session: {
      userId: 'usr-admin-sharma',
      role: 'official',
      name: 'Dr. Arindam Sharma',
      designation: 'DDMA Officer',
      district: 'All Districts (State Control)',
      permissions: ['SYSTEM_WIDE_ACCESS', 'VERIFY_REQUESTS', 'ADMIN_ALL_DATA', 'VIEW_ALL_DEPOTS', 'VIEW_ALL_VILLAGES'],
      organization: 'Assam State Disaster Management Authority (ASDMA)'
    }
  }
];

export const DEFAULT_DEMO_SESSIONS: Record<UserRole, UserSession> = {
  requester: DEMO_USER_ACCOUNTS[0].session,
  provider: DEMO_USER_ACCOUNTS[2].session,
  official: DEMO_USER_ACCOUNTS[4].session,
  guest: {
    userId: 'usr-guest-01',
    role: 'guest',
    name: 'General Commuter',
    permissions: ['SYSTEM_WIDE_ACCESS'],
    organization: 'General Public'
  }
};

export interface DispatchResult {
  success: boolean;
  message: string;
  allocated: number;
  shortage: number;
}

export interface ResourceAvailabilityCheck {
  available: number;
  total: number;
  reserved: number;
  canFulfill: number;
  shortage: number;
  isFull: boolean;
  isPartial: boolean;
  isUnavailable: boolean;
  unit: string;
  item?: ProviderInventoryItem;
  alternativeDepots: { depotId: string; depotName: string; available: number; unit: string }[];
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  isLoggedIn: boolean;
  currentUser: UserSession | null;
  loginAsUser: (session: UserSession) => void;
  loginAsDemoRole: (role: UserRole) => void;
  logout: () => void;
  demoAccounts: DemoUserAccount[];
  
  // System-wide lists
  requests: ReliefRequest[];
  villages: Village[];
  depots: Depot[];
  roadSegments: RoadSegment[];
  alerts: AlertNotification[];
  ledger: CompletedLedgerItem[];
  inventory: ProviderInventoryItem[];

  // User-specific scoped lists (Data Access Layer Enforcement)
  userRequests: ReliefRequest[];
  userInventory: ProviderInventoryItem[];
  userLedger: CompletedLedgerItem[];
  
  // Selections
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  activeCalculatedRoute: CalculatedRoute | null;
  setActiveCalculatedRoute: (route: CalculatedRoute | null) => void;

  // Actions
  submitReliefRequest: (payload: {
    villageId: string;
    resourceType: ResourceType;
    quantity: string;
    urgency: UrgencyLevel;
    contactName: string;
    contactPhone: string;
    detailsNote?: string;
    isOfficialSubmission?: boolean;
    numericUnits?: number;
  }) => ReliefRequest;

  verifyRequest: (requestId: string, verifiedBy?: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  dispatchRequest: (requestId: string, depotId: string, vehicleName: string, customAllocatedAmount?: number) => DispatchResult;
  markDelivered: (
    requestId: string,
    confirmedByName?: string,
    confirmationNotes?: string,
    userVillageId?: string
  ) => { success: boolean; error?: string };

  // Inventory Management & Matching
  checkResourceAvailability: (depotId: string, resourceType: ResourceType, requestedAmount: number) => ResourceAvailabilityCheck;
  updateInventoryStock: (itemId: string, newTotalStock: number) => { success: boolean; error?: string };

  // Alerts
  markAlertRead: (alertId: string) => void;
  unreadAlertsCount: number;
  activeIsolationInterrupt: AlertNotification | null;
  dismissIsolationInterrupt: () => void;

  // Road Network Simulation
  toggleWeatherSimulation: () => void;
  isWeatherSimulated: boolean;
  updateRoadStatus: (roadId: string, newStatus: RoadStatus, reason?: string) => void;

  // Demo Helpers
  resetAllData: () => void;
  triggerAutoIsolationDemo: (villageId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'resqroute_v2_';

export function parseUnits(quantityStr: string | number): { count: number; unit: string } {
  if (typeof quantityStr === 'number') {
    return { count: Math.max(1, Math.round(quantityStr)), unit: 'Units' };
  }
  const clean = String(quantityStr || '').trim();
  const match = clean.match(/^(\d+(?:,\d+)*)/);
  if (match) {
    const num = parseInt(match[1].replace(/,/g, ''), 10);
    const rest = clean.slice(match[0].length).replace(/^[\s-]+/, '').trim() || 'Units';
    return { count: isNaN(num) || num <= 0 ? 1 : num, unit: rest };
  }
  return { count: 1, unit: 'Units' };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Entry Flow State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedLocal = localStorage.getItem(STORAGE_KEY_PREFIX + 'isLoggedIn');
      const savedSession = sessionStorage.getItem(STORAGE_KEY_PREFIX + 'isLoggedIn');
      return savedLocal === 'true' || savedSession === 'true';
    } catch {
      return false;
    }
  });

  const normalizeSession = (session: UserSession): UserSession => {
    let defaultPermissions: UserPermission[] = [];
    if (session.role === 'requester') {
      defaultPermissions = ['VIEW_VILLAGE_DATA', 'SUBMIT_VILLAGE_REQUEST', 'CONFIRM_VILLAGE_DELIVERY'];
    } else if (session.role === 'provider') {
      defaultPermissions = ['VIEW_DEPOT_INVENTORY', 'MANAGE_DEPOT_STOCK', 'DISPATCH_DEPOT_RESOURCES', 'VIEW_DEPOT_DISPATCHES'];
    } else if (session.role === 'official') {
      defaultPermissions = ['SYSTEM_WIDE_ACCESS', 'VERIFY_REQUESTS', 'ADMIN_ALL_DATA', 'VIEW_ALL_DEPOTS', 'VIEW_ALL_VILLAGES'];
    } else {
      defaultPermissions = ['SYSTEM_WIDE_ACCESS'];
    }

    const userId = session.userId || (
      session.villageId ? `usr-vil-${session.villageId.replace('vil-', '')}` :
      session.depotId ? `usr-depot-${session.depotId.replace('depot-', '')}` :
      `usr-${session.role}-${Date.now()}`
    );

    return {
      ...session,
      userId,
      permissions: session.permissions && session.permissions.length > 0 ? session.permissions : defaultPermissions,
      organization: session.organization || (
        session.role === 'requester' ? `${session.villageName || 'Village'} Local Committee` :
        session.role === 'provider' ? `${session.depotName || 'Depot'} Base` :
        session.role === 'official' ? 'DDMA Emergency Operations' : 'General Public'
      )
    };
  };

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'currentUser') || sessionStorage.getItem(STORAGE_KEY_PREFIX + 'currentUser');
      return saved ? normalizeSession(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  // Load initial states with localStorage persistence
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'role');
    return (saved as UserRole) || 'requester';
  });

  const [activeTab, setActiveTabState] = useState<MainTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'activeTab');
    return (saved as MainTab) || 'dashboard';
  });

  const [requests, setRequests] = useState<ReliefRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'roads');
    return saved ? JSON.parse(saved) : INITIAL_ROAD_SEGMENTS;
  });

  const [villages, setVillages] = useState<Village[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'villages');
    return saved ? JSON.parse(saved) : INITIAL_VILLAGES;
  });

  const [depots] = useState<Depot[]>(INITIAL_DEPOTS);

  const [alerts, setAlerts] = useState<AlertNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [ledger, setLedger] = useState<CompletedLedgerItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [inventory, setInventory] = useState<ProviderInventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'inventory');
    return saved ? JSON.parse(saved) : INITIAL_PROVIDER_INVENTORY;
  });

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeCalculatedRoute, setActiveCalculatedRoute] = useState<CalculatedRoute | null>(null);
  const [isWeatherSimulated, setIsWeatherSimulated] = useState<boolean>(false);

  // Critical Isolation Alert Interrupt Queue State
  const [isolationQueue, setIsolationQueue] = useState<AlertNotification[]>([]);
  const [activeIsolationInterrupt, setActiveIsolationInterrupt] = useState<AlertNotification | null>(null);

  const enqueueIsolationAlert = (alert: AlertNotification) => {
    setIsolationQueue(prev => [...prev, alert]);
  };

  const dismissIsolationInterrupt = () => {
    setActiveIsolationInterrupt(null);
  };

  // Queue runner: whenever active interrupt is dismissed, pop next from queue if any
  useEffect(() => {
    if (!activeIsolationInterrupt && isolationQueue.length > 0) {
      const [nextAlert, ...remaining] = isolationQueue;
      setActiveIsolationInterrupt(nextAlert);
      setIsolationQueue(remaining);
    }
  }, [activeIsolationInterrupt, isolationQueue]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'roads', JSON.stringify(roadSegments));
  }, [roadSegments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'villages', JSON.stringify(villages));
  }, [villages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'inventory', JSON.stringify(inventory));
  }, [inventory]);

  const loginAsUser = (session: UserSession) => {
    const safeSession = normalizeSession(session);
    setCurrentUser(safeSession);
    setRoleState(safeSession.role);
    setIsLoggedIn(true);
    setActiveTabState('dashboard');
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'isLoggedIn', 'true');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'currentUser', JSON.stringify(safeSession));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'role', safeSession.role);
      sessionStorage.setItem(STORAGE_KEY_PREFIX + 'isLoggedIn', 'true');
      sessionStorage.setItem(STORAGE_KEY_PREFIX + 'currentUser', JSON.stringify(safeSession));
    } catch {
      // Ignore storage errors
    }
  };

  const loginAsDemoRole = (targetRole: UserRole) => {
    const demoSession: UserSession = DEFAULT_DEMO_SESSIONS[targetRole] || { 
      userId: `usr-${targetRole}`, 
      role: targetRole, 
      name: 'User', 
      permissions: ['SYSTEM_WIDE_ACCESS'] as UserPermission[] 
    };
    loginAsUser(demoSession);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTabState('dashboard');
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'isLoggedIn');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'currentUser');
      sessionStorage.removeItem(STORAGE_KEY_PREFIX + 'isLoggedIn');
      sessionStorage.removeItem(STORAGE_KEY_PREFIX + 'currentUser');
    } catch {
      // Ignore storage errors
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (!isLoggedIn) {
      loginAsDemoRole(newRole);
    } else {
      if (currentUser?.role !== newRole) {
        const demoSession: UserSession = DEFAULT_DEMO_SESSIONS[newRole] || { 
          userId: `usr-${newRole}`, 
          role: newRole, 
          name: 'User', 
          permissions: ['SYSTEM_WIDE_ACCESS'] as UserPermission[] 
        };
        loginAsUser(demoSession);
      }
    }
    // When switching role, if we are on general navigation or ledger, stay there, otherwise stay on dashboard
    if (activeTab !== 'navigate' && activeTab !== 'ledger') {
      setActiveTabState('dashboard');
    }
  };

  const setActiveTab = (tab: MainTab) => {
    setActiveTabState(tab);
  };

  // ----------------------------------------------------
  // DATA ACCESS LAYER - ROLE-BASED DATA VISIBILITY
  // ----------------------------------------------------
  const userRequests = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'requester') {
      // Village Representatives: ONLY consignments/requests addressed to or submitted for their registered village
      return requests.filter(r => r.villageId === currentUser.villageId);
    }
    if (currentUser.role === 'provider') {
      // Resource Providers: ONLY requests assigned to or dispatched from their assigned depot
      return requests.filter(r => r.assignedDepotId === currentUser.depotId);
    }
    // Administrator / Official / Guest: System-wide access to all requests
    return requests;
  }, [requests, currentUser]);

  const userInventory = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'provider') {
      // Resource Providers: Display inventory ONLY for their assigned depot
      return inventory.filter(item => item.depotId === currentUser.depotId);
    }
    if (currentUser.role === 'requester') {
      // Village Representatives: Do NOT expose inventory belonging to depots
      return [];
    }
    // Administrator / Official: System-wide inventory across all depots
    return inventory;
  }, [inventory, currentUser]);

  const userLedger = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'requester') {
      // Village Representatives: Only delivery records for their registered village
      const vName = (currentUser.villageName || '').toLowerCase().trim();
      return ledger.filter(item => {
        const itemVName = item.villageName.toLowerCase();
        return itemVName.includes(vName) || vName.includes(itemVName);
      });
    }
    if (currentUser.role === 'provider') {
      // Resource Providers: Only deliveries dispatched from their assigned depot
      const dName = (currentUser.depotName || '').toLowerCase().trim();
      const dCode = currentUser.depotId?.toLowerCase() || '';
      return ledger.filter(item => {
        const source = item.sourceDepot.toLowerCase();
        return source.includes(dName) || dName.includes(source) || source.includes(dCode);
      });
    }
    // Administrator / Official: All ledger items
    return ledger;
  }, [ledger, currentUser]);

  // Submit a new relief request
  const submitReliefRequest = ({
    villageId,
    resourceType,
    quantity,
    urgency,
    contactName,
    contactPhone,
    detailsNote,
    isOfficialSubmission = false,
    numericUnits
  }: {
    villageId: string;
    resourceType: ResourceType;
    quantity: string;
    urgency: UrgencyLevel;
    contactName: string;
    contactPhone: string;
    detailsNote?: string;
    isOfficialSubmission?: boolean;
    numericUnits?: number;
  }): ReliefRequest => {
    // If logged in as village representative, enforce submission for their registered village
    const effectiveVillageId = (currentUser?.role === 'requester' && currentUser.villageId)
      ? currentUser.villageId
      : villageId;

    const targetVillage = villages.find(v => v.id === effectiveVillageId) || villages[0];
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const parsed = parseUnits(quantity);
    const requestedUnits = numericUnits !== undefined && numericUnits > 0 ? numericUnits : parsed.count;
    const defaultUnitLabel = RESOURCE_METADATA[resourceType]?.defaultUnit || parsed.unit || 'Units';

    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `RQ-2026-${codeNum}`;

    // Compute route and escalation level from nearest depot
    const nearestDepot = depots[0];
    const calculated = calculateRiskAwareRoute(
      nearestDepot.id,
      targetVillage.id,
      roadSegments,
      ALL_LOCATIONS
    );

    const newRequest: ReliefRequest = {
      id: `req-${Date.now()}`,
      trackingCode,
      villageId: targetVillage.id,
      villageName: targetVillage.name,
      district: targetVillage.district,
      state: targetVillage.state,
      lat: targetVillage.lat,
      lng: targetVillage.lng,
      resourceType,
      quantity,
      requestedUnits,
      allocatedUnits: 0,
      shortageUnits: 0,
      fulfillmentStatus: 'PENDING_MATCH',
      unitLabel: defaultUnitLabel,
      urgency,
      status: isOfficialSubmission ? 'VERIFIED' : 'SUBMITTED',
      submittedBy: contactName,
      submittedRole: isOfficialSubmission ? 'official' : 'villager',
      contactPhone,
      detailsNote,
      submissionTime: timestampStr,
      verifiedTime: isOfficialSubmission ? timestampStr : undefined,
      verifiedBy: isOfficialSubmission ? 'Direct Official Submission (Panchayat / DDMA)' : undefined,
      assignedDepotId: isOfficialSubmission ? nearestDepot.id : undefined,
      assignedDepotName: isOfficialSubmission ? nearestDepot.name : undefined,
      escalationLevel: calculated.escalationLevel,
      relayDistanceKm: calculated.relayDistanceKm,
      relayMethod: calculated.relayMethod,
      totalDistanceKm: calculated.totalDistanceKm,
      estimatedDriveTimeMins: calculated.estimatedMinutes,
      autoDetected: false
    };

    setRequests(prev => [newRequest, ...prev]);
    setSelectedRequestId(newRequest.id);

    return newRequest;
  };

  // Government Official Verifies a request
  const verifyRequest = (requestId: string, verifiedBy = 'DDMA Regional Verification Cell') => {
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          // Assign closest depot
          const assignedDepot = depots[0];
          return {
            ...req,
            status: 'VERIFIED',
            verifiedTime: timestampStr,
            verifiedBy,
            assignedDepotId: assignedDepot.id,
            assignedDepotName: assignedDepot.name
          };
        }
        return req;
      })
    );
  };

  // Reject Request
  const rejectRequest = (requestId: string, reason: string) => {
    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'REJECTED',
            rejectionReason: reason
          };
        }
        return req;
      })
    );
  };

  // Resource Matching Check: Identifies inventory, available stock, shortage, and alternative depots
  const checkResourceAvailability = (
    depotId: string,
    resourceType: ResourceType,
    requestedAmount: number
  ): ResourceAvailabilityCheck => {
    const item = inventory.find(i => i.depotId === depotId && i.resourceName === resourceType);
    const total = item?.totalStock ?? 0;
    const reserved = item?.reservedQuantity ?? 0;
    const available = item?.availableQuantity ?? 0;
    const reqAmount = Math.max(1, requestedAmount);
    const canFulfill = Math.min(reqAmount, available);
    const shortage = Math.max(0, reqAmount - canFulfill);
    const defaultUnit = item?.unit || RESOURCE_METADATA[resourceType]?.defaultUnit || 'Units';

    const alternativeDepots = inventory
      .filter(i => i.resourceName === resourceType && i.depotId !== depotId && i.availableQuantity > 0)
      .map(i => ({
        depotId: i.depotId,
        depotName: i.depotName,
        available: i.availableQuantity,
        unit: i.unit
      }));

    return {
      available,
      total,
      reserved,
      canFulfill,
      shortage,
      isFull: canFulfill === reqAmount && reqAmount > 0,
      isPartial: canFulfill > 0 && canFulfill < reqAmount,
      isUnavailable: available === 0,
      unit: defaultUnit,
      item,
      alternativeDepots
    };
  };

  // Update Total Inventory Stock with validation and role access restrictions
  const updateInventoryStock = (itemId: string, newTotalStock: number): { success: boolean; error?: string } => {
    if (newTotalStock < 0 || isNaN(newTotalStock)) {
      return { success: false, error: 'Total stock cannot be negative or invalid.' };
    }

    if (currentUser?.role === 'requester') {
      return {
        success: false,
        error: 'Security Restriction: Village Representatives do not have authorization to adjust depot inventory.'
      };
    }

    const item = inventory.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: 'Inventory item not found.' };
    }

    if (currentUser?.role === 'provider' && currentUser.depotId && item.depotId !== currentUser.depotId) {
      return {
        success: false,
        error: `Security Restriction: Unauthorized stock adjustment. You are assigned to ${currentUser.depotName || 'your depot'}. Modifying inventory for other depots (${item.depotName}) is restricted.`
      };
    }

    if (newTotalStock < item.reservedQuantity) {
      return {
        success: false,
        error: `Total stock (${newTotalStock}) cannot be less than currently reserved quantity (${item.reservedQuantity}).`
      };
    }

    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setInventory(prev =>
      prev.map(i => {
        if (i.id === itemId) {
          const newAvailable = Math.max(0, newTotalStock - i.reservedQuantity);
          return {
            ...i,
            totalStock: newTotalStock,
            availableQuantity: newAvailable,
            lastUpdated: timestampStr
          };
        }
        return i;
      })
    );

    return { success: true };
  };

  // Resource Provider Dispatches with robust inventory reservation and depot authorization
  const dispatchRequest = (
    requestId: string,
    depotId: string,
    vehicleName: string,
    customAllocatedAmount?: number
  ): DispatchResult => {
    if (currentUser?.role === 'requester') {
      return {
        success: false,
        message: 'Security Restriction: Village Representatives cannot dispatch depot resources.',
        allocated: 0,
        shortage: 0
      };
    }

    const chosenDepot = depots.find(d => d.id === depotId) || depots[0];

    if (currentUser?.role === 'provider' && currentUser.depotId && chosenDepot.id !== currentUser.depotId) {
      return {
        success: false,
        message: `Security Restriction: You are assigned to ${currentUser.depotName}. You cannot dispatch supplies from ${chosenDepot.name}.`,
        allocated: 0,
        shortage: 0
      };
    }

    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) {
      return { success: false, message: 'Request not found.', allocated: 0, shortage: 0 };
    }

    // Idempotency: Prevent duplicate dispatch reservations on multiple clicks
    if (targetReq.status === 'IN_TRANSIT' || targetReq.status === 'DELIVERED') {
      return {
        success: false,
        message: `Mission ${targetReq.trackingCode} is already ${targetReq.status.toLowerCase().replace('_', ' ')}. Duplicate reservation prevented.`,
        allocated: targetReq.allocatedUnits || 0,
        shortage: targetReq.shortageUnits || 0
      };
    }

    // Find the provider inventory item for this depot & resource
    const inventoryItem = inventory.find(
      item => item.depotId === chosenDepot.id && item.resourceName === targetReq.resourceType
    );

    if (!inventoryItem || inventoryItem.availableQuantity <= 0) {
      return {
        success: false,
        message: `Insufficient Stock: ${chosenDepot.name.split('(')[0].trim()} has 0 available ${targetReq.resourceType}. Cannot assign unavailable resources.`,
        allocated: 0,
        shortage: targetReq.requestedUnits || 1
      };
    }

    const availableStock = inventoryItem.availableQuantity;
    const requestedAmount = targetReq.requestedUnits || 1;

    // Determine allocated amount: minimum of requested and available, or custom
    const maxAllocatable = Math.min(requestedAmount, availableStock);
    const allocated = customAllocatedAmount !== undefined
      ? Math.min(Math.max(0, customAllocatedAmount), maxAllocatable)
      : maxAllocatable;

    if (allocated <= 0) {
      return {
        success: false,
        message: `Dispatch aborted: Allocated quantity must be greater than zero. Available stock is ${availableStock}.`,
        allocated: 0,
        shortage: requestedAmount
      };
    }

    const shortage = Math.max(0, requestedAmount - allocated);
    const isPartial = shortage > 0;
    const fulfillmentStatus = isPartial ? 'PARTIAL' : 'FULL';

    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // 1. Atomically update inventory reservation immediately
    setInventory(prev =>
      prev.map(item => {
        if (item.id === inventoryItem.id) {
          const newReserved = item.reservedQuantity + allocated;
          const newAvailable = Math.max(0, item.totalStock - newReserved);
          return {
            ...item,
            reservedQuantity: newReserved,
            availableQuantity: newAvailable,
            lastUpdated: timestampStr
          };
        }
        return item;
      })
    );

    // 2. Update request with exact allocated, shortage, and status
    const reservationId = `res-${targetReq.id}-${Date.now()}`;
    const dispatchTimelineEvent: DeliveryTimelineEvent = {
      stage: 'Dispatched',
      timestamp: timestampStr,
      actor: chosenDepot.name.split('(')[0].trim(),
      note: `${fulfillmentStatus === 'PARTIAL' ? 'Partial dispatch' : 'Full dispatch'}: ${allocated} ${targetReq.unitLabel || 'units'} dispatched via ${vehicleName}.`
    };

    const existingTimeline = targetReq.deliveryTimeline || [
      { stage: 'Submitted', timestamp: targetReq.submissionTime, actor: targetReq.submittedBy, note: 'Emergency requisition registered.' },
      ...(targetReq.verifiedTime ? [{ stage: 'Verified', timestamp: targetReq.verifiedTime, actor: targetReq.verifiedBy || 'DDMA', note: 'Requisition verified.' }] : [])
    ];

    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'IN_TRANSIT',
            assignedDepotId: chosenDepot.id,
            assignedDepotName: chosenDepot.name,
            assignedVehicle: vehicleName,
            dispatchedTime: timestampStr,
            allocatedUnits: allocated,
            shortageUnits: shortage,
            fulfillmentStatus,
            reservationId,
            deliveryTimeline: [...existingTimeline, dispatchTimelineEvent]
          };
        }
        return req;
      })
    );

    const message = isPartial
      ? `⚠️ Partial Fulfillment: Dispatched ${allocated} ${targetReq.unitLabel || 'units'} from ${chosenDepot.name.split('(')[0].trim()}. Remaining shortage of ${shortage} ${targetReq.unitLabel || 'units'} recorded.`
      : `✅ Full Dispatch: Successfully reserved and dispatched all ${allocated} ${targetReq.unitLabel || 'units'} from ${chosenDepot.name.split('(')[0].trim()}.`;

    return {
      success: true,
      message,
      allocated,
      shortage
    };
  };

  // Mark Request as Delivered by Receiver with strict authorization and complete audit trail
  const markDelivered = (
    requestId: string,
    confirmedByName?: string,
    confirmationNotes?: string,
    userVillageId?: string
  ): { success: boolean; error?: string } => {
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) {
      return { success: false, error: 'Request not found.' };
    }

    // 1. Lifecycle verification: Only dispatches in 'IN_TRANSIT' can be marked delivered
    if (targetReq.status !== 'IN_TRANSIT') {
      return {
        success: false,
        error: `Cannot confirm delivery: Request is currently in '${targetReq.status}' status. Only dispatches in 'IN_TRANSIT' can be confirmed delivered.`
      };
    }

    // 2. Receiver Authorization Check
    if (currentUser?.role === 'provider') {
      return {
        success: false,
        error: 'Security Restriction: Resource Providers cannot confirm delivery. Delivery handover must be signed off by the receiving Village Representative.'
      };
    }

    if (currentUser?.role === 'requester' || userVillageId) {
      const activeVillageId = userVillageId || currentUser?.villageId;
      if (!activeVillageId || activeVillageId !== targetReq.villageId) {
        return {
          success: false,
          error: `Security Restriction: Unauthorized delivery confirmation. You are registered as the Village Representative for ${currentUser?.villageName || 'your registered village'}. Consignment ${targetReq.trackingCode} is addressed to ${targetReq.villageName}. Handover can only be confirmed by the authorized representative of ${targetReq.villageName}.`
        };
      }
    }

    const recipientName = confirmedByName || currentUser?.name || targetReq.submittedBy || 'Village Gaonburha';
    const allocated = targetReq.allocatedUnits ?? targetReq.requestedUnits ?? 0;
    const assignedDepotId = targetReq.assignedDepotId || depots[0].id;

    // 3. Provider Inventory: Release reserved stock and decrement total stock
    setInventory(prev =>
      prev.map(item => {
        if (item.depotId === assignedDepotId && item.resourceName === targetReq.resourceType) {
          const newTotal = Math.max(0, item.totalStock - allocated);
          const newReserved = Math.max(0, item.reservedQuantity - allocated);
          const newAvailable = Math.max(0, newTotal - newReserved);
          return {
            ...item,
            totalStock: newTotal,
            reservedQuantity: newReserved,
            availableQuantity: newAvailable,
            lastUpdated: timestampStr
          };
        }
        return item;
      })
    );

    // 4. Update request status, recipient confirmation details, and append delivery timeline
    const existingTimeline = targetReq.deliveryTimeline || [
      { stage: 'Submitted', timestamp: targetReq.submissionTime, actor: targetReq.submittedBy, note: 'Emergency request registered.' },
      ...(targetReq.verifiedTime ? [{ stage: 'Verified', timestamp: targetReq.verifiedTime, actor: targetReq.verifiedBy || 'DDMA', note: 'Requisition verified.' }] : []),
      ...(targetReq.dispatchedTime ? [{ stage: 'Dispatched', timestamp: targetReq.dispatchedTime, actor: targetReq.assignedDepotName || 'Depot', note: `Dispatched ${allocated} ${targetReq.unitLabel || 'units'}.` }] : [])
    ];

    const deliveredEvent: DeliveryTimelineEvent = {
      stage: 'Delivered',
      timestamp: timestampStr,
      actor: recipientName,
      note: confirmationNotes ? `Receiver confirmation: ${confirmationNotes}` : `Physical delivery confirmed at ${targetReq.villageName} by ${recipientName}.`
    };

    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'DELIVERED',
            deliveredTime: timestampStr,
            confirmedBy: recipientName,
            confirmedTime: timestampStr,
            confirmationNotes: confirmationNotes || undefined,
            deliveryTimeline: [...existingTimeline, deliveredEvent]
          };
        }
        return req;
      })
    );

    // 5. Create entry in Public Ledger using the exact underlying request data
    const defaultDepot = depots.find(d => d.id === targetReq.assignedDepotId) || depots[0];
    const sourceDepotName = targetReq.assignedDepotName || (defaultDepot ? defaultDepot.name.split('(')[0].trim() : 'Tezpur Disaster Base');
    const transportName = targetReq.assignedVehicle || (targetReq.escalationLevel === 'LEVEL_3_AIRDROP' ? 'IAF Mi-17 Air-Drop' : '4x4 Rescue Truck & Relief Unit (AS-01-T-8821)');

    const unitStr = targetReq.unitLabel || 'Units';
    const quantityDisplay = targetReq.fulfillmentStatus === 'PARTIAL'
      ? `${allocated} ${unitStr} (Partial of ${targetReq.requestedUnits} requested — ${targetReq.shortageUnits} shortage)`
      : `${allocated} ${unitStr}`;

    const ledgerItem: CompletedLedgerItem = {
      id: `led-${Date.now()}`,
      trackingCode: targetReq.trackingCode,
      villageName: targetReq.villageName,
      district: targetReq.district,
      state: targetReq.state,
      resource: targetReq.resourceType,
      quantity: quantityDisplay,
      requestedUnits: targetReq.requestedUnits,
      allocatedUnits: allocated,
      shortageUnits: targetReq.shortageUnits || 0,
      fulfillmentType: targetReq.fulfillmentStatus === 'PARTIAL' ? 'Partial' : 'Full',
      sourceDepot: sourceDepotName,
      status: 'Delivered',
      dispatchedDate: targetReq.dispatchedTime || timestampStr,
      completedDate: timestampStr,
      beneficiariesCount: Math.floor(800 + Math.random() * 2500),
      transportMethod: transportName,
      confirmedBy: recipientName,
      confirmationNotes: confirmationNotes || undefined
    };

    setLedger(prev => {
      const withoutExisting = prev.filter(item => item.trackingCode !== targetReq.trackingCode);
      return [ledgerItem, ...withoutExisting];
    });

    return { success: true };
  };

  const markAlertRead = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, read: true } : a))
    );
  };

  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  const updateRoadStatus = (roadId: string, newStatus: RoadStatus, reason?: string) => {
    setRoadSegments(prev =>
      prev.map(r => {
        if (r.id === roadId) {
          return {
            ...r,
            status: newStatus,
            hazardReason: reason || r.hazardReason,
            lastUpdated: 'Just now'
          };
        }
        return r;
      })
    );
  };

  // Toggle dynamic monsoon weather simulation
  const toggleWeatherSimulation = () => {
    setIsWeatherSimulated(prev => {
      const next = !prev;
      if (next) {
        // Severe rainfall triggered: block NH-15 and make NH-6 risky
        setRoadSegments(current =>
          current.map(road => {
            if (road.id === 'road-tezpur-lakhimpur-direct') {
              return {
                ...road,
                status: 'BLOCKED',
                hazardReason: '🚨 Flash flood over-topping: 1.4m rushing water across Subansiri culvert.',
                lastUpdated: 'Just now'
              };
            }
            if (road.id === 'road-gh-nongpoh') {
              return {
                ...road,
                status: 'RISKY',
                hazardReason: '⚠️ Heavy mountain downpour; minor rock-shed on uphill carriage.',
                lastUpdated: 'Just now'
              };
            }
            return road;
          })
        );

        // Add weather alert
        const newAlert: AlertNotification = {
          id: `alt-${Date.now()}`,
          type: 'WEATHER',
          title: '🚨 SIMULATED FLASH FLOOD EVENT TRIGGERED',
          message: 'Heavy cloudburst in Subansiri catchment. NH-15 North Bank blocked. Navigation engine automatically calculating safe bypass corridors.',
          timestamp: 'Just now',
          severity: 'critical',
          read: false,
          requiresAction: true
        };
        setAlerts(a => [newAlert, ...a]);
      } else {
        // Reset roads to standard baseline
        setRoadSegments(INITIAL_ROAD_SEGMENTS);
      }
      return next;
    });
  };

  // Trigger automated check-in timeout isolation demo (with duplicate prevention)
  const triggerAutoIsolationDemo = (villageId?: string) => {
    const timestampStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const targetVillage = villageId 
      ? (villages.find(v => v.id === villageId) || villages[1])
      : (villages.find(v => v.id === 'vil-majuli-jengraimukh') || villages[1]);

    // Check whether that village already has an ACTIVE (non-Delivered, non-Rejected) auto-generated request open
    const existingActiveAutoReq = requests.find(
      r => r.villageId === targetVillage.id && 
           r.autoDetected && 
           r.status !== 'DELIVERED' && 
           r.status !== 'REJECTED'
    );

    if (existingActiveAutoReq) {
      // Do NOT create a duplicate — keep existing request's data current
      setRequests(prev => prev.map(req => {
        if (req.id === existingActiveAutoReq.id) {
          return {
            ...req,
            detailsNote: `Check-in beacon silent (Last confirmed isolated at ${timestampStr}). Embankment sensor detected 1.3m water rise. Active mission maintained.`
          };
        }
        return req;
      }));

      // Refresh alert notification so operators know isolation is re-confirmed without spamming duplicate request IDs
      const refreshAlert: AlertNotification = {
        id: `alt-auto-${Date.now()}`,
        type: 'ISOLATION',
        title: `⚡ ISOLATION RE-CONFIRMED: ${targetVillage.name}`,
        message: `Village check-in beacon re-tested at ${timestampStr} (still silent > 180 min). Existing active mission (${existingActiveAutoReq.trackingCode}) kept current.`,
        timestamp: 'Just now',
        severity: 'critical',
        villageId: targetVillage.id,
        villageName: targetVillage.name,
        read: false,
        requiresAction: true
      };

      setAlerts(prev => [refreshAlert, ...prev.filter(a => !(a.villageId === targetVillage.id && a.type === 'ISOLATION'))]);
      enqueueIsolationAlert(refreshAlert);
      setSelectedRequestId(existingActiveAutoReq.id);
      return;
    }

    // Only allow a new auto-generated request for that village once the previous one has reached "Delivered"
    const autoReq: ReliefRequest = {
      id: `req-auto-${Date.now()}`,
      trackingCode: `RQ-2026-AUTO-${Math.floor(10 + Math.random() * 89)}`,
      villageId: targetVillage.id,
      villageName: targetVillage.name,
      district: targetVillage.district,
      state: targetVillage.state,
      lat: targetVillage.lat,
      lng: targetVillage.lng,
      resourceType: 'Drinking Water & Purification Kits',
      quantity: '400 Emergency Water Filter Kits',
      requestedUnits: 400,
      allocatedUnits: 0,
      shortageUnits: 0,
      fulfillmentStatus: 'PENDING_MATCH',
      unitLabel: 'Kits',
      urgency: 'CRITICAL',
      status: 'VERIFIED',
      submittedBy: 'ResQRoute Automated Check-In Sensor',
      submittedRole: 'auto_system',
      contactPhone: 'Automated Trigger (Village silent > 180 min)',
      detailsNote: `Check-in beacon silent (Confirmed isolated at ${timestampStr}). Embankment sensor detected 1.3m water rise. Automatic emergency mission created.`,
      submissionTime: timestampStr,
      verifiedTime: timestampStr,
      verifiedBy: 'System Auto-Verification (Hazard Protocol #9)',
      assignedDepotId: 'depot-jorhat',
      assignedDepotName: 'Jorhat Brahmaputra Riverine Base',
      escalationLevel: 'LEVEL_2_RELAY',
      relayDistanceKm: 28,
      relayMethod: 'boat',
      autoDetected: true
    };

    setRequests(prev => [autoReq, ...prev]);
    setSelectedRequestId(autoReq.id);

    const newAlert: AlertNotification = {
      id: `alt-auto-${Date.now()}`,
      type: 'ISOLATION',
      title: `⚡ AUTO-DETECTED ISOLATION: ${targetVillage.name}`,
      message: `Village check-in signal lost for 180+ minutes in active flood zone. Auto-generated Level 2 relief mission for Jorhat base.`,
      timestamp: 'Just now',
      severity: 'critical',
      villageId: targetVillage.id,
      villageName: targetVillage.name,
      read: false,
      requiresAction: true
    };

    setAlerts(prev => [newAlert, ...prev]);
    enqueueIsolationAlert(newAlert);
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'requests');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'roads');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'villages');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'alerts');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'ledger');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'inventory');
    
    setRequests(INITIAL_REQUESTS);
    setRoadSegments(INITIAL_ROAD_SEGMENTS);
    setVillages(INITIAL_VILLAGES);
    setAlerts(INITIAL_ALERTS);
    setLedger(INITIAL_LEDGER);
    setInventory(INITIAL_PROVIDER_INVENTORY);
    setIsWeatherSimulated(false);
    setSelectedRequestId(null);
    setActiveCalculatedRoute(null);
    setActiveIsolationInterrupt(null);
    setIsolationQueue([]);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        isLoggedIn,
        currentUser,
        loginAsUser,
        loginAsDemoRole,
        logout,
        demoAccounts: DEMO_USER_ACCOUNTS,
        requests,
        villages,
        depots,
        roadSegments,
        alerts,
        ledger,
        inventory,
        userRequests,
        userInventory,
        userLedger,
        selectedRequestId,
        setSelectedRequestId,
        activeCalculatedRoute,
        setActiveCalculatedRoute,
        submitReliefRequest,
        verifyRequest,
        rejectRequest,
        dispatchRequest,
        markDelivered,
        checkResourceAvailability,
        updateInventoryStock,
        markAlertRead,
        unreadAlertsCount,
        activeIsolationInterrupt,
        dismissIsolationInterrupt,
        toggleWeatherSimulation,
        isWeatherSimulated,
        updateRoadStatus,
        resetAllData,
        triggerAutoIsolationDemo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
