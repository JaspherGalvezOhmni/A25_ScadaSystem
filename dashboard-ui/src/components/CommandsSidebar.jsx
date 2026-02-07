import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; // Import the auth hook to check token

const SETPOINT_TAG = 'Test_OutputVal1';

function CommandsSidebar({ setpoints }) {
  const { token } = useAuth(); // Get the current token status

  const handleSetpointCommand = async (value) => {
    // SECURITY FIX: If there is no token, prevent the command from running immediately.
    if (!token) {
        alert("Action Restricted: Please log in to send control commands.");
        return;
    }
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      alert("Setpoint value is not a valid number.");
      return;
    }
    
    try {
      await apiClient.post('/api/write-tag', { 
        tag_name: SETPOINT_TAG, 
        value: numericValue 
      });
      alert(`Command sent: Set ${SETPOINT_TAG} to ${numericValue}`);
    } catch (error) {
      console.error(`Error writing to ${SETPOINT_TAG}:`, error);
      alert(`Failed to send command. Server may require re-login.`);
    }
  };

  // The component is DISABLED if setpoints haven't loaded OR if the user is logged out
  const isDisabled = !setpoints || Object.keys(setpoints).length === 0 || !token;

  return (
    <div className="sidebar commands-sidebar">
      <h2>Commands</h2>
      <button onClick={() => handleSetpointCommand(setpoints.charge)} disabled={isDisabled}>Charge</button>
      <button onClick={() => handleSetpointCommand(setpoints.discharge)} disabled={isDisabled}>Discharge</button>
      <button onClick={() => handleSetpointCommand(setpoints.shutdown)} disabled={isDisabled}>Shutdown</button>
      <button onClick={() => handleSetpointCommand(setpoints.idle)} disabled={isDisabled}>Set Idle</button>
    </div>
  );
}

export default CommandsSidebar;