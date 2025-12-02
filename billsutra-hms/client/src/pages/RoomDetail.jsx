import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomsAPI, bookingsAPI, housekeepingAPI, billsAPI } from '../api';
import { formatDate, formatCurrency } from '../utils';
import EnhancedFolioModal from '../components/EnhancedFolioModal';

const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ task: 'Clean', notes: '' });
  const [folioBookingId, setFolioBookingId] = useState(null);

  const load = async () => {
    const r = await roomsAPI.getById(id);
    setRoom(r.data);
    const b = await bookingsAPI.getAll({ roomId: id });
    setBookings(b.data);
    const hk = await housekeepingAPI.getAll({ roomNumber: r.data.number });
    setTasks(hk.data);
    // Industry standard: Get checkout history from bookings table
    // No need for separate room.history array (follows Opera PMS, Maestro, Cloudbeds pattern)
  };

  useEffect(() => { load(); }, [id]);

  const history = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    return {
      // PAST: Only truly completed/cancelled bookings
      // FIX: CheckedIn guests should NEVER appear in past, regardless of dates
      past: bookings.filter(b =>
        (b.status === 'CheckedOut' ||
          b.status === 'Cancelled' ||
          b.status === 'NoShow') ||
        (b.status !== 'CheckedIn' && new Date(b.checkOutDate) < today)
      ).sort((a, b) => new Date(b.checkOutDate) - new Date(a.checkOutDate)),

      // CURRENT: Must have CheckedIn status AND today must be within stay dates
      current: bookings.filter(b => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return b.status === 'CheckedIn' &&
          checkIn <= today &&
          today <= checkOut;
      }),

      // UPCOMING: Reserved/Confirmed bookings with check-in date today or later
      future: bookings.filter(b => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return (b.status === 'Reserved' || b.status === 'Confirmed') && checkIn >= today;
      }).sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))
    };
  }, [bookings]);

  const setStatus = async (status) => { await roomsAPI.setStatus(id, status); load(); };
  const addTask = async () => {
    // Check if there's already a pending/in-progress task for this room
    const activeTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
    if (activeTasks.length > 0) {
      alert(`Cannot add task: Room ${room.number} already has ${activeTasks.length} active task(s). Complete or cancel existing tasks first.`);
      return;
    }

    await housekeepingAPI.create({ roomId: id, roomNumber: room.number, task: newTask.task, notes: newTask.notes });
    setNewTask({ task: 'Clean', notes: '' });
    load();
  };

  if (!room) return <div className="card">Loading...</div>;

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Room {room.number} <small style={{ fontSize: 14, opacity: 0.7 }}>({room.type})</small></h1>
          <Link className="btn" to="/rooms">Back to Rooms</Link>
        </div>

        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-title">Status</p>
              <h2 className="stat-value">{room.status}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setStatus('Available')}>Available</button>
                <button className="btn btn-secondary" onClick={() => setStatus('Occupied')}>Occupied</button>
                <button className="btn btn-secondary" onClick={() => setStatus('Dirty')}>Dirty</button>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-title">Rate</p>
              <h2 className="stat-value">{formatCurrency(room.rate || 0)}</h2>
              <p className="stat-subtext">Type: {room.type}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-title">Housekeeping</p>
              <h2 className="stat-value">{tasks.filter(t => t.status === 'PENDING').length} pending</h2>
              <p className="stat-subtext">{tasks.length} total tasks</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Add Housekeeping Task</h2>
          <div className="form-grid">
            <input placeholder="Task" value={newTask.task} onChange={e => setNewTask({ ...newTask, task: e.target.value })} />
            <input placeholder="Notes" value={newTask.notes} onChange={e => setNewTask({ ...newTask, notes: e.target.value })} />
            <button className="btn btn-primary" onClick={addTask}>Add Task</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Current Stay</h2>
          {history.current.length === 0 ? <p className="no-data">No current stay</p> : (
            <table className="table">
              <thead><tr><th>Res No</th><th>Guest</th><th>Dates</th><th>Amount</th><th>Status</th><th>Invoice</th><th>Actions</th></tr></thead>
              <tbody>
                {history.current.map(b => (
                  <tr key={b._id}>
                    <td>{b.reservationNumber}</td>
                    <td>{b.guest?.name}</td>
                    <td>{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ({b.nights}n)</td>
                    <td>{formatCurrency(b.amount)}</td>
                    <td>{b.status}</td>
                    <td>{b.billNumber ? <span>{b.billNumber}</span> : '-'}</td>
                    <td><button className="btn" onClick={() => setFolioBookingId(b._id)}>Folio</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Upcoming</h2>
          {history.future.length === 0 ? <p className="no-data">No future bookings</p> : (
            <table className="table">
              <thead><tr><th>Res No</th><th>Guest</th><th>Dates</th><th>Amount</th></tr></thead>
              <tbody>
                {history.future.map(b => (
                  <tr key={b._id}>
                    <td>{b.reservationNumber}</td>
                    <td>{b.guest?.name}</td>
                    <td>{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ({b.nights}n)</td>
                    <td>{formatCurrency(b.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Past Reservations (Checkout History)</h2>
          {history.past.length === 0 ? <p className="no-data">No checkout history yet</p> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Res No</th>
                  <th>Guest</th>
                  <th>Stay Period</th>
                  <th>Nights</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {history.past.map(b => (
                  <tr key={b._id}>
                    <td>{b.reservationNumber}</td>
                    <td>{b.guest?.name}</td>
                    <td>{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</td>
                    <td>{b.nights}</td>
                    <td>{formatCurrency(b.rate)}/night</td>
                    <td>{formatCurrency(b.amount)}</td>
                    <td>{b.paymentMethod || '-'}</td>
                    <td>{b.status}</td>
                    <td>{b.billNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {folioBookingId && (
        <EnhancedFolioModal
          bookingId={folioBookingId}
          onClose={() => setFolioBookingId(null)}
          onChanged={load}
        />
      )}
    </>
  );
};

export default RoomDetail;
