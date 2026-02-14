import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; // Import the auth hook to check token

const COMMAND_TAG_BASE = 'A25_SIM_';

// FIX 1: Change parameter name from 'value' to 'commandKey'
function CommandsSidebar({ setpoints, liveData }) {
  const { token, user } = useAuth(); // Get the current token status

  const currentSpeed = liveData?.tags?.['A25_Speed'] || 0; // placeholder for now just in case we want to use speed as reference in future?
  const En_Charge = liveData?.tags?.['A25_En_Charge'] || 0;
  const En_Discharge = liveData?.tags?.['A25_En_Discharge'] || 0;
  const En_Shutdown = liveData?.tags?.['A25_En_Shutdown'] || 0;
  const En_Startup = liveData?.tags?.['A25_En_Startup'] || 0;

  // 1. Base check: Must be logged in/ token should exist.
  const isUserAuthenticated = !!token && (user?.role === 'Engineer' || user?.role === 'Admin');

  // 2. Button specific logic.
  const canCharge = isUserAuthenticated && En_Charge == 1;
  const canDischarge = isUserAuthenticated && En_Discharge == 1;
  const canShutdown = isUserAuthenticated && En_Shutdown == 1;
  const canStartup = isUserAuthenticated && En_Startup == 1;

  const handleCommand = async (commandKey) => {
    if (!isUserAuthenticated) {
      alert("You must be logged in with sufficient permissions to send commands.");
      return;
    }

    const tagName = COMMAND_TAG_BASE + commandKey.charAt(0).toUpperCase() + commandKey.slice(1);
    console.log(`Attempting to send command '${commandKey}' by writing to tag '${tagName}' with value true.`);
    const valueToWrite = 1;

    try {
      // Send command as 1 (TRUE) for all actions.
      await apiClient.post('/api/write-tag', {
        tag_name: tagName,
        value: valueToWrite
      });
      alert(`Command '${commandKey}' sent successfully!`);
    } catch (error) {
      console.error(`Error writing to ${tagName}:`, error);
      alert(`Failed to send command '${commandKey}'. Please try again.`);
    }
  }

  const baseDisabled = !isUserAuthenticated;

  return (
    <div className="sidebar commands-sidebar">
      <h2>Commands (SIM)</h2>

      {/* Guest access warning */}
      {!isUserAuthenticated && (
        <p className="auth-warning">
          Please log in with an Engineer or Admin account to send commands.
        </p>
      )}

      {/* 1. Charge Button */}
      <button 
        onClick={() => handleCommand('Charge')} 
        disabled={baseDisabled || !canCharge}
      >
        Charge
      </button>
      
      {/* 2. Discharge Button */}
      <button 
        onClick={() => handleCommand('Discharge')} 
        disabled={baseDisabled || !canDischarge}
      >
        Discharge
      </button>

      {/* 3. Startup Button (Always enabled if authenticated) */}
      <button 
        onClick={() => handleCommand('Startup')} 
        disabled={baseDisabled || !canStartup}
      >
        Startup
      </button>
      
      {/* 4. Shutdown Button (Always enabled if authenticated) */}
      <button 
        onClick={() => handleCommand('Shutdown')} 
        disabled={baseDisabled || !canShutdown}
      >
        Shutdown
      </button> 
      
    </div>
  );
}

export default CommandsSidebar;