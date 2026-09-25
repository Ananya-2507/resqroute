import React, { useState, useEffect } from 'react';
import { WifiOff, Phone, X } from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { RequesterView } from './components/RequesterView';
import { ResourceProviderView } from './components/ResourceProviderView';
import { GovernmentOfficialView } from './components/GovernmentOfficialView';
import { GeneralNavigationView } from './components/GeneralNavigationView';
import { PublicLedgerView } from './components/PublicLedgerView';
import { DemoGuideModal } from './components/DemoGuideModal';
import { LandingLoginView } from './components/LandingLoginView';
import { OfflineHelpSection } from './components/OfflineHelpSection';
import { CriticalIsolationModal } from './components/CriticalIsolationModal';
import { useNetworkStatus } from './hooks/useNetworkStatus';

const AppContent: React.FC = () => {
  const { role, activeTab, isLoggedIn, activeIsolationInterrupt, dismissIsolationInterrupt } = useApp();
  const { t } = useLanguage();
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const { effectiveOnline } = useNetworkStatus();

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-dot-pattern text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Google Maps Quota Defense Banner (Case A: Auto-Provisioned Demo Key) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Global Header */}
      <Navbar onOpenDemoGuide={() => setIsDemoGuideOpen(true)} />

      {/* 5. Auto-detect Network Status: Persistent banner if offline */}
      {!effectiveOnline && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md shrink-0 sticky top-16 z-40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
            <span>{t('noInternetDetectedBanner')}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                const el = document.getElementById('offline-help-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setIsOfflineModalOpen(true);
                }
              } else {
                setIsOfflineModalOpen(true);
              }
            }}
            className="px-3 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('callSmsHelpBtn')}</span>
          </button>
        </div>
      )}

      {/* Main View Area - Only Entry Point is LandingLoginView when not logged in */}
      <main className="flex-1 pb-10">
        {!isLoggedIn ? (
          <LandingLoginView onOpenDemoGuide={() => setIsDemoGuideOpen(true)} />
        ) : activeTab === 'navigate' ? (
          <GeneralNavigationView />
        ) : activeTab === 'ledger' ? (
          <PublicLedgerView />
        ) : (
          /* Role Dashboard Router */
          <>
            {role === 'requester' && <RequesterView />}
            {role === 'provider' && <ResourceProviderView />}
            {role === 'official' && <GovernmentOfficialView />}
            {role === 'guest' && <GeneralNavigationView />}
          </>
        )}
      </main>

      {/* Offline Help Modal (For logged-in users or quick banner click) */}
      {isOfflineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto relative">
            <div className="sticky top-0 right-0 z-10 flex justify-end p-3 bg-white/90 backdrop-blur-xs border-b border-slate-100">
              <button
                type="button"
                onClick={() => setIsOfflineModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <span>{t('close')}</span>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <OfflineHelpSection isProminent={true} />
            </div>
          </div>
        </div>
      )}

      {/* Demo Guide Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
      />

      {/* Full-Screen Interrupt for Critical Isolation Alerts */}
      <CriticalIsolationModal
        alert={activeIsolationInterrupt}
        onDismiss={dismissIsolationInterrupt}
      />
    </div>
  );
};

export default function App() {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  return (
    <APIProvider apiKey={apiKey} libraries={['marker', 'geometry']}>
      <LanguageProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </LanguageProvider>
    </APIProvider>
  );
}
