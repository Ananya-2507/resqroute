import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  BarChart3, 
  Bell, 
  Building2,
  Check,
  ChevronDown,
  CloudRain, 
  Compass, 
  FileText, 
  HelpCircle, 
  Layers, 
  LogOut, 
  MapPin,
  RotateCcw, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  UserCheck, 
  Users, 
  Zap 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { MainTab, UserRole } from '../types';

interface NavbarProps {
  onOpenDemoGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemoGuide }) => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    isLoggedIn,
    currentUser,
    logout,
    alerts,
    markAlertRead,
    unreadAlertsCount,
    toggleWeatherSimulation,
    isWeatherSimulated,
    triggerAutoIsolationDemo,
    resetAllData,
    demoAccounts,
    loginAsUser
  } = useApp();

  const { t, translateRole } = useLanguage();

  const [isSimulationMenuOpen, setIsSimulationMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const ROLE_CONFIG: Record<UserRole, { label: string; sub: string; badgeColor: string; dotColor: string; icon: React.ReactNode }> = {
    requester: {
      label: translateRole('requester'),
      sub: t('villager'),
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
      icon: <Users className="w-4 h-4 text-emerald-700" />
    },
    provider: {
      label: translateRole('provider'),
      sub: t('depotLogistics'),
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      dotColor: 'bg-blue-500',
      icon: <Truck className="w-4 h-4 text-blue-700" />
    },
    official: {
      label: translateRole('official'),
      sub: t('ddmaAdmin'),
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      dotColor: 'bg-purple-500',
      icon: <ShieldCheck className="w-4 h-4 text-purple-700" />
    },
    guest: {
      label: translateRole('guest'),
      sub: t('generalTraveler'),
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      dotColor: 'bg-slate-500',
      icon: <Compass className="w-4 h-4 text-slate-700" />
    }
  };

  const currentRoleConfig = ROLE_CONFIG[role];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs h-16 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2 sm:gap-4">
          
          {/* Logo & Region Tag */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-700 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-800 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  ResQ<span className="text-emerald-600">Route</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hidden md:inline-block">
                  {t('regionTag')}
                </span>
              </div>
            </button>

            {isLoggedIn && (
              <>
                <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

                {/* Geometric Navigation Tabs */}
                <nav className="hidden lg:flex items-center gap-5 text-sm font-medium h-full">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`h-full flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'dashboard'
                        ? role === 'provider'
                          ? 'text-blue-700 border-b-2 border-blue-700 font-bold'
                          : role === 'official'
                          ? 'text-purple-700 border-b-2 border-purple-700 font-bold'
                          : 'text-emerald-700 border-b-2 border-emerald-700 font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{t('operations')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('navigate')}
                    className={`h-full flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'navigate'
                        ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>{t('planRoute')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ledger')}
                    className={`h-full flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'ledger'
                        ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t('publicLedger')}</span>
                  </button>
                </nav>
              </>
            )}
          </div>

          {/* Mobile Nav Tabs */}
          {isLoggedIn && (
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'dashboard'
                    ? role === 'provider'
                      ? 'bg-blue-50 text-blue-800'
                      : role === 'official'
                      ? 'bg-purple-50 text-purple-800'
                      : 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600'
                }`}
                title={t('operations')}
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('navigate')}
                className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'navigate' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
                }`}
                title={t('planRoute')}
              >
                <Compass className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'ledger' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
                }`}
                title={t('publicLedger')}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Global Language Selector - Always clearly visible */}
            <LanguageSelector />

            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                {onOpenDemoGuide && (
                  <button
                    onClick={onOpenDemoGuide}
                    className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">{t('walkthroughGuide')}</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Hackathon Simulation Trigger Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsSimulationMenuOpen(prev => !prev)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isWeatherSimulated
                        ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                    title="Simulation Controls"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isWeatherSimulated ? 'text-rose-600' : 'text-amber-600'}`} />
                    <span className="hidden md:inline">{t('simulations')}</span>
                  </button>

                  {isSimulationMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in"
                      onClick={() => setIsSimulationMenuOpen(false)}
                    >
                      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                        {t('simulations')}
                      </div>

                      <button
                        onClick={toggleWeatherSimulation}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                      >
                        <CloudRain className={`w-4 h-4 mt-0.5 ${isWeatherSimulated ? 'text-rose-600' : 'text-emerald-600'}`} />
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{isWeatherSimulated ? t('resetMonsoonTitle') : t('simulatedFloodTitle')}</span>
                            {isWeatherSimulated && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {isWeatherSimulated ? t('restoresNH15Open') : t('blocksNH15Flood')}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={triggerAutoIsolationDemo}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">{t('autoDetectSilentTitle')}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {t('simulates180MinTimeout')}
                          </div>
                        </div>
                      </button>

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={resetAllData}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('resetAllDataTitle')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Bell Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(prev => !prev)}
                    className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    title={t('alertCenter')}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadAlertsCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in"
                      onClick={() => setIsNotificationsOpen(false)}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 px-1">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {t('alertCenter')}
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {unreadAlertsCount} {t('unreadCount')}
                        </span>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {alerts.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400">
                            {t('noNotifications')}
                          </div>
                        ) : (
                          alerts.map(alert => (
                            <div
                              key={alert.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAlertRead(alert.id);
                              }}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                                alert.read
                                  ? 'bg-slate-50/60 border-slate-100 text-slate-500'
                                  : 'bg-emerald-50/40 border-emerald-200 text-slate-800 font-medium'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  alert.severity === 'critical'
                                    ? 'bg-rose-100 text-rose-700'
                                    : alert.severity === 'warning'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {alert.type}
                                </span>
                                <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                              </div>
                              <p className="text-xs leading-relaxed">{alert.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Role & Registered Location Indicator Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsAccountMenuOpen(prev => !prev)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs cursor-pointer transition-all hover:opacity-90 ${currentRoleConfig.badgeColor}`}
                    title="Click to view identity or switch demo persona"
                  >
                    <span className={`w-2 h-2 rounded-full ${currentRoleConfig.dotColor} animate-pulse`}></span>
                    <span className="font-bold tracking-tight uppercase text-[10px] sm:text-xs">
                      {currentRoleConfig.label}
                    </span>
                    {(currentUser?.villageName || currentUser?.depotName) && (
                      <span className="text-slate-700 font-extrabold hidden md:inline text-[11px] max-w-[150px] truncate bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {currentUser.villageName ? `📍 ${currentUser.villageName.split('(')[0].trim()}` : `🏢 ${currentUser.depotName?.split('(')[0].trim()}`}
                      </span>
                    )}
                    {currentUser?.name && (
                      <span className="text-slate-600 font-medium hidden xl:inline text-[11px] max-w-[110px] truncate">
                        • {currentUser.name}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
                  </button>

                  {isAccountMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      {/* Identity Details Card */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                          <span>{t('activeAuthenticatedIdentity')}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 font-mono">
                            {currentUser?.userId || 'usr-default'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{currentUser?.name || 'Authorized User'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${currentRoleConfig.badgeColor}`}>
                            {currentRoleConfig.label}
                          </span>
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
                          {currentUser?.villageName && (
                            <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{t('registeredVillageLabel')}: <strong>{currentUser.villageName}</strong></span>
                            </div>
                          )}
                          {currentUser?.depotName && (
                            <div className="flex items-center gap-1 text-blue-800 font-semibold">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{t('assignedDepotLabel')}: <strong>{currentUser.depotName}</strong></span>
                            </div>
                          )}
                          {currentUser?.organization && (
                            <div className="text-slate-500">
                              {t('orgLabel')}: <em>{currentUser.organization}</em>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Switch Demo Persona List */}
                      <div className="px-1 mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {t('switchDemoAccount')}
                        </span>
                        <span className="text-[10px] text-slate-400">{t('oneClickTest')}</span>
                      </div>

                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {demoAccounts.map(account => {
                          const isActive = currentUser?.userId === account.session.userId || (currentUser?.role === account.role && (currentUser?.villageId === account.session.villageId || currentUser?.depotId === account.session.depotId));
                          return (
                            <button
                              key={account.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                loginAsUser(account.session);
                                setIsAccountMenuOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                                isActive
                                  ? account.role === 'provider'
                                    ? 'bg-blue-50/80 border-blue-300 font-semibold text-blue-950 shadow-2xs'
                                    : account.role === 'official'
                                    ? 'bg-purple-50/80 border-purple-300 font-semibold text-purple-950 shadow-2xs'
                                    : 'bg-emerald-50/80 border-emerald-300 font-semibold text-emerald-950 shadow-2xs'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold truncate text-slate-900">{account.name}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    account.role === 'requester'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : account.role === 'provider'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {account.role === 'requester' ? t('villager') : account.role === 'provider' ? t('provider') : t('official')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                                  <span>{account.locationLabel}</span>
                                </div>
                              </div>
                              {isActive && (
                                <span className={`w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 ${
                                  account.role === 'provider'
                                    ? 'bg-blue-600'
                                    : account.role === 'official'
                                    ? 'bg-purple-600'
                                    : 'bg-emerald-600'
                                }`}>
                                  <Check className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Top-Nav Logout Button */}
                <button
                  id="navbar-logout-btn"
                  onClick={logout}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer"
                  title={t('logout')}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};

