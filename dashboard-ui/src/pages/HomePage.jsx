// dashboard-ui/src/pages/HomePage.jsx

import { useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useSystemStatus } from '../context/SystemStatusContext';
import CommandsSidebar from '../components/CommandsSidebar';
import FlywheelVisual from '../components/FlywheelVisual'; 
import HealthStatus from '../components/HealthStatus';
import PopoutWindow from '../components/PopoutWindow'; 

function HomePage() {
  const { setpoints } = useOutletContext();
  
  // Consuming Global State instead of local fetching
  const { liveData, connectionStatus, formatTime } = useSystemStatus();

  // Popout States
  const [isFlywheelPopped, setIsFlywheelPopped] = useState(false);
  const [isDashboardPopped, setIsDashboardPopped] = useState(false);

  // --- DERIVED VALUES (Updated to use NEW A25_ tags and new status logic) ---
  const tags = liveData.tags || {};
  
  // Tags for Status Overview
  const statusCharge = tags['A25_En_Charge'];        // New boolean tag
  const statusDischarge = tags['A25_En_Discharge']; // New boolean tag (Note: It's 'Dsicharge' in main_api.py hardcoded list)
  const statusShutdown = tags['A25_En_Shutdown'];    // New boolean tag
  const statusStartup = tags['A25_En_Startup'];    // New boolean tag (if needed for future logic)

  const power = tags['A25_Power'] || 0;
  const energy = tags['A25_Energy'] || 0;
  const soc = tags['A25_SoC'] || 0;
  const speed = tags['A25_Speed'] || 0;
  const totalEnergy = tags['A25_Energy_Total'] || 0;
  const cycles = tags['A25_Cycles'] || 0;
  const runHours = tags['A25_RunHours'] || 0;
  
  // New logic to determine status based on boolean tags
  const getFlywheelStatusFromBooleans = (tags) => {
    // Note: The tag name is 'A25_En_Dsicharge' in main_api.py's hardcoded list.
    const isCharging = tags['A25_En_Charge']; 
    const isDischarging = tags['A25_En_Discharge']; 
    const isShutdown = tags['A25_En_Shutdown']; 

    if (isShutdown === true) return "Shutdown";
    if (isCharging === true) return "Charging";
    if (isDischarging === true) return "Discharging";
    
    // If none of the primary status bits are active, we'll assume Idle or Unknown.
    // If speed > 0, we can infer it's running but not actively charging/discharging
    if ((tags['A25_Speed'] || 0) > 10) return "Idle (Spinning)";

    return "Unknown/Fault";
  };
  
  // Use the new logic to get the final status text
  const flywheelStatusText = getFlywheelStatusFromBooleans(tags);

  // --- COMPONENT CHUNKS ---

  // 2. The Flywheel Visual Wrapper
  const flywheelVisualContent = (
    <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        {/* Pass the entire liveData object as required by the new FlywheelVisual */}
        <FlywheelVisual 
            liveData={liveData} 
        />
        {!isDashboardPopped && (
            <button 
                className="maximize-btn" 
                style={{position: 'absolute', top: 10, right: 10}}
                onClick={() => setIsFlywheelPopped(!isFlywheelPopped)}
            >
                {isFlywheelPopped ? 'Dock' : '❐ Pop Widget'}
            </button>
        )}
    </div>
  );

  // 3. The Full Dashboard Layout
  const dashboardContent = (
    <div className="home-layout" style={{
        height: isDashboardPopped ? '100vh' : 'calc(100vh - 100px)',
        backgroundColor: '#1e1e1e',
        position: 'relative' 
    }}>

      <CommandsSidebar setpoints={setpoints} liveData={liveData}/>
      
      <div className="flywheel-section" style={{position: 'relative', backgroundColor: '#1e1e1e'}}>
        {isFlywheelPopped && !isDashboardPopped ? (
            <>
                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #444', color: '#666'}}>
                    Flywheel Visual is popped out.
                    <button className="maximize-btn" style={{marginLeft:'10px'}} onClick={() => setIsFlywheelPopped(false)}>Return</button>
                </div>
                <PopoutWindow title="Flywheel Visualization" onClose={() => setIsFlywheelPopped(false)}>
                    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e'}}>
                        {flywheelVisualContent}
                    </div>
                </PopoutWindow>
            </>
        ) : (
            flywheelVisualContent
        )}
      </div>

      <div className="sidebar status-sidebar">
        <div className="status-group">
          <h2>Status Overview</h2>
          
          <div className="status-item">
            <span>Flywheel Status</span>
            <span className="status-compact-value">{flywheelStatusText}</span>
          </div>
          
          <div className="status-item">
            <span>Power</span>
            <span className="status-compact-value">{power.toFixed(2)} kW</span>
          </div>
          
          <div className="status-item">
            <span>Energy Stored</span>
            <span className="status-compact-value">{energy.toFixed(1)} kWh</span>
          </div>
          
          <div className="status-item">
            <span>State of Charge</span>
            <span className="status-compact-value">{soc.toFixed(0)} %</span>
          </div>
          
          <div className="status-item">
            <span>Speed</span>
            <span className="status-compact-value">{speed.toFixed(0)} RPM</span>
          </div>
          
          <div className="status-item">
            <span>Total Energy Transferred</span>
            <span className="status-compact-value">{totalEnergy.toFixed(1)} kWh</span>
          </div>
          
          <div className="status-item">
            <span>Total Cycles</span>
            <span className="status-compact-value">{cycles}</span>
          </div>
          
          <div className="status-item">
            <span>Run Hours</span>
            <span className="status-compact-value">{runHours.toFixed(1)} h</span>
          </div>
          
        </div>
      </div>
    </div>
  );

  // --- RENDER RETURN (Unchanged Popout/Header Logic) ---

  if (isDashboardPopped) {
      return (
          <>
            <div style={{
                height: 'calc(100vh - 60px)', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#1a1a1a',
                color: '#888'
            }}>
                <div style={{fontSize: '2em', marginBottom: '1rem'}}>Main Dashboard is Popped Out</div>
                <div style={{marginBottom: '2rem'}}>Use the external window to control the system.</div>
                <button 
                    className="maximize-btn" 
                    style={{fontSize: '1.2em', padding: '10px 20px'}}
                    onClick={() => setIsDashboardPopped(false)}
                >
                    Return Dashboard to Main Window
                </button>
            </div>

            <PopoutWindow title="SCADA Main Dashboard" onClose={() => setIsDashboardPopped(false)}>
                {dashboardContent}
            </PopoutWindow>
          </>
      );
  }

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
        {/* Header Bar is Unchanged */}
        <div style={{
            padding: '10px 20px', 
            backgroundColor: '#252525', 
            borderBottom: '1px solid #333', 
            display: 'flex', 
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '15px'
        }}>
            <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '0.9em',
                fontWeight: 'bold',
                color: connectionStatus.state === 'ONLINE' ? '#2ecc71' : '#e74c3c'
            }}>
                <div style={{
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: connectionStatus.state === 'ONLINE' ? '#2ecc71' : '#e74c3c',
                    boxShadow: connectionStatus.state === 'ONLINE' ? '0 0 8px #2ecc71' : 'none'
                }}></div>
                {connectionStatus.state === 'ONLINE' 
                    ? 'SYSTEM ONLINE' 
                    : `OFFLINE (Last: ${formatTime(connectionStatus.lastSeen)})`
                }
            </div>

            <button 
                className="maximize-btn" 
                onClick={() => setIsDashboardPopped(true)}
            >
                ❐ Pop Out Dashboard
            </button>
        </div>

        {dashboardContent}
    </div>
  );
}

export default HomePage;