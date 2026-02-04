// src/components/FlywheelVisual.jsx

import React from 'react';
// We'll keep HealthStatus imported in case we add it inside this component later
import HealthStatus from './HealthStatus'; 

// Component for the new base visual
function FlywheelVisual({ liveData }) {
    // FIX: Safely extract tags
    const tags = liveData?.tags || {};

    const UBT_Tag = 'TT001_Healthy';
    const UBT_Value = tags[UBT_Tag];
    const UBT_Text = UBT_Value === true ? 'Healthy' : (UBT_Value === false ? 'Fault' : 'N/A');
    const UBT_Class = UBT_Value === true ? 'healthy' : (UBT_Value === false ? 'unhealthy' : 'unknown');

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
                    bottom: '50px', // changed this padding to adjust flywheel vertically
                }}
            />
            
                {/* ========================================================= */}
                {/* *** BOOLEAN SCHEMATIC CARD TEMPLATE (DUPLICATABLE BLOCK) *** */}
                {/* ========================================================= */}
                
                {/* 1. UPPER BEARING TEMP HEALTH */}
                {/* ------------------------------ */}

                <div 
                    className="schematic-health-card" 
                    style={{ position: 'absolute', top: '35%', left: '70%', transform: 'translateX(-50%)' }} // adjust top and left as needed for all cards.
                >
                    <div className="schematic-card-title">Upper Bearing Temp.</div>
                    <div className="schematic-status-container">
                        <div className={`schematic-health-indicator ${UBT_Class}`}>
                            {UBT_Text}
                        </div>
                    </div>
                </div>
                
                {/* ========================================================= */}
                {/* *** END BLOCKS *** */}
                {/* ========================================================= */}

                {/* Example: Dynamic Arrow Placeholder */}
                <div style={{ position: 'absolute', top: '-100px', left: '100px', fontSize: '3em' }}>
                    {/* {'↓'} */}
                </div>


        </div>
    );
}

export default FlywheelVisual;