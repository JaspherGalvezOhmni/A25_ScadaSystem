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
        console.error("Error fetching live data:", error);
        setStatus('disconnected');
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 250); 
    return () => clearInterval(intervalId);
  }, []);

  const sortedTags = Object.entries(liveTags).sort((a, b) => a[0].localeCompare(b[0])); 

  return (
    <div style={{
      backgroundColor: '#1a1a1a', 
      minHeight: '100vh', 
      width: '100vw', // CRITICAL FIX: Force full viewport width
      padding: '20px', 
      color: '#dcdcdc',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowX: 'hidden' // Prevent horizontal scrollbar
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '2px solid #444', 
        paddingBottom: '1rem',
        marginBottom: '1.5rem',
        width: '100%'
      }}>
        <h1 style={{margin: 0, fontSize: '2em', color: 'white'}}>All Live Tag Values</h1>
        
        <div style={{textAlign: 'right'}}>
            <div style={{
                color: status === 'connected' ? '#2ecc71' : '#e74c3c', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                marginBottom: '5px'
            }}>
                {status === 'connected' ? '● LIVE' : '○ DISCONNECTED'}
            </div>
            <div style={{fontSize: '0.9em', color: '#888'}}>
                {sortedTags.length} Data Points
            </div>
        </div>
      </div>

      {/* THE TILE GRID */}
      <div style={{
        display: 'grid',
        // 'auto-fill' will cram as many 220px blocks as possible into the width
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '15px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {sortedTags.map(([tagName, value]) => (
          <div key={tagName} style={{
            backgroundColor: '#2d2d2d',
            padding: '1.2rem',
            borderRadius: '8px',
            border: '1px solid #444',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '110px', 
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Tag Name */}
            <span style={{
              color: '#bbb', 
              fontSize: '0.85em', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              wordWrap: 'break-word',
              lineHeight: '1.2',
              maxHeight: '2.4em',
              overflow: 'hidden'
            }} title={tagName}>
              {tagName}
            </span>

            {/* Tag Value */}
            <span style={{
              color: '#41D1FF', 
              fontSize: '1.8em', 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              alignSelf: 'flex-end',
              textAlign: 'right',
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {typeof value === 'number' ? value.toFixed(2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SensorWallPage;