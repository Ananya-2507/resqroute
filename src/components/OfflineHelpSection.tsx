import React, { useState, useEffect, useId } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  UserPlus, 
  ShieldAlert, 
  Building2, 
  Search, 
  Check, 
  Copy, 
  AlertTriangle, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Radio, 
  Trash2,
  HelpCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  getOfflineProviders, 
  saveOfflineProvider, 
  deleteOfflineProvider, 
  resetOfflineProviders,
  OfflineProvider 
} from '../utils/offlineDirectoryStorage';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLanguage } from '../context/LanguageContext';

interface OfflineHelpSectionProps {
  /** If provided, overrides default location text */
  defaultLocation?: string;
  /** Whether the section is placed prominently at top due to offline */
  isProminent?: boolean;
}

export const OfflineHelpSection: React.FC<OfflineHelpSectionProps> = ({ 
  defaultLocation = 'Kamalabari Ghat, Majuli',
  isProminent = false
}) => {
  const { isOnline, isSimulatedOffline, effectiveOnline, toggleSimulatedOffline } = useNetworkStatus();
  const { t } = useLanguage();
  
  // Section collapse state: if offline, force expanded; if online, allow collapsing
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'register'>('directory');

  // Directory state cached from localStorage
  const [providers, setProviders] = useState<OfflineProvider[]>(() => getOfflineProviders());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Custom SMS template fields (editable by user)
  const [locationText, setLocationText] = useState<string>(defaultLocation);
  const [hazardType, setHazardType] = useState<string>('Flood/Landslide/Other');
  const [customNotes, setCustomNotes] = useState<string>('');

  // Provider Registration form states
  const [regName, setRegName] = useState<string>('');
  const [regOrganization, setRegOrganization] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regCategory, setRegCategory] = useState<OfflineProvider['category']>('Volunteer');
  const [regDistrict, setRegDistrict] = useState<string>('Majuli');
  
  // Feedback messages
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);
  const [regErrorMessage, setRegErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync providers from localStorage whenever updated
  useEffect(() => {
    const handleUpdate = () => {
      setProviders(getOfflineProviders());
    };
    window.addEventListener('resqroute_providers_updated', handleUpdate);
    return () => {
      window.removeEventListener('resqroute_providers_updated', handleUpdate);
    };
  }, []);

  // When offline is detected, automatically expand the section
  useEffect(() => {
    if (!effectiveOnline) {
      setIsCollapsed(false);
    }
  }, [effectiveOnline]);

  // Clean phone number for tel: and sms: protocol
  const sanitizePhoneNumber = (phone: string): string => {
    // Preserve leading + if present, strip spaces, dashes, brackets
    return phone.trim().replace(/[^+\d]/g, '');
  };

  // Generate SMS link body
  const buildSmsBody = (): string => {
    const loc = locationText.trim() || '[user can edit]';
    const type = hazardType.trim() || 'Flood/Landslide/Other';
    let body = `HELP NEEDED - Location: ${loc} - Type: ${type}`;
    if (customNotes.trim()) {
      body += ` - Details: ${customNotes.trim()}`;
    }
    return body;
  };

  const handleCopyPhone = (id: string, phone: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Handle Provider Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMessage(null);
    setRegSuccessMessage(null);

    if (!regName.trim()) {
      setRegErrorMessage(t('enterContactNameError'));
      return;
    }
    if (!regOrganization.trim()) {
      setRegErrorMessage(t('enterOrganizationError'));
      return;
    }
    if (!regPhone.trim()) {
      setRegErrorMessage(t('validPhoneError'));
      return;
    }

    // Format phone if without +91
    let formattedPhone = regPhone.trim();
    if (!formattedPhone.startsWith('+')) {
      const digits = formattedPhone.replace(/\D/g, '');
      if (digits.length === 10) {
        formattedPhone = `+91 ${digits.slice(0, 5)}-${digits.slice(5)}`;
      }
    }

    const updated = saveOfflineProvider({
      name: regName.trim(),
      organization: regOrganization.trim(),
      phone: formattedPhone,
      category: regCategory,
      district: regDistrict.trim() || 'NER Region',
      state: 'Assam'
    });

    setProviders(updated);
    setRegSuccessMessage(t('providerRegisteredSuccess', { name: regName, organization: regOrganization }));
    
    // Reset form
    setRegName('');
    setRegOrganization('');
    setRegPhone('');
    
    // Switch to directory after short delay to view
    setTimeout(() => {
      setActiveTab('directory');
    }, 1800);
  };

  // Filtered providers
  const filteredProviders = providers.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.district && p.district.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryShortLabel = (cat: string) => {
    switch (cat) {
      case 'Volunteer':
        return t('catVolunteerShort');
      case 'NGO':
        return t('catNgo');
      case 'Local Authority':
        return t('catLocalAuthorityShort');
      case 'Disaster Unit':
        return t('catDisasterUnitShort');
      case 'Emergency Medical':
        return t('catEmergencyMedicalShort');
      default:
        return cat;
    }
  };

  const smsBodyText = buildSmsBody();

  return (
    <section 
      id="offline-help-section"
      className={`rounded-2xl transition-all duration-300 overflow-hidden ${
        !effectiveOnline
          ? 'bg-amber-50/70 border-2 border-amber-500 shadow-xl ring-4 ring-amber-400/20'
          : isProminent 
          ? 'bg-white border-2 border-emerald-500/50 shadow-lg'
          : 'bg-white border border-slate-200 shadow-md'
      }`}
    >
      {/* 5. Auto-detect Network Status Banner: Highlight prominently if offline */}
      {!effectiveOnline && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 px-4 py-3 sm:px-6 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center gap-1.5 font-extrabold text-sm sm:text-base tracking-wide">
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 shrink-0" />
              <span>{t('noInternetDetected')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-100 bg-black/20 px-3 py-1 rounded-full border border-white/20">
            <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{t('cellularVoiceSmsNote')}</span>
            <button
              onClick={toggleSimulatedOffline}
              title="Toggle simulated connection"
              className="ml-2 underline text-white hover:text-amber-200 font-bold text-[11px] cursor-pointer"
            >
              {isSimulatedOffline ? t('exitTestBtn') : t('reconnectBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Main Section Header */}
      <div className={`p-4 sm:p-6 ${!effectiveOnline ? 'bg-amber-50/60' : 'bg-slate-50/80'} border-b border-slate-200`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              !effectiveOnline 
                ? 'bg-amber-600 text-white' 
                : 'bg-emerald-700 text-white'
            }`}>
              {!effectiveOnline ? (
                <WifiOff className="w-6 h-6 animate-pulse" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Title Requirement */}
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {t('offlineHelpTitle')}
                </h2>
                {effectiveOnline ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Wifi className="w-3 h-3 text-emerald-600" />
                    {t('onlineDirectoryCached')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    <WifiOff className="w-3 h-3 text-rose-600" />
                    {t('offlineModeActive')}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t('offlineHelpSubtitle')}
              </p>
            </div>
          </div>

          {/* Right Header Controls (Simulation Toggle + Collapse/Expand) */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={toggleSimulatedOffline}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isSimulatedOffline
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Test how this section appears and behaves when internet is disconnected"
            >
              {isSimulatedOffline ? <Wifi className="w-3.5 h-3.5 text-amber-700" /> : <WifiOff className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isSimulatedOffline ? t('simulatingOfflineBtn') : t('testOfflineBtn')}</span>
            </button>

            {effectiveOnline && (
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-xs font-semibold p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                aria-label={isCollapsed ? 'Expand offline section' : 'Collapse offline section'}
              >
                {isCollapsed ? (
                  <>
                    <span className="hidden sm:inline">{t('showDirectoryBtn')}</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{t('collapseBtn')}</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher (Directory vs Register New Provider) */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t('registeredProvidersDir')} ({providers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('registerAsProvider')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-6">

          {/* TAB 1: DIRECTORY & NO-INTERNET FLOW */}
          {activeTab === 'directory' && (
            <div className="space-y-5">
              
              {/* Emergency Message Customizer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('smsHelpPresetTitle')}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('smsHelpPresetDesc')}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-200 self-start md:self-auto shrink-0">
                    {t('works100OfflineSms')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      {t('yourLocationLandmark')}
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        placeholder={t('landmarkLocationPlaceholder')}
                        className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      {t('hazardEmergencyType')}
                    </label>
                    <select
                      value={hazardType}
                      onChange={(e) => setHazardType(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Flood/Landslide/Other">{t('hazardDefault')}</option>
                      <option value="Rising Floodwater / Inundation">{t('hazardFlood')}</option>
                      <option value="Severe Hill Landslide / Road Blocked">{t('hazardLandslide')}</option>
                      <option value="Medical Emergency / Critical First Aid">{t('hazardMedical')}</option>
                      <option value="Drinking Water & Food Shortage">{t('hazardWaterFood')}</option>
                      <option value="Boat Rescue Needed / Stranded on Roof">{t('hazardBoatRescue')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      {t('optionalExtraNote')}
                    </label>
                    <input
                      type="text"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder={t('customNotesPlaceholder')}
                      className="w-full px-3 py-2 text-xs font-medium bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Preview of formatted SMS body */}
                <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200/90 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="font-bold text-slate-500 text-[10px] uppercase shrink-0">{t('smsBodyLabel')}</span>
                    <code className="font-mono text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded text-[11px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {smsBodyText}
                    </code>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                    {t('readyToSendOffline')}
                  </span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchProviderPlaceholder')}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 hidden md:inline">
                    {t('filterAll')}:
                  </span>
                  {(['ALL', 'Disaster Unit', 'Local Authority', 'NGO', 'Volunteer', 'Emergency Medical'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? t('allProvidersFilter') : getCategoryShortLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Requester Side List of Providers (No Internet Flow) */}
              <div className="space-y-3">
                {filteredProviders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-sm font-semibold text-slate-600">{t('noProvidersMatchSearch')}</p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setCategoryFilter('ALL'); }}
                      className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {t('clearFiltersBtn')}
                    </button>
                  </div>
                ) : (
                  filteredProviders.map((provider) => {
                    const cleanPhone = sanitizePhoneNumber(provider.phone);
                    // 4.b SMS link requirement:
                    // <a href="sms:+91XXXXXXXXXX?body=HELP NEEDED - Location: [user can edit] - Type: Flood/Landslide/Other">
                    const smsHref = `sms:${cleanPhone}?body=${encodeURIComponent(smsBodyText)}`;
                    // 4.a Call link requirement:
                    // <a href="tel:+91XXXXXXXXXX">
                    const telHref = `tel:${cleanPhone}`;

                    return (
                      <div
                        key={provider.id}
                        className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 transition-all shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Provider Info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                              {provider.name}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              provider.category === 'Disaster Unit'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : provider.category === 'Local Authority'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : provider.category === 'NGO'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : provider.category === 'Emergency Medical'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {getCategoryShortLabel(provider.category)}
                            </span>
                            {provider.isPreloaded && (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {t('verifiedBaseBadge')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{provider.organization}</span>
                            {provider.district && (
                              <span className="text-slate-400 font-normal">
                                • {provider.district}
                              </span>
                            )}
                          </div>

                          {/* Phone number display with quick copy */}
                          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                            <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{provider.phone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(provider.id, provider.phone)}
                              className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                              title="Copy phone number"
                            >
                              {copiedId === provider.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">{t('copiedLabel')}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>{t('copyLabel')}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons: Native Call & Send SMS */}
                        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
                          {/* 4.a Call button: Native link that works offline */}
                          <a
                            href={telHref}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 cursor-pointer"
                            title={`Call ${provider.name} at ${provider.phone}`}
                          >
                            <Phone className="w-4 h-4 shrink-0 fill-current" />
                            <span>{t('callBtn')}</span>
                          </a>

                          {/* 4.b Send SMS button: Native link with prefilled emergency text */}
                          <a
                            href={smsHref}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 cursor-pointer"
                            title={`Send SMS Help message to ${provider.name}`}
                          >
                            <MessageSquare className="w-4 h-4 shrink-0 fill-current" />
                            <span>{t('sendSmsBtn')}</span>
                          </a>

                          {/* Delete option for user-registered custom providers */}
                          {!provider.isPreloaded && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove provider "${provider.name}" from offline cache?`)) {
                                  const updated = deleteOfflineProvider(provider.id);
                                  setProviders(updated);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete provider from local directory"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Informational Footer Note about native cellular technology */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {t('offlineHowItWorks')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset offline directory back to official verified NDRF / ASDMA bases?')) {
                      const restored = resetOfflineProviders();
                      setProviders(restored);
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline shrink-0 cursor-pointer"
                >
                  {t('restoreDefaultsBtn')}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: 2. PROVIDER REGISTRATION FORM */}
          {activeTab === 'register' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
              
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-700" />
                  <span>{t('providerRegFormTitle')}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {t('providerRegFormDesc')}
                </p>
              </div>

              {regSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccessMessage}</span>
                </div>
              )}

              {regErrorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Provider Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t('providerContactNameLabel')}: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={t('regNamePlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t('organizationTeamNameLabel')}: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regOrganization}
                      onChange={(e) => setRegOrganization(e.target.value)}
                      placeholder={t('regOrgPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t('emergencyPhoneLabel')}: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder={t('regPhonePlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm font-mono"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      {t('phoneHint')}
                    </p>
                  </div>

                  {/* Provider Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t('providerCategoryLabel')}:
                    </label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value as OfflineProvider['category'])}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm font-medium"
                    >
                      <option value="Volunteer">{t('catVolunteer')}</option>
                      <option value="NGO">{t('catNgo')}</option>
                      <option value="Local Authority">{t('catLocalAuthority')}</option>
                      <option value="Disaster Unit">{t('catDisasterUnit')}</option>
                      <option value="Emergency Medical">{t('catEmergencyMedical')}</option>
                    </select>
                  </div>

                  {/* Operating District */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {t('operatingDistrictLabel')}:
                    </label>
                    <input
                      type="text"
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value)}
                      placeholder={t('regDistrictPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('saveCacheProviderBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>

            </div>
          )}

        </div>
      )}
    </section>
  );
};
