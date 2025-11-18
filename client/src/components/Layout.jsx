import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Package, Users, BarChart3, Settings, LogOut, PlusCircle,
  Hotel, Calendar, ClipboardList, Wrench, CreditCard, ChevronDown, ChevronRight
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children, onLogout }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    operations: true,
    billing: true,
    configuration: false
  });

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
          <h1>BillSutra</h1>
          <p>Hotel Management System</p>
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
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
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
