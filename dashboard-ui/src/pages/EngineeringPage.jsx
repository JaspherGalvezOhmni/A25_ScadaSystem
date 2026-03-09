// src/pages/EngineeringPage.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; 
import TagBrowserWidget from '../components/widgets/TagBrowserWidget';
import { tagColorMap, chartDefinitions } from '../constants';

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

    const generateInteractiveReport = async () => {
        setIsExporting(true);
        try {
            // 1. Get the latest tags
            const tagRes = await apiClient.get('/api/tags');
            const activeTags = tagRes.data.map(t => t.tag);
            
            const now = new Date();
            let start = new Date();
            if (range === '1h') start.setHours(now.getHours() - 1);
            else if (range === '24h') start.setHours(now.getHours() - 24);
            else if (range === '7d') start.setDate(now.getDate() - 7);
            else if (range === '1mo') start.setMonth(now.getMonth() - 1);
            else if (range === '1y') start.setFullYear(now.getFullYear() - 1);
            else if (range === 'All') start = new Date(2020, 0, 1);

            const params = new URLSearchParams();
            activeTags.forEach(t => params.append('tags', t));
            params.append('start_time', start.toISOString());
            params.append('end_time', now.toISOString());

            // 2. Fetch Data
            const dataRes = await apiClient.get('/api/historian', { params });
            const historyData = dataRes.data;

            // 3. Build the HTML Template
            const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>A25 Flywheel System Report - ${range}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
        <style>
            body { background: #0f0f0f; color: #dcdcdc; font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; }
            .report-header { border-bottom: 2px solid #333; margin-bottom: 40px; padding-bottom: 20px; }
            .report-header h1 { color: #41D1FF; margin: 0; font-size: 2.2em; text-transform: uppercase; letter-spacing: 2px; }
            .meta { color: #888; font-family: monospace; margin-top: 10px; line-height: 1.5; }
            .chart-grid { display: flex; flex-direction: column; gap: 40px; }
            .chart-card { 
                background: #161616; 
                border: 1px solid #333; 
                border-radius: 12px; 
                padding: 25px; 
                height: 550px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                page-break-inside: avoid;
            }
            .chart-title { 
                color: #fff; 
                margin-bottom: 20px; 
                font-size: 1.4em; 
                font-weight: bold;
                border-left: 5px solid #41D1FF; 
                padding-left: 15px; 
            }
            .canvas-wrapper { height: 450px; width: 100%; position: relative; }
            
            @media print {
                body { background: white; color: black; padding: 0; }
                .chart-card { 
                    border: 1px solid #ccc; 
                    box-shadow: none; 
                    margin-bottom: 20px; 
                    height: 500px;
                    page-break-after: always; /* Each chart gets its own page when printing */
                }
                .chart-title { color: black; border-left: 5px solid #000; }
                .report-header h1 { color: black; }
            }
        </style>
    </head>
    <body>
        <div class="report-header">
            <h1>A25 Flywheel Operational Report</h1>
            <div class="meta">
                <strong>TIMESTAMP:</strong> ${now.toLocaleString()}<br>
                <strong>DATA RANGE:</strong> ${range}<br>
                <strong>SOURCE:</strong> OHMNI A25 Historian System
            </div>
        </div>
        
        <div class="chart-grid" id="charts-root"></div>

        <script>
            // Data injected from backend
            const rawData = ${JSON.stringify(historyData)};
            const tagColors = ${JSON.stringify(tagColorMap)};
            const definitions = ${JSON.stringify(chartDefinitions)};
            
            definitions.forEach((chartDef, index) => {
                // 1. Create the container for this chart
                const container = document.createElement('div');
                container.className = 'chart-card';
                
                // 2. Add title and canvas
                container.innerHTML = \`
                    <div class="chart-title">\${chartDef.title}</div>
                    <div class="canvas-wrapper">
                        <canvas id="canvas-\${index}"></canvas>
                    </div>
                \`;
                document.getElementById('charts-root').appendChild(container);

                const ctx = document.getElementById('canvas-' + index).getContext('2d');
                
                // 3. Render the Chart.js instance
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        datasets: chartDef.tags.map(tag => ({
                            label: tag,
                            data: (rawData[tag] || []).map(p => ({ x: new Date(p.ts).getTime(), y: p.value })),
                            borderColor: tagColors[tag] || '#888',
                            backgroundColor: (tagColors[tag] || '#888') + '22',
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.1,
                            yAxisID: tag === 'A25_Speed' ? 'y1' : 'y'
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false, axis: 'x' },
                        scales: {
                            x: { 
                                type: 'time', 
                                grid: { color: 'rgba(255,255,255,0.05)' }, 
                                ticks: { color: '#888' } 
                            },
                            y: { 
                                position: 'left',
                                grid: { color: 'rgba(255,255,255,0.1)' }, 
                                ticks: { color: '#aaa' } 
                            },
                            y1: { 
                                position: 'right', 
                                display: chartDef.tags.includes('A25_Speed'), 
                                min: 0, max: 9000, 
                                grid: { drawOnChartArea: false }, 
                                ticks: { color: '#41D1FF' },
                                title: { display: true, text: 'Speed (RPM)', color: '#41D1FF' }
                            }
                        },
                        plugins: {
                            legend: { 
                                position: 'top', 
                                labels: { color: '#ccc', boxWidth: 15, usePointStyle: true } 
                            },
                            tooltip: { 
                                mode: 'index', 
                                intersect: false,
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                borderColor: "#41D1FF",
                                borderWidth: 1
                            }
                        }
                    }
                });
            });
        </script>
    </body>
    </html>`;

            // 4. Download as HTML
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `A25_Full_Report_${range}_${new Date().toISOString().split('T')[0]}.html`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Report Generation Error:", e);
            alert("Report failed. Ensure you are connected to the network.");
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
            <button
                onClick={generateInteractiveReport}
                disabled={isExporting}
                style={{ backgroundColor: '#2980b9', cursor: isExporting ? 'not-allowed' : 'pointer' }}>
                    {isExporting ? 'Generating...' : 'Generate Interactive Report'}
            </button>
        </div>
    );
}

export default EngineeringPage;