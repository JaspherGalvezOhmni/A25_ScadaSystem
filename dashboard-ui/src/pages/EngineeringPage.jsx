// REPURPOSED TO CONFIG PAGE.

import { useState, useEffect, useRef } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; // Keep useAuth for robust role check
import TagBrowserWidget from '../components/widgets/TagBrowserWidget';

// User manager
function UserManager() {
    const [users, setUsers] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [editingUser, setEditingUser] = useState(null); // Tracks which user is being edited.
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Operator' });

    const fetchUsers = async () => {
        setIsFetching(true);
        try {
            const response = await apiClient.get('/api/admin/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();

        // Clean username one last time before sending
        const cleanName = newUser.username.trim().replace(/\s/g, '');

        if (cleanName.length < 3) {
            alert("Username must be at least 3 characters.");
            return;
        }

        try {
            await apiClient.post('/api/admin/users', {
                username: cleanName,
                password: newUser.password,
                role: newUser.role,
                is_active: true // Explicitly send this to avoid 400 errors
            });
            setNewUser({ username: '', password: '', role: 'Operator' });
            fetchUsers();
            alert("User created successfully.");
        } catch (err) {
            // Show the specific error from the backend if available
            const msg = err.response?.data?.detail || "Error creating user.";
            alert(msg);
        }
    };

    const handleUpdate = async (username) => {
        try {
            await apiClient.put(`/api/admin/users/${username}`, editingUser);
            setEditingUser(null);
            fetchUsers();
            alert("User updated.");
        } catch (err) { alert("Update failed."); }
    };

    const handleDelete = async (username) => {
        if (!window.confirm(`Delete user ${username}?`)) return;
        try {
            await apiClient.delete(`/api/admin/users/${username}`);
            fetchUsers();
        } catch (err) { alert(err.response?.data?.detail || "Delete failed."); }
    };

    if (isFetching) return <div className="card"><h2>Loading User Management...</h2></div>

    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <h2>User Management (Admin)</h2>
            <p>Manage system access levels and passwords.</p>

            <table className="tag-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.username}>
                            <td>{u.username}</td>
                            <td>
                                {editingUser?.username === u.username ? (
                                    <select
                                        value={editingUser.role}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        className="status-toggle" style={{ backgroundColor: '#1e1e1e', color: 'white' }}
                                    >
                                        <option value="Operator">Operator</option>
                                        <option value="Engineer">Engineer</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                ) : u.role}
                            </td>
                            <td style={{ display: 'flex', gap: '10px' }}>
                                {editingUser?.username === u.username ? (
                                    <>
                                        <button onClick={() => handleUpdate(u.username)} style={{ backgroundColor: '#27ae60' }}>Save</button>
                                        <button onClick={() => setEditingUser(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setEditingUser({ username: u.username, role: u.role, password: '' })}>Edit</button>
                                        <button onClick={() => handleDelete(u.username)} style={{ backgroundColor: '#c0392b' }}>Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 style={{ marginTop: '2rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>Create New User</h3>
            <form onSubmit={handleCreate} className="form-group-with-button" style={{ gridTemplateColumns: '1fr 1fr 1fr 80px' }}>
                <input
                    placeholder="Username (No spaces)"
                    value={newUser.username}
                    onChange={e => {
                        // Remove spaces immediately as the user types
                        const val = e.target.value.replace(/\s/g, '');
                        setNewUser({ ...newUser, username: val });
                    }}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    required
                />
                <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ padding: '0.8rem', borderRadius: '6px', backgroundColor: '#1e1e1e', color: 'white', border: '1px solid #555' }}
                >
                    <option value="Operator">Operator</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Admin">Admin</option>
                </select>
                <button type="submit">Add</button>
            </form>
        </div>
    );
}

// === RESTORING THE MISSING TAG MANAGER COMPONENT ===
function TagManager({ onRefreshTagBrowser }) {
    const [tags, setTags] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isError, setIsError] = useState(false);

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

    useEffect(() => {
        fetchTags();
    }, []);

    // Expose refresh to parent via ref or just let parent pass a dependency/prop 
    // Wait, the parent just passes a key to force re-render, or we can use an exposed method via ref.
    // Instead of ref, let's just make the parent responsible for refreshing.

    const handleToggle = async (tagId, currentState) => {
        try {
            await apiClient.put(`/api/tags/${tagId}`, { is_active: !currentState });
            fetchTags();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTag = async (tagId) => {
        if (!window.confirm("Delete this tag? It will stop polling immediately.")) return;
        try {
            await apiClient.delete(`/api/tags/${tagId}`);
            fetchTags();
            if (onRefreshTagBrowser) onRefreshTagBrowser(); // Tell browser to update its DB list
        } catch (err) {
            console.error(err);
        }
    };

    if (isFetching && tags.length === 0) {
        return (
            <div className="card" style={{ marginTop: '2rem' }}>
                <h2>Tag Polling Configuration (Admin)</h2>
                <p>Loading configuration...</p>
            </div>
        );
    }

    if (isError && tags.length === 0) {
        return (
            <div className="card" style={{ marginTop: '2rem', borderLeft: '5px solid #e74c3c' }}>
                <h2>Tag Polling Configuration (Admin)</h2>
                <p style={{ color: '#e74c3c' }}>
                    Configuration data inaccessible. (Check console for error).
                </p>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column' }}>
            <h2>Tag Polling Configuration (Admin)</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #444', borderRadius: '6px' }}>
                <table className="tag-table compact-table" style={{ margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr><th>ID</th><th>Tag Name</th><th>Data Type</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {tags.map(tag => (
                            <tr key={tag.id}>
                                <td>{tag.id}</td><td>{tag.tag}</td><td>{tag.datatype}</td>
                                <td><button className={`status-toggle ${tag.is_active ? 'active' : 'inactive'}`} onClick={() => handleToggle(tag.id, tag.is_active)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.85em' }}>{tag.is_active ? 'ACTIVE' : 'INACTIVE'}</button></td>
                                <td><button onClick={() => handleDeleteTag(tag.id)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.85em', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Del</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
                <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
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

    // Provide a key to force re-render TagManager when a tag is added in the browser
    const [tagManagerKey, setTagManagerKey] = useState(0);
    // Provide a way to refresh TagBrowser when a tag is deleted in TagManager
    const [tagBrowserKey, setTagBrowserKey] = useState(0);

    return (
        <div className="config-layout">
            {/* 1. Show TagManager and User Manager if Admin */}
            {isAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <TagBrowserWidget
                        key={`browser-${tagBrowserKey}`}
                        onTagsUpdated={() => setTagManagerKey(k => k + 1)}
                    />
                    <TagManager
                        key={`manager-${tagManagerKey}`}
                        onRefreshTagBrowser={() => setTagBrowserKey(k => k + 1)}
                    />
                </div>
            )}
            {isAdmin && <UserManager />}

            {/* 2. Access Denied if authenticated but role is neither */}
            {(!isEngineer && !isAdmin) && (
                <div className="card">
                    <h2>Access Denied</h2>
                    <p>Your current role ({role}) does not have permission to view this page.</p>
                </div>
            )}
        </div>
    );
}
export default EngineeringPage;