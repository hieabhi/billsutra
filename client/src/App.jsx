import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewBill from './pages/NewBill';
import BillList from './pages/BillList';
import Items from './pages/Items';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import FirebaseLogin from './components/Auth/Login';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Housekeeping from './pages/Housekeeping';
import RoomManagement from './pages/RoomManagement';
import RateCalendar from './pages/RateCalendar';
import RoomDetail from './pages/RoomDetail';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Get Firebase ID token
        const token = await currentUser.getIdToken();
        localStorage.setItem('authToken', token);
        
        // Fetch user data from backend
        try {
          const response = await fetch('http://localhost:5051/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setUserData(null);
  };

  const handleLoginSuccess = async (firebaseUser) => {
    setUser(firebaseUser);
    
    // Get Firebase ID token
    const token = await firebaseUser.getIdToken();
    localStorage.setItem('authToken', token);
    
    // Fetch user data from backend
    try {
      const response = await fetch('http://localhost:5051/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <FirebaseLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout} user={userData}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
                          <Route path="/room-management" element={<RoomManagement />} />
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
