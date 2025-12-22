import { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import apiClient from '../api';

function SetpointManager() {
    const { setpoints, setSetpoints } = useOutletContext();
    const [localSettings, setLocalSettings] = useState(setpoints); 

    // Sync local state when global setpoints load, but only if user isn't actively editing
    // (Simplification: just sync when setpoints change externally or on load)
    useEffect(() => { 
        if (setpoints) setLocalSettings(setpoints); 
    }, [setpoints]);

    if (!setpoints || Object.keys(setpoints).length === 0) return <div className="card"><h2>Loading Setpoints...</h2></div>;

    const handleInputChange = (key, value) => {
        // Allow empty string for typing, otherwise store raw value
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key) => {
        const rawValue = localSettings[key];
        const numValue = rawValue === '' ? 0 : parseFloat(rawValue); // Default to 0 if empty on save
        
        try {
            await apiClient.put(`/api/settings/setpoint_${key}`, { key: `setpoint_${key}`, value: numValue });
            setSetpoints(prev => ({ ...prev, [key]: numValue }));
            // Update local settings to the sanitized number
            setLocalSettings(prev => ({ ...prev, [key]: numValue }));
            alert(`Setting '${key}' saved successfully!`);
        } catch (err) { 
            alert('Failed to update setting.'); 
            console.error("Failed to save setting:", err);
        }
    };
    
    // Helper to safely render input value
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

function TagManager() {
    const [tags, setTags] = useState([]);
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await apiClient.get('/api/tags');
                setTags(response.data);
            } catch (err) { console.error('Failed to fetch tags:', err); }
        };
        fetchTags();
    }, []);

    const handleToggle = async (tagId, currentStatus) => {
        try {
            await apiClient.put(`/api/tags/${tagId}`, { is_active: !currentStatus });
            setTags(prevTags => prevTags.map(tag => tag.id === tagId ? { ...tag, is_active: !currentStatus } : tag));
        } catch (err) { alert('Failed to update tag.'); }
    };

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

function EngineeringPage() {
    const { user } = useOutletContext();
    return (
        <div className="engineering-layout">
            <div>
                <SetpointManager />
                {user?.role === 'Admin' && <TagManager />}
            </div>
        </div>
    );
}
export default EngineeringPage;