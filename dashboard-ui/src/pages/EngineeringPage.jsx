import { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; // Keep useAuth for robust role check

function SetpointManager() {
    // FIX: Revert to using useOutletContext internally, as originally designed,
    // to keep it simple and avoid passing props when not strictly necessary.
    const { setpoints, setSetpoints } = useOutletContext();
    const [localSettings, setLocalSettings] = useState(setpoints); 

    // Sync local state when global setpoints load, but only if user isn't actively editing
    useEffect(() => { 
        if (setpoints) setLocalSettings(setpoints); 
    }, [setpoints]);

    if (!setpoints || Object.keys(setpoints).length === 0) return <div className="card"><h2>Loading Setpoints...</h2></div>;

    const handleInputChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key) => {
        const rawValue = localSettings[key];
        const numValue = rawValue === '' ? 0 : parseFloat(rawValue);
        
        try {
            await apiClient.put(`/api/settings/setpoint_${key}`, { key: `setpoint_${key}`, value: numValue });
            setSetpoints(prev => ({ ...prev, [key]: numValue }));
            setLocalSettings(prev => ({ ...prev, [key]: numValue }));
            alert(`Setting '${key}' saved successfully!`);
        } catch (err) { 
            alert('Failed to update setting.'); 
            console.error("Failed to save setting:", err);
        }
    };
    
    const getValue = (val) => (val === undefined || val === null) ? '' : val;

    return (
        <div className="card">
            <h2>Command Setpoints (Engineer)</h2>
            <p>Configure the value sent to the PLC for each command.</p>
            {['charge', 'discharge', 'shutdown', 'idle'].map((key) => (
                <div className="form-group-with-button" key={key}>
                    <label>{key.charAt(0).toUpperCase() + key.slice(1)} Value:</label>
                    <input 
                        type="number" 
                        value={getValue(localSettings[key])} 
                        onChange={(e) => handleInputChange(key, e.target.value)} 
                    />
                    <button onClick={() => handleSave(key)}>Save</button>
                </div>
            ))}
        </div>
    );
}

// === RESTORING THE MISSING TAG MANAGER COMPONENT ===
function TagManager() {
    const [tags, setTags] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isError, setIsError] = useState(false); 

    useEffect(() => {
        const fetchTags = async () => {
            setIsFetching(true);
            setIsError(false);
            try {
                const response = await apiClient.get('/api/tags');
                setTags(response.data);
                setIsError(false);
            } catch (err) { 
                console.error('Failed to fetch tags for TagManager:', err.response?.status, err.message); 
                setIsError(true); 
            } finally {
                setIsFetching(false);
            }
        };
        fetchTags();
    }, []);

    if (isFetching) {
        return (
            <div className="card" style={{marginTop: '2rem'}}>
                <h2>Tag Polling Configuration (Admin)</h2>
                <p>Loading configuration...</p>
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="card" style={{marginTop: '2rem', borderLeft: '5px solid #e74c3c'}}>
                <h2>Tag Polling Configuration (Admin)</h2>
                <p style={{color: '#e74c3c'}}>
                    Configuration data inaccessible. (Check console for error).
                </p>
            </div>
        );
    }

    return (
        <div className="card" style={{marginTop: '2rem'}}>
            <h2>Tag Polling Configuration (Admin)</h2>
            <table className="tag-table">
                <thead><tr><th>ID</th><th>Tag Name</th><th>Data Type</th><th>Status</th></tr></thead>
                <tbody>
                    {tags.map(tag => (
                        <tr key={tag.id}>
                            <td>{tag.id}</td><td>{tag.tag}</td><td>{tag.datatype}</td>
                            <td><button className={`status-toggle ${tag.is_active ? 'active' : 'inactive'}`} onClick={() => handleToggle(tag.id, tag.is_active)}>{tag.is_active ? 'ACTIVE' : 'INACTIVE'}</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
// === END TAG MANAGER RESTORATION ===

function EngineeringPage() {
    // We rely on useAuth() now, as the sync-login fix ensures it holds the most accurate, non-null user data.
    const { user } = useAuth(); 
    
    // Check if the primary data structure (user object) has resolved.
    if (!user) {
        // This state handles the brief moment after login but before the context has propagated.
        return (
            <div className="engineering-layout">
                <div className="card" style={{width: '100%', maxWidth: '600px'}}>
                    <h2>Authenticating Role...</h2>
                    <p>Please wait while the final permissions are verified.</p>
                </div>
            </div>
        );
    }
    
    // Robust role evaluation based on data guaranteed by the AuthContext user
    const role = user.role;
    const isEngineer = role === 'Engineer' || role === 'Admin';
    const isAdmin = role === 'Admin';

    return (
        <div className="engineering-layout">
            <div>
                {/* 1. Show SetpointManager if Engineer or Admin */}
                {isEngineer && <SetpointManager />}
                
                {/* 2. Show TagManager if Admin */}
                {isAdmin && <TagManager />}
                
                {/* 3. Access Denied if authenticated but role is neither */}
                {(!isEngineer && !isAdmin) && (
                    <div className="card">
                        <h2>Access Denied</h2>
                        <p>Your current role ({role}) does not have permission to view this page.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
export default EngineeringPage;