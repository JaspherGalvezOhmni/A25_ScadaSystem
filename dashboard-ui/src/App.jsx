import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { useSystemStatus } from './context/SystemStatusContext'; // <--- NEW IMPORT
import apiClient from './api';
import './App.css';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [setpoints, setSetpoints] = useState({});

  const auth = useAuth();
  const { token, logout, user } = auth;
  const navigate = useNavigate();
  
  // Consume System Status for Global Overlay
  const { connectionStatus, formatTime } = useSystemStatus();

  // Redirect Logic
  useEffect(() => {
    if (!isClient) return;
    // Only redirect if NO token. If we have a token but server is down, stay put.
    if (!token && !user) {
      navigate('/login', { replace: true });
    }
  }, [token, user, isClient, navigate]);

  // Fetch Settings (Only if online)
  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await apiClient.get('/api/settings');
        const settingsObj = response.data.reduce((acc, s) => {
          acc[s.key.replace('setpoint_', '')] = s.value;
          return acc;
        }, {});
        setSetpoints(settingsObj);
      } catch (error) {
        // Quiet fail on settings fetch
      }
    };
    if (connectionStatus.state === 'ONLINE') {
        fetchSettings();
    }
  }, [token, connectionStatus.state]);

  useEffect(() => {
    setIsClient(true);
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formattedTime = currentTime.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  });

  // --- THE GLOBAL OFFLINE OVERLAY ---
  const offlineOverlay = connectionStatus.state === 'OFFLINE' && (
      <div className="connection-overlay">
          <div className="connection-box">
              <h2>Communication Lost</h2>
              <p>
                  Backend server is unreachable.<br/>
                  Last connection: <strong>{formatTime(connectionStatus.lastSeen)}</strong>
              </p>
              <div className="retry-spinner"></div>
              <p style={{fontSize: '0.9em', marginTop: '1rem', color: '#888'}}>
                  System is attempting to reconnect...
              </p>
          </div>
      </div>
  );

  return (
    <div className="App" style={{position: 'relative'}}>
      {/* RENDER OVERLAY ON TOP OF EVERYTHING */}
      {offlineOverlay}

      <header className="App-header">
        <div className="logo-container">
          <img src="/Ohmni_Logo_RGB_Blue_WhiteBG.svg" alt="Ohmni Logo" />
        </div>

        <nav className="navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/operational-details">Operational Details</NavLink>
          <NavLink to="/engineering">Engineering</NavLink>
        </nav>

        <div className="header-right-side">
          {/* NEW DUAL INDICATORS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: '10px' }}>
            
            {/* SERVER STATUS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: connectionStatus.state === 'ONLINE' ? '#2ecc71' : '#e74c3c',
                boxShadow: connectionStatus.state === 'ONLINE' ? '0 0 8px #2ecc71' : 'none'
              }}></div>
              <span style={{ fontSize: '0.75em', color: '#888', fontWeight: 'bold' }}>SRV</span>
            </div>

            {/* PLC STATUS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: (connectionStatus.state === 'ONLINE' && connectionStatus.plcConnected) ? '#2ecc71' : '#e74c3c',
                boxShadow: (connectionStatus.state === 'ONLINE' && connectionStatus.plcConnected) ? '0 0 8px #2ecc71' : 'none'
              }}></div>
              <span style={{ fontSize: '0.75em', color: '#888', fontWeight: 'bold' }}>PLC</span>
            </div>
            
          </div>

          <div className="status-time">{isClient ? formattedTime : 'Loading...'}</div>
          {token && (
            <button onClick={logout} className="logout-button">Log Out</button>
          )}
        </div>
      </header>

      <main className="main-content">
        <Outlet context={{ setpoints, setSetpoints, user: auth.user }} />
      </main>
    </div>
  );
}

export default App;