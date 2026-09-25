import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveOnline: boolean;
  toggleSimulatedOffline: () => void;
  setSimulatedOffline: (simulated: boolean) => void;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('resqroute_simulated_offline') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setSimulatedOffline = useCallback((simulated: boolean) => {
    setIsSimulatedOfflineState(simulated);
    try {
      if (simulated) {
        localStorage.setItem('resqroute_simulated_offline', 'true');
      } else {
        localStorage.removeItem('resqroute_simulated_offline');
      }
    } catch {
      // ignore localStorage errors in sandboxed iframes
    }
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    setSimulatedOffline(!isSimulatedOffline);
  }, [isSimulatedOffline, setSimulatedOffline]);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  return {
    isOnline,
    isSimulatedOffline,
    effectiveOnline,
    toggleSimulatedOffline,
    setSimulatedOffline
  };
}
