import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; // Import the auth hook to check token

const COMMAND_TAG_BASE = 'A25_SIM_';

// FIX 1: Change parameter name from 'value' to 'commandKey'
function CommandsSidebar({ setpoints }) {
  const { token } = useAuth(); // Get the current token status

  const handleSetpointCommand = async (commandKey) => { // <-- FIXED PARAM NAME
    // SECURITY FIX: If there is no token, prevent the command from running immediately.
    if (!token) {
        alert("Action Restricted: Please log in to send control commands.");
        return;
    }
    
    // FIX 2: Construct tagName and get setpoint value based on commandKey
    const tagName = COMMAND_TAG_BASE + commandKey.charAt(0).toUpperCase() + commandKey.slice(1);
    const setpointValue = setpoints[commandKey]; // <-- Use a different variable name to avoid confusion
    
    // FIX 3: Parse the setpointValue
    const numericValue = parseFloat(setpointValue); 
    
    if (isNaN(numericValue)) {
      alert(`Setpoint value for ${commandKey} is not a valid number.`);
      return;
    }

    try {
      await apiClient.post('/api/write-tag', { 
        tag_name: tagName, // <-- Use tagName here
        value: numericValue // <-- Use numericValue here
      });
      alert(`Simulation Command sent: Set ${tagName} to ${numericValue}`);
    } catch (error) {
      console.error(`Error writing to ${tagName}:`, error);
      alert(`Failed to send command. Server may require re-login. Check WRITEABLE_TAGS list in backend.`);
    }
  };

  // The component is DISABLED if setpoints haven't loaded OR if the user is logged out
  const isDisabled = !setpoints || Object.keys(setpoints).length === 0 || !token;

  return (
    <div className="sidebar commands-sidebar">
      <h2>Commands (SIM)</h2>
      <button onClick={() => handleSetpointCommand('charge')} disabled={isDisabled}>Charge</button>
      <button onClick={() => handleSetpointCommand('discharge')} disabled={isDisabled}>Discharge</button>
      <button onClick={() => handleSetpointCommand('shutdown')} disabled={isDisabled}>Shutdown</button>
      {/* FIX: Use 'startup' key for the 'Set Idle' button command */}
      <button onClick={() => handleSetpointCommand('startup')} disabled={isDisabled}>Set Idle</button> 
    </div>
  );
}

export default CommandsSidebar;