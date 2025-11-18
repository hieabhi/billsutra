import React, { useEffect, useMemo, useState } from 'react';
import { roomTypesAPI, ratePlansAPI } from '../api';

function getMonthDays(year, month) {
  // month: 0-11
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

const RateCalendar = () => {
  const today = new Date();
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [overrides, setOverrides] = useState({});
  const [defaultRate, setDefaultRate] = useState(0);
  const [error, setError] = useState('');
  const days = useMemo(()=>getMonthDays(year, month), [year, month]);

  useEffect(() => {
    (async () => {
      try {
        setError('');
        const res = await roomTypesAPI.getAll();
        setTypes(res.data);
        if (res.data.length) {
          setSelectedType(res.data[0].name);
          setDefaultRate(res.data[0].defaultRate || 0);
        }
      } catch (err) {
        console.error('Error fetching room types:', err);
        setError(err.response?.data?.message || 'Failed to fetch room types');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedType) return;
      try {
        setError('');
        const plan = await ratePlansAPI.getByRoomType(selectedType).catch(()=>({ data: { overrides: {} } }));
        setOverrides(plan.data?.overrides || {});
        const type = types.find(t=>t.name===selectedType);
        setDefaultRate(type?.defaultRate || 0);
      } catch (err) {
        console.error('Error fetching rate plan:', err);
        setError(err.response?.data?.message || 'Failed to fetch rate plan');
      }
    })();
  }, [selectedType, types]);

  const onCellChange = (dateStr, value) => {
    const rate = parseFloat(value);
    setOverrides(prev => ({ ...prev, [dateStr]: isNaN(rate) || rate<=0 ? undefined : rate }));
  };

  const save = async () => {
    try {
      setError('');
      // Clean undefined entries
      const clean = {};
      Object.entries(overrides).forEach(([k,v])=>{ if (typeof v === 'number') clean[k]=v; });
      await ratePlansAPI.setOverrides(selectedType, clean);
      alert('Saved rate overrides');
    } catch (err) {
      console.error('Error saving rate plan:', err);
      setError(err.response?.data?.message || 'Failed to save rate plan');
    }
  };

  const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;

  return (
    <div className="card">
      <h1>Rate Calendar</h1>
      {error && <div style={{ padding: '10px', background: '#fee', color: '#c00', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <select value={selectedType} onChange={e=>setSelectedType(e.target.value)}>
          {types.map(t=> <option key={t._id} value={t.name}>{t.name}</option>)}
        </select>
        <input type="month" value={monthStr} onChange={e=>{ const [y,m]=e.target.value.split('-'); setYear(parseInt(y,10)); setMonth(parseInt(m,10)-1); }} />
        <button className="btn btn-primary" onClick={save}>Save</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {days.map(d=>{
              const ds = d.toISOString().slice(0,10);
              const val = overrides[ds] ?? '';
              return (
                <tr key={ds}>
                  <td>{ds}</td>
                  <td>
                    <input type="number" placeholder={`${defaultRate}`} value={val}
                      onChange={e=>onCellChange(ds, e.target.value)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RateCalendar;
