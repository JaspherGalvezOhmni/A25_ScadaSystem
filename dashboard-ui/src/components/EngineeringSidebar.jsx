import React, { useState, useEffect } from 'react';
import apiClient from '../api';

function EngineeringSidebar({ liveData }) {
  const tags = liveData?.tags || {};

  // Local state for smooth typing
  const [maglevInput, setMaglevInput] = useState(tags['EM_SV'] || 0);
  const [motorInput, setMotorInput] = useState(tags['A25_Speed'] || 0);

  // Sync inputs with live data only when not typing
  useEffect(() => {
    if (document.activeElement.id !== 'mag-input') setMaglevInput(tags['EM_SV'] || 0);
    if (document.activeElement.id !== 'mot-input') setMotorInput(tags['A25_Speed'] || 0);
  }, [tags]);

  const handleWrite = async (tagName, value) => {
    try {
      // Logic for bool vs float
      const finalValue = typeof value === 'boolean' ? (value ? 1 : 0) : parseFloat(value);
      await apiClient.post('/api/write-tag', { 
        tag_name: tagName, 
        value: finalValue 
      });
    } catch (error) {
      console.error("Write error", error);
    }
  };

  const toggleTag = (tagName) => {
    const currentState = tags[tagName] === true || tags[tagName] === 1;
    handleWrite(tagName, !currentState);
  };

  return (
    <div className="sidebar commands-sidebar" style={{ gap: '20px', padding: '15px' }}>
      
      {/* BOX 1: MAGLEV CONTROL */}
      <div className="eng-box">
        <div className="eng-header-row">MAGLEV CONTROL</div>
        
        <div className="eng-field-row">
          <div className="eng-label-field">TARGET SETPOINT</div>
          <input 
            id="mag-input"
            className="eng-value-input"
            type="number" 
            value={maglevInput}
            onChange={(e) => setMaglevInput(e.target.value)}
            onBlur={() => handleWrite('EM_SV', maglevInput)}
          />
        </div>

        <button 
          className={`eng-btn-full ${tags['EM_ControlEnable'] ? 'active' : 'inactive'}`}
          onClick={() => toggleTag('EM_ControlEnable')}
        >
          {tags['EM_ControlEnable'] ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>

      {/* BOX 2: MOTOR CONTROL */}
      <div className="eng-box">
        <div className="eng-header-row">MOTOR CONTROL</div>
        
        <div className="eng-field-row">
          <div className="eng-label-field">TARGET SETPOINT</div>
          <input 
            id="mot-input"
            className="eng-value-input"
            type="number" 
            value={motorInput}
            onChange={(e) => setMotorInput(e.target.value)}
            onBlur={() => handleWrite('VSD_SPEED_REF', motorInput)}
          />
        </div>

        <div className="eng-btn-grid">
          <button 
            className={`eng-btn-half ${tags['VFD_AutoReturnEnable'] ? 'active' : 'inactive'}`}
            onClick={() => toggleTag('VFD_AutoReturnEnable')}
          >
            {tags['VFD_AutoReturnEnable'] ? 'AUTO RET. ON' : 'AUTO RET. OFF'}
          </button>
          <button 
            className={`eng-btn-half ${tags['VFD_OFF1_CONTROL'] ? 'active' : 'inactive'}`}
            onClick={() => toggleTag('VFD_OFF1_CONTROL')}
          >
            START
          </button>
        </div>

        <div className="eng-btn-grid">
          <button 
            className={`eng-btn-half ${tags['VFD_RESET'] ? 'active' : 'inactive'}`}
            onClick={() => toggleTag('VFD_RESET')}
          >
            RESET FAULTS
          </button>
          <button 
            className={`eng-btn-half ${tags['VFD_OFF3_CONTROL'] ? 'active' : 'inactive'}`}
            onClick={() => toggleTag('VFD_OFF3_CONTROL')}
          >
            FORCE STOP
          </button>
        </div>
      </div>

    </div>
  );
}

export default EngineeringSidebar;