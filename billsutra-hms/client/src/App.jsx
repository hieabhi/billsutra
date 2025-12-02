import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewBill from './pages/NewBill';
import BillList from './pages/BillList';
import Items from './pages/Items';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Housekeeping from './pages/Housekeeping';
import RoomTypes from './pages/RoomTypes';
import RateCalendar from './pages/RateCalendar';
import RoomDetail from './pages/RoomDetail';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('token') ? true : false
  );

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <Layout onLogout={() => setIsAuthenticated(false)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/room-types" element={<RoomTypes />} />
          <Route path="/rate-calendar" element={<RateCalendar />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/housekeeping" element={<Housekeeping />} />
          <Route path="/new-bill" element={<NewBill />} />
          <Route path="/bills" element={<BillList />} />
          <Route path="/items" element={<Items />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
