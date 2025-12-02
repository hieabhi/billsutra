import React, { useEffect, useState } from 'react';
import { housekeepingAPI, roomsAPI } from '../api';
import { useAutoRefresh, useRefreshAfterMutation } from '../hooks/useAutoRefresh';

const Housekeeping = () => {
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [dirtyRooms, setDirtyRooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ roomId: '', roomNumber: '', type: 'CLEANING', priority: 'MEDIUM', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // ACTIVE, ALL, COMPLETED

  const refresh = async (showLoading = false) => {
    try {
      if (showLoading || isInitialLoad) setLoading(true);
      setError('');
      const [tasksRes, roomsRes, statsRes] = await Promise.all([
        housekeepingAPI.getAll({}),
        roomsAPI.getAll(),
        housekeepingAPI.getStats()
      ]);
      // Smart sorting: Priority first, then status
      const sortedTasks = tasksRes.data.sort((a, b) => {
        const aCompleted = a.status === 'COMPLETED';
        const bCompleted = b.status === 'COMPLETED';
        
        // First: Separate completed from active
        if (aCompleted !== bCompleted) {
          return aCompleted ? 1 : -1; // Completed to bottom
        }
        
        // Second: Sort by priority (HIGH > MEDIUM > LOW)
        if (!aCompleted) {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          const aPriority = priorityOrder[a.priority] || 1;
          const bPriority = priorityOrder[b.priority] || 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
        }
        
        // Third: Sort by room number
        return (a.roomNumber || '').localeCompare(b.roomNumber || '');
      });
      setTasks(sortedTasks);
      setRooms(roomsRes.data);
      setStats(statsRes.data);
      
      // Filter dirty rooms (using housekeepingStatus field)
      const dirty = roomsRes.data.filter(r => r.housekeepingStatus === 'DIRTY');
      setDirtyRooms(dirty);
      
      // AUTO-SYNC: Automatically create cleaning tasks for dirty rooms (like Opera PMS, Maestro)
      if (dirty.length > 0) {
        const dirtyRoomIds = dirty.map(r => r._id);
        const dirtyRoomsWithoutTasks = dirty.filter(room => {
          const roomTasks = tasksRes.data.filter(t => t.roomId === room._id);
          const hasActiveTask = roomTasks.some(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
          return !hasActiveTask;
        });
        
        // Silently create tasks for dirty rooms without active tasks
        if (dirtyRoomsWithoutTasks.length > 0) {
          try {
            await housekeepingAPI.syncDirtyRooms();
            // Refresh to show newly created tasks
            const updatedTasks = await housekeepingAPI.getAll({});
            const sortedUpdatedTasks = updatedTasks.data.sort((a, b) => {
              const aCompleted = a.status === 'COMPLETED';
              const bCompleted = b.status === 'COMPLETED';
              if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
              if (!aCompleted) {
                const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                const aPriority = priorityOrder[a.priority] || 1;
                const bPriority = priorityOrder[b.priority] || 1;
                if (aPriority !== bPriority) return aPriority - bPriority;
              }
              return (a.roomNumber || '').localeCompare(b.roomNumber || '');
            });
            setTasks(sortedUpdatedTasks);
          } catch (err) {
            // Silent fail - don't show error to user
            console.log('Auto-sync failed:', err);
          }
        }
      }
      
      if (isInitialLoad) setIsInitialLoad(false);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      if (showLoading || isInitialLoad) setLoading(false);
    }
  };

  // Auto-refresh every 1 second for fast background sync
  useAutoRefresh(refresh, 1000);
  
  // Helper for refreshing after mutations
  const { refreshAfterMutation } = useRefreshAfterMutation(refresh);

  const onRoomChange = (id) => {
    const room = rooms.find(x=>x._id===id);
    setForm({ ...form, roomId: id, roomNumber: room?.number||'' });
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await refreshAfterMutation(() => housekeepingAPI.create(form));
      setForm({ roomId:'', roomNumber:'', type:'CLEANING', priority:'MEDIUM', description:'' });
    } catch (err) {
      setError(err.message || 'Failed to create task');
    }
  };

  const startTask = async (id) => { 
    try {
      await refreshAfterMutation(() => housekeepingAPI.start(id));
    } catch (err) {
      setError(err.message);
    }
  };
  
  const completeTask = async (id) => { 
    try {
      await refreshAfterMutation(() => housekeepingAPI.complete(id, {}));
    } catch (err) {
      setError(err.message);
    }
  };
  
  const remove = async (id) => { 
    if (confirm('Delete task?')) { 
      try {
        await refreshAfterMutation(() => housekeepingAPI.delete(id));
      } catch (err) {
        setError(err.message);
      }
    } 
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return '#fbbf24';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      case 'VERIFIED': return '#059669';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'URGENT': return '#dc2626';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#84cc16';
      default: return '#6b7280';
    }
  };

  return (
    <div className="card">
      <h1 style={{marginBottom:24}}>Housekeeping</h1>

      {error && <div className="alert alert-error" style={{marginBottom:16}}>{error}</div>}

      {/* Stats */}
      {stats && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:16, marginBottom:24}}>
          <div style={{padding:16, background:'#f3f4f6', borderRadius:8}}>
            <div style={{fontSize:24, fontWeight:600, color:'#fbbf24'}}>{stats.pending}</div>
            <div style={{fontSize:14, color:'#6b7280'}}>Pending</div>
          </div>
          <div style={{padding:16, background:'#f3f4f6', borderRadius:8}}>
            <div style={{fontSize:24, fontWeight:600, color:'#3b82f6'}}>{stats.inProgress}</div>
            <div style={{fontSize:14, color:'#6b7280'}}>In Progress</div>
          </div>
          <div style={{padding:16, background:'#f3f4f6', borderRadius:8}}>
            <div style={{fontSize:24, fontWeight:600, color:'#10b981'}}>{stats.completed}</div>
            <div style={{fontSize:14, color:'#6b7280'}}>Completed</div>
          </div>
          <div style={{padding:16, background:'#f3f4f6', borderRadius:8}}>
            <div style={{fontSize:24, fontWeight:600, color:'#ef4444'}}>{stats.highPriority}</div>
            <div style={{fontSize:14, color:'#6b7280'}}>High Priority</div>
          </div>
        </div>
      )}

      {/* Dirty Rooms Alert */}
      {dirtyRooms.length > 0 && (
        <div className="alert" style={{background:'#fef3c7', border:'1px solid #fbbf24', marginBottom:16}}>
          <strong>⚠️ {dirtyRooms.length} Dirty Room(s):</strong> {dirtyRooms.map(r => r.number).join(', ')}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div style={{display:'flex', gap:8, marginBottom:16, borderBottom:'2px solid #e5e7eb'}}>
        <button
          type="button"
          onClick={() => setStatusFilter('ACTIVE')}
          style={{
            padding:'8px 16px',
            background: statusFilter === 'ACTIVE' ? '#3b82f6' : 'transparent',
            color: statusFilter === 'ACTIVE' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'ACTIVE' ? '2px solid #3b82f6' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'ACTIVE' ? 600 : 400,
            marginBottom:'-2px'
          }}
        >
          Active ({tasks.filter(t => t.status !== 'COMPLETED').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          style={{
            padding:'8px 16px',
            background: statusFilter === 'ALL' ? '#3b82f6' : 'transparent',
            color: statusFilter === 'ALL' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'ALL' ? '2px solid #3b82f6' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'ALL' ? 600 : 400,
            marginBottom:'-2px'
          }}
        >
          All ({tasks.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('COMPLETED')}
          style={{
            padding:'8px 16px',
            background: statusFilter === 'COMPLETED' ? '#3b82f6' : 'transparent',
            color: statusFilter === 'COMPLETED' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'COMPLETED' ? '2px solid #3b82f6' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'COMPLETED' ? 600 : 400,
            marginBottom:'-2px'
          }}
        >
          Completed ({tasks.filter(t => t.status === 'COMPLETED').length})
        </button>
      </div>

      <form onSubmit={create} className="form-grid" style={{marginBottom:24, gridTemplateColumns:'1fr 1fr 1fr 2fr auto'}}>
        <select value={form.roomId} onChange={e=>onRoomChange(e.target.value)} required>
          <option value="">Select Room</option>
          {rooms.map(r=> (
            <option key={r._id} value={r._id}>
              {r.number} {r.housekeepingStatus === 'DIRTY' && '🧹'}
            </option>
          ))}
        </select>
        <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
          <option value="CLEANING">Cleaning</option>
          <option value="INSPECTION">Inspection</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="DEEP_CLEAN">Deep Clean</option>
        </select>
        <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <input 
          placeholder="Description" 
          value={form.description} 
          onChange={e=>setForm({...form, description:e.target.value})} 
        />
        <button className="btn btn-primary" type="submit">Add Task</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Description</th>
            <th>Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr><td colSpan="7" style={{textAlign:'center', padding:32, color:'#6b7280'}}>
              No housekeeping tasks. Tasks are automatically created for dirty rooms.
            </td></tr>
          ) : (
            tasks
              .filter(t => {
                if (statusFilter === 'ACTIVE') return t.status === 'PENDING' || t.status === 'IN_PROGRESS';
                if (statusFilter === 'COMPLETED') return t.status === 'COMPLETED';
                return true; // ALL
              })
              .map(t=> {
                const isCompleted = t.status === 'COMPLETED';
                return (
              <tr key={t._id} style={{
                opacity: isCompleted ? 0.6 : 1,
                background: isCompleted ? '#f9fafb' : 'white'
              }}>
                <td><strong>{t.roomNumber}</strong></td>
                <td>{t.type}</td>
                <td>
                  <span style={{
                    padding:'4px 8px',
                    borderRadius:4,
                    fontSize:12,
                    fontWeight:600,
                    background:getPriorityColor(t.priority),
                    color:'white'
                  }}>
                    {t.priority}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding:'4px 8px',
                    borderRadius:4,
                    fontSize:12,
                    fontWeight:600,
                    background:getStatusColor(t.status),
                    color:'white'
                  }}>
                    {t.status}
                  </span>
                </td>
                <td>{t.description}</td>
                <td>{t.assignedToName || t.assignedTo || '-'}</td>
                <td style={{display:'flex', gap:8}}>
                  {t.status === 'PENDING' && (
                    <button className="btn btn-secondary" onClick={()=>startTask(t._id)}>Start</button>
                  )}
                  {t.status === 'IN_PROGRESS' && (
                    <button className="btn btn-success" onClick={()=>completeTask(t._id)}>Complete</button>
                  )}
                  <button className="btn btn-danger" onClick={()=>remove(t._id)}>×</button>
                </td>
              </tr>
                );
              })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Housekeeping;
