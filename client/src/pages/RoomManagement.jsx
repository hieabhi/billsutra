import React, { useState, useEffect } from 'react';
import { roomTypesAPI, roomsAPI } from '../api';
import { Plus, Edit2, Trash2, Save, X, Hotel, Bed } from 'lucide-react';
import './Settings.css';

const RoomManagement = () => {
  const [activeTab, setActiveTab] = useState('types'); // 'types' | 'rooms'
  
  // Room Types State
  const [roomTypes, setRoomTypes] = useState([]);
  const [typeForm, setTypeForm] = useState({
    name: '',
    code: '',
    defaultRate: 0,
    maxOccupancy: 2,
    amenities: '',
    description: '',
    cgst: 2.5,
    sgst: 2.5,
    igst: 0
  });
  const [editingType, setEditingType] = useState(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  
  // Individual Rooms State
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({
    number: '',
    type: '',
    rate: 0,
    floor: ''
  });
  const [editingRoom, setEditingRoom] = useState(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoomTypes();
    fetchRooms();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await roomTypesAPI.getAll();
      setRoomTypes(response.data || []);
      if (response.data && response.data.length > 0 && !roomForm.type) {
        const firstType = response.data[0];
        setRoomForm(prev => ({ 
          ...prev, 
          type: firstType.name,
          rate: firstType.baseRate || firstType.defaultRate || 0
        }));
      }
    } catch (err) {
      setError('Failed to fetch room types');
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll();
      setRooms(response.data || []);
    } catch (err) {
      setError('Failed to fetch rooms');
    }
  };

  // Room Type Handlers
  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingType) {
        await roomTypesAPI.update(editingType._id, typeForm);
      } else {
        await roomTypesAPI.create(typeForm);
      }
      fetchRoomTypes();
      resetTypeForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save room type');
    }
  };

  const editType = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      code: type.code || '',
      defaultRate: type.baseRate || type.defaultRate,
      maxOccupancy: type.maxOccupancy || 2,
      amenities: typeof type.amenities === 'string' ? type.amenities : (Array.isArray(type.amenities) ? type.amenities.join(', ') : ''),
      description: type.description || '',
      cgst: type.cgst ?? 2.5,
      sgst: type.sgst ?? 2.5,
      igst: type.igst ?? 0
    });
    setShowTypeForm(true);
  };

  const deleteType = async (id) => {
    if (confirm('Delete this room type? This will not delete existing rooms.')) {
      try {
        await roomTypesAPI.delete(id);
        fetchRoomTypes();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete room type');
      }
    }
  };

  const resetTypeForm = () => {
    setTypeForm({
      name: '',
      code: '',
      defaultRate: 0,
      maxOccupancy: 2,
      amenities: '',
      description: '',
      cgst: 2.5,
      sgst: 2.5,
      igst: 0
    });
    setEditingType(null);
    setShowTypeForm(false);
  };

  // Room Handlers
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingRoom) {
        await roomsAPI.update(editingRoom._id, roomForm);
      } else {
        await roomsAPI.create(roomForm);
      }
      fetchRooms();
      resetRoomForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save room');
    }
  };

  const editRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      number: room.number,
      type: room.type,
      rate: room.rate,
      floor: room.floor || ''
    });
    setShowRoomForm(true);
  };

  const deleteRoom = async (id) => {
    if (confirm('Delete this room? This action cannot be undone.')) {
      try {
        await roomsAPI.delete(id);
        fetchRooms();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  const resetRoomForm = () => {
    const firstType = roomTypes.length > 0 ? roomTypes[0] : null;
    setRoomForm({
      number: '',
      type: firstType ? firstType.name : '',
      rate: firstType ? (firstType.baseRate || firstType.defaultRate || 0) : 0,
      floor: ''
    });
    setEditingRoom(null);
    setShowRoomForm(false);
  };

  return (
    <div className="dashboard">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
          Room Management
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Manage room types (categories) and individual room inventory
        </p>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('types')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'types' ? '#fff' : 'transparent',
            color: activeTab === 'types' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === 'types' ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Hotel size={18} /> Room Types
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'rooms' ? '#fff' : 'transparent',
            color: activeTab === 'rooms' ? '#4f46e5' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === 'rooms' ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Bed size={18} /> Individual Rooms ({rooms.length})
        </button>
      </div>

      {/* Room Types Tab */}
      {activeTab === 'types' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="section-title">Room Types / Categories</h2>
            <button
              onClick={() => setShowTypeForm(!showTypeForm)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {showTypeForm ? <X size={18} /> : <Plus size={18} />}
              {showTypeForm ? 'Cancel' : 'Add Room Type'}
            </button>
          </div>

          {showTypeForm && (
            <form onSubmit={handleTypeSubmit} style={{
              background: '#f9fafb',
              border: '2px solid #4f46e5',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#4f46e5', fontSize: '16px', fontWeight: 600 }}>
                {editingType ? 'Edit Room Type' : 'Create New Room Type'}
              </h3>
              
              <div className="form-grid">
                <div className="input-group">
                  <label>Type Name *</label>
                  <input
                    type="text"
                    value={typeForm.name}
                    onChange={e => setTypeForm({...typeForm, name: e.target.value})}
                    placeholder="e.g., Deluxe, Suite, Standard"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Type Code *</label>
                  <input
                    type="text"
                    value={typeForm.code}
                    onChange={e => setTypeForm({...typeForm, code: e.target.value.toUpperCase()})}
                    placeholder="e.g., DLX, STE, STD"
                    maxLength="5"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Default Rate (₹) *</label>
                  <input
                    type="number"
                    value={typeForm.defaultRate}
                    onChange={e => setTypeForm({...typeForm, defaultRate: Number(e.target.value) || 0})}
                    placeholder="2500"
                    min="0"
                    step="1"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Max Occupancy *</label>
                  <input
                    type="number"
                    value={typeForm.maxOccupancy}
                    onChange={e => setTypeForm({...typeForm, maxOccupancy: Number(e.target.value) || 2})}
                    placeholder="2"
                    min="1"
                    step="1"
                    required
                  />
                </div>

                <div className="input-group full-width">
                  <label>Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={typeForm.amenities}
                    onChange={e => setTypeForm({...typeForm, amenities: e.target.value})}
                    placeholder="AC, TV, WiFi, Mini Bar, Balcony"
                  />
                </div>

                <div className="input-group full-width">
                  <label>Description</label>
                  <textarea
                    value={typeForm.description}
                    onChange={e => setTypeForm({...typeForm, description: e.target.value})}
                    placeholder="Brief description of this room type..."
                    rows="2"
                  />
                </div>

                <div className="input-group">
                  <label>CGST %</label>
                  <input
                    type="number"
                    value={typeForm.cgst}
                    onChange={e => setTypeForm({...typeForm, cgst: parseFloat(e.target.value) || 0})}
                    placeholder="2.5"
                    step="0.1"
                  />
                </div>

                <div className="input-group">
                  <label>SGST %</label>
                  <input
                    type="number"
                    value={typeForm.sgst}
                    onChange={e => setTypeForm({...typeForm, sgst: parseFloat(e.target.value) || 0})}
                    placeholder="2.5"
                    step="0.1"
                  />
                </div>

                <div className="input-group">
                  <label>IGST %</label>
                  <input
                    type="number"
                    value={typeForm.igst}
                    onChange={e => setTypeForm({...typeForm, igst: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={18} /> {editingType ? 'Update' : 'Create'} Room Type
                </button>
                <button type="button" onClick={resetTypeForm} className="btn">
                  <X size={18} /> Cancel
                </button>
              </div>
            </form>
          )}

          {/* Room Types List */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {roomTypes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #d1d5db'
              }}>
                <Hotel size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
                  No room types created yet. Click "Add Room Type" to get started.
                </p>
              </div>
            ) : (
              roomTypes.map((type) => (
                <div
                  key={type._id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#4f46e5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                          {type.name}
                        </h3>
                        <span style={{
                          padding: '4px 12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          letterSpacing: '0.5px'
                        }}>
                          {type.code}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          background: '#dcfce7',
                          color: '#166534',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}>
                          ₹{type.baseRate || type.defaultRate}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                        <span>👥 Max {type.maxOccupancy} guests</span>
                        <span>📊 CGST: {type.cgst ?? 0}% | SGST: {type.sgst ?? 0}%</span>
                      </div>

                      {type.amenities && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                            {(typeof type.amenities === 'string' 
                              ? type.amenities.split(',') 
                              : Array.isArray(type.amenities) 
                                ? type.amenities 
                                : []
                            ).map((amenity, idx) => (
                              <span key={idx} style={{
                                padding: '4px 10px',
                                background: '#f3f4f6',
                                color: '#374151',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}>
                                {typeof amenity === 'string' ? amenity.trim() : amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {type.description && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                          {type.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => editType(type)}
                        style={{
                          padding: '8px 12px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => deleteType(type._id)}
                        style={{
                          padding: '8px 12px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Individual Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="section-title">Individual Rooms</h2>
            <button
              onClick={() => setShowRoomForm(!showRoomForm)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              disabled={roomTypes.length === 0}
            >
              {showRoomForm ? <X size={18} /> : <Plus size={18} />}
              {showRoomForm ? 'Cancel' : 'Add Room'}
            </button>
          </div>

          {roomTypes.length === 0 ? (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 12px 0', color: '#92400e' }}>
                ⚠️ Please create at least one room type before adding rooms.
              </p>
              <button
                onClick={() => setActiveTab('types')}
                className="btn btn-primary"
              >
                Go to Room Types →
              </button>
            </div>
          ) : (
            <>
              {showRoomForm && (
                <form onSubmit={handleRoomSubmit} style={{
                  background: '#f9fafb',
                  border: '2px solid #4f46e5',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#4f46e5', fontSize: '16px', fontWeight: 600 }}>
                    {editingRoom ? 'Edit Room' : 'Add New Room'}
                  </h3>
                  
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Room Number *</label>
                      <input
                        type="text"
                        value={roomForm.number}
                        onChange={e => setRoomForm({...roomForm, number: e.target.value})}
                        placeholder="101, 102, 201..."
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label>Room Type *</label>
                      <select
                        value={roomForm.type}
                        onChange={(e) => {
                          const selectedType = roomTypes.find(t => t.name === e.target.value);
                          setRoomForm({
                            ...roomForm,
                            type: e.target.value,
                            rate: selectedType?.baseRate || selectedType?.defaultRate || 0
                          });
                        }}
                        required
                        style={{
                          padding: '10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        {roomTypes.map((type) => (
                          <option key={type._id} value={type.name}>
                            {type.name} ({type.code}) - ₹{type.baseRate || type.defaultRate}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Rate (₹) *</label>
                      <input
                        type="number"
                        value={roomForm.rate}
                        onChange={e => setRoomForm({...roomForm, rate: Number(e.target.value) || 0})}
                        placeholder="Auto-filled from room type"
                        min="0"
                        step="1"
                        required
                      />
                      <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Default rate is auto-filled from room type. You can customize it for this specific room.
                      </small>
                    </div>

                    <div className="input-group">
                      <label>Floor *</label>
                      <input
                        type="text"
                        value={roomForm.floor}
                        onChange={e => setRoomForm({...roomForm, floor: e.target.value})}
                        placeholder="Ground Floor, 1, 2..."
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Save size={18} /> {editingRoom ? 'Update' : 'Add'} Room
                    </button>
                    <button type="button" onClick={resetRoomForm} className="btn">
                      <X size={18} /> Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Rooms List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {rooms.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '2px dashed #d1d5db'
                  }}>
                    <Bed size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
                      No rooms added yet. Click "Add Room" to create your first room.
                    </p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room._id}
                      style={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = '#4f46e5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <h3 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '24px', 
                          fontWeight: 700, 
                          color: '#1f2937',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Bed size={20} color="#6b7280" />
                          {room.number}
                        </h3>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>Floor: {room.floor}</div>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ 
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#374151',
                          fontWeight: 500,
                          marginBottom: '6px'
                        }}>
                          {room.type}
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: 600, 
                          color: '#059669'
                        }}>
                          ₹{room.rate}/night
                        </div>
                      </div>

                      <div style={{ 
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: room.status === 'Available' ? '#dcfce7' : room.status === 'Occupied' ? '#fee2e2' : '#fef3c7',
                        color: room.status === 'Available' ? '#166534' : room.status === 'Occupied' ? '#991b1b' : '#92400e',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '12px'
                      }}>
                        {room.status || 'Available'}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => editRoom(room)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: 500
                          }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteRoom(room._id)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: 500
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
