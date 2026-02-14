// src/components/FlywheelVisual.jsx

import React from 'react';
import HealthStatus from './HealthStatus'; 

function FlywheelVisual({ liveData }) {
    const tags = liveData?.tags || {};
    const STATUS_MAP = {   // Status map for A25_Status
        3: "Idle",
        6: "Idle",
        7: "Idle",
        1: "Stopped",
        2: "Starting Up",
        4: "Charging",
        5: "Discharging"
    };
    // --- ALL YOUR TAG LOGIC (UBT, LC, UV, etc.) stays exactly as you have it ---
    const UBT_Tag = 'TT001_Healthy';
    const UBT_Value = tags[UBT_Tag];
    const UBT_Text = UBT_Value === true ? 'Healthy' : (UBT_Value === false ? 'Fault' : 'N/A');
    const UBT_Class = UBT_Value === true ? 'healthy' : (UBT_Value === false ? 'unhealthy' : 'unknown');

    const LC_Tag = 'WT001_Healthy';
    const LC_Value = tags[LC_Tag];
    const LC_Text = LC_Value === true ? 'Healthy' : (LC_Value === false ? 'Fault' : 'N/A');
    const LC_Class = LC_Value === true ? 'healthy' : (LC_Value === false ? 'unhealthy' : 'unknown');

    const UV_Tag = 'VT001_Healthy';
    const UV_Value = tags[UV_Tag];
    const UV_Text = UV_Value === true ? 'Healthy' : (UV_Value === false ? 'Fault' : 'N/A');
    const UV_Class = UV_Value === true ? 'healthy' : (UV_Value === false ? 'unhealthy' : 'unknown');

    const PR_Tag = 'PT001_Healthy';
    const PR_Value = tags[PR_Tag];
    const PR_Text = PR_Value === true ? 'Healthy' : (PR_Value === false ? 'Fault' : 'N/A');
    const PR_Class = PR_Value === true ? 'healthy' : (PR_Value === false ? 'unhealthy' : 'unknown');

    const LV_Tag = 'VT002_Healthy';
    const LV_Value = tags[LV_Tag];
    const LV_Text = LV_Value === true ? 'Healthy' : (LV_Value === false ? 'Fault' : 'N/A');
    const LV_Class = LV_Value === true ? 'healthy' : (LV_Value === false ? 'unhealthy' : 'unknown');

    const LBT_Tag = 'TT002_Healthy';
    const LBT_Value = tags[LBT_Tag];
    const LBT_Text = LBT_Value === true ? 'Healthy' : (LBT_Value === false ? 'Fault' : 'N/A');
    const LBT_Class = LBT_Value === true ? 'healthy' : (LBT_Value === false ? 'unhealthy' : 'unknown');

    const MT_Tag = 'TT003_Healthy';
    const MT_Value = tags[MT_Tag];
    const MT_Text = MT_Value === true ? 'Healthy' : (MT_Value === false ? 'Fault' : 'N/A');
    const MT_Class = MT_Value === true ? 'healthy' : (MT_Value === false ? 'unhealthy' : 'unknown');

    const status = tags?.['A25_Status'] ?? 0;
    const statusText = STATUS_MAP[status] ?? "Unknown";

    let arrowChar = '';
    let arrowColor = '#dcdcdc';
    if (statusText === "Charging" || statusText === "Starting Up") { arrowChar = '↓'; arrowColor = '#2ecc71'; }
    else if (statusText === "Discharging") { arrowChar = '↑'; arrowColor = '#e74c3c'; }
    else if (statusText === "Stopped") { arrowChar = '-'; }
    else if (statusText === "Idle") { arrowChar = '-'; }
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
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            {/* 
                SCALING BOX: 
                This maintains the same proportions (407x471 from your SVG) 
                so the cards stay exactly on the leader lines regardless of screen size.
            */}
            <div style={{
                position: 'relative',
                height: '90%', // Uses most of the vertical space
                aspectRatio: '407 / 471', // Matches your SVG dimensions
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                
                <img 
                    src="/A25+Leaders.svg" 
                    alt="Schematic"
                    style={{
                        width: '60%',
                        height: '60%',
                        objectFit: 'contain',
                        position: 'absolute',
                        top: '40%',
                    }}
                />

                <div style={{
                    position: 'absolute',
                    top: '5%',
                    left: '53%',
                    transform: 'translateX(-50%)',
                    fontSize: '2.5em',
                    fontWeight: 'bold',
                    color: '#dcdcdc',
                    zIndex: 102,
                    whiteSpace: 'nowrap'
                }}>
                    AC Network
                </div>
            
                {/* 1. UPPER BEARING */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '38%', left: '93%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Upper Bearing Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${UBT_Class}`}>{UBT_Text}</div>
                    </div>
                </div>

                {/* 2. Load Cell */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '32%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Load Cell</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${LC_Class}`}>{LC_Text}</div>
                    </div>
                </div>

                {/* 3. Upper Vibration */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '45%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Upper Vibration</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${UV_Class}`}>{UV_Text}</div>
                    </div>
                </div>

                {/* 4. Pressure */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '75%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Pressure</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${PR_Class}`}>{PR_Text}</div>
                    </div>
                </div>

                {/* 5. Lower Vibration */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '60%', left: '8%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Lower Vibration</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${LV_Class}`}>{LV_Text}</div>
                    </div>
                </div>

                {/* 6. Lower Bearing Temp */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '75%', left: '93%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Lower Bearing Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${LBT_Class}`}>{LBT_Text}</div>
                    </div>
                </div>

                {/* 7. Motor Temp */}
                <div className="schematic-health-card" style={{ position: 'absolute', top: '90%', left: '93%', transform: 'translateX(-50%)' }}>
                    <div className="schematic-card-title">Motor Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${MT_Class}`}>{MT_Text}</div>
                    </div>
                </div>

                <div style={arrowStyle}>{arrowChar}</div>
            </div>
        </div>
    );
}

export default FlywheelVisual;