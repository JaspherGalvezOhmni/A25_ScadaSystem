// src/components/FlywheelVisual.jsx

import React from 'react';

function FlywheelVisual({ liveData }) {
    const tags = liveData?.tags || {};
    const STATUS_MAP = {
        3: "Idle",
        6: "Idle",
        7: "Idle",
        1: "Stopped",
        2: "Starting Up",
        4: "Charging",
        5: "Discharging"
    };

    // Health Card Logic
    const UBT_Value = tags['TT001_Healthy'];
    const LC_Value = tags['WT001_Healthy'];
    const UV_Value = tags['VT001_Healthy'];
    const PR_Value = tags['PT001_Healthy'];
    const LV_Value = tags['VT002_Healthy'];
    const LBT_Value = tags['TT002_Healthy'];
    const MT_Value = tags['TT003_Healthy'];

    const getStatusInfo = (val) => ({
        text: val === true ? 'Healthy' : (val === false ? 'Fault' : 'N/A'),
        class: val === true ? 'healthy' : (val === false ? 'unhealthy' : 'unknown')
    });

    const status = tags?.['A25_Status'] ?? 0;
    const statusText = STATUS_MAP[status] ?? "Unknown";

    let arrowChar = '';
    let arrowColor = '#dcdcdc';
    if (statusText === "Charging" || statusText === "Starting Up") { arrowChar = '↓'; arrowColor = '#2ecc71'; }
    else if (statusText === "Discharging") { arrowChar = '↑'; arrowColor = '#e74c3c'; }
    else if (statusText === "Stopped" || statusText === "Idle") { arrowChar = '-'; }
    else { arrowChar = '⚠️'; arrowColor = '#f39c12'; }

    const arrowStyle = {
        position: 'absolute',
        top: '18%',
        left: '53%',
        transform: 'translateX(-50%)',
        fontSize: '8em',
        fontWeight: 'bold',
        color: arrowColor,
        lineHeight: '1',
        zIndex: 101,
        visibility: arrowChar ? 'visible' : 'hidden',
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '90%', aspectRatio: '407 / 471', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                
                <img src="/A25+Leaders.svg" alt="Schematic" style={{ width: '60%', height: '60%', objectFit: 'contain', position: 'absolute', top: '40%' }} />

                <div style={{ position: 'absolute', top: '5%', left: '53%', transform: 'translateX(-50%)', fontSize: '2.5em', fontWeight: 'bold', color: '#dcdcdc', zIndex: 102, whiteSpace: 'nowrap' }}>
                    AC Network
                </div>
            
                {/* 1. UPPER BEARING */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '38%', left: '93%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Upper Bearing Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${getStatusInfo(UBT_Value).class}`}>{getStatusInfo(UBT_Value).text}</div>
                    </div>
                </div>

                {/* 2. Load Cell */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '32%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Load Cell</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${getStatusInfo(LC_Value).class}`}>{getStatusInfo(LC_Value).text}</div>
                    </div>
                </div>

                {/* 3. Upper Vibration */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '45%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Upper Vibration</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${getStatusInfo(UV_Value).class}`}>{getStatusInfo(UV_Value).text}</div>
                    </div>
                </div>

                {/* 4. Pressure */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '75%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Pressure</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${getStatusInfo(PR_Value).class}`}>{getStatusInfo(PR_Value).text}</div>
                    </div>
                </div>

                {/* 5. Lower Vibration */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '60%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Lower Vibration</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${getStatusInfo(LV_Value).class}`}>{getStatusInfo(LV_Value).text}</div>
                    </div>
                </div>

                {/* 6. Lower Bearing Temp */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '75%', left: '93%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Lower Bearing Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${getStatusInfo(LBT_Value).class}`}>{getStatusInfo(LBT_Value).text}</div>
                    </div>
                </div>

                {/* 7. Motor Temp */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '90%', left: '93%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Motor Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${getStatusInfo(MT_Value).class}`}>{getStatusInfo(MT_Value).text}</div>
                    </div>
                </div>

                <div style={arrowStyle}>{arrowChar}</div>
            </div>
        </div>
    );
}

export default FlywheelVisual;