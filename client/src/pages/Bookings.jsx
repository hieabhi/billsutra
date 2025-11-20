import React, { useEffect, useState } from 'react';
import { bookingsAPI, roomsAPI, billsAPI, ratePlansAPI } from '../api';
import { formatDate } from '../utils';
import InvoicePreview from '../components/InvoicePreview';
import EnhancedFolioModal from '../components/EnhancedFolioModal';
import { useAutoRefresh, useRefreshAfterMutation } from '../hooks/useAutoRefresh';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [folioBookingId, setFolioBookingId] = useState(null);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ARRIVING'); // ARRIVING, IN_HOUSE, DEPARTING, DEPARTED_TODAY, UPCOMING, HISTORY
  // INDUSTRY STANDARD: Initialize form with FUNCTION to get fresh dates (Opera PMS, Mews, Cloudbeds)
  // This ensures dates update when component re-renders or refreshes
  const getInitialFormState = () => ({
    guest: { 
      name: '',
      phone: '',
      email: '',
      idProof: '',
      address: ''
    },
    guestCounts: {
      adults: 1,
      children: 0,
      infants: 0
    },
    additionalGuests: [],
    roomId: '',
    roomNumber: '',
    rate: 0,
    checkInDate: new Date().toISOString().slice(0,10),  // Fresh date on every call
    checkOutDate: new Date(Date.now()+86400000).toISOString().slice(0,10), // Tomorrow
    guestsCount: 1,
    paymentMethod: 'Cash',
    bookingSource: 'Walk-in',
    advancePayment: 0,
    advancePaymentMethod: 'Cash',
    notes: ''
  });
  
  const [form, setForm] = useState(getInitialFormState());
  const [isFormDirty, setIsFormDirty] = useState(false);

  const refresh = async () => {
    try {
      const [b, r] = await Promise.all([
        bookingsAPI.getAll({}),
        roomsAPI.getAll()
      ]);
      setBookings(b.data);
      setRooms(r.data);
      
      // INDUSTRY STANDARD: Refresh form dates on every refresh (Opera PMS pattern)
      // Ensures today's date is always current, even if app left open overnight
      // BUT: Don't reset if user is actively editing the form
      if (!isFormDirty) {
        const freshDates = getInitialFormState();
        setForm(prev => ({
          ...prev,
          checkInDate: freshDates.checkInDate,
          checkOutDate: freshDates.checkOutDate
        }));
        
        // Fetch available rooms for current dates
        await fetchAvailableRooms(freshDates.checkInDate, freshDates.checkOutDate);
      }
      
      if (isInitialLoad) setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Fetch available rooms based on selected dates
  const fetchAvailableRooms = async (checkIn, checkOut) => {
    try {
      const response = await roomsAPI.getAvailable(checkIn, checkOut);
      setAvailableRooms(response.data);
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      setAvailableRooms(rooms); // Fallback to all rooms
    }
  };

  // Auto-refresh every 1 second for fast background sync
  useAutoRefresh(refresh, 1000);
  
  // Helper for refreshing after mutations
  const { refreshAfterMutation } = useRefreshAfterMutation(refresh);

  const onRoomChange = async (id) => {
    setIsFormDirty(true);
    const room = availableRooms.find(x=>x._id===id);
    let rate = room?.rate||0;
    try {
      if (room?.type && form.checkInDate) {
        const plan = await ratePlansAPI.getByRoomType(room.type);
        const ov = plan.data?.overrides||{};
        if (ov[form.checkInDate]) rate = ov[form.checkInDate];
      }
    } catch {}
    setForm({ ...form, roomId: id, roomNumber: room?.number||'', rate });
  };

  // Update available rooms when dates change
  // INDUSTRY STANDARD: Auto-adjust checkout when checkin changes (Opera PMS, Mews, Cloudbeds)
  const onDateChange = async (field, value) => {
    setIsFormDirty(true); // Mark form as being edited
    let newForm = { ...form, [field]: value };
    
    // AUTO-INCREMENT LOGIC: If check-in date changes, ensure check-out is at least next day
    if (field === 'checkInDate') {
      const checkInDate = new Date(value);
      const checkOutDate = new Date(form.checkOutDate);
      
      // If checkout is before or same as new checkin, auto-set to checkin + 1 day
      if (checkOutDate <= checkInDate) {
        const nextDay = new Date(checkInDate);
        nextDay.setDate(nextDay.getDate() + 1);
        newForm.checkOutDate = nextDay.toISOString().slice(0, 10);
      }
    }
    
    setForm(newForm);
    
    if (field === 'checkInDate' || field === 'checkOutDate') {
      await fetchAvailableRooms(
        field === 'checkInDate' ? value : newForm.checkInDate,
        field === 'checkOutDate' ? value : newForm.checkOutDate
      );
      
      // Clear room selection if currently selected room is no longer available
      if (form.roomId) {
        const stillAvailable = await roomsAPI.getAvailable(
          newForm.checkInDate, 
          newForm.checkOutDate
        );
        const isRoomAvailable = stillAvailable.data.some(r => r._id === form.roomId);
        if (!isRoomAvailable) {
          setForm({ ...newForm, roomId: '', roomNumber: '', rate: 0 });
          setError('Selected room is not available for these dates. Please select another room.');
        }
      }
    }
  };

  // Add additional guest
  const addAdditionalGuest = () => {
    setForm({
      ...form,
      additionalGuests: [...form.additionalGuests, { name: '', age: '', ageCategory: 'Adult', idProof: '' }]
    });
  };

  // Remove additional guest
  const removeAdditionalGuest = (index) => {
    const newGuests = form.additionalGuests.filter((_, i) => i !== index);
    setForm({ ...form, additionalGuests: newGuests });
  };

  // Update additional guest
  const updateAdditionalGuest = (index, field, value) => {
    const newGuests = [...form.additionalGuests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setForm({ ...form, additionalGuests: newGuests });
  };

  // Auto-categorize guest by age
  const autoCategorizeAge = (age) => {
    if (age === '' || age === undefined) return 'Adult';
    const ageNum = parseInt(age);
    if (ageNum <= 2) return 'Infant';
    if (ageNum <= 17) return 'Child';
    return 'Adult';
  };

  const create = async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!form.roomId) {
      setError('Please select a room');
      return;
    }
    
    if (!form.guest.name || form.guest.name.trim() === '') {
      setError('Please enter primary guest name');
      return;
    }
    
    if (!form.guest.phone || form.guest.phone.trim() === '') {
      setError('Please enter primary guest phone number');
      return;
    }
    
    if (!form.guest.email || form.guest.email.trim() === '') {
      setError('Please enter primary guest email');
      return;
    }
    
    // Validate guest counts
    if (form.guestCounts.adults < 1) {
      setError('At least 1 adult is required');
      return;
    }
    
    const checkIn = new Date(form.checkInDate);
    const checkOut = new Date(form.checkOutDate);
    
    if (checkIn >= checkOut) {
      setError('Check-out date must be after check-in date');
      return;
    }
    
    try {
      await refreshAfterMutation(() => bookingsAPI.create(form));
      // Reset to fresh form with current dates
      setForm(getInitialFormState());
      setIsFormDirty(false); // Allow auto-refresh to update dates again
      setError(''); // Clear any previous errors
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create booking';
      setError(errorMsg);
      console.error('Booking creation error:', err);
    }
  };

  const checkIn = async (id) => { 
    await refreshAfterMutation(() => bookingsAPI.checkIn(id)); 
  };
  
  const checkOut = async (id) => { 
    await refreshAfterMutation(() => bookingsAPI.checkOut(id)); 
  };
  
  // INDUSTRY STANDARD: Mark reservation as No-Show (Opera PMS, Mews, Cloudbeds)
  const markNoShow = async (id) => {
    if (!window.confirm('Mark this reservation as No-Show? This will cancel the booking and free the room.')) return;
    setError('');
    try {
      await refreshAfterMutation(() => bookingsAPI.cancel(id));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to mark as no-show');
    }
  };
  
  const remove = async (id) => { 
    if (confirm('Delete booking?')) {
      // OPTIMISTIC UPDATE: Remove from UI immediately
      const previousBookings = [...bookings];
      setBookings(bookings.filter(b => b._id !== id));
      
      try {
        console.log('Deleting booking with ID:', id);
        const response = await bookingsAPI.delete(id);
        console.log('Delete response:', response);
        // Refresh after 50ms to sync room status changes
        setTimeout(refresh, 50);
      } catch (err) {
        // Revert on error
        setBookings(previousBookings);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to delete booking';
        console.error('Delete error:', err);
        setError(errorMsg);
        alert(`Error deleting booking: ${errorMsg}`);
      }
    } 
  };

  // Filter bookings based on status (Industry Standard - Opera PMS, Maestro, Cloudbeds)
  const getFilteredBookings = () => {
    const today = new Date().toISOString().slice(0, 10);
    
    switch (statusFilter) {
      case 'ARRIVING':
        // Arriving today - Reserved status with check-in date = today
        return bookings.filter(b => 
          b.status === 'Reserved' && b.checkInDate === today
        );
      
      case 'IN_HOUSE':
        // Currently checked in
        return bookings.filter(b => b.status === 'CheckedIn');
      
      case 'DEPARTING':
        // Departing today - CheckedIn status with SCHEDULED check-out date = today
        return bookings.filter(b => 
          b.status === 'CheckedIn' && b.checkOutDate === today
        );
      
      case 'DEPARTED_TODAY':
        // Departed today - CheckedOut status with ACTUAL checkout date = today
        return bookings.filter(b => {
          if (b.status !== 'CheckedOut') return false;
          const actualCheckout = b.actualCheckOutDate || b.updatedAt;
          if (!actualCheckout) return false;
          const checkoutDate = new Date(actualCheckout).toISOString().slice(0, 10);
          return checkoutDate === today;
        }).sort((a,b) => {
          const dateA = new Date(a.actualCheckOutDate || a.updatedAt);
          const dateB = new Date(b.actualCheckOutDate || b.updatedAt);
          return dateB - dateA; // Most recent first
        });
      
      case 'UPCOMING':
        // Future reservations - Reserved status with check-in date > today
        return bookings.filter(b => 
          b.status === 'Reserved' && b.checkInDate > today
        );
      
      case 'HISTORY':
        // Past stays - All checked out guests sorted by most recent departures first
        return bookings.filter(b => b.status === 'CheckedOut')
          .sort((a,b) => {
            const dateA = new Date(a.actualCheckOutDate || a.updatedAt || a.checkOutDate);
            const dateB = new Date(b.actualCheckOutDate || b.updatedAt || b.checkOutDate);
            return dateB - dateA; // Most recent departures first
          });
      
      case 'ALL':
      default:
        // Show all bookings with active ones first
        return bookings.sort((a,b) => {
          // Priority: Arriving > In-House > Departing > Upcoming > History
          const statusPriority = {
            'Reserved': b.checkInDate === today ? 1 : (b.checkInDate > today ? 4 : 6),
            'CheckedIn': b.checkOutDate === today ? 2 : 3,
            'CheckedOut': 5
          };
          return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
        });
    }
  };

  const filteredBookings = getFilteredBookings();

  if (selectedBill) {
    return (
      <InvoicePreview bill={selectedBill} onClose={() => setSelectedBill(null)} />
    );
  }

  return (
    <div className="card">
      <h1>Bookings & Reservations</h1>
      
      {/* Quick Stats Overview - Industry Standard */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:20}}>
        <div style={{padding:16, background:'#dbeafe', borderRadius:8, borderLeft:'4px solid #3b82f6'}}>
          <div style={{fontSize:24, fontWeight:600, color:'#1e40af'}}>
            {bookings.filter(b => b.status === 'Reserved' && b.checkInDate === new Date().toISOString().slice(0, 10)).length}
          </div>
          <div style={{fontSize:13, color:'#1e40af', fontWeight:500}}>Arriving Today</div>
        </div>
        <div style={{padding:16, background:'#d1fae5', borderRadius:8, borderLeft:'4px solid #10b981'}}>
          <div style={{fontSize:24, fontWeight:600, color:'#047857'}}>
            {bookings.filter(b => b.status === 'CheckedIn').length}
          </div>
          <div style={{fontSize:13, color:'#047857', fontWeight:500}}>In-House</div>
        </div>
        <div style={{padding:16, background:'#fed7aa', borderRadius:8, borderLeft:'4px solid #f59e0b'}}>
          <div style={{fontSize:24, fontWeight:600, color:'#b45309'}}>
            {bookings.filter(b => b.status === 'CheckedIn' && b.checkOutDate === new Date().toISOString().slice(0, 10)).length}
          </div>
          <div style={{fontSize:13, color:'#b45309', fontWeight:500}}>Departing Today</div>
        </div>
        <div style={{padding:16, background:'#fee2e2', borderRadius:8, borderLeft:'4px solid #dc2626'}}>
          <div style={{fontSize:24, fontWeight:600, color:'#991b1b'}}>
            {bookings.filter(b => {
              if (b.status !== 'CheckedOut') return false;
              const actualCheckout = b.actualCheckOutDate || b.updatedAt;
              if (!actualCheckout) return false;
              return new Date(actualCheckout).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
            }).length}
          </div>
          <div style={{fontSize:13, color:'#991b1b', fontWeight:500}}>Departed Today</div>
        </div>
        <div style={{padding:16, background:'#e9d5ff', borderRadius:8, borderLeft:'4px solid #8b5cf6'}}>
          <div style={{fontSize:24, fontWeight:600, color:'#6b21a8'}}>
            {bookings.filter(b => b.status === 'Reserved' && b.checkInDate > new Date().toISOString().slice(0, 10)).length}
          </div>
          <div style={{fontSize:13, color:'#6b21a8', fontWeight:500}}>Upcoming</div>
        </div>
      </div>
      
      {error && (
        <div style={{ padding: '10px', background: '#fee', color: '#c00', marginBottom: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={create} className="form-grid" style={{marginBottom:16}}>
        <h3 style={{gridColumn: '1 / -1', marginBottom: '8px', fontSize: '16px', fontWeight: 600}}>Guest Information</h3>
        
        <input 
          placeholder="Guest Name *" 
          value={form.guest.name} 
          onChange={e=>setForm({...form, guest:{...form.guest, name:e.target.value}})} 
          required 
        />
        <input 
          placeholder="Phone Number *" 
          value={form.guest.phone} 
          onChange={e=>setForm({...form, guest:{...form.guest, phone:e.target.value}})} 
          required 
        />
        <input 
          placeholder="Email Address *" 
          type="email"
          value={form.guest.email} 
          onChange={e=>setForm({...form, guest:{...form.guest, email:e.target.value}})} 
          required 
        />
        <input 
          placeholder="ID Proof (Passport/Aadhaar/DL)" 
          value={form.guest.idProof} 
          onChange={e=>setForm({...form, guest:{...form.guest, idProof:e.target.value}})} 
        />
        
        {/* Address and Booking Source in same row */}
        <input 
          placeholder="Address (Optional)" 
          value={form.guest.address} 
          onChange={e=>setForm({...form, guest:{...form.guest, address:e.target.value}})} 
          style={{gridColumn: 'span 1'}}
        />
        <select 
          value={form.bookingSource} 
          onChange={e=>setForm({...form, bookingSource:e.target.value})}
          style={{gridColumn: 'span 1'}}
        >
          <option value="Walk-in">Walk-in</option>
          <option value="Phone">Phone</option>
          <option value="Online">Online</option>
          <option value="OTA">OTA (Booking.com, etc.)</option>
          <option value="Travel Agent">Travel Agent</option>
        </select>
        
        <h3 style={{gridColumn: '1 / -1', marginTop: '12px', marginBottom: '8px', fontSize: '16px', fontWeight: 600}}>Booking Details</h3>
        
        {/* All booking fields in one row */}
        <div style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px'}}>
          <input 
            type="date" 
            value={form.checkInDate} 
            onChange={e=>onDateChange('checkInDate', e.target.value)}
            style={{width: '100%'}}
            required
          />
          <input 
            type="date" 
            value={form.checkOutDate} 
            onChange={e=>onDateChange('checkOutDate', e.target.value)}
            style={{width: '100%'}}
            required
          />
          <select value={form.roomId} onChange={e=>onRoomChange(e.target.value)} required style={{width: '100%'}}>
            <option value="">Select Room *</option>
            {availableRooms.map(r=> (
              <option key={r._id} value={r._id}>
                {r.number} ({r.type}) - Available
              </option>
            ))}
          </select>
          <input 
            type="number" 
            placeholder="Rate per night (₹) *" 
            value={form.rate === 0 ? '' : form.rate} 
            onChange={e=>setForm({...form, rate:parseFloat(e.target.value)||0})}
            onFocus={e=>e.target.select()}
            style={{width: '100%'}}
            required
          />
          <input 
            type="number" 
            min="0"
            placeholder="Advance (₹)"
            value={form.advancePayment === 0 ? '' : form.advancePayment} 
            onChange={e=>setForm({...form, advancePayment:parseFloat(e.target.value)||0})}
            onFocus={e=>e.target.select()}
            style={{width: '100%'}}
          />
          <select 
            value={form.advancePaymentMethod} 
            onChange={e=>setForm({...form, advancePaymentMethod:e.target.value})}
            style={{width: '100%'}}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        
        <h3 style={{gridColumn: '1 / -1', marginTop: '12px', marginBottom: '8px', fontSize: '16px', fontWeight: 600}}>
          Guest Count (Industry Standard)
        </h3>
        
        <div style={{display: 'flex', gap: '8px', gridColumn: '1 / -1'}}>
          <div style={{flex: 1}}>
            <label style={{fontSize: '12px', color: '#666'}}>Adults (18+) *</label>
            <input 
              type="number" 
              min="1"
              placeholder="Number of adults"
              value={form.guestCounts.adults} 
              onChange={e=>setForm({...form, guestCounts:{...form.guestCounts, adults:parseInt(e.target.value)||1}})}
              onFocus={e=>e.target.select()}
              style={{width: '100%'}}
            />
          </div>
          <div style={{flex: 1}}>
            <label style={{fontSize: '12px', color: '#666'}}>Children (2-17)</label>
            <input 
              type="number" 
              min="0"
              placeholder="Number of children"
              value={form.guestCounts.children === 0 ? '' : form.guestCounts.children} 
              onChange={e=>setForm({...form, guestCounts:{...form.guestCounts, children:parseInt(e.target.value)||0}})}
              onFocus={e=>e.target.select()}
              style={{width: '100%'}}
            />
          </div>
          <div style={{flex: 1}}>
            <label style={{fontSize: '12px', color: '#666'}}>Infants (0-2)</label>
            <input 
              type="number" 
              min="0"
              placeholder="Number of infants"
              value={form.guestCounts.infants === 0 ? '' : form.guestCounts.infants} 
              onChange={e=>setForm({...form, guestCounts:{...form.guestCounts, infants:parseInt(e.target.value)||0}})}
              onFocus={e=>e.target.select()}
              style={{width: '100%'}}
            />
          </div>
          <div style={{flex: 1, display: 'flex', alignItems: 'flex-end'}}>
            <div style={{padding: '8px', background: '#f0f0f0', borderRadius: '4px', width: '100%', textAlign: 'center'}}>
              <div style={{fontSize: '12px', color: '#666'}}>Total Guests</div>
              <div style={{fontSize: '20px', fontWeight: 'bold'}}>
                {form.guestCounts.adults + form.guestCounts.children}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Guests Section */}
        {form.additionalGuests.length > 0 && (
          <>
            <h3 style={{gridColumn: '1 / -1', marginTop: '12px', marginBottom: '8px', fontSize: '16px', fontWeight: 600}}>
              Additional Guests (Optional - for companion names)
            </h3>
            {form.additionalGuests.map((guest, index) => (
              <div key={index} style={{gridColumn: '1 / -1', display: 'flex', gap: '8px', marginBottom: '8px', padding: '12px', background: '#f9f9f9', borderRadius: '4px'}}>
                <input 
                  placeholder={`Guest ${index + 2} Name`}
                  value={guest.name}
                  onChange={e=>updateAdditionalGuest(index, 'name', e.target.value)}
                  style={{flex: 2}}
                />
                <input 
                  type="number"
                  placeholder="Enter age"
                  value={guest.age === '' || guest.age === 0 ? '' : guest.age}
                  onChange={e=>{
                    const age = e.target.value;
                    updateAdditionalGuest(index, 'age', age);
                    updateAdditionalGuest(index, 'ageCategory', autoCategorizeAge(age));
                  }}
                  onFocus={e=>e.target.select()}
                  style={{flex: 1}}
                />
                <select
                  value={guest.ageCategory}
                  onChange={e=>updateAdditionalGuest(index, 'ageCategory', e.target.value)}
                  style={{flex: 1}}
                >
                  <option value="Adult">Adult</option>
                  <option value="Child">Child</option>
                  <option value="Infant">Infant</option>
                </select>
                <input 
                  placeholder="ID Proof"
                  value={guest.idProof}
                  onChange={e=>updateAdditionalGuest(index, 'idProof', e.target.value)}
                  style={{flex: 1}}
                />
                <button 
                  type="button"
                  onClick={()=>removeAdditionalGuest(index)}
                  className="btn btn-danger"
                  style={{padding: '4px 12px'}}
                >
                  Remove
                </button>
              </div>
            ))}
          </>
        )}

        <button 
          type="button"
          onClick={addAdditionalGuest}
          className="btn"
          style={{gridColumn: '1 / -1', marginTop: '8px'}}
        >
          + Add Additional Guest (Name & Details)
        </button>
        
        <button className="btn btn-primary" type="submit" style={{gridColumn: '1 / -1', marginTop: '12px'}}>
          Create Booking
        </button>
      </form>

      {/* Status Filter Tabs - Industry Standard (Opera PMS, Maestro, Cloudbeds) */}
      <div style={{display:'flex', gap:6, marginBottom:16, marginTop:24, borderBottom:'2px solid #e5e7eb'}}>
        <button
          type="button"
          onClick={() => setStatusFilter('ARRIVING')}
          style={{
            padding:'8px 12px',
            background: statusFilter === 'ARRIVING' ? '#3b82f6' : 'transparent',
            color: statusFilter === 'ARRIVING' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'ARRIVING' ? '3px solid #3b82f6' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'ARRIVING' ? 600 : 400,
            fontSize:'13px',
            marginBottom:'-2px',
            transition:'all 0.2s',
            whiteSpace:'nowrap'
          }}
        >
          🔵 Arriving ({bookings.filter(b => b.status === 'Reserved' && b.checkInDate === new Date().toISOString().slice(0, 10)).length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('IN_HOUSE')}
          style={{
            padding:'8px 12px',
            background: statusFilter === 'IN_HOUSE' ? '#10b981' : 'transparent',
            color: statusFilter === 'IN_HOUSE' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'IN_HOUSE' ? '3px solid #10b981' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'IN_HOUSE' ? 600 : 400,
            fontSize:'13px',
            marginBottom:'-2px',
            transition:'all 0.2s',
            whiteSpace:'nowrap'
          }}
        >
          🟢 In-House ({bookings.filter(b => b.status === 'CheckedIn').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('DEPARTING')}
          style={{
            padding:'8px 12px',
            background: statusFilter === 'DEPARTING' ? '#f59e0b' : 'transparent',
            color: statusFilter === 'DEPARTING' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'DEPARTING' ? '3px solid #f59e0b' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'DEPARTING' ? 600 : 400,
            fontSize:'13px',
            marginBottom:'-2px',
            transition:'all 0.2s',
            whiteSpace:'nowrap'
          }}
        >
          🔶 Departing ({bookings.filter(b => b.status === 'CheckedIn' && b.checkOutDate === new Date().toISOString().slice(0, 10)).length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('DEPARTED_TODAY')}
          style={{
            padding:'8px 12px',
            background: statusFilter === 'DEPARTED_TODAY' ? '#dc2626' : 'transparent',
            color: statusFilter === 'DEPARTED_TODAY' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'DEPARTED_TODAY' ? '3px solid #dc2626' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'DEPARTED_TODAY' ? 600 : 400,
            fontSize:'13px',
            marginBottom:'-2px',
            transition:'all 0.2s',
            whiteSpace:'nowrap'
          }}
        >
          ✈️ Departed ({bookings.filter(b => {
            if (b.status !== 'CheckedOut') return false;
            const actualCheckout = b.actualCheckOutDate || b.updatedAt;
            if (!actualCheckout) return false;
            return new Date(actualCheckout).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
          }).length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('UPCOMING')}
          style={{
            padding:'8px 12px',
            background: statusFilter === 'UPCOMING' ? '#8b5cf6' : 'transparent',
            color: statusFilter === 'UPCOMING' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'UPCOMING' ? '3px solid #8b5cf6' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'UPCOMING' ? 600 : 400,
            fontSize:'13px',
            marginBottom:'-2px',
            transition:'all 0.2s',
            whiteSpace:'nowrap'
          }}
        >
          🟣 Upcoming ({bookings.filter(b => b.status === 'Reserved' && b.checkInDate > new Date().toISOString().slice(0, 10)).length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('HISTORY')}
          style={{
            padding:'8px 12px',
            background: statusFilter === 'HISTORY' ? '#64748b' : 'transparent',
            color: statusFilter === 'HISTORY' ? 'white' : '#6b7280',
            border:'none',
            borderBottom: statusFilter === 'HISTORY' ? '3px solid #64748b' : 'none',
            cursor:'pointer',
            fontWeight: statusFilter === 'HISTORY' ? 600 : 400,
            fontSize:'13px',
            marginBottom:'-2px',
            transition:'all 0.2s',
            whiteSpace:'nowrap'
          }}
        >
          📜 History ({bookings.filter(b => b.status === 'CheckedOut').length})
        </button>
      </div>

      <div style={{marginTop: '20px'}}>
        <table className="table" style={{fontSize: '0.9rem', width: '100%', tableLayout: 'fixed'}}>
          <thead>
            <tr>
              <th style={{width: '9%'}}>Res No</th>
              <th style={{width: '21%'}}>Guest & Contact</th>
              <th style={{width: '6%', textAlign: 'center'}}>Pax</th>
              <th style={{width: '5%', textAlign: 'center'}}>Room</th>
              <th style={{width: '16%'}}>Check-in / Out</th>
              <th style={{width: '8%'}}>Source</th>
              <th style={{width: '9%'}}>Status</th>
              <th style={{width: '11%', textAlign: 'right'}}>Amount</th>
              <th style={{width: '15%'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{textAlign:'center', padding:'40px', color:'#999'}}>
                  {statusFilter === 'ARRIVING' && 'No arrivals today'}
                  {statusFilter === 'IN_HOUSE' && 'No guests currently in-house'}
                  {statusFilter === 'DEPARTING' && 'No departures scheduled for today'}
                  {statusFilter === 'DEPARTED_TODAY' && 'No departures yet today'}
                  {statusFilter === 'UPCOMING' && 'No upcoming reservations'}
                  {statusFilter === 'HISTORY' && 'No past stays'}
                  {statusFilter === 'ALL' && 'No bookings yet'}
                </td>
              </tr>
            ) : (
              filteredBookings.map(b=> {
              // INDUSTRY STANDARD: Detect overdue reservations (Opera PMS, Mews pattern)
              const today = new Date().toISOString().slice(0, 10);
              const isOverdue = b.status === 'Reserved' && b.checkInDate < today;
              
              return (
              <tr key={b._id} style={isOverdue ? {backgroundColor: '#fff3cd'} : {}}>
                <td style={{fontWeight: '600', fontSize: '0.85rem'}}>{b.reservationNumber}</td>
                <td>
                  <div style={{fontWeight: '500'}}>
                    {b.guest?.name}
                    {isOverdue && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: '#dc3545',
                        color: '#fff',
                        fontSize: '0.65rem',
                        borderRadius: '3px',
                        fontWeight: 'bold'
                      }}>
                        LATE
                      </span>
                    )}
                  </div>
                  {b.guest?.phone && <div style={{fontSize: '0.8rem', color: '#666'}}>{b.guest.phone}</div>}
                  {b.additionalGuests?.length > 0 && (
                    <small style={{color: '#007bff', fontSize: '0.75rem'}}>
                      +{b.additionalGuests.length} more
                    </small>
                  )}
                </td>
                <td style={{textAlign: 'center'}}>
                  {b.guestCounts ? (
                    <>
                      <div style={{fontWeight: 'bold', fontSize: '1rem'}}>{b.totalGuests || (b.guestCounts.adults + b.guestCounts.children)}</div>
                      <small style={{color:'#666', fontSize: '0.7rem', whiteSpace: 'nowrap'}}>
                        {b.guestCounts.adults}A
                        {b.guestCounts.children > 0 && `,${b.guestCounts.children}C`}
                        {b.guestCounts.infants > 0 && `,${b.guestCounts.infants}I`}
                      </small>
                    </>
                  ) : (
                    <div style={{fontWeight: 'bold'}}>{b.guestsCount || 1}</div>
                  )}
                </td>
                <td style={{textAlign: 'center', fontWeight: '600', fontSize: '0.95rem'}}>{b.roomNumber}</td>
                <td style={{fontSize: '0.8rem'}}>
                  <div style={isOverdue ? {color: '#dc3545', fontWeight: 'bold'} : {}}>{formatDate(b.checkInDate)}</div>
                  <div style={{color: '#666'}}>{formatDate(b.checkOutDate)} <small>({b.nights}n)</small></div>
                </td>
                <td><small style={{fontSize: '0.75rem'}}>{b.bookingSource || 'Walk-in'}</small></td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    background: b.status === 'Reserved' ? '#ffc107' : b.status === 'CheckedIn' ? '#28a745' : b.status === 'CheckedOut' ? '#6c757d' : '#17a2b8',
                    color: '#fff',
                    whiteSpace: 'nowrap'
                  }}>
                    {b.status}
                  </span>
                </td>
                <td style={{textAlign: 'right', fontWeight: '600'}}>
                  <div>₹{b.amount}</div>
                  {b.advancePayment > 0 && (
                    <div style={{fontSize: '0.7rem', color: '#28a745', fontWeight: '500'}}>
                      Adv: ₹{b.advancePayment}
                    </div>
                  )}
                  {b.folio?.balance > 0 && (
                    <div style={{fontSize: '0.75rem', color: '#dc3545', fontWeight: '500'}}>
                      Due: ₹{b.folio.balance}
                    </div>
                  )}
                  {b.folio?.balance === 0 && b.amount > 0 && (
                    <div style={{fontSize: '0.7rem', color: '#28a745'}}>✓ Paid</div>
                  )}
                </td>
                <td>
                  <div style={{display: 'flex', gap: '4px', justifyContent: 'flex-start'}}>
                    {b.status === 'Reserved' && !isOverdue && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => checkIn(b._id)} 
                        title="Check-in Guest"
                        style={{padding: '8px', fontSize: '0.85rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                      >
                        ✓
                      </button>
                    )}
                    {b.status === 'Reserved' && isOverdue && (
                      <>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => checkIn(b._id)} 
                          title="Late Check-in"
                          style={{padding: '8px', fontSize: '0.85rem', width: '36px', height: '36px', background: '#ffc107', border: '1px solid #e0a800', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          ⚠
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => markNoShow(b._id)} 
                          title="Mark as No-Show"
                          style={{padding: '8px', fontSize: '0.85rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {b.status === 'CheckedIn' && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => checkOut(b._id)} 
                        title="Check-out Guest"
                        style={{padding: '8px', fontSize: '0.85rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                      >
                        →
                      </button>
                    )}
                    <button 
                      className="btn" 
                      onClick={() => setFolioBookingId(b._id)} 
                      title="View Folio"
                      style={{padding: '8px', fontSize: '0.85rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    >
                      📋
                    </button>
                    {b.billId && (
                      <button 
                        className="btn btn-primary" 
                        onClick={async () => { const resp = await billsAPI.getById(b.billId); setSelectedBill(resp.data); }}
                        title="View Invoice"
                        style={{padding: '8px', fontSize: '0.85rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                      >
                        📄
                      </button>
                    )}
                    <button 
                      className="btn btn-danger" 
                      onClick={() => remove(b._id)} 
                      title="Delete Reservation"
                      style={{padding: '8px', fontSize: '0.85rem', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {folioBookingId && (
        <EnhancedFolioModal
          bookingId={folioBookingId}
          onClose={()=> setFolioBookingId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
};

export default Bookings;
