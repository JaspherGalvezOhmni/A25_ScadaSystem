// dashboard-ui/src/pages/HomePage.jsx

import { useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useSystemStatus } from '../context/SystemStatusContext';
import CommandsSidebar from '../components/CommandsSidebar';
import FlywheelVisual from '../components/FlywheelVisual'; 
import HealthStatus from '../components/HealthStatus';
import PopoutWindow from '../components/PopoutWindow'; 
import { getSystemStatus } from '../constants';

function HomePage() {
  const { setpoints } = useOutletContext();
  
  // Consuming Global State instead of local fetching
  const { liveData, connectionStatus, formatTime } = useSystemStatus();

  // Popout States
  // const [isFlywheelPopped, setIsFlywheelPopped] = useState(false);  staging removal
  // const [isDashboardPopped, setIsDashboardPopped] = useState(false); staging removal

  // --- DERIVED VALUES (Updated to use NEW A25_ tags and new status logic) ---
  const tags = liveData.tags || {};

  const status = tags?.['A25_Status'] ?? 0;
  const flywheelStatusText = getSystemStatus(status).text;


  const power = tags['A25_Power'] || 0;
  const energy = tags['A25_Energy'] || 0;
  const soc = tags['A25_SoC'] || 0;
  const speed = tags['A25_Speed'] || 0;
  const totalEnergy = tags['A25_Energy_Total'] || 0;
  const cycles = tags['A25_Cycles'] || 0;
  const runHours = tags['A25_RunHours'] || 0;
  
  // New logic to determine status based on boolean tags
  const getFlywheelStatusFromBooleans = (tags) => {
    return STATUS_MAP[status] ?? "Unknown";
  };

   return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>

        <div style={{
            backgroundColor: '#181818',
            borderBottom: '1px solid #333',
            height: '6px',
            flexShrink: 0
        }}></div>

        {/* Static Dashboard Layout */}
        <div className="home-layout" style={{ backgroundColor: '#1e1e1e' }}>
            <CommandsSidebar setpoints={setpoints} liveData={liveData}/>
            
            <div className="flywheel-section" style={{position: 'relative', backgroundColor: '#1e1e1e'}}>
                <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <FlywheelVisual liveData={liveData} />
                </div>
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
    </div>
  );
}

export default HomePage;