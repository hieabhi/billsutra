import React, { useEffect, useState } from 'react';
import api, { bookingsAPI } from '../api';
import './Modal.css';

const FolioModal = ({ bookingId, onClose, onChanged }) => {
  const [booking, setBooking] = useState(null);
  const [line, setLine] = useState({ description: '', amount: 0, type: 'pos' });
  const [payment, setPayment] = useState({ method: 'Cash', amount: 0 });
  const load = async () => {
    const b = await bookingsAPI.getById(bookingId);
    setBooking(b.data);
  };
  useEffect(()=>{ load(); },[bookingId]);

  const addLine = async () => {
    if (!line.description || !line.amount) return;
    await bookingsAPI.addFolioLine(bookingId, line);
    setLine({ description: '', amount: 0, type: 'pos' });
    await load();
    onChanged && onChanged();
  };
  const addPay = async () => {
    if (!payment.amount) return;
    await bookingsAPI.addPayment(bookingId, payment);
    setPayment({ method: 'Cash', amount: 0 });
    await load();
    onChanged && onChanged();
  };

  if (!booking) return null;
  const f = booking.folio || { lines: [], payments: [], total: booking.amount, balance: booking.amount };
  const totalPaid = (f.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0);
  const advancePayment = booking.advancePayment || 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <h3>Folio · {booking.reservationNumber} · Room {booking.roomNumber}</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          {advancePayment > 0 && (
            <div style={{padding: '12px', background: '#e8f5e9', borderRadius: '6px', marginBottom: '16px', border: '1px solid #4caf50'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <div style={{fontSize: '12px', color: '#2e7d32', fontWeight: '500'}}>💰 Advance Payment Received</div>
                  <div style={{fontSize: '11px', color: '#558b2f', marginTop: '2px'}}>
                    via {booking.advancePaymentMethod || 'Cash'} at booking time
                  </div>
                </div>
                <div style={{fontSize: '20px', fontWeight: 'bold', color: '#1b5e20'}}>₹ {advancePayment}</div>
              </div>
            </div>
          )}
          <div className="grid-2">
            <div>
              <h4>Lines</h4>
              <ul className="list">
                {f.lines.map(l=> <li key={l._id}><span>{l.description}</span><span>₹ {l.amount}</span></li>)}
              </ul>
              <div className="form-grid">
                <input placeholder="Description" value={line.description} onChange={e=>setLine({...line, description:e.target.value})} />
                <input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={line.amount === 0 ? '' : line.amount} 
                  onChange={e=>setLine({...line, amount: parseFloat(e.target.value)||0})}
                  onFocus={e=>e.target.select()}
                />
                <select value={line.type} onChange={e=>setLine({...line, type:e.target.value})}>
                  <option value="pos">POS</option>
                  <option value="adjustment">Adjustment</option>
                </select>
                <button className="btn btn-primary" onClick={addLine}>Add Line</button>
              </div>
            </div>
            <div>
              <h4>Payments</h4>
              <ul className="list">
                {f.payments.map(p=> <li key={p._id}><span>{p.method}</span><span>₹ {p.amount}</span></li>)}
              </ul>
              <div className="form-grid">
                <select value={payment.method} onChange={e=>setPayment({...payment, method:e.target.value})}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Enter payment amount" 
                  value={payment.amount === 0 ? '' : payment.amount} 
                  onChange={e=>setPayment({...payment, amount: parseFloat(e.target.value)||0})}
                  onFocus={e=>e.target.select()}
                />
                <button className="btn btn-primary" onClick={addPay}>Add Payment</button>
              </div>
            </div>
          </div>
          <div className="totals">
            <div><strong>Room Total</strong> ₹ {f.total || 0}</div>
            <div><strong>Total Paid</strong> ₹ {totalPaid}</div>
            {advancePayment > 0 && (
              <div style={{color: '#28a745', fontSize: '0.9rem'}}>
                <strong>Advance</strong> ₹ {advancePayment}
              </div>
            )}
            <div style={{fontSize: '1.2rem', color: f.balance > 0 ? '#dc3545' : '#28a745'}}>
              <strong>Balance Due</strong> ₹ {f.balance || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolioModal;
