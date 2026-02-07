import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; // Import the auth hook to check token

const COMMAND_TAG_BASE = 'A25_SIM_';

// FIX 1: Change parameter name from 'value' to 'commandKey'
function CommandsSidebar({ setpoints, liveData }) {
  const { token, user } = useAuth(); // Get the current token status

  const currentSpeed = liveData?.tags?.['A25_Speed'] || 0;

  const RPM_UNLOCK_CHARGE = 4000; // Example threshold for allowing charge command
  const RPM_UNLOCK_DISCHARGE = 5000; // Example threshold for allowing discharge command
  const RPM_MAX_SPEED = 8200; // Example maximum speed for safety

  // 1. Base check: Must be logged in/ token should exist.
  const isUserAuthenticated = !!token && (user?.role === 'Engineer' || user?.role === 'Admin');

  // 2. Button specific logic.
  const canCharge = isUserAuthenticated && currentSpeed >= RPM_UNLOCK_CHARGE && currentSpeed < RPM_MAX_SPEED;
  const canDischarge = isUserAuthenticated && currentSpeed >= RPM_UNLOCK_DISCHARGE && currentSpeed < RPM_MAX_SPEED;
  const canShutdown = isUserAuthenticated;
  const canStartup = isUserAuthenticated;

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