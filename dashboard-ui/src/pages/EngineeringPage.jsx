// src/pages/EngineeringPage.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; 
import TagBrowserWidget from '../components/widgets/TagBrowserWidget';

// ==========================================
// 1. User Manager (Admin Only)
// ==========================================
function UserManager() {
    const [users, setUsers] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [editingUser, setEditingUser] = useState(null); // Tracking username being edited
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Operator' });

    const fetchUsers = async () => {
        setIsFetching(true);
        try {
            const response = await apiClient.get('/api/admin/users');
            setUsers(response.data);
        } catch (err) { console.error(err); } finally { setIsFetching(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleUpdate = async (username) => {
        try {
            await apiClient.put(`/api/admin/users/${username}`, editingUser);
            setEditingUser(null);
            fetchUsers();
        } catch (err) { alert("Update failed"); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/admin/users', { ...newUser, is_active: true });
            setNewUser({ username: '', password: '', role: 'Operator' });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.detail || "Error"); }
    };

    if (isFetching) return <div className="card">Loading Users...</div>;

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>Account Management</h2>
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                <table className="tag-table compact-table">
                    <thead><tr><th>User</th><th>Role</th><th>Action</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.username}>
                                <td>{u.username}</td>
                                <td>
                                    {editingUser?.username === u.username ? (
                                        <select 
                                            value={editingUser.role} 
                                            onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                                            style={{backgroundColor: '#1e1e1e', color: 'white', border: '1px solid #555'}}
                                        >
                                            <option value="Operator">Operator</option>
                                            <option value="Engineer">Engineer</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    ) : u.role}
                                </td>
                                <td>
                                    <div style={{display: 'flex', gap: '5px'}}>
                                        {editingUser?.username === u.username ? (
                                            <button onClick={() => handleUpdate(u.username)} style={{ backgroundColor: '#27ae60', padding: '2px 8px' }}>Save</button>
                                        ) : (
                                            <button onClick={() => setEditingUser({username: u.username, role: u.role})} style={{ backgroundColor: '#3498db', padding: '2px 8px' }}>Edit</button>
                                        )}
                                        <button onClick={async () => {
                                            if(window.confirm(`Delete ${u.username}?`)) {
                                                await apiClient.delete(`/api/admin/users/${u.username}`);
                                                fetchUsers();
                                            }
                                        }} style={{ backgroundColor: '#c0392b', padding: '2px 8px' }}>Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #444', paddingTop: '1rem' }}>
                <input placeholder="New Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value.replace(/\s/g, '') })} required style={{ padding: '8px' }} />
                <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required style={{ padding: '8px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ flexGrow: 1, padding: '8px' }}>
                        <option value="Operator">Operator</option><option value="Engineer">Engineer</option><option value="Admin">Admin</option>
                    </select>
                    <button type="submit" style={{ backgroundColor: '#27ae60' }}>Create</button>
                </div>
            </form>
        </div>
    );
}

// ==========================================
// 2. Tag Manager (Admin Only)
// ==========================================
function TagManager({ onRefreshTagBrowser }) {
    const [tags, setTags] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const fetchTags = async () => {
        setIsFetching(true);
        try {
            const response = await apiClient.get('/api/tags');
            setTags(response.data);
        } catch (err) { console.error(err); } finally { setIsFetching(false); }
    };

    useEffect(() => { fetchTags(); }, []);

    if (isFetching && tags.length === 0) return <div className="card">Loading Tags...</div>;

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem', flexShrink: 0 }}>Active Tag Polling List</h2>
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                <table className="tag-table compact-table">
                    <thead><tr><th>Tag</th><th>Status</th><th>Delete?</th></tr></thead>
                    <tbody>
                        {tags.map(tag => (
                            <tr key={tag.id}>
                                <td style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>{tag.tag}</td>
                                <td>
                                    <button 
                                        className={`status-toggle ${tag.is_active ? 'active' : 'inactive'}`}
                                        onClick={async () => {
                                            await apiClient.put(`/api/tags/${tag.id}`, { is_active: !tag.is_active });
                                            fetchTags();
                                        }}
                                        style={{ fontSize: '0.7em', padding: '2px 5px' }}
                                    >
                                        {tag.is_active ? 'ON' : 'OFF'}
                                    </button>
                                </td>
                                <td>
                                    <button onClick={async () => {
                                        if(window.confirm("Delete tag? This will delete all data associated with this tag! If you only wish to pause polling, click status")) {
                                            await apiClient.delete(`/api/tags/${tag.id}`);
                                            fetchTags();
                                            onRefreshTagBrowser();
                                        }
                                    }} style={{ backgroundColor: '#c0392b', padding: '2px 8px' }}>X</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
// 3. Main Engineering Page Component
// ==========================================
function EngineeringPage() {
    const { user } = useAuth();
    const [tagBrowserKey, setTagBrowserKey] = useState(0);
    const [tagManagerKey, setTagManagerKey] = useState(0);

    if (!user) return <div className="engineering-layout"><div className="card"><h2>Authenticating...</h2></div></div>;

    const isAdmin = user.role === 'Admin';

    return (
        <div style={{ padding: '30px', height: 'calc(100vh - 66px)', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div style={{ maxWidth: '1750px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                    display: 'grid', 
                    // Standardizing column widths and ensuring they don't overlap
                    gridTemplateColumns: isAdmin ? 'repeat(3, 1fr)' : '1fr',
                    gap: '25px',
                    flexGrow: 1,
                    minHeight: 0 // Crucial for internal scrolling
                }}>
                    
                    {/* COLUMN 1: TAG BROWSER */}
                    {isAdmin && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            {/* Pass a style prop to override the internal card margin */}
                            <TagBrowserWidget 
                                key={`browser-${tagBrowserKey}`} 
                                onTagsUpdated={() => setTagManagerKey(k => k + 1)}
                                style={{ margin: 0, height: '100%' }} 
                            />
                        </div>
                    )}

                    {/* COLUMN 2: ACTIVE TAGS */}
                    {isAdmin && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <TagManager 
                                key={`manager-${tagManagerKey}`} 
                                onRefreshTagBrowser={() => setTagBrowserKey(k => k + 1)} 
                            />
                        </div>
                    )}

                    {/* COLUMN 3: TOOLS & USERS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '5px' }}>
                        <div className="card"><h2 style={{ marginBottom: '15px' }}>Data Exports</h2><ExportControls /></div>
                        <div className="card">
                            <h2 style={{ marginBottom: '15px' }}>Personalisation (Layout and Pens)</h2>
                            <button onClick={async () => {
                                if(window.confirm("Reset layout?")) { await apiClient.delete('/api/user/prefs/reset'); window.location.reload(); }
                            }} style={{ width: '100%', backgroundColor: '#34495e' }}>Reset Dashboards Preferences</button>
                        </div>
                        {isAdmin && <UserManager />}
                        {isAdmin && (
                            <div className="card" style={{ border: '1px solid #c0392b' }}>
                                <h2 style={{ color: '#e74c3c' }}>RESET TAG LIST</h2>
                                <p>WARNING! Tags are CASCADED and this action will PURGE all historical data for ALL TAGS.</p>
                                <button onClick={async () => {
                                    if (window.prompt("Type 'PURGE' to proceed:") === 'PURGE') {
                                        await apiClient.delete('/api/admin/maintenance/reset-tags');
                                        window.location.reload();
                                    }
                                }} style={{ width: '100%', backgroundColor: '#c0392b', marginTop: '10px' }}>Purge Database</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExportControls() {
    const [range, setRange] = useState('1h');
    const [isExporting, setIsExporting] = useState(false);

    const downloadCSV = async () => {
        setIsExporting(true);
        try {
            // 1. Get currently active tags
            const tagRes = await apiClient.get('/api/tags');
            const activeTags = tagRes.data.map(t => t.tag);
            
            // 2. Calculate Start/End time based on selection
            const now = new Date();
            let start = new Date();
            if (range === '1h') start.setHours(now.getHours() - 1);
            else if (range === '24h') start.setHours(now.getHours() - 24);
            else if (range === '7d') start.setDate(now.getDate() - 7);
            else if (range === '1mo') start.setMonth(now.getMonth() - 1);
            else if (range === '1y') start.setFullYear(now.getFullYear() - 1);
            else if (range === 'All') start = new Date(2000, 0, 1); // Way back

            const params = new URLSearchParams();
            activeTags.forEach(t => params.append('tags', t));
            params.append('start_time', start.toISOString());
            params.append('end_time', now.toISOString());

            // 3. Fetch data from backend
            // NOTE: The backend will automatically aggregate this data for us 
            // because of your tiered logic in get_historian!
            const dataRes = await apiClient.get('/api/historian', { params });
            const data = dataRes.data;

            // 4. Transform to CSV
            let csv = "Timestamp,Tag,Value\n";
            Object.keys(data).forEach(tag => {
                data[tag].forEach(p => {
                    csv += `${p.ts},${tag},${p.value}\n`;
                });
            });

            // 5. Trigger Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `A25_Data_Export_${range}_${new Date().getTime()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export Error:", e);
            alert("Export failed. Range might be too large for browser memory.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9em', color: '#aaa' }}>Export Range</span>
                <select value={range} onChange={e => setRange(e.target.value)} style={{ padding: '5px' }}>
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="1mo">Last Month</option>
                    <option value="1y">Last Year</option>
                    <option value="All">All Time</option>
                </select>
            </div>
            <button 
                onClick={downloadCSV} 
                disabled={isExporting}
                style={{ backgroundColor: '#27ae60', cursor: isExporting ? 'not-allowed' : 'pointer' }}
            >
                {isExporting ? 'Processing...' : 'Download CSV'}
            </button>
            <button style={{ backgroundColor: '#2980b9' }}>Generate Report PDF</button>
        </div>
    );
}

export default EngineeringPage;