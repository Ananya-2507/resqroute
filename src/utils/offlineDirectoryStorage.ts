export interface OfflineProvider {
  id: string;
  name: string;
  organization: string;
  phone: string;
  category: 'NGO' | 'Volunteer' | 'Local Authority' | 'Disaster Unit' | 'Emergency Medical';
  district?: string;
  state?: string;
  registeredAt: string;
  isPreloaded?: boolean;
}

export const STORAGE_KEY = 'resqroute_offline_providers_directory';

export const INITIAL_OFFLINE_PROVIDERS: OfflineProvider[] = [
  {
    id: 'prov-ndrf-guwahati',
    name: 'Col. R. K. Baruah',
    organization: '1st Battalion NDRF Central Rescue Hub',
    phone: '+919435011223',
    category: 'Disaster Unit',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    registeredAt: '2026-08-20 08:00',
    isPreloaded: true
  },
  {
    id: 'prov-tezpur-base',
    name: 'Maj. S. Neog',
    organization: 'Tezpur Disaster Response Staging Base',
    phone: '+919435144556',
    category: 'Local Authority',
    district: 'Sonitpur',
    state: 'Assam',
    registeredAt: '2026-08-20 08:30',
    isPreloaded: true
  },
  {
    id: 'prov-asdma-state',
    name: 'Dr. Arindam Sharma',
    organization: 'Assam State Disaster Management Authority (ASDMA)',
    phone: '+919435012345',
    category: 'Local Authority',
    district: 'Statewide Control',
    state: 'Assam',
    registeredAt: '2026-08-21 09:15',
    isPreloaded: true
  },
  {
    id: 'prov-jorhat-riverine',
    name: 'Insp. P. Gogoi',
    organization: 'Jorhat Brahmaputra Riverine Rescue Unit',
    phone: '+919435277889',
    category: 'Disaster Unit',
    district: 'Jorhat / Majuli',
    state: 'Assam',
    registeredAt: '2026-08-21 11:00',
    isPreloaded: true
  },
  {
    id: 'prov-redcross-assam',
    name: 'Hemanta Deka',
    organization: 'Indian Red Cross Society (Assam Field Volunteer)',
    phone: '+919854098765',
    category: 'NGO',
    district: 'Majuli & Dhemaji',
    state: 'Assam',
    registeredAt: '2026-08-22 07:45',
    isPreloaded: true
  },
  {
    id: 'prov-shillong-hill',
    name: 'Capt. L. Marbaniang',
    organization: 'Shillong Hill Sector Medical Relief Unit',
    phone: '+919436199001',
    category: 'Emergency Medical',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    registeredAt: '2026-08-22 08:00',
    isPreloaded: true
  },
  {
    id: 'prov-majuli-boat',
    name: 'Dwijen Hazarika',
    organization: 'Majuli Island Boat Rescue Volunteers',
    phone: '+919854122334',
    category: 'Volunteer',
    district: 'Majuli',
    state: 'Assam',
    registeredAt: '2026-08-23 06:30',
    isPreloaded: true
  }
];

/**
 * Retrieve cached provider numbers from browser localStorage.
 * If not yet initialized, seeds initial verified providers and returns them.
 */
export function getOfflineProviders(): OfflineProvider[] {
  if (typeof window === 'undefined') return INITIAL_OFFLINE_PROVIDERS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OFFLINE_PROVIDERS));
      return INITIAL_OFFLINE_PROVIDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array found, re-seed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OFFLINE_PROVIDERS));
    return INITIAL_OFFLINE_PROVIDERS;
  } catch (err) {
    console.warn('Failed to read from localStorage:', err);
    return INITIAL_OFFLINE_PROVIDERS;
  }
}

/**
 * Register a new provider and immediately cache to localStorage.
 */
export function saveOfflineProvider(
  provider: Omit<OfflineProvider, 'id' | 'registeredAt'> & { id?: string }
): OfflineProvider[] {
  const current = getOfflineProviders();
  const newProvider: OfflineProvider = {
    id: provider.id || `prov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: provider.name.trim(),
    organization: provider.organization.trim(),
    phone: provider.phone.trim(),
    category: provider.category || 'Volunteer',
    district: provider.district?.trim() || 'NER Region',
    state: provider.state?.trim() || 'Assam',
    registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isPreloaded: false
  };

  const updated = [newProvider, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('resqroute_providers_updated'));
  } catch (err) {
    console.error('Failed to save provider to localStorage:', err);
  }
  return updated;
}

/**
 * Remove a registered provider by ID
 */
export function deleteOfflineProvider(id: string): OfflineProvider[] {
  const current = getOfflineProviders();
  const updated = current.filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('resqroute_providers_updated'));
  } catch (err) {
    console.error('Failed to delete provider from localStorage:', err);
  }
  return updated;
}

/**
 * Reset directory back to defaults
 */
export function resetOfflineProviders(): OfflineProvider[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OFFLINE_PROVIDERS));
    window.dispatchEvent(new Event('resqroute_providers_updated'));
  } catch (err) {
    console.error('Failed to reset providers in localStorage:', err);
  }
  return INITIAL_OFFLINE_PROVIDERS;
}
