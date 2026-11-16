import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const API_BASE = `${API_BASE_URL}/api/geofences`;

const GeofenceHistory = () => {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, CREATED, DELETED, RESTORED
    const [searchTerm, setSearchTerm] = useState('');
    const [restoringId, setRestoringId] = useState(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/history`);
            setHistoryList(res.data);
        } catch (err) {
            console.error("Failed to fetch geofence history:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleRestore = async (historyId, name) => {
        if (!window.confirm(`Kya aap "${name}" ko wapas active geofences mein restore karna chahte hain?`)) {
            return;
        }
        setRestoringId(historyId);
        try {
            await axios.post(`${API_BASE}/restore/${historyId}`);
            alert(`✅ "${name}" successfully restore ho gaya hai aur Traccar par live hai!`);
            fetchHistory();
        } catch (err) {
            alert("❌ Restore karne mein error aaya.");
        } finally {
            setRestoringId(null);
        }
    };

    // Filter & Search Logic
    const filteredData = historyList.filter(item => {
        const matchesFilter = filter === 'ALL' || item.action_type === filter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getBadgeStyle = (type) => {
        switch (type) {
            case 'CREATED':
                return { bg: '#e0f2fe', color: '#0284c7', label: 'CREATED' };
            case 'DELETED':
                return { bg: '#fee2e2', color: '#dc2626', label: 'DELETED' };
            case 'RESTORED':
                return { bg: '#dcfce7', color: '#16a34a', label: 'RESTORED' };
            default:
                return { bg: '#f3f4f6', color: '#374151', label: type };
        }
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>Geofence Audit & History</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                        Track created perimeters and restore previously deleted geofences
                    </p>
                </div>
                <button
                    onClick={fetchHistory}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    ↻ Refresh Logs
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fff',
                padding: '14px 18px',
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['ALL', 'CREATED', 'DELETED', 'RESTORED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                backgroundColor: filter === tab ? '#2563eb' : '#f1f5f9',
                                color: filter === tab ? '#fff' : '#475569'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    placeholder="Search geofence name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        width: '260px',
                        fontSize: '14px'
                    }}
                />
            </div>

            {/* Table Card */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading history logs...</div>
                ) : filteredData.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No geofence history records found.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
                                <th style={{ padding: '14px 18px' }}>GEOFENCE NAME</th>
                                <th style={{ padding: '14px 18px' }}>STATUS / ACTION</th>
                                <th style={{ padding: '14px 18px' }}>DATE & TIME</th>
                                <th style={{ padding: '14px 18px' }}>COORDINATES (WKT)</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>RECOVERY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row) => {
                                const badge = getBadgeStyle(row.action_type);
                                return (
                                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                                        <td style={{ padding: '14px 18px', fontWeight: '600', color: '#1e293b' }}>
                                            {row.name}
                                        </td>
                                        <td style={{ padding: '14px 18px' }}>
                                            <span style={{
                                                backgroundColor: badge.bg,
                                                color: badge.color,
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '700'
                                            }}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                                            {new Date(row.performed_at).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </td>
                                        <td style={{ padding: '14px 18px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {row.area}
                                        </td>
                                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                            {row.action_type === 'DELETED' ? (
                                                <button
                                                    onClick={() => handleRestore(row.id, row.name)}
                                                    disabled={restoringId === row.id}
                                                    style={{
                                                        padding: '6px 14px',
                                                        backgroundColor: '#16a34a',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    {restoringId === row.id ? 'Restoring...' : '♻️ Restore'}
                                                </button>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default GeofenceHistory;