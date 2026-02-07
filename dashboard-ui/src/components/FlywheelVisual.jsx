// src/components/FlywheelVisual.jsx

import React from 'react';
// We'll keep HealthStatus imported in case we add it inside this component later
import HealthStatus from './HealthStatus'; 

// Component for the new base visual
function FlywheelVisual({ liveData }) {
    // FIX: Safely extract tags
    const tags = liveData?.tags || {};

    // For the schematic health cards, we can directly use the boolean tags to determine status.
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

    const isCharging = tags['A25_En_Charge'] === true;
    const isDischarging = tags['A25_En_Discharge'] === true;
    const isShutdown = tags['A25_En_Shutdown'] === true;

    let arrowChar = '';
    let arrowColor = '#dcdcdc';
    
    // Arrow logic
    if (isCharging) {
        arrowChar = '↓';
        arrowColor = '#2ecc71';
    } else if (isDischarging) {
        arrowChar = '↑';
        arrowColor = '#e74c3c';
    } else if (isShutdown) {
        arrowChar = '';
    } else {
        arrowChar = '⚠️';
        arrowColor = '#f39c12';
    }

    // --- Arrow Style ---
    const arrowStyle = {
        position: 'absolute',
        // --- CALIBRATION POINTS ---
        top: '20%',  // Adjust to be above the flywheel graphic
        left: '55%', // Adjust to be centered on the graphic
        // --- END CALIBRATION ---
        transform: 'translateX(-50%)',
        fontSize: '8em', // Large arrow
        fontWeight: 'bold',
        color: arrowColor,
        lineHeight: '1',
        zIndex: 101, // Ensure it's above everything else
        visibility: arrowChar ? 'visible' : 'hidden', // Hide if arrowChar is empty
    };

    return (
        // The container needs to be relative so we can place absolute elements on top
        // The size of this container should match the available space on the Home Page
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            {/* 
                This is the static SVG background.
                We use an <img> tag for best display, but we can't edit it.
                You can replace this with the full SVG code if you want to edit the path/fill later.
            */}
            <img 
                src="/A25+Leaders.svg" // SVG path
                alt="Flywheel Energy Storage Schematic"
                style={{
                    maxWidth: '50%', 
                    maxHeight: '50%',
                    objectFit: 'contain',
                    position: 'absolute',
                    bottom: '80px', // changed this padding to adjust flywheel vertically
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    top: '5%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '3em',
                    fontWeight: 'bold',
                    color: '#dcdcdc',
                    zIndex: 102,
                    whiteSpace: 'nowrap'
                }}>
                AC Network
            </div>
            
                {/* ========================================================= */}
                {/* *** BOOLEAN SCHEMATIC CARD TEMPLATE (DUPLICATABLE BLOCK) *** */}
                {/* ========================================================= */}
                
                {/* 1. UPPER BEARING Temp */}
                {/* ------------------------------ */}

                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '38%', left: '75%', transform: 'translateX(-50%)' }} // adjust top and left as needed for all cards.
                >
                    <div className="schematic-card-title">Upper Bearing Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${UBT_Class}`}>
                            {UBT_Text}
                        </div>
                    </div>
                </div>
                {/* 2. Load Cell */}
                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '32%', left: '25%', transform: 'translateX(-50%)' }} 
                >
                    <div className="schematic-card-title">Load Cell</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${LC_Class}`}>
                            {LC_Text}
                        </div>
                    </div>
                </div>

                {/* 3. Upper Vibration */}
                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '42%', left: '25%', transform: 'translateX(-50%)' }} 
                >
                    <div className="schematic-card-title">Upper Vibration</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${UV_Class}`}>
                            {UV_Text}
                        </div>
                    </div>
                </div>

                {/* 3. Pressure */}
                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '52%', left: '25%', transform: 'translateX(-50%)' }} 
                >
                    <div className="schematic-card-title">Pressure</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${PR_Class}`}>
                            {PR_Text}
                        </div>
                    </div>
                </div>

                {/* 4. Pressure */}
                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '67%', left: '25%', transform: 'translateX(-50%)' }} 
                >
                    <div className="schematic-card-title">Lower Vibration</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${LV_Class}`}>
                            {LV_Text}
                        </div>
                    </div>
                </div>

                {/* 4. Lower Bearing Vibration */}
                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '67%', left: '75%', transform: 'translateX(-50%)' }} 
                >
                    <div className="schematic-card-title">Lower Bearting Temp</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${LBT_Class}`}>
                            {LBT_Text}
                        </div>
                    </div>
                </div>

                {/* 5. Motor Temp */}
                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '80%', left: '75%', transform: 'translateX(-50%)' }} 
                >
                    <div className="schematic-card-title">Motor Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${MT_Class}`}>
                            {MT_Text}
                        </div>
                    </div>
                </div>
                
                {/* ========================================================= */}
                {/* *** END BLOCKS *** */}
                {/* ========================================================= */}

                {/* ARROW */}
                <div style={arrowStyle}>
                    {arrowChar}
                </div>
        </div>
    );
}

export default FlywheelVisual;