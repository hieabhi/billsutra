import React, { useState, useEffect } from 'react';
import { settingsAPI, roomTypesAPI, roomsAPI } from '../api';
import { Save, Plus, Trash2, Edit2, X } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [formData, setFormData] = useState({
    hotelName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    invoicePrefix: 'INV',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: ''
    },
    terms: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Room Configuration State
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomTypeForm, setRoomTypeForm] = useState({
    name: '',
    code: '',
    defaultRate: 0,
    maxOccupancy: 2,
    amenities: '',
    description: ''
  });
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
  
  const [roomForm, setRoomForm] = useState({
    number: '',
    type: '',
    rate: 0,
    floor: ''
  });
  const [activeTab, setActiveTab] = useState('hotel'); // 'hotel' | 'rooms' | 'types'

  useEffect(() => {
    fetchSettings();
    fetchRoomTypes();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await roomTypesAPI.getAll();
      setRoomTypes(response.data || []);
      // Set default room type for room form
      if (response.data && response.data.length > 0) {
        setRoomForm(prev => ({ ...prev, type: response.data[0].name }));
        setRoomTypeForm(prev => ({ ...prev, name: '', code: '' }));
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await settingsAPI.update(formData);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBankDetailChange = (field, value) => {
    setFormData({
      ...formData,
      bankDetails: {
        ...formData.bankDetails,
        [field]: value
      }
    });
  };

  // Room Type Management Functions
  const handleRoomTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArray = roomTypeForm.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a);

      const data = {
        ...roomTypeForm,
        amenities: amenitiesArray,
        defaultRate: parseFloat(roomTypeForm.defaultRate) || 0,
        maxOccupancy: parseInt(roomTypeForm.maxOccupancy) || 2
      };

      if (editingRoomType) {
        await roomTypesAPI.update(editingRoomType._id, data);
        alert('Room type updated successfully!');
      } else {
        await roomTypesAPI.create(data);
        alert('Room type created successfully!');
      }

      setRoomTypeForm({
        name: '',
        code: '',
        defaultRate: 0,
        maxOccupancy: 2,
        amenities: '',
        description: ''
      });
      setEditingRoomType(null);
      setShowRoomTypeForm(false);
      fetchRoomTypes();
    } catch (error) {
      console.error('Error saving room type:', error);
      alert('Error saving room type. Please try again.');
    }
  };

  const handleEditRoomType = (roomType) => {
    setEditingRoomType(roomType);
    setRoomTypeForm({
      name: roomType.name,
      code: roomType.code,
      defaultRate: roomType.defaultRate,
      maxOccupancy: roomType.maxOccupancy,
      amenities: roomType.amenities.join(', '),
      description: roomType.description || ''
    });
    setShowRoomTypeForm(true);
  };

  const handleDeleteRoomType = async (id) => {
    if (!confirm('Are you sure you want to delete this room type?')) return;
    try {
      await roomTypesAPI.delete(id);
      alert('Room type deleted successfully!');
      fetchRoomTypes();
    } catch (error) {
      console.error('Error deleting room type:', error);
      alert('Error deleting room type. Please try again.');
    }
  };

  const handleCancelRoomType = () => {
    setRoomTypeForm({
      name: '',
      code: '',
      defaultRate: 0,
      maxOccupancy: 2,
      amenities: '',
      description: ''
    });
    setEditingRoomType(null);
    setShowRoomTypeForm(false);
  };

  // Room Management Functions
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        number: roomForm.number,
        type: roomForm.type,
        rate: parseFloat(roomForm.rate) || 0,
        floor: roomForm.floor,
        status: 'AVAILABLE'
      };

      await roomsAPI.create(data);
      alert('Room added successfully!');
      setRoomForm({
        number: '',
        type: roomTypes[0]?.name || '',
        rate: 0,
        floor: ''
      });
    } catch (error) {
      console.error('Error adding room:', error);
      alert(error.response?.data?.message || 'Error adding room. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>⚙️ Settings & Configuration</h1>
        <p>Manage hotel information, room setup, and system settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="settings-tabs" style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0'
      }}>
        <button
          className={`tab-btn ${activeTab === 'hotel' ? 'active' : ''}`}
          onClick={() => setActiveTab('hotel')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'hotel' ? '#3b82f6' : 'transparent',
            color: activeTab === 'hotel' ? 'white' : '#6b7280',
            fontWeight: '600',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🏨 Hotel Information
        </button>
        <button
          className={`tab-btn ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'types' ? '#3b82f6' : 'transparent',
            color: activeTab === 'types' ? 'white' : '#6b7280',
            fontWeight: '600',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🏷️ Room Types
        </button>
        <button
          className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'rooms' ? '#3b82f6' : 'transparent',
            color: activeTab === 'rooms' ? 'white' : '#6b7280',
            fontWeight: '600',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🚪 Add Rooms
        </button>
      </div>

      {/* Hotel Information Tab */}
      {activeTab === 'hotel' && (
        <form onSubmit={handleSubmit}>
        <div className="card">
          <h2 className="section-title">Hotel Information</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Hotel Name *</label>
              <input
                type="text"
                value={formData.hotelName}
                onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>GST Number *</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              />
            </div>

            <div className="input-group full-width">
              <label>Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Bank Details</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={formData.bankDetails?.bankName || ''}
                onChange={(e) => handleBankDetailChange('bankName', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Account Number</label>
              <input
                type="text"
                value={formData.bankDetails?.accountNumber || ''}
                onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>IFSC Code</label>
              <input
                type="text"
                value={formData.bankDetails?.ifscCode || ''}
                onChange={(e) => handleBankDetailChange('ifscCode', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Branch</label>
              <input
                type="text"
                value={formData.bankDetails?.branch || ''}
                onChange={(e) => handleBankDetailChange('branch', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Terms & Conditions</h2>
          <div className="input-group">
            <label>Invoice Terms & Conditions</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows="5"
              placeholder="Enter terms and conditions to be displayed on invoices..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        </form>
      )}

      {/* Room Types Tab */}
      {activeTab === 'types' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Room Types</h2>
              {!showRoomTypeForm && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowRoomTypeForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Add Room Type
                </button>
              )}
            </div>

            {showRoomTypeForm && (
              <form onSubmit={handleRoomTypeSubmit} style={{
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '2px solid #3b82f6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: '#3b82f6' }}>
                    {editingRoomType ? '✏️ Edit Room Type' : '➕ New Room Type'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelRoomType}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={20} color="#6b7280" />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label>Type Name *</label>
                    <input
                      type="text"
                      value={roomTypeForm.name}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })}
                      placeholder="e.g., Deluxe, Suite"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Type Code *</label>
                    <input
                      type="text"
                      value={roomTypeForm.code}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., DLX, STE"
                      maxLength="3"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Default Rate (₹) *</label>
                    <input
                      type="number"
                      value={roomTypeForm.defaultRate}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, defaultRate: e.target.value })}
                      placeholder="2500"
                      min="0"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Max Occupancy *</label>
                    <input
                      type="number"
                      value={roomTypeForm.maxOccupancy}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, maxOccupancy: e.target.value })}
                      placeholder="2"
                      min="1"
                      max="10"
                      required
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>Amenities (comma-separated)</label>
                    <input
                      type="text"
                      value={roomTypeForm.amenities}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, amenities: e.target.value })}
                      placeholder="AC, TV, WiFi, Mini Fridge"
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>Description</label>
                    <textarea
                      value={roomTypeForm.description}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, description: e.target.value })}
                      placeholder="Describe this room type..."
                      rows="3"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Save size={16} /> {editingRoomType ? 'Update Room Type' : 'Create Room Type'}
                  </button>
                  <button type="button" onClick={handleCancelRoomType} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Room Types List */}
            <div style={{ display: 'grid', gap: '12px' }}>
              {roomTypes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p style={{ fontSize: '18px', marginBottom: '8px' }}>📋 No room types defined</p>
                  <p style={{ fontSize: '14px' }}>Create your first room type to get started</p>
                </div>
              ) : (
                roomTypes.map((type) => (
                  <div
                    key={type._id}
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      transition: 'box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{type.name}</h3>
                        <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {type.code}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Rate: </span>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>₹{type.defaultRate}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Max Guests: </span>
                          <span style={{ fontSize: '16px', fontWeight: '600' }}>{type.maxOccupancy}</span>
                        </div>
                      </div>
                      {type.amenities && type.amenities.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Amenities: </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                            {type.amenities.map((amenity, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: '#e0e7ff',
                                  color: '#4338ca',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {type.description && (
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
                          {type.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleEditRoomType(type)}
                        className="btn btn-secondary"
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoomType(type._id)}
                        className="btn btn-danger"
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Room Tab */}
      {activeTab === 'rooms' && (
        <div className="card">
          <h2 className="section-title">Add New Room</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Create room types first in the "Room Types" tab, then add individual rooms here.
          </p>

          {roomTypes.length === 0 ? (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#92400e' }}>
                ⚠️ Please create at least one room type before adding rooms.
              </p>
              <button
                onClick={() => setActiveTab('types')}
                className="btn btn-primary"
                style={{ marginTop: '12px' }}
              >
                Go to Room Types →
              </button>
            </div>
          ) : (
            <form onSubmit={handleRoomSubmit} style={{ maxWidth: '600px' }}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Room Number *</label>
                  <input
                    type="text"
                    value={roomForm.number}
                    onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
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
                        rate: selectedType?.defaultRate || 0
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
                        {type.name} ({type.code}) - ₹{type.defaultRate}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Rate (₹) *</label>
                  <input
                    type="number"
                    value={roomForm.rate}
                    onChange={(e) => setRoomForm({ ...roomForm, rate: e.target.value })}
                    placeholder="2500"
                    min="0"
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                    Default rate from room type. You can customize it for this room.
                  </small>
                </div>

                <div className="input-group">
                  <label>Floor *</label>
                  <input
                    type="text"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    placeholder="Ground Floor, First Floor, 1, 2..."
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>Preview</h4>
                <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Room:</strong> {roomForm.number || '—'}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Type:</strong> {roomForm.type || '—'}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Rate:</strong> ₹{roomForm.rate || 0}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Floor:</strong> {roomForm.floor || '—'}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Initial Status:</strong> Available
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontSize: '16px'
                }}
              >
                <Plus size={18} /> Add Room
              </button>
            </form>
          )}

          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>💡 Tips</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
              <li>Room numbers should be unique across your hotel</li>
              <li>The rate auto-fills from the room type but can be customized</li>
              <li>All new rooms start with "Available" status</li>
              <li>View and manage rooms on the "Rooms" page after creation</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
