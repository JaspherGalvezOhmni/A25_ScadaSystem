import { useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useSystemStatus } from '../context/SystemStatusContext'; // <--- USE CONTEXT
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

  // --- DERIVED VALUES ---
  const tags = liveData.tags || {};
  const maxSpeed = 1800;
  const currentSpeed = tags['VFD_Sts_MtrSpeedScaled'] || 0;
  const powerOutput = tags['VFD_Sts_OutPowerScaled'] || 0;
  const dcVolts = tags['VFD_Sts_DCVolts'] || 0;
  const temp1 = tags['TT001.Scaled'];
  const temp2 = tags['TT002.Scaled'];
  const totalEnergy = tags['Test_InfiniteCounter'] || 0;
  const setpointSent = tags['Test_OutputVal1'];
  const setpointReadback = tags['Test_InputVal1'];
  const isTripped = tags['VFD_Sts_Tripped'];
  const hasWarning = tags['VFD_Sts_Warning'];
  const psu1Healthy = tags['PSU001_HLTY'];
  const psu2Healthy = tags['PSU002_HLTY'];
  const flywheelPercentage = (currentSpeed / maxSpeed) * 100;
  
  let flywheelStatus = "Idle";
  if (powerOutput > 0.5) flywheelStatus = "Charging";
  else if (powerOutput < -0.5) flywheelStatus = "Discharging";

  // --- COMPONENT CHUNKS ---

  // 2. The Flywheel Visual Wrapper
  const flywheelVisualContent = (
    <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <FlywheelVisual 
            percentage={flywheelPercentage}
            status={flywheelStatus}
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

      <CommandsSidebar setpoints={setpoints} />
      
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
          <h2>Overview</h2>
          <div className="status-item"><span>Flywheel Status</span><span>{flywheelStatus}</span></div>
          <div className="status-item"><span>Power</span><span>{powerOutput.toFixed(2)} kW</span></div>
          <div className="status-item"><span>Speed</span><span>{currentSpeed} RPM</span></div>
          <div className="status-item"><span>DC Voltage</span><span>{dcVolts} V</span></div>
          <div className="status-item"><span>Total Energy</span><span>{(totalEnergy / 1000).toFixed(1)} kWh</span></div>
        </div>
        <div className="status-group">
          <h2>Temperatures</h2>
          <div className="status-item"><span>Bearing 1</span><span>{typeof temp1 === 'number' ? temp1.toFixed(1) + ' °C' : 'N/A'}</span></div>
          <div className="status-item"><span>Bearing 2</span><span>{typeof temp2 === 'number' ? temp2.toFixed(1) + ' °C' : 'N/A'}</span></div>
        </div>
        <div className="status-group">
          <h2>System Health</h2>
          <HealthStatus title="VFD Tripped" value={isTripped} isHealthy={!isTripped} unhealthyText="TRIPPED" />
          <HealthStatus title="VFD Warning" value={hasWarning} isHealthy={!hasWarning} unhealthyText="WARNING" />
          <HealthStatus title="PSU 1" value={psu1Healthy} />
          <HealthStatus title="PSU 2" value={psu2Healthy} />
        </div>
        <div className="status-group">
          <h2>Setpoint Feedback</h2>
          <div className="status-item debug-item">
            <span>Setpoint Sent:</span>
            <span>{typeof setpointSent === 'number' ? setpointSent.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="status-item debug-item" style={{ color: '#00c4ff' }}>
            <span>Setpoint Readback (2x):</span>
            <span>{typeof setpointReadback === 'number' ? setpointReadback.toFixed(2) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // --- RENDER RETURN ---

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
        {/* Header Bar */}
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