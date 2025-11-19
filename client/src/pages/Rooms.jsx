import React, { useEffect, useMemo, useState } from 'react';
import { roomsAPI, bookingsAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAutoRefresh, useRefreshAfterMutation } from '../hooks/useAutoRefresh';
import './Rooms.css';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [inhouse, setInhouse] = useState([]);
  const [view, setView] = useState('board'); // 'board' | 'table'
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // INDUSTRY STANDARD: Filters & Search (Opera PMS, Mews, Cloudbeds)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, AVAILABLE, OCCUPIED, RESERVED, DIRTY
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('number'); // number, type, status, floor
  const [groupByFloor, setGroupByFloor] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState([]); // For bulk actions

  const refresh = async (showLoading = false) => {
    if (showLoading || isInitialLoad) setLoading(true);
    try {
      setError('');
      const [roomsRes, inhouseRes] = await Promise.all([
        roomsAPI.getAll(),
        bookingsAPI.getAll({ status: 'CheckedIn' })
      ]);
      setRooms(roomsRes.data);
      setInhouse(inhouseRes.data || []);
      if (isInitialLoad) setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err.response?.data?.message || 'Failed to fetch rooms');
    } finally { 
      if (showLoading || isInitialLoad) setLoading(false); 
    }
  };

  // Auto-refresh every 1 second for fast background sync
  useAutoRefresh(refresh, 1000);
  
  // Helper for refreshing after mutations
  const { refreshAfterMutation } = useRefreshAfterMutation(refresh);

  const setStatus = async (id, status) => { 
    // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
    const previousRooms = [...rooms];
    setRooms(rooms.map(r => r._id === id ? { ...r, status } : r));
    
    try {
      await roomsAPI.setStatus(id, status);
      // Refresh after 50ms to sync with backend
      setTimeout(refresh, 50);
    } catch (err) {
      // Revert on error
      setRooms(previousRooms);
      setError(err.response?.data?.message || 'Failed to update room status');
    }
  };
  
  const remove = async (id) => { 
    if (confirm('Delete room?')) { 
      await refreshAfterMutation(() => roomsAPI.delete(id)); 
    } 
  };

  const occMap = useMemo(() => {
    const map = {};
    inhouse.forEach(b => { if (b.roomId) map[b.roomId] = b; });
    return map;
  }, [inhouse]);

  // INDUSTRY STANDARD: Extract unique room types and floors
  const roomTypes = useMemo(() => {
    const types = [...new Set(rooms.map(r => r.type))];
    return types.sort();
  }, [rooms]);

  const floors = useMemo(() => {
    const floorSet = new Set();
    rooms.forEach(r => {
      const roomNum = String(r.number);
      if (roomNum.length >= 2) {
        floorSet.add(roomNum.charAt(0)); // First digit is floor
      }
    });
    return [...floorSet].sort();
  }, [rooms]);

  // INDUSTRY STANDARD: Filter, search, and sort rooms
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = [...rooms];

    // Search by room number
    if (searchQuery.trim()) {
      filtered = filtered.filter(r => 
        String(r.number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.type || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    // Filter by floor
    if (floorFilter !== 'ALL') {
      filtered = filtered.filter(r => String(r.number || '').charAt(0) === floorFilter);
    }

    // Sort - handle null/undefined values safely
    filtered.sort((a, b) => {
      if (sortBy === 'number') {
        const aNum = String(a.number || '');
        const bNum = String(b.number || '');
        return aNum.localeCompare(bNum, undefined, { numeric: true });
      } else if (sortBy === 'type') {
        const aType = String(a.type || '');
        const bType = String(b.type || '');
        return aType.localeCompare(bType);
      } else if (sortBy === 'status') {
        const aStatus = String(a.status || '');
        const bStatus = String(b.status || '');
        return aStatus.localeCompare(bStatus);
      } else if (sortBy === 'floor') {
        const aFloor = String(a.number || '').charAt(0) || '0';
        const bFloor = String(b.number || '').charAt(0) || '0';
        return aFloor.localeCompare(bFloor);
      }
      return 0;
    });

    return filtered;
  }, [rooms, searchQuery, statusFilter, typeFilter, floorFilter, sortBy]);

  // INDUSTRY STANDARD: Group rooms by floor (Opera PMS style)
  const roomsByFloor = useMemo(() => {
    if (!groupByFloor) return { 'All Rooms': filteredAndSortedRooms };
    
    const grouped = {};
    filteredAndSortedRooms.forEach(room => {
      const roomNum = String(room.number);
      const floor = roomNum.length >= 2 ? roomNum.charAt(0) : '0';
      const floorName = `Floor ${floor}`;
      if (!grouped[floorName]) grouped[floorName] = [];
      grouped[floorName].push(room);
    });
    return grouped;
  }, [filteredAndSortedRooms, groupByFloor]);

  // INDUSTRY STANDARD: Status summary for quick overview
  const statusSummary = useMemo(() => {
    const summary = {
      AVAILABLE: rooms.filter(r => r.status === 'AVAILABLE').length,
      OCCUPIED: rooms.filter(r => r.status === 'OCCUPIED').length,
      RESERVED: rooms.filter(r => r.status === 'RESERVED').length,
      DIRTY: rooms.filter(r => r.housekeepingStatus === 'DIRTY').length,
    };
    return summary;
  }, [rooms]);

  // Bulk actions
  const toggleRoomSelection = (roomId) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedRooms(filteredAndSortedRooms.map(r => r._id));
  };

  const clearSelection = () => {
    setSelectedRooms([]);
  };

  const bulkSetStatus = async (status) => {
    if (selectedRooms.length === 0) {
      alert('No rooms selected');
      return;
    }
    if (!confirm(`Set ${selectedRooms.length} room(s) to ${status}?`)) return;
    
    try {
      await Promise.all(selectedRooms.map(id => roomsAPI.setStatus(id, status)));
      clearSelection();
      refresh();
    } catch (err) {
      setError('Failed to update rooms');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: '1 1 auto' }}>
          <h1 style={{ margin: '0 0 4px 0' }}>🏨 Rooms ({filteredAndSortedRooms.length}/{rooms.length})</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-block', minWidth: '80px' }}>{statusSummary.AVAILABLE} Available</span> ·
            <span style={{ display: 'inline-block', minWidth: '80px' }}>{statusSummary.OCCUPIED} Occupied</span> ·
            <span style={{ display: 'inline-block', minWidth: '80px' }}>{statusSummary.RESERVED} Reserved</span> ·
            <span style={{ display: 'inline-block', minWidth: '60px' }}>{statusSummary.DIRTY} Dirty</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexShrink: 0 }}>
          <button 
            onClick={() => navigate('/room-management')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '8px 16px', height: '38px' }}
          >
            ⚙️ Manage
          </button>
          <div className="view-toggle" style={{ display: 'flex', gap: '4px' }}>
            <button className={`btn ${view==='board'?'btn-primary':''}`} onClick={()=>setView('board')} style={{ padding: '8px 16px', height: '38px', display: 'flex', alignItems: 'center' }}>Board</button>
            <button className={`btn ${view==='table'?'btn-primary':''}`} onClick={()=>setView('table')} style={{ padding: '8px 16px', height: '38px', display: 'flex', alignItems: 'center' }}>Table</button>
          </div>
        </div>
      </div>

      {/* INDUSTRY STANDARD: Search & Filters (Opera PMS, Mews, Cloudbeds) */}
      <div style={{ 
        display: 'flex',
        gap: '12px', 
        marginBottom: '16px',
        padding: '16px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input 
          type="text"
          placeholder="🔍 Search room number or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px',
            fontSize: '14px',
            flex: '1 1 200px',
            minWidth: '200px'
          }}
        />
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', flex: '0 1 auto' }}
        >
          <option value="ALL">All Status ({rooms.length})</option>
          <option value="AVAILABLE">Available ({statusSummary.AVAILABLE})</option>
          <option value="OCCUPIED">Occupied ({statusSummary.OCCUPIED})</option>
          <option value="RESERVED">Reserved ({statusSummary.RESERVED})</option>
        </select>

        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', flex: '0 1 auto' }}
        >
          <option value="ALL">All Types</option>
          {roomTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select 
          value={floorFilter} 
          onChange={(e) => setFloorFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', flex: '0 1 auto' }}
        >
          <option value="ALL">All Floors</option>
          {floors.map(floor => (
            <option key={floor} value={floor}>Floor {floor}</option>
          ))}
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', flex: '0 1 auto' }}
        >
          <option value="number">Sort by Number</option>
          <option value="type">Sort by Type</option>
          <option value="status">Sort by Status</option>
          <option value="floor">Sort by Floor</option>
        </select>

        {view === 'board' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '0 1 auto', whiteSpace: 'nowrap' }}>
            <input 
              type="checkbox" 
              checked={groupByFloor} 
              onChange={(e) => setGroupByFloor(e.target.checked)}
            />
            <span style={{ fontSize: '14px' }}>Group by Floor</span>
          </label>
        )}
      </div>

      {/* INDUSTRY STANDARD: Bulk Actions */}
      {selectedRooms.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong style={{ color: '#1e40af' }}>{selectedRooms.length} room(s) selected</strong>
            <button 
              onClick={clearSelection}
              style={{ 
                marginLeft: '12px', 
                padding: '4px 8px', 
                background: 'transparent',
                border: '1px solid #3b82f6',
                borderRadius: '4px',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => bulkSetStatus('AVAILABLE')} className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>Set Available</button>
            <button onClick={() => bulkSetStatus('DIRTY')} className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>Set Dirty</button>
            <button onClick={selectAllFiltered} className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>Select All ({filteredAndSortedRooms.length})</button>
          </div>
        </div>
      )}

      {error && <div style={{ padding: '10px', background: '#fee', color: '#c00', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}
      
      {rooms.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '2px dashed #d1d5db'
        }}>
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '12px' }}>
            🏨 No rooms available
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
            Add rooms from Settings to get started
          </p>
          <button 
            onClick={() => navigate('/settings')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Go to Settings →
          </button>
        </div>
      )}

      {loading ? <div>Loading...</div> : view==='board' ? (
        <>
          {Object.entries(roomsByFloor).map(([floorName, floorRooms]) => (
            <div key={floorName} style={{ marginBottom: '32px' }}>
              {groupByFloor && (
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  {floorName} ({floorRooms.length} rooms)
                </h3>
              )}
              <div className="rooms-board">
                {floorRooms.map(r=>{
            const occ = occMap[r._id];
            const housekeepingBadge = r.housekeepingStatus || 'CLEAN';
            const housekeepingColor = {
              'DIRTY': '#fbbf24',
              'IN_PROGRESS': '#3b82f6',
              'CLEAN': '#06b6d4',
              'INSPECTED': '#10b981',
              'PICKUP': '#a78bfa',
              'MAINTENANCE': '#f59e0b'
            }[housekeepingBadge] || '#6b7280';
            
            const isSelected = selectedRooms.includes(r._id);
            
            return (
              <div 
                key={r._id} 
                className={`room-tile status-${(r.status||'').toLowerCase()}`} 
                onClick={()=>navigate(`/rooms/${r._id}`)}
                style={{
                  position: 'relative',
                  border: isSelected ? '3px solid #3b82f6' : undefined,
                  boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : undefined
                }}
              >
                <div className="room-header">
                  <div className="room-number">{r.number}</div>
                  <div className="room-status">{r.status}</div>
                </div>
                {/* DUAL STATUS - Industry Standard */}
                <div style={{
                  display: 'flex', 
                  gap: '4px', 
                  marginTop: '8px', 
                  flexWrap: 'wrap',
                  paddingLeft: '12px',
                  paddingRight: '12px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: housekeepingColor + '20',
                    color: housekeepingColor,
                    fontWeight: '600',
                    border: `1px solid ${housekeepingColor}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    🧹 {housekeepingBadge}
                  </span>
                </div>
                <div className="room-body">
                  <div className="room-type">{r.type}</div>
                  <div className="room-rate">₹ {r.rate || 0}</div>
                  {occ && (
                    <div className="room-guest">
                      <div className="guest-name">{occ.guest?.name}</div>
                      <div className="guest-dates">{occ.checkInDate?.slice(0,10)} → {occ.checkOutDate?.slice(0,10)} ({occ.nights}n)</div>
                      {occ.folio?.balance > 0 && <div className="guest-due">Due ₹ {occ.folio.balance}</div>}
                    </div>
                  )}
                </div>
                <div className="room-actions">
                  <button className="btn-sm" onClick={(e)=>{ e.stopPropagation(); setStatus(r._id, 'Available'); }}>Available</button>
                  <button className="btn-sm" onClick={(e)=>{ e.stopPropagation(); setStatus(r._id, 'Occupied'); }}>Occupied</button>
                  <button className="btn-sm" onClick={(e)=>{ e.stopPropagation(); setStatus(r._id, 'Dirty'); }}>Dirty</button>
                  <button className="btn-sm danger" onClick={(e)=>{ e.stopPropagation(); remove(r._id); }}>Delete</button>
                </div>
              </div>
            );
          })}
              </div>
            </div>
          ))}
        </>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Type</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Housekeeping</th>
              <th>Guest</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRooms.map(r=> {
              const occ = occMap[r._id];
              const isSelected = selectedRooms.includes(r._id);
              
              return (
                <tr 
                  key={r._id} 
                  onClick={()=>navigate(`/rooms/${r._id}`)} 
                  style={{ cursor:'pointer' }}
                >
                  <td><strong>{r.number}</strong></td>
                  <td>{r.type}</td>
                  <td>₹ {r.rate || 0}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: r.status === 'AVAILABLE' ? '#dcfce7' : r.status === 'OCCUPIED' ? '#fee2e2' : r.status === 'RESERVED' ? '#fef3c7' : '#f3f4f6',
                      color: r.status === 'AVAILABLE' ? '#166534' : r.status === 'OCCUPIED' ? '#991b1b' : r.status === 'RESERVED' ? '#92400e' : '#374151'
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: r.housekeepingStatus === 'DIRTY' ? '#fef3c7' : '#dcfce7',
                      color: r.housekeepingStatus === 'DIRTY' ? '#92400e' : '#166534'
                    }}>
                      {r.housekeepingStatus || 'CLEAN'}
                    </span>
                  </td>
                  <td>
                    {occ ? (
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ fontWeight: '500' }}>{occ.guest?.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>
                          {occ.checkInDate?.slice(0,10)} → {occ.checkOutDate?.slice(0,10)}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{display:'flex', gap:8}}>
                    <button className="btn btn-secondary" onClick={()=>setStatus(r._id, 'AVAILABLE')} style={{ fontSize: '12px', padding: '4px 8px' }}>Available</button>
                    <button className="btn btn-secondary" onClick={()=>setStatus(r._id, 'DIRTY')} style={{ fontSize: '12px', padding: '4px 8px' }}>Dirty</button>
                    <button className="btn btn-danger" onClick={()=>remove(r._id)} style={{ fontSize: '12px', padding: '4px 8px' }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Rooms;
