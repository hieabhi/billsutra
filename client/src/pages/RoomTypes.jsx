import React, { useEffect, useState } from 'react';
import { roomTypesAPI } from '../api';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const RoomTypes = () => {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ 
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
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    try {
      setError('');
      const res = await roomTypesAPI.getAll();
      setTypes(res.data);
    } catch (err) {
      console.error('Error fetching room types:', err);
      setError(err.response?.data?.message || 'Failed to fetch room types');
    }
  };

  useEffect(() => { refresh(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editing) {
        await roomTypesAPI.update(editing._id, form);
      } else {
        await roomTypesAPI.create(form);
      }
      setForm({ 
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
      setEditing(null);
      setShowForm(false);
      refresh();
    } catch (err) {
      console.error('Error saving room type:', err);
      setError(err.response?.data?.message || 'Failed to save room type');
    }
  };

  const edit = (t) => { 
    setEditing(t); 
    setForm({ 
      name: t.name, 
      code: t.code || '',
      defaultRate: t.defaultRate || 0, 
      maxOccupancy: t.maxOccupancy || 2,
      amenities: t.amenities || '',
      description: t.description || '',
      cgst: t.cgst ?? 2.5, 
      sgst: t.sgst ?? 2.5, 
      igst: t.igst ?? 0 
    }); 
    setShowForm(true);
  };

  const remove = async (id) => { 
    if (confirm('Delete this room type?')) { 
      try {
        await roomTypesAPI.delete(id); 
        refresh();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete room type');
      }
    } 
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ 
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
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Room Types Configuration</h1>
        <p>Manage room categories and their default rates</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Room Types</h2>
          {!showForm && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Add Room Type
            </button>
          )}
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#fef2f2', 
            color: '#dc2626', 
            marginBottom: '20px', 
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #4f46e5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#4f46e5', fontSize: '18px', fontWeight: 600 }}>
                {editing ? '✏️ Edit Room Type' : '➕ New Room Type'}
              </h3>
              <button
                type="button"
                onClick={handleCancel}
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

            <div className="form-grid" style={{ gap: '16px' }}>
              <div className="input-group">
                <label>Type Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Deluxe, Suite, Standard"
                  required
                />
              </div>

              <div className="input-group">
                <label>Type Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., DLX, STE"
                  maxLength="3"
                  required
                />
              </div>

              <div className="input-group">
                <label>Default Rate (₹) *</label>
                <input
                  type="number"
                  value={form.defaultRate}
                  onChange={e => setForm({...form, defaultRate: parseFloat(e.target.value) || 0})}
                  placeholder="2500"
                  min="0"
                  required
                />
              </div>

              <div className="input-group">
                <label>Max Occupancy *</label>
                <input
                  type="number"
                  value={form.maxOccupancy}
                  onChange={e => setForm({...form, maxOccupancy: parseInt(e.target.value) || 2})}
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
                  value={form.amenities}
                  onChange={e => setForm({...form, amenities: e.target.value})}
                  placeholder="AC, TV, WiFi, Mini Fridge, Hot Water"
                />
              </div>

              <div className="input-group full-width">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Describe this room type..."
                  rows="3"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> {editing ? 'Update Room Type' : 'Create Room Type'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Room Types List */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {types.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏨</div>
              <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 500 }}>No room types defined</p>
              <p style={{ fontSize: '14px' }}>Create your first room type to get started</p>
            </div>
          ) : (
            types.map((type) => (
              <div
                key={type._id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#4f46e5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                      {type.name}
                    </h3>
                    {type.code && (
                      <span style={{
                        padding: '4px 12px',
                        background: '#ede9fe',
                        color: '#6d28d9',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {type.code}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Default Rate</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#059669' }}>
                        ₹{type.defaultRate?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Max Occupancy</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#3b82f6' }}>
                        {type.maxOccupancy || 2} guests
                      </div>
                    </div>
                  </div>

                  {type.amenities && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Amenities</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {type.amenities.split(',').map((amenity, idx) => (
                          <span key={idx} style={{
                            padding: '4px 10px',
                            background: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}>
                            {amenity.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {type.description && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Description</div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                        {type.description}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => edit(type)}
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
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dbeafe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                    }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => remove(type._id)}
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
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fef2f2';
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
  );
};

export default RoomTypes;
        <input type="number" placeholder="CGST %" value={form.cgst} onChange={e=>setForm({...form, cgst: parseFloat(e.target.value)||0})} />
        <input type="number" placeholder="SGST %" value={form.sgst} onChange={e=>setForm({...form, sgst: parseFloat(e.target.value)||0})} />
        <input type="number" placeholder="IGST %" value={form.igst} onChange={e=>setForm({...form, igst: parseFloat(e.target.value)||0})} />
        <button className="btn btn-primary" type="submit">{editing ? 'Update' : 'Add'} Type</button>
        {editing && <button type="button" className="btn" onClick={()=>{ setEditing(null); setForm({ name: '', defaultRate: 0, cgst: 2.5, sgst: 2.5, igst: 0 }); }}>Cancel</button>}
      </form>

      <table className="table">
        <thead><tr><th>Name</th><th>Default Rate</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Actions</th></tr></thead>
        <tbody>
          {types.map(t => (
            <tr key={t._id}>
              <td>{t.name}</td>
              <td>{t.defaultRate}</td>
              <td>{t.cgst ?? '-'}</td>
              <td>{t.sgst ?? '-'}</td>
              <td>{t.igst ?? '-'}</td>
              <td style={{ display:'flex', gap:8 }}>
                <button className="btn btn-secondary" onClick={()=>edit(t)}>Edit</button>
                <button className="btn btn-danger" onClick={()=>remove(t._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomTypes;
