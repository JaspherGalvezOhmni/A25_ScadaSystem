import React, { useState, useEffect } from 'react';
import apiClient from '../../api';

// Recursive component to display tree nodes
const TagTree = ({ node, path = '', onTagSelect, dbTagNames }) => {
    const folders = Object.keys(node).filter(k => k !== '__tags__');
    const tags = node.__tags__ || [];

    return (
        <ul className="tag-tree-ul">
            {/* Render Folders/Structures */}
            {folders.map(folderName => (
                <li key={folderName} className="tag-folder">
                    <details open>
                        <summary className="folder-name">{folderName}</summary>
                        <TagTree
                            node={node[folderName]}
                            path={`${path}/${folderName}`}
                            onTagSelect={onTagSelect}
                            dbTagNames={dbTagNames}
                        />
                    </details>
                </li>
            ))}

            {/* Render Tags (Leaf Nodes) */}
            {tags.map(tag => {
                const isInDb = dbTagNames.has(tag.name);
                return (
                    <li
                        key={tag.name}
                        className={`tag-item ${isInDb ? 'tag-in-db' : ''}`}
                        onClick={() => onTagSelect(tag, isInDb)}
                    >
                        <span className="tag-name-display">{tag.tag_name_only} <span className="tag-datatype">({tag.datatype})</span></span>
                        {!isInDb && <button className="add-tag-btn">+</button>}
                    </li>
                );
            })}
        </ul>
    );
};


function TagBrowserWidget({ onTagsUpdated }) {
    const [plcTree, setPlcTree] = useState(null);
    const [dbTagNames, setDbTagNames] = useState(new Set()); // Tags actively polled by DB
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch both PLC tags and the current list of tags in the DB lookup table
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch PLC structure (Admin endpoint used by Engineer/Admin roles)
            const plcResponse = await apiClient.get('/api/plc-browse');
            setPlcTree(plcResponse.data);

            // 2. Fetch current DB tags (to show which tags are ready for history/live display)
            const dbResponse = await apiClient.get('/api/tags');
            const dbTags = new Set(dbResponse.data.map(t => t.tag));
            setDbTagNames(dbTags);

        } catch (e) {
            console.error("Tag Browser failed:", e);
            setError("Failed to fetch tags. Ensure PLC and DB are reachable, and you are logged in as Admin/Engineer.");
        } finally {
            setIsLoading(false);
        }
    };

    // We expose a method to let the parent trigger a refresh if a tag is deleted
    useEffect(() => {
        fetchData();
    }, []);

    const handleTagSelect = async (tag, isInDb) => {
        if (isInDb) return; // Already there

        try {
            await apiClient.post('/api/tags', { tag: tag.name, datatype: tag.datatype });
            // Refresh local state and inform parent
            const dbResponse = await apiClient.get('/api/tags');
            const dbTags = new Set(dbResponse.data.map(t => t.tag));
            setDbTagNames(dbTags);
            if (onTagsUpdated) onTagsUpdated();

        } catch (e) {
            alert(e.response?.data?.detail || "Failed to add tag");
        }
    };

    return (
        <div className="card tag-browser-widget" style={{ display: 'flex', flexDirection: 'column', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>PLC Tag Browser</h2>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    style={{ padding: '0.4rem 0.8rem', backgroundColor: '#3a3a3a' }}
                >
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="tag-browser-content" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '400px', border: '1px solid #444', borderRadius: '6px', padding: '1rem', backgroundColor: '#1e1e1e' }}>
                {isLoading && !error && <div className="loading-message">Loading PLC Structure...</div>}

                {plcTree && Object.keys(plcTree).length > 0 && (
                    <TagTree node={plcTree} onTagSelect={handleTagSelect} dbTagNames={dbTagNames} />
                )}

                {(!plcTree || Object.keys(plcTree).length === 0) && !isLoading && !error && (
                    <div style={{ color: '#888', fontStyle: 'italic' }}>No tags found or PLC offline.</div>
                )}
            </div>
        </div>
    );
}

export default TagBrowserWidget;
