import { useState, useEffect } from 'react';
import apiClient from '../api';

function SensorWallPage() {
  const [liveTags, setLiveTags] = useState({});
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/api/live-data');
        setLiveTags(response.data.tags || {});
        setStatus('connected');
      } catch (error) {
        setStatus('disconnected');
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 500); 
    return () => clearInterval(intervalId);
  }, []);

  // Sort tags alphabetically
  const sortedTags = Object.entries(liveTags).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div style={{
      backgroundColor: '#0f0f0f', 
      minHeight: '100vh', 
      width: '100%',
      padding: '25px', 
      color: '#dcdcdc',
      fontFamily: 'Consolas, "Courier New", monospace',
      boxSizing: 'border-box'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '2px solid #333',
        paddingBottom: '15px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6em', color: '#41D1FF', letterSpacing: '1px' }}>
            SYSTEM TELEMETRY WALL
          </h1>
          <div style={{ color: '#666', fontSize: '0.9em', marginTop: '4px' }}>
            Monitoring {sortedTags.length} active data points
          </div>
        </div>
        
        <div style={{
          backgroundColor: status === 'connected' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
          color: status === 'connected' ? '#2ecc71' : '#e74c3c', 
          padding: '8px 15px',
          borderRadius: '4px',
          border: `1px solid ${status === 'connected' ? '#2ecc71' : '#e74c3c'}`,
          fontWeight: 'bold',
          fontSize: '0.9em'
        }}>
          {status === 'connected' ? '● PLC LINK ACTIVE' : '○ PLC LINK OFFLINE'}
        </div>
      </div>

      {/* THE TWO-COLUMN GRID */}
      <div style={{
        display: 'grid',
        // This forces exactly 2 columns and shares the width 50/50
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '8px 20px', // 8px vertical gap, 20px space between columns
      }}>
        {sortedTags.map(([tagName, value]) => {
          const isNumeric = typeof value === 'number';
          const isBool = typeof value === 'boolean';
          
          return (
            <div key={tagName} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#161616',
              padding: '8px 15px',
              borderLeft: `3px solid ${isBool ? (value ? '#2ecc71' : '#e74c3c') : '#333'}`,
              borderRadius: '2px',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
            }}>
              {/* TAG NAME */}
              <span style={{
                color: '#888',
                fontSize: '0.85em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: '500'
              }} title={tagName}>
                {tagName}
              </span>

              {/* VALUE */}
              <span style={{
                color: isBool ? (value ? '#2ecc71' : '#e74c3c') : '#41D1FF',
                fontWeight: 'bold',
                fontSize: '1.1em',
                textAlign: 'right',
                marginLeft: '15px'
              }}>
                {isNumeric ? value.toFixed(3) : String(value).toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div style={{ 
        marginTop: '30px', 
        paddingTop: '10px',
        borderTop: '1px solid #222',
        fontSize: '0.75em', 
        color: '#444', 
        textAlign: 'right' 
      }}>
        Auto-refresh: 500ms | High-Density Monitor View
      </div>
    </div>
  );
}

export default SensorWallPage;