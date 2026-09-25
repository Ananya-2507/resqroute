import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_LANGUAGE,
  LanguageCode,
  LanguageInfo,
  SUPPORTED_LANGUAGES
} from '../i18n/languages';
import { getTranslation, TranslationKey } from '../i18n';
import { EscalationLevel, RequestStatus, ResourceType, RoadStatus, UrgencyLevel, UserRole } from '../types';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  translateResourceType: (resource: ResourceType | string) => string;
  translateResourceCategory: (category: string) => string;
  translateUnit: (unit: string | undefined) => string;
  translateDepotName: (depotName: string | undefined) => string;
  translateVillageName: (villageName: string | undefined) => string;
  translateDistrict: (district: string | undefined) => string;
  translateState: (state: string | undefined) => string;
  translateVehicle: (vehicle: string | undefined) => string;
  translateHazard: (hazard: string | undefined) => string;
  translateFulfillment: (fulfillment: string | undefined) => string;
  translateTime: (timeStr: string | undefined) => string;
  formatNumber: (num: number | string | undefined | null) => string;
  formatDate: (date: Date | string | number | undefined) => string;
  translateRoadStatus: (status: RoadStatus | string) => string;
  translateEscalationLevel: (level: EscalationLevel | string) => string;
  translateRequestStatus: (status: RequestStatus | string) => string;
  translateUrgency: (urgency: UrgencyLevel | string) => string;
  translateRole: (role: UserRole | string) => string;
}

const STORAGE_LANG_KEY = 'resqroute_v2_lang';

const INTL_LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN',
  bn: 'bn-IN',
  mni: 'mni-IN',
  kha: 'en-IN',
  lus: 'en-IN',
  ne: 'ne-NP',
  brx: 'as-IN',
  trp: 'bn-IN'
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      const isSupported = SUPPORTED_LANGUAGES.some(l => l.code === saved);
      return (isSupported && saved) ? (saved as LanguageCode) : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    return getTranslation(language, key, params);
  };

  const formatNumber = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null || num === '') return '0';
    const parsed = typeof num === 'number' ? num : Number(num);
    if (isNaN(parsed)) return String(num);
    try {
      const locale = INTL_LOCALE_MAP[language] || 'en-IN';
      return new Intl.NumberFormat(locale).format(parsed);
    } catch {
      return parsed.toLocaleString();
    }
  };

  const formatDate = (date: Date | string | number | undefined): string => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return String(date);
      const locale = INTL_LOCALE_MAP[language] || 'en-IN';
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(d);
    } catch {
      return String(date);
    }
  };

  const translateTime = (timeStr: string | undefined): string => {
    if (!timeStr) return '';
    const trimmed = timeStr.trim();

    if (trimmed.toLowerCase() === 'just now') {
      return t('justNow');
    }
    if (trimmed.toLowerCase() === 'today') {
      return t('today');
    }

    // Relative times: "18 mins ago" or "45 mins ago"
    const minsMatch = trimmed.match(/^(\d+)\s+mins?\s+ago$/i);
    if (minsMatch) {
      return t('timeAgoMins', { count: formatNumber(minsMatch[1]) });
    }

    // "1 hour ago" or "2 hours ago"
    const hoursMatch = trimmed.match(/^(\d+)\s+hours?\s+ago$/i);
    if (hoursMatch) {
      return t('timeAgoHours', { count: formatNumber(hoursMatch[1]) });
    }

    // Standard date timestamp like "22 Aug 2026, 08:00 AM" or "21 Aug 2026, 06:45 PM"
    const dateMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
    if (dateMatch) {
      const [, day, mon, year, hour, min, ampm] = dateMatch;
      const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const monthIndex = monthMap[mon.toLowerCase().slice(0, 3)] ?? 7;
      let h = hour ? parseInt(hour, 10) : 0;
      if (ampm && ampm.toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampm && ampm.toUpperCase() === 'AM' && h === 12) h = 0;
      const m = min ? parseInt(min, 10) : 0;
      const parsedDate = new Date(parseInt(year, 10), monthIndex, parseInt(day, 10), h, m);
      if (!isNaN(parsedDate.getTime())) {
        return formatDate(parsedDate);
      }
    }

    return trimmed;
  };

  const translateResourceType = (resource: ResourceType | string): string => {
    switch (resource) {
      case 'Drinking Water & Purification Kits':
        return t('resWater');
      case 'Emergency Medical Supplies & First Aid':
        return t('resMedical');
      case 'Dry Rations & Baby Food':
        return t('resRations');
      case 'Tarpaulins & Flood Shelter Kits':
        return t('resShelter');
      case 'Search & Rescue Gear / Inflatable Boats':
        return t('resRescue');
      case 'High-Capacity Power Generators & Comms':
        return t('resPower');
      default:
        return String(resource);
    }
  };

  const translateResourceCategory = (category: string): string => {
    switch (category) {
      case 'Water & Sanitation':
        return t('catWaterSanitation');
      case 'Medical & Trauma Care':
        return t('catMedicalTrauma');
      case 'Food Security & Nutrition':
        return t('catFoodSecurity');
      case 'Shelter & Non-Food Items':
        return t('catShelterNonFood');
      case 'Search, Rescue & Life Safety':
        return t('catSearchRescue');
      case 'Power & Telecommunications':
        return t('catPowerTelecom');
      default:
        return category;
    }
  };

  const translateUnit = (unit: string | undefined): string => {
    if (!unit) return t('units');
    const u = unit.trim().toLowerCase();
    switch (u) {
      case 'kits':
      case 'kit':
        return t('unitKits');
      case 'packs':
      case 'pack':
        return t('unitPacks');
      case 'parcels':
      case 'parcel':
        return t('unitParcels');
      case 'tarpaulins':
      case 'tarpaulin':
        return t('unitTarpaulins');
      case 'boats':
      case 'boat':
        return t('unitBoats');
      case 'units':
      case 'unit':
        return t('unitUnits');
      case 'boxes':
      case 'box':
        return t('unitBoxes');
      case 'tons':
      case 'ton':
        return t('unitTons');
      default:
        return unit;
    }
  };

  const translateDepotName = (depotName: string | undefined): string => {
    if (!depotName) return '';
    const d = depotName.toLowerCase();
    if (d.includes('guwahati')) return t('depotGuwahati');
    if (d.includes('tezpur')) return t('depotTezpur');
    if (d.includes('jorhat')) return t('depotJorhat');
    if (d.includes('shillong')) return t('depotShillong');
    return depotName;
  };

  const translateVillageName = (villageName: string | undefined): string => {
    if (!villageName) return '';
    const v = villageName.toLowerCase();
    if (v.includes('kamalabari north')) return t('vilKamalabariNorth');
    if (v.includes('kamalabari')) return t('vilKamalabari');
    if (v.includes('jengraimukh')) return t('vilJengraimukh');
    if (v.includes('sissiborgaon')) return t('vilSissiborgaon');
    if (v.includes('jatinga')) return t('vilJatinga');
    if (v.includes('nongriat')) return t('vilNongriat');
    if (v.includes('chariduar')) return t('vilChariduar');
    if (v.includes('laharighat')) return t('vilLaharighat');
    if (v.includes('umroi')) return t('vilUmroi');
    return villageName;
  };

  const translateDistrict = (district: string | undefined): string => {
    if (!district) return '';
    const d = district.toLowerCase();
    if (d.includes('majuli')) return t('distMajuli');
    if (d.includes('kamrup')) return t('distKamrup');
    if (d.includes('sonitpur')) return t('distSonitpur');
    if (d.includes('dhemaji')) return t('distDhemaji');
    if (d.includes('dima hasao')) return t('distDimaHasao');
    if (d.includes('east khasi hills')) return t('distEastKhasiHills');
    if (d.includes('morigaon')) return t('distMorigaon');
    if (d.includes('ri-bhoi') || d.includes('ribhoi')) return t('distRiBhoi');
    if (d.includes('jorhat')) return t('distJorhat');
    if (d.includes('nagaon')) return t('distNagaon');
    if (d.includes('cachar')) return t('distCachar');
    return district;
  };

  const translateState = (state: string | undefined): string => {
    if (!state) return '';
    const s = state.toLowerCase();
    if (s.includes('assam')) return t('stateAssam');
    if (s.includes('meghalaya')) return t('stateMeghalaya');
    if (s.includes('tripura')) return t('stateTripura');
    if (s.includes('manipur')) return t('stateManipur');
    if (s.includes('mizoram')) return t('stateMizoram');
    if (s.includes('nagaland')) return t('stateNagaland');
    if (s.includes('arunachal')) return t('stateArunachal');
    if (s.includes('sikkim')) return t('stateSikkim');
    return state;
  };

  const translateVehicle = (vehicle: string | undefined): string => {
    if (!vehicle) return '';
    const v = vehicle.toLowerCase();
    if (v.includes('as-01-t-8821') || v.includes('relief unit')) return t('vehReliefUnit');
    if (v.includes('high-clearance truck')) return t('vehHighClearanceTruck');
    if (v.includes('mountain 4x4 supply van') || v.includes('supply van')) return t('vehMountainSupplyVan');
    if (v.includes('ro-pax') || v.includes('tractor trolley')) return t('vehRopaxFerry');
    if (v.includes('porter relay') || v.includes('sohra')) return t('vehPorterRelay');
    if (v.includes('inflatable rescue boat') || v.includes('inflatable boat')) return t('vehInflatableBoat');
    if (v.includes('unimog')) return t('vehUnimog');
    if (v.includes('catamaran')) return t('vehCatamaran');
    if (v.includes('drone')) return t('vehDrone');
    if (v.includes('ambulance')) return t('vehAmbulance');
    if (v.includes('hill crawler')) return t('vehHillCrawler');
    return vehicle;
  };

  const translateHazard = (hazard: string | undefined): string => {
    if (!hazard) return '';
    const h = hazard.toLowerCase();
    if (h.includes('river flood')) return t('hazardRiverFlood');
    if (h.includes('high-water') || h.includes('inundation')) return t('hazardHighWaterInundation');
    if (h.includes('landslide')) return t('hazardLandslideHazard');
    if (h.includes('normal')) return t('hazardLandslideNormal');
    return hazard;
  };

  const translateFulfillment = (status: string | undefined): string => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'full') return t('fulfillmentFull');
    if (s === 'partial') return t('fulfillmentPartial');
    if (s.includes('pending')) return t('fulfillmentPending');
    return status;
  };

  const translateRoadStatus = (status: RoadStatus | string): string => {
    switch (status) {
      case 'OPEN':
        return t('roadOpen');
      case 'RISKY':
        return t('roadRisky');
      case 'BLOCKED':
        return t('roadBlocked');
      case 'IMPASSABLE':
        return t('roadImpassable');
      default:
        return String(status);
    }
  };

  const translateEscalationLevel = (level: EscalationLevel | string): string => {
    switch (level) {
      case 'LEVEL_1_VEHICLE':
        return t('level1');
      case 'LEVEL_2_RELAY':
        return t('level2');
      case 'LEVEL_3_AIRDROP':
        return t('level3');
      default:
        return String(level);
    }
  };

  const translateRequestStatus = (status: RequestStatus | string): string => {
    switch (status) {
      case 'SUBMITTED':
        return t('statusSubmitted');
      case 'VERIFIED':
        return t('statusVerified');
      case 'MATCHED':
        return t('statusMatched');
      case 'IN_TRANSIT':
        return t('statusInTransit');
      case 'DELIVERED':
        return t('statusDelivered');
      case 'REJECTED':
        return t('statusRejected');
      default:
        return String(status);
    }
  };

  const translateUrgency = (urgency: UrgencyLevel | string): string => {
    switch (urgency) {
      case 'CRITICAL':
        return t('urgencyCritical');
      case 'HIGH':
        return t('urgencyHigh');
      case 'MEDIUM':
        return t('urgencyMedium');
      default:
        return String(urgency);
    }
  };

  const translateRole = (role: UserRole | string): string => {
    switch (role) {
      case 'requester':
        return t('requester');
      case 'provider':
        return t('provider');
      case 'official':
        return t('official');
      case 'guest':
        return t('publicCommuter');
      default:
        return String(role);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageInfo,
        languages: SUPPORTED_LANGUAGES,
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
        translateUrgency,
        translateRole
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
