import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Compass, 
  FileText, 
  HelpCircle, 
  Layers, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  UserCheck, 
  Users, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, UserSession } from '../types';
import { OfflineHelpSection } from './OfflineHelpSection';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface LandingLoginViewProps {
  onOpenDemoGuide?: () => void;
}

const DISTRICT_OPTIONS = [
  'Majuli',
  'Kamrup Metropolitan',
  'Sonitpur',
  'Dhemaji',
  'Dima Hasao',
  'East Khasi Hills',
  'Morigaon',
  'Ri-Bhoi',
  'Jorhat',
  'Nagaon',
  'Cachar'
];

export const LandingLoginView: React.FC<LandingLoginViewProps> = ({ onOpenDemoGuide }) => {
  const { villages, depots, loginAsUser, setActiveTab } = useApp();
  const { t, translateRoadStatus } = useLanguage();
  const { effectiveOnline } = useNetworkStatus();

  // Selected role for the login card/form
  const [selectedRole, setSelectedRole] = useState<UserRole>('requester');

  // Form states - Requester
  const [reqName, setReqName] = useState('Biren Saikia');
  const [reqVillageId, setReqVillageId] = useState(villages[0]?.id || 'vil-majuli-kamalabari');
  const [reqPhone, setReqPhone] = useState('+91 98540-12345');

  // Form states - Government Official
  const [offName, setOffName] = useState('Dr. Arindam Sharma');
  const [offDesignation, setOffDesignation] = useState<'Panchayat Head' | 'DDMA Officer'>('DDMA Officer');
  const [offDistrict, setOffDistrict] = useState('Majuli');

  // Form states - Resource Provider
  const [provDepotId, setProvDepotId] = useState(depots[0]?.id || 'depot-guwahati');
  const [provContact, setProvContact] = useState('Col. R. K. Baruah');

  // Error feedback
  const [formError, setFormError] = useState<string | null>(null);

  // Quick fill helper
  const handleQuickFill = (role: UserRole) => {
    setSelectedRole(role);
    setFormError(null);
    if (role === 'requester') {
      setReqName('Biren Saikia');
      setReqVillageId(villages[0]?.id || 'vil-majuli-kamalabari');
      setReqPhone('+91 98540-12345');
    } else if (role === 'official') {
      setOffName('Dr. Arindam Sharma');
      setOffDesignation('DDMA Officer');
      setOffDistrict('Majuli');
    } else if (role === 'provider') {
      setProvDepotId(depots[0]?.id || 'depot-guwahati');
      setProvContact('Col. R. K. Baruah');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedRole === 'requester') {
      if (!reqName.trim()) {
        setFormError(t('enterYourNameError'));
        return;
      }
      if (!reqVillageId) {
        setFormError(t('selectVillageError'));
        return;
      }
      if (!reqPhone.trim()) {
        setFormError(t('providePhoneError'));
        return;
      }

      const village = villages.find(v => v.id === reqVillageId);
      const session: UserSession = {
        userId: 'usr-req-' + (reqVillageId || 'custom'),
        role: 'requester',
        name: reqName.trim(),
        villageId: reqVillageId,
        villageName: village ? village.name : 'Unknown Village',
        phone: reqPhone.trim(),
        permissions: ['VIEW_VILLAGE_DATA', 'SUBMIT_VILLAGE_REQUEST', 'CONFIRM_VILLAGE_DELIVERY']
      };
      loginAsUser(session);

    } else if (selectedRole === 'official') {
      if (!offName.trim()) {
        setFormError(t('enterOfficialNameError'));
        return;
      }
      if (!offDistrict.trim()) {
        setFormError(t('selectDistrictError'));
        return;
      }

      const session: UserSession = {
        userId: 'usr-off-' + (offDistrict ? offDistrict.toLowerCase().replace(/\s+/g, '-') : 'ddma'),
        role: 'official',
        name: offName.trim(),
        designation: offDesignation,
        district: offDistrict,
        permissions: ['VIEW_VILLAGE_DATA', 'SYSTEM_WIDE_ACCESS', 'VERIFY_REQUESTS', 'ADMIN_ALL_DATA', 'VIEW_ALL_DEPOTS', 'VIEW_ALL_VILLAGES']
      };
      loginAsUser(session);

    } else if (selectedRole === 'provider') {
      if (!provContact.trim()) {
        setFormError(t('enterContactNameError'));
        return;
      }
      if (!provDepotId) {
        setFormError(t('selectDepotError'));
        return;
      }

      const depot = depots.find(d => d.id === provDepotId);
      const session: UserSession = {
        userId: 'usr-prov-' + (provDepotId || 'base'),
        role: 'provider',
        name: provContact.trim(),
        depotId: provDepotId,
        depotName: depot ? depot.name : 'NDRF Logistics Hub',
        contactPerson: provContact.trim(),
        permissions: ['VIEW_DEPOT_INVENTORY', 'MANAGE_DEPOT_STOCK', 'DISPATCH_DEPOT_RESOURCES', 'VIEW_DEPOT_DISPATCHES', 'VIEW_ALL_VILLAGES']
      };
      loginAsUser(session);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          {t('gatewayBadge')}
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {t('landingTitle')}
        </h1>
        
        <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t('landingSubtitle')}
        </p>
      </div>

      {/* 5. Auto-detect Network Status: If offline is detected, automatically highlight/show Offline Help prominently at top */}
      {!effectiveOnline && (
        <div className="mb-8">
          <OfflineHelpSection isProminent={true} />
        </div>
      )}

      {/* Role Selection Cards (3 Large, Distinct Options) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Card 1: Requester / Villager */}
        <div
          id="role-card-requester"
          onClick={() => { setSelectedRole('requester'); setFormError(null); }}
          className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 border-2 relative flex flex-col justify-between ${
            selectedRole === 'requester'
              ? 'bg-white border-emerald-600 shadow-lg ring-2 ring-emerald-500/20'
              : 'bg-white/80 hover:bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === 'requester' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}>
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {t('community')}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {t('requesterTitle')}
            </h3>
            <p className="text-xs font-medium text-emerald-800 mb-3">
              {t('requesterSub')}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('requesterDesc')}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className={selectedRole === 'requester' ? 'text-emerald-700' : 'text-slate-500'}>
              {selectedRole === 'requester' ? t('selectedRole') : t('clickToSelect')}
            </span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              selectedRole === 'requester' ? 'bg-emerald-600 text-white' : 'border border-slate-300'
            }`}>
              {selectedRole === 'requester' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* Card 2: Government Official */}
        <div
          id="role-card-official"
          onClick={() => { setSelectedRole('official'); setFormError(null); }}
          className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 border-2 relative flex flex-col justify-between ${
            selectedRole === 'official'
              ? 'bg-white border-purple-600 shadow-lg ring-2 ring-purple-500/20'
              : 'bg-white/80 hover:bg-white border-slate-200 hover:border-purple-300 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === 'official' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                {t('administration')}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {t('officialTitle')}
            </h3>
            <p className="text-xs font-medium text-purple-800 mb-3">
              {t('officialSub')}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('officialDesc')}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className={selectedRole === 'official' ? 'text-purple-700' : 'text-slate-500'}>
              {selectedRole === 'official' ? t('selectedRole') : t('clickToSelect')}
            </span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              selectedRole === 'official' ? 'bg-purple-600 text-white' : 'border border-slate-300'
            }`}>
              {selectedRole === 'official' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* Card 3: Resource Provider */}
        <div
          id="role-card-provider"
          onClick={() => { setSelectedRole('provider'); setFormError(null); }}
          className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 border-2 relative flex flex-col justify-between ${
            selectedRole === 'provider'
              ? 'bg-white border-blue-600 shadow-lg ring-2 ring-blue-500/20'
              : 'bg-white/80 hover:bg-white border-slate-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedRole === 'provider' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
              }`}>
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                {t('logisticsBase')}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {t('providerTitle')}
            </h3>
            <p className="text-xs font-medium text-blue-800 mb-3">
              {t('providerSub')}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('providerDesc')}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className={selectedRole === 'provider' ? 'text-blue-700' : 'text-slate-500'}>
              {selectedRole === 'provider' ? t('selectedRole') : t('clickToSelect')}
            </span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              selectedRole === 'provider' ? 'bg-blue-600 text-white' : 'border border-slate-300'
            }`}>
              {selectedRole === 'provider' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

      </div>

      {/* Role-Specific Login Form Container */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Form Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          selectedRole === 'requester' 
            ? 'bg-emerald-50/70 border-emerald-100' 
            : selectedRole === 'official' 
            ? 'bg-purple-50/70 border-purple-100' 
            : 'bg-blue-50/70 border-blue-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              selectedRole === 'requester' 
                ? 'bg-emerald-600 text-white' 
                : selectedRole === 'official' 
                ? 'bg-purple-600 text-white' 
                : 'bg-blue-600 text-white'
            }`}>
              {selectedRole === 'requester' && <Users className="w-5 h-5" />}
              {selectedRole === 'official' && <ShieldCheck className="w-5 h-5" />}
              {selectedRole === 'provider' && <Truck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedRole === 'requester' && t('requesterLogin')}
                {selectedRole === 'official' && t('officialLogin')}
                {selectedRole === 'provider' && t('providerLogin')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('mockCredentials')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleQuickFill(selectedRole)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Auto-fill sample data for this role"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{t('fillSampleData')}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              {formError}
            </div>
          )}

          {/* Requester Form */}
          {selectedRole === 'requester' && (
            <div className="space-y-4">
              
              {/* Quick Persona Switcher for Requester testing */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  {t('quickProfiles')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReqName('Biren Saikia');
                      setReqVillageId('vil-majuli-kamalabari');
                      setReqPhone('+91 98540-12345');
                    }}
                    className={`p-2 rounded-lg text-left border text-xs transition-all cursor-pointer ${
                      reqVillageId === 'vil-majuli-kamalabari'
                        ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold">Biren Saikia (Gaonburha)</div>
                    <div className="text-[10px] text-slate-500">Kamalabari Ghat (Majuli)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReqName('Ramesh Karmakar');
                      setReqVillageId('vil-balipara-foothill');
                      setReqPhone('+91 98545-67890');
                    }}
                    className={`p-2 rounded-lg text-left border text-xs transition-all cursor-pointer ${
                      reqVillageId === 'vil-balipara-foothill'
                        ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold">Ramesh Karmakar (Local Rep)</div>
                    <div className="text-[10px] text-slate-500">Chariduar Settlement (Sonitpur)</div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="requester-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('fullNameLabel')}
                </label>
                <div className="relative">
                  <input
                    id="requester-name"
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="requester-village" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('villageLabel')}
                </label>
                <select
                  id="requester-village"
                  value={reqVillageId}
                  onChange={(e) => setReqVillageId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 bg-white"
                >
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.district}, {v.state}) — {t('status')}: {translateRoadStatus(v.riskZone)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {t('villageSelectHint')}
                </p>
              </div>

              <div>
                <label htmlFor="requester-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('phoneLabel')}
                </label>
                <div className="relative">
                  <input
                    id="requester-phone"
                    type="tel"
                    required
                    value={reqPhone}
                    onChange={(e) => setReqPhone(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 bg-slate-50/50"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {t('phoneHint')}
                </p>
              </div>
            </div>
          )}

          {/* Government Official Form */}
          {selectedRole === 'official' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="official-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('officialNameLabel')}
                </label>
                <input
                  id="official-name"
                  type="text"
                  required
                  value={offName}
                  onChange={(e) => setOffName(e.target.value)}
                  placeholder={t('officialNamePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label htmlFor="official-designation" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('designationLabel')}
                </label>
                <select
                  id="official-designation"
                  value={offDesignation}
                  onChange={(e) => setOffDesignation(e.target.value as 'Panchayat Head' | 'DDMA Officer')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium text-slate-900 bg-white"
                >
                  <option value="DDMA Officer">{t('ddmaOfficer')}</option>
                  <option value="Panchayat Head">{t('panchayatHead')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="official-district" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('districtLabel')}
                </label>
                <select
                  id="official-district"
                  value={offDistrict}
                  onChange={(e) => setOffDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium text-slate-900 bg-white"
                >
                  {DISTRICT_OPTIONS.map(district => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {t('districtHint')}
                </p>
              </div>
            </div>
          )}

          {/* Resource Provider Form */}
          {selectedRole === 'provider' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="provider-depot" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('depotLabel')}
                </label>
                <select
                  id="provider-depot"
                  value={provDepotId}
                  onChange={(e) => setProvDepotId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-slate-900 bg-white"
                >
                  {depots.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}) — {d.district}, {d.state}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {t('depotHint')}
                </p>
              </div>

              <div>
                <label htmlFor="provider-contact" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('contactPersonLabel')}
                </label>
                <input
                  id="provider-contact"
                  type="text"
                  required
                  value={provContact}
                  onChange={(e) => setProvContact(e.target.value)}
                  placeholder={t('contactPersonPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3">
            <button
              id="continue-button"
              type="submit"
              className={`w-full py-3 px-6 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedRole === 'requester'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : selectedRole === 'official'
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <span>{t('continueToDashboard')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              {t('mockAuthNote')}
            </p>
          </div>

        </form>

      </div>

      {/* 1 & 5. If online, Offline Help remains visible but less prominent (lower on the page) */}
      {effectiveOnline && (
        <div className="mt-10">
          <OfflineHelpSection isProminent={false} />
        </div>
      )}

      {/* Alternative Access / Demo Guide link */}
      <div className="mt-8 text-center flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
        {onOpenDemoGuide && (
          <button
            onClick={onOpenDemoGuide}
            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-semibold cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t('readWalkthrough')}</span>
          </button>
        )}
      </div>

    </div>
  );
};

