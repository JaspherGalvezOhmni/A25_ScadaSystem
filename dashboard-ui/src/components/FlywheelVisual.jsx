// src/components/FlywheelVisual.jsx

import React from 'react';
import { getSystemStatus, getDirectionConfig } from '../constants';

const HealthCard = ({ title, value, top, left }) => {
    const isHealthy = value === true;
    const isFault = value === false;

    const displayText = isHealthy ? 'Healthy' : (isFault ? 'Fault' : 'N/A');
    const statusClass = isHealthy ? 'healthy' : (isFault ? 'unhealthy' : 'unknown');

    return (
        <div
            className="schematic-health-card"
            style={{
                position: 'absolute',
                top: top,
                left: left,
                transform: 'translateX(-50%)'
            }}>
            <div className="schematic-card-title">{title}</div>
            <div className="schematic-status-container">
                <div className={`schematic-health-indicator ${statusClass}`}>
                    {displayText}
                </div>
            </div>
        </div>
    )
}

function FlywheelVisual({ liveData }) {
    const tags = liveData?.tags || {};

    const status = tags?.['A25_Status'] ?? 0;
    const { text: statusText } = getSystemStatus(status);

    const arrow = getDirectionConfig(statusText);

    const arrowStyle = {
        position: 'absolute',
        top: '18%',
        left: '53%',
        transform: 'translateX(-50%)',
        fontSize: '8em',
        fontWeight: 'bold',
        color: arrow.color,
        lineHeight: '1',
        zIndex: 101,
        visibility: arrow.char ? 'visible' : 'hidden',
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '90%', aspectRatio: '407 / 471', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                
                <img src="/A25+Leaders.svg" alt="Schematic" style={{ width: '60%', height: '60%', objectFit: 'contain', position: 'absolute', top: '40%' }} />

                <div style={{ position: 'absolute', top: '5%', left: '53%', transform: 'translateX(-50%)', fontSize: '2.5em', fontWeight: 'bold', color: '#dcdcdc', zIndex: 102, whiteSpace: 'nowrap' }}>
                    AC Network
                </div>

                {/* Dynamic Health Cards */}
                <HealthCard title="Load Cell" value={tags['WT001_Healthy']} top="32%" left="8%" />
                <HealthCard title="Upper Bearing Temp." value={tags['TT001_Healthy']} top="38%" left="93%" />
                <HealthCard title="Upper Vibration" value={tags['VT001_Healthy']} top="45%" left="8%" />
                <HealthCard title="Lower Vibration" value={tags['VT002_Healthy']} top="60%" left="8%" />
                <HealthCard title="Lower Bearing Temp." value={tags['TT002_Healthy']} top="75%" left="93%" />
                <HealthCard title="Pressure" value={tags['PT001_Healthy']} top="75%" left="8%" />
                <HealthCard title="Motor Temp." value={tags['TT003_Healthy']} top="90%" left="93%" />

                <div style={arrowStyle}>{arrow.char}</div>
            </div>
        </div>
    );
}

export default FlywheelVisual;