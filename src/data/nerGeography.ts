import {
  CalculatedRoute,
  Depot,
  EscalationLevel,
  LocationPoint,
  RoadSegment,
  RoadStatus,
  TurnStep,
  Village
} from '../types';

/**
 * Realistic North-East India Nodes (Assam, Meghalaya, Arunachal Pradesh)
 */
export const INITIAL_DEPOTS: Depot[] = [
  {
    id: 'depot-guwahati',
    name: 'Guwahati NDRF Central Logistics Hub',
    code: 'GH-HUB-01',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    type: 'depot',
    capacityTonnes: 120,
    availableVehicles: ['4x4 Heavy Rescue Truck (x4)', 'All-Terrain Unimog (x2)', 'Inflatable Rescue Boat (x6)'],
    commanderName: 'Col. R. K. Baruah',
    contactNumber: '+91 94350-11223',
    stockSummary: {
      waterKits: 4500,
      medKits: 1200,
      rationsTons: 45,
      shelterTarps: 3000,
      boats: 8
    }
  },
  {
    id: 'depot-tezpur',
    name: 'Tezpur Disaster Response Staging Base',
    code: 'TZ-BASE-02',
    district: 'Sonitpur',
    state: 'Assam',
    lat: 26.6528,
    lng: 92.7926,
    type: 'depot',
    capacityTonnes: 85,
    availableVehicles: ['4x4 High-Clearance Truck (x3)', 'Motorized Lifeboat (x4)', 'Quick Response Drone (x2)'],
    commanderName: 'Maj. S. Neog',
    contactNumber: '+91 94351-44556',
    stockSummary: {
      waterKits: 2800,
      medKits: 950,
      rationsTons: 28,
      shelterTarps: 1800,
      boats: 6
    }
  },
  {
    id: 'depot-jorhat',
    name: 'Jorhat Brahmaputra Riverine Base',
    code: 'JH-RIV-03',
    district: 'Jorhat',
    state: 'Assam',
    lat: 26.7509,
    lng: 94.2037,
    type: 'depot',
    capacityTonnes: 60,
    availableVehicles: ['High-Power River Catamaran (x3)', '4x4 Supply Van (x2)', 'Off-road Medical Unit (x1)'],
    commanderName: 'Insp. P. Gogoi',
    contactNumber: '+91 94352-77889',
    stockSummary: {
      waterKits: 3200,
      medKits: 750,
      rationsTons: 20,
      shelterTarps: 1200,
      boats: 10
    }
  },
  {
    id: 'depot-shillong',
    name: 'Shillong Hill Sector Relief Center',
    code: 'SH-HILL-04',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5788,
    lng: 91.8933,
    type: 'depot',
    capacityTonnes: 70,
    availableVehicles: ['Mountain 4x4 Ambulance (x3)', 'Heavy Hill Crawler (x2)', 'Porter Squad (15-man)'],
    commanderName: 'Capt. L. Marbaniang',
    contactNumber: '+91 94361-99001',
    stockSummary: {
      waterKits: 2100,
      medKits: 1400,
      rationsTons: 24,
      shelterTarps: 2200,
      boats: 2
    }
  }
];

export const INITIAL_VILLAGES: Village[] = [
  {
    id: 'vil-majuli-kamalabari',
    name: 'Kamalabari Ghat (Majuli Island)',
    district: 'Majuli',
    state: 'Assam',
    lat: 26.9125,
    lng: 94.1750,
    type: 'village',
    population: 3450,
    contactPerson: 'Biren Saikia (Gaonburha)',
    phone: '+91 98540-12345',
    lastCheckInMinutesAgo: 14,
    isAutoDetectedIsolated: false,
    riskZone: 'RISKY',
    elevationMeters: 85,
    vulnerabilityFactor: 'River Flood'
  },
  {
    id: 'vil-majuli-jengraimukh',
    name: 'Jengraimukh Wetland Settlement',
    district: 'Majuli',
    state: 'Assam',
    lat: 27.0420,
    lng: 94.3810,
    type: 'village',
    population: 1820,
    contactPerson: 'Purnima Doley',
    phone: '+91 98541-23456',
    lastCheckInMinutesAgo: 185, // Silent for > 3 hours!
    isAutoDetectedIsolated: true,
    riskZone: 'BLOCKED',
    elevationMeters: 78,
    vulnerabilityFactor: 'High-Water Inundation'
  },
  {
    id: 'vil-dhemaji-sissiborgaon',
    name: 'Sissiborgaon Floodplain Village',
    district: 'Dhemaji',
    state: 'Assam',
    lat: 27.4210,
    lng: 94.7120,
    type: 'village',
    population: 2600,
    contactPerson: 'Hemanta Pegu',
    phone: '+91 98542-34567',
    lastCheckInMinutesAgo: 32,
    isAutoDetectedIsolated: false,
    riskZone: 'OPEN',
    elevationMeters: 104,
    vulnerabilityFactor: 'Normal'
  },
  {
    id: 'vil-haflong-jatinga',
    name: 'Jatinga Valley Settlement',
    district: 'Dima Hasao',
    state: 'Assam',
    lat: 25.1240,
    lng: 93.0310,
    type: 'village',
    population: 1420,
    contactPerson: 'David Hmar',
    phone: '+91 98543-45678',
    lastCheckInMinutesAgo: 240, // High-risk silent
    isAutoDetectedIsolated: true,
    riskZone: 'IMPASSABLE',
    elevationMeters: 680,
    vulnerabilityFactor: 'Landslide'
  },
  {
    id: 'vil-cherrapunji-sohra',
    name: 'Nongriat Gorge Hamlet',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.2510,
    lng: 91.6720,
    type: 'village',
    population: 980,
    contactPerson: 'Kynsai Lynrah',
    phone: '+91 98544-56789',
    lastCheckInMinutesAgo: 45,
    isAutoDetectedIsolated: false,
    riskZone: 'RISKY',
    elevationMeters: 720,
    vulnerabilityFactor: 'High-Water Inundation'
  },
  {
    id: 'vil-balipara-foothill',
    name: 'Chariduar Tea Settlement',
    district: 'Sonitpur',
    state: 'Assam',
    lat: 26.8530,
    lng: 92.7840,
    type: 'village',
    population: 2100,
    contactPerson: 'Ramesh Karmakar',
    phone: '+91 98545-67890',
    lastCheckInMinutesAgo: 8,
    isAutoDetectedIsolated: false,
    riskZone: 'OPEN',
    elevationMeters: 110,
    vulnerabilityFactor: 'Normal'
  },
  {
    id: 'vil-morigaon-laharighat',
    name: 'Laharighat Riverbank Enclave',
    district: 'Morigaon',
    state: 'Assam',
    lat: 26.3980,
    lng: 92.3610,
    type: 'village',
    population: 3100,
    contactPerson: 'Abdur Rahim',
    phone: '+91 98546-78901',
    lastCheckInMinutesAgo: 19,
    isAutoDetectedIsolated: false,
    riskZone: 'RISKY',
    elevationMeters: 62,
    vulnerabilityFactor: 'River Flood'
  },
  {
    id: 'vil-nongpoh-umpling',
    name: 'Umroi Sub-Hill Hamlet',
    district: 'Ri-Bhoi',
    state: 'Meghalaya',
    lat: 25.7140,
    lng: 91.9320,
    type: 'village',
    population: 1350,
    contactPerson: 'Mebanshan Ryntathiang',
    phone: '+91 98547-89012',
    lastCheckInMinutesAgo: 12,
    isAutoDetectedIsolated: false,
    riskZone: 'OPEN',
    elevationMeters: 560,
    vulnerabilityFactor: 'Normal'
  }
];

export const JUNCTION_NODES: LocationPoint[] = [
  { id: 'junc-nagaon', name: 'Nagaon Bypass Junction', district: 'Nagaon', state: 'Assam', lat: 26.3480, lng: 92.6840, type: 'junction' },
  { id: 'junc-tezpur-bridge', name: 'Kolia Bhomora Bridge North', district: 'Sonitpur', state: 'Assam', lat: 26.6020, lng: 92.8540, type: 'junction' },
  { id: 'junc-kaziranga', name: 'Kohora Kaziranga Gate', district: 'Golaghat', state: 'Assam', lat: 26.5870, lng: 93.4120, type: 'junction' },
  { id: 'junc-nimati-ghat', name: 'Nimati Ferry Ghat Post', district: 'Jorhat', state: 'Assam', lat: 26.8610, lng: 94.2180, type: 'junction' },
  { id: 'junc-north-lakhimpur', name: 'North Lakhimpur Crossing', district: 'Lakhimpur', state: 'Assam', lat: 27.2340, lng: 94.1020, type: 'junction' },
  { id: 'junc-lumding', name: 'Lumding Hill Junction', district: 'Hojai', state: 'Assam', lat: 25.7510, lng: 93.1720, type: 'junction' },
  { id: 'junc-nongpoh', name: 'Nongpoh Valley Post', district: 'Ri-Bhoi', state: 'Meghalaya', lat: 25.9010, lng: 91.8810, type: 'junction' }
];

export const ALL_LOCATIONS: LocationPoint[] = [
  ...INITIAL_DEPOTS,
  ...INITIAL_VILLAGES,
  ...JUNCTION_NODES
];

export const INITIAL_ROAD_SEGMENTS: RoadSegment[] = [
  // Guwahati -> Nagaon (NH-27 4-Lane corridor)
  {
    id: 'road-gh-ng',
    name: 'NH-27 East-West Expressway (Guwahati to Nagaon)',
    fromNodeId: 'depot-guwahati',
    toNodeId: 'junc-nagaon',
    fromName: 'Guwahati NDRF Hub',
    toName: 'Nagaon Bypass',
    coordinates: [
      [26.1445, 91.7362],
      [26.1820, 91.9540],
      [26.2410, 92.2150],
      [26.3480, 92.6840]
    ],
    distanceKm: 112,
    status: 'OPEN',
    hazardReason: 'Dry elevated highway. Normal 4-lane flow.',
    lastUpdated: '10 mins ago',
    elevationGainMeters: 25,
    recommendedSpeedKmh: 75
  },
  // Nagaon -> Laharighat (River road)
  {
    id: 'road-ng-lahari',
    name: 'SH-3 Morigaon-Laharighat River Link',
    fromNodeId: 'junc-nagaon',
    toNodeId: 'vil-morigaon-laharighat',
    fromName: 'Nagaon Bypass',
    toName: 'Laharighat Riverbank',
    coordinates: [
      [26.3480, 92.6840],
      [26.3710, 92.5100],
      [26.3980, 92.3610]
    ],
    distanceKm: 38,
    status: 'RISKY',
    hazardReason: 'Active river seepage on shoulder; 10-15cm standing water in low patches.',
    lastUpdated: '25 mins ago',
    elevationGainMeters: 5,
    recommendedSpeedKmh: 35
  },
  // Nagaon -> Tezpur Bridge North (NH-715 Kolia Bhomora Corridor)
  {
    id: 'road-ng-tzbridge',
    name: 'NH-715 Kolia Bhomora Brahmaputra Crossing',
    fromNodeId: 'junc-nagaon',
    toNodeId: 'junc-tezpur-bridge',
    fromName: 'Nagaon Bypass',
    toName: 'Kolia Bhomora Bridge North',
    coordinates: [
      [26.3480, 92.6840],
      [26.4950, 92.8120],
      [26.6020, 92.8540]
    ],
    distanceKm: 34,
    status: 'OPEN',
    hazardReason: 'Reinforced concrete bridge clear. Traffic moving normally.',
    lastUpdated: '15 mins ago',
    elevationGainMeters: 10,
    recommendedSpeedKmh: 60
  },
  // Tezpur Bridge -> Tezpur Base
  {
    id: 'road-tzbridge-tzbase',
    name: 'Tezpur Ring Road Link',
    fromNodeId: 'junc-tezpur-bridge',
    toNodeId: 'depot-tezpur',
    fromName: 'Kolia Bhomora Bridge North',
    toName: 'Tezpur Staging Base',
    coordinates: [
      [26.6020, 92.8540],
      [26.6340, 92.8150],
      [26.6528, 92.7926]
    ],
    distanceKm: 9,
    status: 'OPEN',
    hazardReason: 'Clear paved urban connector.',
    lastUpdated: '5 mins ago',
    elevationGainMeters: 15,
    recommendedSpeedKmh: 50
  },
  // Tezpur Base -> Chariduar Tea Settlement (Balipara Foothill)
  {
    id: 'road-tz-chariduar',
    name: 'SH-4 Balipara-Chariduar Arunachal Access',
    fromNodeId: 'depot-tezpur',
    toNodeId: 'vil-balipara-foothill',
    fromName: 'Tezpur Staging Base',
    toName: 'Chariduar Tea Settlement',
    coordinates: [
      [26.6528, 92.7926],
      [26.7410, 92.7880],
      [26.8530, 92.7840]
    ],
    distanceKm: 24,
    status: 'OPEN',
    hazardReason: 'Paved foothill corridor. All vehicles cleared.',
    lastUpdated: '40 mins ago',
    elevationGainMeters: 45,
    recommendedSpeedKmh: 55
  },
  // Tezpur Bridge -> Kaziranga -> Jorhat (NH-715 South Bank Corridor)
  {
    id: 'road-tzbridge-kaziranga',
    name: 'NH-715 Kaziranga Wildlife & Relief Corridor',
    fromNodeId: 'junc-tezpur-bridge',
    toNodeId: 'junc-kaziranga',
    fromName: 'Kolia Bhomora Bridge North',
    toName: 'Kohora Kaziranga Gate',
    coordinates: [
      [26.6020, 92.8540],
      [26.5680, 93.1050],
      [26.5870, 93.4120]
    ],
    distanceKm: 62,
    status: 'OPEN',
    hazardReason: 'Animal sensor corridor active; speed capped at 40 km/h. Clear dry tarmac.',
    lastUpdated: '12 mins ago',
    elevationGainMeters: 30,
    recommendedSpeedKmh: 45
  },
  // Kaziranga -> Jorhat Riverine Base
  {
    id: 'road-kaziranga-jorhat',
    name: 'NH-715 Jorhat Trunk Highway',
    fromNodeId: 'junc-kaziranga',
    toNodeId: 'depot-jorhat',
    fromName: 'Kohora Kaziranga Gate',
    toName: 'Jorhat Riverine Base',
    coordinates: [
      [26.5870, 93.4120],
      [26.6450, 93.8120],
      [26.7509, 94.2037]
    ],
    distanceKm: 85,
    status: 'OPEN',
    hazardReason: 'Primary asphalt highway. No obstruction.',
    lastUpdated: '18 mins ago',
    elevationGainMeters: 15,
    recommendedSpeedKmh: 65
  },
  // Jorhat Base -> Nimati Ghat Post
  {
    id: 'road-jh-nimatighat',
    name: 'Nimati Ghat Riverine Approach',
    fromNodeId: 'depot-jorhat',
    toNodeId: 'junc-nimati-ghat',
    fromName: 'Jorhat Riverine Base',
    toName: 'Nimati Ferry Ghat',
    coordinates: [
      [26.7509, 94.2037],
      [26.8120, 94.2100],
      [26.8610, 94.2180]
    ],
    distanceKm: 14,
    status: 'OPEN',
    hazardReason: 'Paved approach to ferry embankment.',
    lastUpdated: '8 mins ago',
    elevationGainMeters: 5,
    recommendedSpeedKmh: 45
  },
  // Nimati Ghat -> Kamalabari Ghat (Majuli Island Ferry/Boat Relay)
  {
    id: 'road-nimati-kamalabari',
    name: 'Brahmaputra Main Channel Waterway (Nimati to Kamalabari)',
    fromNodeId: 'junc-nimati-ghat',
    toNodeId: 'vil-majuli-kamalabari',
    fromName: 'Nimati Ferry Ghat',
    toName: 'Kamalabari Ghat (Majuli)',
    coordinates: [
      [26.8610, 94.2180],
      [26.8850, 94.1950],
      [26.9125, 94.1750]
    ],
    distanceKm: 8,
    status: 'RISKY',
    hazardReason: 'High river current (2.8 m/s). Motorized rescue boats and Ro-Pax ferries operating with caution.',
    lastUpdated: '14 mins ago',
    elevationGainMeters: 0,
    recommendedSpeedKmh: 20
  },
  // Kamalabari -> Jengraimukh (Majuli Interior Road - Currently BLOCKED by river breaches)
  {
    id: 'road-kamalabari-jengraimukh',
    name: 'Majuli Interior Embankment Road',
    fromNodeId: 'vil-majuli-kamalabari',
    toNodeId: 'vil-majuli-jengraimukh',
    fromName: 'Kamalabari Ghat (Majuli)',
    toName: 'Jengraimukh Settlement',
    coordinates: [
      [26.9125, 94.1750],
      [26.9740, 94.2650],
      [27.0420, 94.3810]
    ],
    distanceKm: 28,
    status: 'BLOCKED',
    hazardReason: 'River breach at km 16; 1.2m rushing floodwater across 350m stretch. Impassable for land vehicles.',
    lastUpdated: '30 mins ago',
    elevationGainMeters: 0,
    recommendedSpeedKmh: 0
  },
  // Tezpur Base -> North Lakhimpur (Direct Highway NH-15 North Bank - Currently BLOCKED at Subansiri overflow)
  {
    id: 'road-tezpur-lakhimpur-direct',
    name: 'NH-15 North Bank Direct Highway (Tezpur - Lakhimpur)',
    fromNodeId: 'depot-tezpur',
    toNodeId: 'junc-north-lakhimpur',
    fromName: 'Tezpur Staging Base',
    toName: 'North Lakhimpur Crossing',
    coordinates: [
      [26.6528, 92.7926],
      [26.8450, 93.3100],
      [27.0210, 93.7400],
      [27.2340, 94.1020]
    ],
    distanceKm: 148,
    status: 'BLOCKED',
    hazardReason: 'Subansiri river tributary overflow at km 84; culvert collapsed. Heavy vehicle access barred.',
    lastUpdated: '18 mins ago',
    elevationGainMeters: 35,
    recommendedSpeedKmh: 0
  },
  // North Lakhimpur -> Sissiborgaon (Dhemaji flood plain)
  {
    id: 'road-lakhimpur-sissiborgaon',
    name: 'NH-15 Dhemaji Link',
    fromNodeId: 'junc-north-lakhimpur',
    toNodeId: 'vil-dhemaji-sissiborgaon',
    fromName: 'North Lakhimpur Crossing',
    toName: 'Sissiborgaon Village',
    coordinates: [
      [27.2340, 94.1020],
      [27.3250, 94.4100],
      [27.4210, 94.7120]
    ],
    distanceKm: 68,
    status: 'OPEN',
    hazardReason: 'Elevated highway open. Clear access to Sissiborgaon relief point.',
    lastUpdated: '22 mins ago',
    elevationGainMeters: 15,
    recommendedSpeedKmh: 60
  },
  // Alternate route to Lakhimpur: via Kolia Bhomora Bridge -> Jorhat -> Bogibeel / North Bank link
  {
    id: 'road-jorhat-lakhimpur-alternate',
    name: 'NH-715 South Bank Bypass to North Lakhimpur',
    fromNodeId: 'depot-jorhat',
    toNodeId: 'junc-north-lakhimpur',
    fromName: 'Jorhat Riverine Base',
    toName: 'North Lakhimpur Crossing',
    coordinates: [
      [26.7509, 94.2037],
      [26.9450, 94.1800],
      [27.1100, 94.1400],
      [27.2340, 94.1020]
    ],
    distanceKm: 64,
    status: 'OPEN',
    hazardReason: 'Alternate open corridor across South Bank bypass. Safe detour avoiding NH-15 flood cut.',
    lastUpdated: '10 mins ago',
    elevationGainMeters: 20,
    recommendedSpeedKmh: 55
  },
  // Guwahati -> Shillong (NH-6 Mountain Expressway)
  {
    id: 'road-gh-nongpoh',
    name: 'NH-6 Guwahati-Shillong Expressway (Guwahati to Nongpoh)',
    fromNodeId: 'depot-guwahati',
    toNodeId: 'junc-nongpoh',
    fromName: 'Guwahati NDRF Hub',
    toName: 'Nongpoh Valley Post',
    coordinates: [
      [26.1445, 91.7362],
      [26.0120, 91.8100],
      [25.9010, 91.8810]
    ],
    distanceKm: 48,
    status: 'OPEN',
    hazardReason: '4-lane divided mountain corridor. Retaining walls stable.',
    lastUpdated: '12 mins ago',
    elevationGainMeters: 450,
    recommendedSpeedKmh: 60
  },
  {
    id: 'road-nongpoh-umroi',
    name: 'Umroi Sub-Hill Rural Access',
    fromNodeId: 'junc-nongpoh',
    toNodeId: 'vil-nongpoh-umpling',
    fromName: 'Nongpoh Valley Post',
    toName: 'Umroi Sub-Hill Hamlet',
    coordinates: [
      [25.9010, 91.8810],
      [25.8050, 91.9100],
      [25.7140, 91.9320]
    ],
    distanceKm: 26,
    status: 'OPEN',
    hazardReason: 'Paved rural asphalt. No blockage.',
    lastUpdated: '35 mins ago',
    elevationGainMeters: 220,
    recommendedSpeedKmh: 40
  },
  {
    id: 'road-nongpoh-shillong',
    name: 'NH-6 Upper Khasi Hills Ascent',
    fromNodeId: 'junc-nongpoh',
    toNodeId: 'depot-shillong',
    fromName: 'Nongpoh Valley Post',
    toName: 'Shillong Relief Center',
    coordinates: [
      [25.9010, 91.8810],
      [25.7420, 91.8900],
      [25.5788, 91.8933]
    ],
    distanceKm: 52,
    status: 'OPEN',
    hazardReason: 'Clear uphill highway. Fog lights advised after dusk.',
    lastUpdated: '15 mins ago',
    elevationGainMeters: 900,
    recommendedSpeedKmh: 50
  },
  // Shillong -> Cherrapunji Nongriat
  {
    id: 'road-shillong-sohra',
    name: 'SH-5 Sohra Hill Pass to Nongriat Ridge',
    fromNodeId: 'depot-shillong',
    toNodeId: 'vil-cherrapunji-sohra',
    fromName: 'Shillong Relief Center',
    toName: 'Nongriat Gorge Hamlet',
    coordinates: [
      [25.5788, 91.8933],
      [25.4120, 91.7850],
      [25.3210, 91.7100],
      [25.2510, 91.6720]
    ],
    distanceKm: 54,
    status: 'RISKY',
    hazardReason: 'Heavy cloudburst run-off; loose gravel at km 38 switchbacks. 4x4 or high-clearance only.',
    lastUpdated: '20 mins ago',
    elevationGainMeters: 380,
    recommendedSpeedKmh: 30
  },
  // Nagaon -> Lumding Junction
  {
    id: 'road-ng-lumding',
    name: 'NH-27 Lumding Spur',
    fromNodeId: 'junc-nagaon',
    toNodeId: 'junc-lumding',
    fromName: 'Nagaon Bypass',
    toName: 'Lumding Hill Junction',
    coordinates: [
      [26.3480, 92.6840],
      [26.0420, 92.9100],
      [25.7510, 93.1720]
    ],
    distanceKm: 88,
    status: 'OPEN',
    hazardReason: 'Open tarmac connecting to southern hill districts.',
    lastUpdated: '20 mins ago',
    elevationGainMeters: 120,
    recommendedSpeedKmh: 65
  },
  // Lumding -> Jatinga / Haflong (Dima Hasao - Severely Impassable due to multiple landslides)
  {
    id: 'road-lumding-haflong',
    name: 'NH-54E Dima Hasao Mountain Pass',
    fromNodeId: 'junc-lumding',
    toNodeId: 'vil-haflong-jatinga',
    fromName: 'Lumding Hill Junction',
    toName: 'Jatinga Valley Settlement',
    coordinates: [
      [25.7510, 93.1720],
      [25.4520, 93.1100],
      [25.2810, 93.0700],
      [25.1240, 93.0310]
    ],
    distanceKm: 82,
    status: 'IMPASSABLE',
    hazardReason: 'Catastrophic mudslide across 1.4km; bridge abutment washed away near km 54. Total ground route cutoff.',
    lastUpdated: '1 hour ago',
    elevationGainMeters: 550,
    recommendedSpeedKmh: 0
  }
];

/**
 * Build an adjacency graph for bidirectional navigation
 */
interface GraphEdge {
  targetId: string;
  segment: RoadSegment;
  weight: number;
}

export function buildAdjacencyGraph(segments: RoadSegment[]): Map<string, GraphEdge[]> {
  const graph = new Map<string, GraphEdge[]>();

  for (const seg of segments) {
    if (!graph.has(seg.fromNodeId)) graph.set(seg.fromNodeId, []);
    if (!graph.has(seg.toNodeId)) graph.set(seg.toNodeId, []);

    // Calculate traversal weight based on road status
    let weight = seg.distanceKm;
    if (seg.status === 'RISKY') {
      weight = seg.distanceKm * 1.5; // Slight penalty but passable
    } else if (seg.status === 'BLOCKED' || seg.status === 'IMPASSABLE') {
      weight = 999999; // Effectively impassable for pure driving
    }

    graph.get(seg.fromNodeId)!.push({
      targetId: seg.toNodeId,
      segment: seg,
      weight
    });

    graph.get(seg.toNodeId)!.push({
      targetId: seg.fromNodeId,
      segment: seg,
      weight
    });
  }

  return graph;
}

/**
 * Dijkstra route solver that finds:
 * 1. The best passable route (avoiding BLOCKED/IMPASSABLE roads if possible)
 * 2. If no full drivable route exists, determines if partial relay is possible (Level 2) or Air-drop required (Level 3)
 * 3. Explains alternative routing deltas (km & mins) when standard route was blocked
 */
export function calculateRiskAwareRoute(
  sourceId: string,
  targetId: string,
  segments: RoadSegment[] = INITIAL_ROAD_SEGMENTS,
  locations: LocationPoint[] = ALL_LOCATIONS
): CalculatedRoute {
  const locMap = new Map<string, LocationPoint>();
  locations.forEach(loc => locMap.set(loc.id, loc));

  const sourceLoc = locMap.get(sourceId);
  const targetLoc = locMap.get(targetId);

  const fallbackSource: LocationPoint = sourceLoc || {
    id: sourceId,
    name: 'Origin Location',
    district: '',
    state: '',
    lat: 26.1445,
    lng: 91.7362,
    type: 'junction'
  };

  const fallbackTarget: LocationPoint = targetLoc || {
    id: targetId,
    name: 'Destination Location',
    district: '',
    state: '',
    lat: 26.9125,
    lng: 94.1750,
    type: 'village'
  };

  // 1. First attempt: Find route using ONLY OPEN & RISKY segments (strictly passable ground route)
  const passableSegments = segments.filter(s => s.status === 'OPEN' || s.status === 'RISKY');
  const passableGraph = buildAdjacencyGraph(passableSegments);

  const directPath = dijkstraSearch(sourceId, targetId, passableGraph);

  // 2. Also run search on ALL segments (including blocked ones) to see what the shortest nominal/historic route was
  const allGraph = buildAdjacencyGraph(segments.map(s => ({ ...s, status: 'OPEN' }))); // calculate nominal distance
  const nominalPath = dijkstraSearch(sourceId, targetId, allGraph);

  if (directPath && directPath.segments.length > 0) {
    // We found a ground route!
    const overallRisk = directPath.segments.some(s => s.status === 'RISKY') ? 'RISKY' : 'OPEN';
    const isRerouted = nominalPath && nominalPath.totalDistanceKm < directPath.totalDistanceKm - 5;
    
    // Find if a blocked road was bypassed
    const blockedSeg = segments.find(s => (s.status === 'BLOCKED' || s.status === 'IMPASSABLE') &&
      nominalPath?.segments.some(ns => ns.id === s.id));

    const extraKm = isRerouted && nominalPath ? Math.round(directPath.totalDistanceKm - nominalPath.totalDistanceKm) : 0;
    const extraMins = extraKm > 0 ? Math.round((extraKm / 45) * 60) : 0;

    const steps = buildTurnSteps(directPath.segments, sourceId);

    let warningMessage: string | undefined;
    if (overallRisk === 'RISKY') {
      const riskySegs = directPath.segments.filter(s => s.status === 'RISKY');
      warningMessage = `⚠️ Caution: Route includes ${riskySegs.length} risky section(s) (${riskySegs.map(s => s.name.split('(')[0].trim()).join(', ')}). Proceed with caution.`;
    }

    return {
      sourceId,
      sourceName: fallbackSource.name,
      targetId,
      targetName: fallbackTarget.name,
      totalDistanceKm: Math.round(directPath.totalDistanceKm * 10) / 10,
      estimatedMinutes: Math.round(directPath.totalTimeMinutes),
      pathCoordinates: directPath.coordinates,
      segments: directPath.segments,
      steps,
      overallRisk,
      isReroutedDueToBlockade: !!isRerouted && !!blockedSeg,
      blockedRoadName: blockedSeg?.name,
      extraDistanceKm: extraKm,
      extraTimeMinutes: extraMins,
      escalationLevel: 'LEVEL_1_VEHICLE',
      warningMessage
    };
  }

  // 3. No full drivable ground route. Let's check for PARTIAL REACH (Level 2 Relay)
  // Find the closest node to target that CAN be reached from source
  const reachableNodes = getReachableNodes(sourceId, passableGraph);
  
  // Find connected segment into target that is blocked
  const targetIncidentSegments = segments.filter(s => s.fromNodeId === targetId || s.toNodeId === targetId);
  const partialReachableIncident = targetIncidentSegments.find(s => {
    const otherNodeId = s.fromNodeId === targetId ? s.toNodeId : s.fromNodeId;
    return reachableNodes.has(otherNodeId);
  });

  if (partialReachableIncident) {
    const stagingNodeId = partialReachableIncident.fromNodeId === targetId ? partialReachableIncident.toNodeId : partialReachableIncident.fromNodeId;
    const stagingLoc = locMap.get(stagingNodeId);
    const subRoute = dijkstraSearch(sourceId, stagingNodeId, passableGraph);

    if (subRoute) {
      const relayDistance = partialReachableIncident.distanceKm;
      const isBoat = partialReachableIncident.name.toLowerCase().includes('waterway') || 
                     partialReachableIncident.hazardReason.toLowerCase().includes('river') ||
                     partialReachableIncident.hazardReason.toLowerCase().includes('boat') ||
                     partialReachableIncident.hazardReason.toLowerCase().includes('floodwater');
      
      const relayMethod = isBoat ? 'boat' : 'porter';

      const combinedCoordinates = [
        ...subRoute.coordinates,
        ...partialReachableIncident.coordinates
      ];

      const steps = [
        ...buildTurnSteps(subRoute.segments, sourceId),
        {
          instruction: `Arrive at staging post (${stagingLoc?.name || 'Roadhead'}). Ground vehicle travel terminates here due to: ${partialReachableIncident.hazardReason}`,
          roadName: partialReachableIncident.name,
          distanceKm: 0,
          status: partialReachableIncident.status,
          hazardNote: 'Disembark ground vehicles; transition to field relay squad.'
        },
        {
          instruction: `Final ${relayDistance} km relay via ${relayMethod === 'boat' ? 'rescue boat / shallow craft' : 'foot porter / headload team'} to reach ${fallbackTarget.name}.`,
          roadName: `Final Relay Leg (${relayMethod.toUpperCase()})`,
          distanceKm: relayDistance,
          status: partialReachableIncident.status,
          hazardNote: partialReachableIncident.hazardReason
        }
      ];

      return {
        sourceId,
        sourceName: fallbackSource.name,
        targetId,
        targetName: fallbackTarget.name,
        totalDistanceKm: Math.round((subRoute.totalDistanceKm + relayDistance) * 10) / 10,
        estimatedMinutes: Math.round(subRoute.totalTimeMinutes + (relayDistance * (relayMethod === 'boat' ? 6 : 15))),
        pathCoordinates: combinedCoordinates,
        segments: [...subRoute.segments, partialReachableIncident],
        steps,
        overallRisk: partialReachableIncident.status,
        isReroutedDueToBlockade: true,
        blockedRoadName: partialReachableIncident.name,
        escalationLevel: 'LEVEL_2_RELAY',
        relayStartNodeName: stagingLoc?.name || 'Staging Post',
        relayDistanceKm: relayDistance,
        relayMethod,
        warningMessage: `⚠️ Vehicle can reach partway (${stagingLoc?.name || 'Staging Roadhead'}). Final ${relayDistance} km requires ${relayMethod} relay due to road blockage.`
      };
    }
  }

  // 4. LEVEL 3: AIR-DROP ESCALATION (Total Isolation)
  // Generate direct airborne line coordinates
  const straightLineCoords: [number, number][] = [
    [fallbackSource.lat, fallbackSource.lng],
    [fallbackTarget.lat, fallbackTarget.lng]
  ];

  const crowDistanceKm = calculateCrowDistance(
    fallbackSource.lat,
    fallbackSource.lng,
    fallbackTarget.lat,
    fallbackTarget.lng
  );

  return {
    sourceId,
    sourceName: fallbackSource.name,
    targetId,
    targetName: fallbackTarget.name,
    totalDistanceKm: Math.round(crowDistanceKm * 10) / 10,
    estimatedMinutes: Math.round(crowDistanceKm * 0.8), // ~80 km/h helicopter transit
    pathCoordinates: straightLineCoords,
    segments: [],
    steps: [
      {
        instruction: `All ground corridors to ${fallbackTarget.name} are completely severed/impassable.`,
        roadName: 'Ground Isolation Blockade',
        distanceKm: 0,
        status: 'IMPASSABLE',
        hazardNote: 'Severe mudslides, washed out culverts, or extreme inundation.'
      },
      {
        instruction: `Initiate Air-Drop Helicopter Protocol from ${fallbackSource.name} (${Math.round(crowDistanceKm)} km direct aerial corridor).`,
        roadName: 'IAF / Disaster Air Wing Corridor',
        distanceKm: Math.round(crowDistanceKm),
        status: 'IMPASSABLE',
        hazardNote: 'Air-drop coordinates: ' + fallbackTarget.lat.toFixed(4) + '° N, ' + fallbackTarget.lng.toFixed(4) + '° E'
      }
    ],
    overallRisk: 'IMPASSABLE',
    isReroutedDueToBlockade: true,
    escalationLevel: 'LEVEL_3_AIRDROP',
    relayMethod: 'drone',
    warningMessage: `🚫 No ground route available — All road access to ${fallbackTarget.name} is severed. Escalate immediately for air-drop coordination!`
  };
}

/**
 * Standard Dijkstra shortest path implementation
 */
interface DijkstraResult {
  segments: RoadSegment[];
  coordinates: [number, number][];
  totalDistanceKm: number;
  totalTimeMinutes: number;
}

function dijkstraSearch(
  startId: string,
  endId: string,
  graph: Map<string, GraphEdge[]>
): DijkstraResult | null {
  if (startId === endId) {
    return {
      segments: [],
      coordinates: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0
    };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edge: GraphEdge }>();
  const unvisited = new Set<string>();

  // Initialize
  for (const nodeId of graph.keys()) {
    distances.set(nodeId, Infinity);
    unvisited.add(nodeId);
  }
  distances.set(startId, 0);
  unvisited.add(startId);

  while (unvisited.size > 0) {
    // Find node with smallest distance
    let currentId: string | null = null;
    let smallestDist = Infinity;

    for (const nodeId of unvisited) {
      const dist = distances.get(nodeId) ?? Infinity;
      if (dist < smallestDist) {
        smallestDist = dist;
        currentId = nodeId;
      }
    }

    if (!currentId || smallestDist === Infinity) break;
    if (currentId === endId) break;

    unvisited.delete(currentId);

    const edges = graph.get(currentId) || [];
    for (const edge of edges) {
      if (!unvisited.has(edge.targetId)) continue;

      const alt = smallestDist + edge.weight;
      if (alt < (distances.get(edge.targetId) ?? Infinity)) {
        distances.set(edge.targetId, alt);
        previous.set(edge.targetId, { nodeId: currentId, edge });
      }
    }
  }

  // Reconstruct path
  if (!previous.has(endId)) return null;

  const resultSegments: RoadSegment[] = [];
  const resultCoordinates: [number, number][] = [];
  let curr = endId;
  let totalKm = 0;
  let totalMins = 0;

  while (curr !== startId) {
    const prev = previous.get(curr);
    if (!prev) break;

    resultSegments.unshift(prev.edge.segment);
    totalKm += prev.edge.segment.distanceKm;
    
    // Estimate speed
    const speed = prev.edge.segment.recommendedSpeedKmh || 45;
    totalMins += (prev.edge.segment.distanceKm / speed) * 60;

    // Coordinate ordering
    const segCoords = prev.edge.segment.coordinates;
    const isReversed = prev.edge.segment.toNodeId === prev.nodeId;
    const orderedCoords = isReversed ? [...segCoords].reverse() : segCoords;

    resultCoordinates.unshift(...orderedCoords);
    curr = prev.nodeId;
  }

  // Deduplicate consecutive identical coordinates
  const cleanCoords: [number, number][] = [];
  for (let i = 0; i < resultCoordinates.length; i++) {
    if (
      i === 0 ||
      resultCoordinates[i][0] !== resultCoordinates[i - 1][0] ||
      resultCoordinates[i][1] !== resultCoordinates[i - 1][1]
    ) {
      cleanCoords.push(resultCoordinates[i]);
    }
  }

  return {
    segments: resultSegments,
    coordinates: cleanCoords,
    totalDistanceKm: totalKm,
    totalTimeMinutes: totalMins
  };
}

function getReachableNodes(startId: string, graph: Map<string, GraphEdge[]>): Set<string> {
  const visited = new Set<string>();
  const queue = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const node = queue.shift()!;
    const edges = graph.get(node) || [];
    for (const edge of edges) {
      if (!visited.has(edge.targetId)) {
        visited.add(edge.targetId);
        queue.push(edge.targetId);
      }
    }
  }

  return visited;
}

function buildTurnSteps(segments: RoadSegment[], startNodeId: string): TurnStep[] {
  const steps: TurnStep[] = [];
  let currentNodeId = startNodeId;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isForward = seg.fromNodeId === currentNodeId;
    const destinationName = isForward ? seg.toName : seg.fromName;
    currentNodeId = isForward ? seg.toNodeId : seg.fromNodeId;

    let instruction = `Continue on ${seg.name} towards ${destinationName} (${seg.distanceKm} km)`;
    if (i === 0) {
      instruction = `Depart origin on ${seg.name} towards ${destinationName} (${seg.distanceKm} km)`;
    } else if (i === segments.length - 1) {
      instruction = `Take ${seg.name} into final destination ${destinationName} (${seg.distanceKm} km)`;
    }

    steps.push({
      instruction,
      roadName: seg.name,
      distanceKm: seg.distanceKm,
      status: seg.status,
      hazardNote: seg.status !== 'OPEN' ? seg.hazardReason : undefined
    });
  }

  return steps;
}

function calculateCrowDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
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
