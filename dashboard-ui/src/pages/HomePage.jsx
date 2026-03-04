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
                <div className="status-box">
                    <div className="status-box-header">System Overview</div>
                    
                    <div className="status-box-row">
                        <div className="status-box-label">Flywheel Status</div>
                        <div className="status-box-value">{flywheelStatusText}</div>
                    </div>

                    <div className="status-box-row">
                        <div className="status-box-label">Power</div>
                        <div className="status-box-value">{power.toFixed(2)} kW</div>
                    </div>

                    <div className="status-box-row">
                        <div className="status-box-label">Energy Stored</div>
                        <div className="status-box-value">{energy.toFixed(1)} kWh</div>
                    </div>

                    <div className="status-box-row">
                        <div className="status-box-label">State of Charge</div>
                        <div className="status-box-value">{soc.toFixed(0)} %</div>
                    </div>

                    <div className="status-box-row">
                        <div className="status-box-label">Speed</div>
                        <div className="status-box-value">{speed.toFixed(0)} RPM</div>
                    </div>

                    <div className="status-box-row">
                        <div className="status-box-label">Run Hours</div>
                        <div className="status-box-value">{runHours.toFixed(1)} h</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

export default HomePage;