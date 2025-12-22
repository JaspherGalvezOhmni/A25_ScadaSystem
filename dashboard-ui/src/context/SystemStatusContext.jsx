import { createContext, useState, useContext, useEffect, useRef } from 'react';
import apiClient from '../api';

const SystemStatusContext = createContext(null);

export const SystemStatusProvider = ({ children }) => {
  const [liveData, setLiveData] = useState({ tags: {} });
  
  // FIX: Initialize state from LocalStorage so we remember "Last Seen" after refresh
  const [connectionStatus, setConnectionStatus] = useState(() => {
      const saved = localStorage.getItem('lastSystemSeen');
      return {
          state: 'CONNECTING',
          lastSeen: saved ? new Date(saved) : null
      };
  });

  const isFetchingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const performHeartbeat = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const response = await apiClient.get(`/api/live-data?_=${Date.now()}`, { timeout: 2000 });
        
        if (isMounted) {
            setLiveData(response.data);
            const now = new Date();
            // FIX: Save to LocalStorage
            localStorage.setItem('lastSystemSeen', now.toISOString());
            
            setConnectionStatus({
                state: 'ONLINE',
                lastSeen: now
            });
        }
      } catch (error) {
        if (isMounted) {
            setConnectionStatus(prev => ({
                state: 'OFFLINE',
                lastSeen: prev.lastSeen 
            }));
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    performHeartbeat();
    const intervalId = setInterval(performHeartbeat, 1000);

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  }, []);

  const value = {
    liveData,
    connectionStatus,
    formatTime: (date) => {
        if (!date) return "Never";
        return new Date(date).toLocaleTimeString('en-US', { hour12: false });
    }
  };

  return (
    <SystemStatusContext.Provider value={value}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = () => useContext(SystemStatusContext);