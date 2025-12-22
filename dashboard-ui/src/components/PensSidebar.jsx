// src/components/PensSidebar.jsx
import { tagColorMap } from '../constants';

function PensSidebar({ chartDefinitions, visiblePens, onTogglePen }) {
  // Safety check
  if (!chartDefinitions || !Array.isArray(chartDefinitions)) {
      return null;
  }
  
  return (
    <div className="sidebar pens-sidebar">
      <h2>Chart Pens</h2>
      {chartDefinitions.map(chart => (
        <div key={chart.title} className="pen-group">
          <h4>{chart.title}</h4>
          {Array.isArray(chart.tags) && chart.tags.map(penName => (
            <div className="pen-item" key={penName}>
              <div 
                className="pen-color-swatch" 
                style={{ backgroundColor: tagColorMap[penName] }}
              ></div>
              <input
                type="checkbox"
                id={`pen-${chart.title}-${penName}`} // Unique ID
                // Check if this pen is in the visible list for this specific chart
                checked={visiblePens[chart.title]?.includes(penName) || false}
                onChange={() => onTogglePen(chart.title, penName)}
              />
              <label htmlFor={`pen-${chart.title}-${penName}`}>{penName}</label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default PensSidebar;