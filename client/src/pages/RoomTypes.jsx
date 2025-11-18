import React, { useEffect, useState } from 'react';
import { roomTypesAPI } from '../api';

const RoomTypes = () => {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ name: '', defaultRate: 0, cgst: 2.5, sgst: 2.5, igst: 0 });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

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
      setForm({ name: '', defaultRate: 0, cgst: 2.5, sgst: 2.5, igst: 0 });
      setEditing(null);
      refresh();
    } catch (err) {
      console.error('Error saving room type:', err);
      setError(err.response?.data?.message || 'Failed to save room type');
    }
  };

  const edit = (t) => { setEditing(t); setForm({ name: t.name, defaultRate: t.defaultRate||0, cgst: t.cgst??2.5, sgst: t.sgst??2.5, igst: t.igst??0 }); };
  const remove = async (id) => { if (confirm('Delete type?')) { await roomTypesAPI.delete(id); refresh(); } };

  return (
    <div className="card">
      <h1>Room Types</h1>
      {error && <div style={{ padding: '10px', background: '#fee', color: '#c00', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}
      <form onSubmit={submit} className="form-grid" style={{ marginBottom: 16 }}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        <input type="number" placeholder="Default Rate" value={form.defaultRate} onChange={e=>setForm({...form, defaultRate: parseFloat(e.target.value)||0})} />
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
