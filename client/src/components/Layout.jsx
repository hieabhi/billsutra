import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Package, Users, BarChart3, Settings, LogOut, PlusCircle,
  Hotel, Calendar, ClipboardList, Wrench, CreditCard, ChevronDown, ChevronRight,
  Building2, User, Bell, HelpCircle
} from 'lucide-react';
import './Layout.css';
import './UserMenu.css';

const Layout = ({ children, onLogout, user }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    operations: true,
    billing: true,
    configuration: false
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hotelName = user?.tenant?.name || 'Demo Hotel';
  const userName = user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userRole = user?.role || 'staff';

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const menuSections = [
    {
      id: 'overview',
      label: null,
      items: [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' }
      ]
    },
    {
      id: 'operations',
      label: 'Front Office',
      items: [
        { path: '/rooms', icon: Hotel, label: 'Rooms' },
        { path: '/bookings', icon: Calendar, label: 'Reservations' },
        { path: '/housekeeping', icon: ClipboardList, label: 'Housekeeping' }
      ]
    },
    {
      id: 'billing',
      label: 'Billing & Accounts',
      items: [
        { path: '/new-bill', icon: PlusCircle, label: 'New Bill' },
        { path: '/bills', icon: FileText, label: 'All Bills' },
        { path: '/customers', icon: Users, label: 'Customers' },
        { path: '/items', icon: Package, label: 'Items/Services' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      items: [
        { path: '/reports', icon: BarChart3, label: 'Reports' }
      ]
    },
    {
      id: 'configuration',
      label: 'Configuration',
      items: [
        { path: '/room-types', icon: Settings, label: 'Room Types' },
        { path: '/rate-calendar', icon: Calendar, label: 'Rate Calendar' },
        { path: '/settings', icon: Settings, label: 'Settings' }
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="hotel-branding">
            <div className="hotel-logo">
              <Building2 size={32} strokeWidth={2} />
            </div>
            <div className="hotel-info">
              <h1 className="hotel-name">{hotelName}</h1>
              <p className="powered-by">Powered by BillSutra</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div key={section.id} className="nav-section">
              {section.label && (
                <div 
                  className="section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="section-title">{section.label}</span>
                  {expandedSections[section.id] ? 
                    <ChevronDown size={16} /> : 
                    <ChevronRight size={16} />
                  }
                </div>
              )}
              
              {(section.label === null || expandedSections[section.id]) && (
                <div className="section-items">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile" ref={userMenuRef}>
            <button 
              className="user-profile-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-details">
                <div className="user-name">{userName}</div>
                <div className="user-role">{userRole}</div>
              </div>
              <ChevronDown size={16} className={`menu-arrow ${userMenuOpen ? 'open' : ''}`} />
            </button>
            
            {userMenuOpen && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <div className="user-avatar-large">
                    <User size={24} />
                  </div>
                  <div className="user-info">
                    <div className="user-name-large">{userName}</div>
                    <div className="user-email">{userEmail}</div>
                  </div>
                </div>
                
                <div className="user-menu-divider"></div>
                
                <Link to="/settings" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                  <Settings size={18} />
                  <span>Account Settings</span>
                </Link>
                
                <Link to="/settings" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                  <Bell size={18} />
                  <span>Notifications</span>
                </Link>
                
                <Link to="/settings" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                  <HelpCircle size={18} />
                  <span>Help & Support</span>
                </Link>
                
                <div className="user-menu-divider"></div>
                
                <button onClick={handleLogout} className="user-menu-item logout">
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
