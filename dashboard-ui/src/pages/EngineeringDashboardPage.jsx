// dashboard-ui/src/pages/HomePage.jsx

import { useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useSystemStatus } from '../context/SystemStatusContext';
import CommandsSidebar from '../components/CommandsSidebar';
import FlywheelVisual from '../components/FlywheelVisual';
import HealthStatus from '../components/HealthStatus';
import PopoutWindow from '../components/PopoutWindow';
import { getSystemStatus } from '../constants';
import EngineeringSidebar from '../components/EngineeringSidebar';

// Reusable component for the new stylized status rows
const StatusRow = ({ label, value, unit = '', isWarning = false, isHealthy = false }) => {
    return (
        <div className="status-box-row">
            <div className="status-box-label">{label}</div>
            <div className={`status-box-value ${isWarning ? 'warning' : isHealthy ? 'healthy' : ''}`}>
                {value !== undefined && value !== null ? value : '---'} {unit}
            </div>
        </div>
    );
};

function EngineeringDashboardPage() {
    const { setpoints } = useOutletContext();

    // Consuming Global State instead of local fetching
    const { liveData, connectionStatus, formatTime } = useSystemStatus();

    // --- DERIVED VALUES (Updated to use NEW A25_ tags and new status logic) ---
    const tags = liveData.tags || {};

    // Helper for safe number formatting
    const safeNum = (val, toFixed = 1) => {
        if (val === undefined || val === null || isNaN(val)) return '---';
        return Number(val).toFixed(toFixed);
    };

    return (
        <div className="eng-dashboard-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                backgroundColor: '#181818',
                borderBottom: '1px solid #333',
                height: '6px',
                flexShrink: 0
            }}></div>

            {/* Static Dashboard Layout */}
            <div className="home-layout" style={{ backgroundColor: '#00151d' }}>
                <EngineeringSidebar liveData={liveData} />

                <div className="flywheel-section" style={{ position: 'relative', backgroundColor: '#1e1e1e' }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <FlywheelVisual liveData={liveData} />
                    </div>
                </div>

                <div className="sidebar status-sidebar">
                    {/* SYSTEM STATUS BLOCK */}
                    <div className="status-box">
                        <div className="status-box-header">SYSTEM STATUS</div>
                        <StatusRow label="CURRENT SPEED" value={safeNum(tags['VFD_Sts_MtrSpeedScaled'], 0)} unit="RPM" />
                        <StatusRow label="CURRENT TORQUE" value={safeNum(tags['VFD_Sts_AcutalTorque'], 1)} unit="%" />
                        <StatusRow label="GRID FREQUENCY" value={safeNum(tags['VFD_Sts_GridFreq'], 1)} unit="Hz" />
                        <StatusRow label="GRID VOLTS" value={safeNum(tags['VFD_Sts_GridVolts'], 1)} unit="V" />
                        <StatusRow label="GRID POWER" value={safeNum(tags['VFD_Sts_GridAppPower'], 1)} unit="kVA" />
                        <StatusRow label="OUTPUT POWER" value={safeNum(tags['VFD_Sts_OutPowerScaled'], 1)} unit="kW" />
                        <StatusRow label="AMBIENT TEMP" value={safeNum(tags['TT001.Scaled'], 1)} unit="C" />
                    </div>

                    {/* MAGLEV STATUS BLOCK */}
                    <div className="status-box">
                        <div className="status-box-header">MAGLEV STATUS</div>
                        <StatusRow label="CURRENT WEIGHT" value={safeNum(tags['WT001.Scaled'], 0)} unit="kg" />
                        <StatusRow label="TARGET WEIGHT" value={safeNum(tags['EM_SV'], 0)} unit="kg" />
                        <StatusRow label="SIGNAL OUTPUT" value={safeNum(tags['Ch0Data'], 1)} unit="mV" />
                    </div>

                    {/* VSD STATUS BLOCK */}
                    <div className="status-box">
                        <div className="status-box-header">VSD STATUS</div>
                        <StatusRow label="CURRENT SPEED" value={safeNum(tags['VFD_Sts_MtrSpeedScaled'], 1)} unit="RPM" />
                        <StatusRow label="CURRENT TORQUE" value={safeNum(tags['VFD_Sts_AcutalTorque'], 1)} unit="%" />
                        <StatusRow label="OUTPUT FREQUENCY" value={safeNum(tags['VFD_Sts_OutFreq'], 1)} unit="Hz" />
                        <StatusRow label="DC BUS VOLTS" value={safeNum(tags['VFD_Sts_DCVolts'], 0)} unit="V" />
                        <StatusRow label="GRID VOLTS" value={safeNum(tags['VFD_Sts_GridVolts'], 1)} unit="V" />
                        <StatusRow label="VSD AMBIENT TEMP" value={safeNum(tags['VSD_Sts_AmbTemp'], 1)} unit="C" />
                        <StatusRow label="OUTPUT POWER" value={safeNum(tags['VFD_Sts_OutPowerScaled'], 1)} unit="kW" />
                        <StatusRow 
                            label="TRIPPING FAULT" 
                            value={tags['VFD_Sts_TripFlt.value'] ? 'FAULT' : 'OK'} 
                            isWarning={!!tags['VFD_Sts_TripFlt.value']}
                            isHealthy={!tags['VFD_Sts_TripFlt.value']}
                        />
                        <StatusRow label="LATEST WARNING" value={safeNum(tags['VFD_Sts_latestWarning.value'], 1)} unit="" />
                        <StatusRow 
                            label="COMMS STATUS" 
                            value={tags['VFD_Sts_Comms_Healthy'] ? 'Healthy' : 'Fault'} 
                            isHealthy={!!tags['VFD_Sts_Comms_Healthy']}
                            isWarning={!tags['VFD_Sts_Comms_Healthy']}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EngineeringDashboardPage;