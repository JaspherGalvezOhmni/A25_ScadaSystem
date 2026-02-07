import React from 'react';

function FlywheelVisual({ percentage, status }) {
  // Determine animation class based on status
  let animationClass = '';
  if (status === 'Charging') animationClass = 'spinning-charge';
  else if (status === 'Discharging') animationClass = 'spinning-discharge';

  // Determine the correct arrow direction
  const arrowDirection = status === 'Charging' ? '↓' : (status === 'Discharging' ? '↑' : '-');
  const arrowColor = status === 'Charging' ? '#2ecc71' : (status === 'Discharging' ? '#e74c3c' : '#555');

  return (
    <div className="flywheel-container">
      <div className="grid-visual">Grid</div>
      <div className="ac-network-visual">AC Power Network</div>
      
      <div className="power-flow-arrow" style={{ color: arrowColor }}>
        {arrowDirection}
      </div>
      
      {/* The Visual Circle */}
      <div className={`flywheel-visual ${animationClass}`}>
        {/* The rotating gradient fill */}
        <div className="flywheel-fill"></div>
        
        {/* The Text Overlay */}
        <div className="flywheel-text">
          <div>{status}</div>
          <div style={{fontSize: '0.8em', color: '#a0a0a0'}}>{percentage?.toFixed(0) || 0}% Speed</div>
        </div>
      </div>
    </div>
  );
}

export default FlywheelVisual;