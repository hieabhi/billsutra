import React, { useState, useEffect } from 'react';
import { billsAPI, statsAPI, bookingsAPI } from '../api';
import { TrendingUp, TrendingDown, FileText, DollarSign, Calendar, Users, Home, AlertCircle, CheckCircle, Clock, Percent, Activity, Info, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayList, setTodayList] = useState([]);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipTimer, setTooltipTimer] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const [statsRes, billsRes, todaysBookings] = await Promise.all([
        statsAPI.getDashboard(),
        billsAPI.getAll({ limit: 5 }),
        bookingsAPI.getAll({ date: today })
      ]);
      setStats(statsRes.data);
      setRecentBills(billsRes.data.slice(0, 5));
      setTodayList(todaysBookings.data||[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const todayISO = new Date().toISOString().slice(0,10);
  const arrivals = todayList.filter(b=> b.status==='Reserved' && b.checkInDate?.slice(0,10)===todayISO);
  // Departures: Guests who checked out today (actualCheckOutDate = today OR checkOutDate = today for legacy data)
  const departures = todayList.filter(b=> {
    if (b.status !== 'CheckedOut') return false;
    // New checkouts have actualCheckOutDate, old checkouts don't
    if (b.actualCheckOutDate) return b.actualCheckOutDate.slice(0,10) === todayISO;
    // Fallback for legacy checkouts (before actualCheckOutDate was added)
    return b.checkOutDate?.slice(0,10) === todayISO;
  }).sort((a,b) => {
    const dateA = new Date(a.actualCheckOutDate || a.updatedAt || a.checkOutDate);
    const dateB = new Date(b.actualCheckOutDate || b.updatedAt || b.checkOutDate);
    return dateB - dateA; // Most recent first
  });
  const inhouse = todayList.filter(b=> b.status==='CheckedIn');

  // Industry-Standard KPI Cards (Opera PMS, Maestro, Cloudbeds, Mews style)
  const kpiCards = [
    // Row 1: Critical Operational Metrics
    {
      title: "Occupancy Rate",
      value: `${stats?.rooms?.occupancyRate || 0}%`,
      icon: Percent,
      color: '#8b5cf6',
      subtext: `${stats?.rooms?.occupiedRooms || 0} of ${stats?.rooms?.totalRooms || 0} rooms occupied`,
      trend: stats?.rooms?.occupancyRate > 70 ? 'high' : stats?.rooms?.occupancyRate > 40 ? 'medium' : 'low',
      tooltip: 'Occupancy Rate = (Occupied Rooms ÷ Total Rooms) × 100\n\nIndustry Standard: Measures how many rooms are currently occupied. High occupancy (>70%) indicates strong demand.',
      progress: stats?.rooms?.occupancyRate || 0,
      target: 80
    },
    {
      title: 'In-House Guests',
      value: stats?.bookings?.inHouse || 0,
      icon: Users,
      color: '#22c55e',
      subtext: `${stats?.bookings?.arrivalsToday || 0} arrivals · ${stats?.bookings?.departuresToday || 0} departures`,
      badge: stats?.bookings?.departuresToday > 0 ? 'checkout' : null,
      tooltip: 'In-House Guests = Total checked-in bookings\n\nShows current guests staying in the hotel. Includes arrivals for today and excludes departures.',
      sparkline: true
    },
    {
      title: 'Available Rooms',
      value: stats?.rooms?.availableRooms || 0,
      icon: Home,
      color: '#10b981',
      subtext: `${stats?.rooms?.availableClean || 0} clean · ${stats?.rooms?.availableDirty || 0} dirty`,
      badge: stats?.rooms?.availableDirty > 0 ? 'cleaning' : null,
      tooltip: 'Available Rooms = Rooms with no current guest\n\nRooms ready for check-in. Clean rooms can be sold immediately, dirty rooms need housekeeping first.',
      breakdown: [
        { label: 'Clean (Ready)', value: stats?.rooms?.availableClean || 0, color: '#10b981' },
        { label: 'Dirty (Need Cleaning)', value: stats?.rooms?.availableDirty || 0, color: '#f59e0b' }
      ]
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.billing?.todayRevenue || 0),
      icon: DollarSign,
      color: '#3b82f6',
      subtext: `${stats?.billing?.todayBillsCount || 0} bills today`,
      tooltip: "Today's Revenue = Sum of all bills created today\n\nIncludes room charges, food & beverage, and other services. Updated in real-time as bills are created.",
      sparkline: true
    },
    
    // Row 2: Financial KPIs (Industry Standard)
    {
      title: 'ADR (Avg Daily Rate)',
      value: formatCurrency(stats?.financial?.adr || 0),
      icon: TrendingUp,
      color: '#f59e0b',
      subtext: 'Average room revenue',
      tooltip: 'ADR = Total Room Revenue ÷ Occupied Rooms\n\nAverage Daily Rate: Key hotel KPI showing average revenue per occupied room. Higher ADR indicates premium pricing or upselling success.\n\nIndustry Benchmark: Budget hotels ₹1500-3000, Mid-scale ₹3000-8000, Upscale ₹8000+',
      benchmark: 3000,
      actualValue: stats?.financial?.adr || 0
    },
    {
      title: 'RevPAR',
      value: formatCurrency(stats?.financial?.revPAR || 0),
      icon: Activity,
      color: '#ec4899',
      subtext: 'Revenue per available room',
      tooltip: 'RevPAR = Total Revenue ÷ Total Rooms\nOR\nRevPAR = ADR × Occupancy Rate\n\nRevenue Per Available Room: Combines occupancy and pricing to measure overall performance. Most important hotel metric.\n\nTarget: Maximize both occupancy and rate for optimal RevPAR.',
      progress: ((stats?.financial?.revPAR || 0) / 2500) * 100,
      target: 100
    },
    {
      title: 'Outstanding Payments',
      value: formatCurrency(Math.abs(stats?.financial?.outstandingPayments || 0)),
      icon: AlertCircle,
      color: '#ef4444',
      subtext: 'Unpaid folio balances',
      badge: Math.abs(stats?.financial?.outstandingPayments || 0) > 10000 ? 'urgent' : stats?.financial?.outstandingPayments > 0 ? 'pending' : null,
      tooltip: 'Outstanding Payments = Sum of unpaid folio balances\n\nTotal amount owed by in-house guests. Includes charges not yet settled. Should be collected at checkout.\n\nNegative value = Guest overpayment or credit balance.'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.billing?.monthlyRevenue || 0),
      icon: TrendingUp,
      color: '#4f46e5',
      subtext: `${stats?.billing?.monthlyBillsCount || 0} bills this month`,
      tooltip: 'Monthly Revenue = Total bills from current month\n\nCumulative revenue for the current calendar month. Includes all services: rooms, F&B, laundry, etc.\n\nUsed for monthly reporting and budget tracking.',
      sparkline: true
    },
    
    // Row 3: Operational Status
    {
      title: 'Reserved Rooms',
      value: stats?.rooms?.reservedRooms || 0,
      icon: Calendar,
      color: '#f97316',
      subtext: `${stats?.rooms?.reservedClean || 0} clean · ${stats?.rooms?.reservedDirty || 0} dirty`,
      badge: stats?.rooms?.reservedDirty > 0 ? 'cleaning' : null,
      tooltip: 'Reserved Rooms = Confirmed future bookings\n\nRooms with confirmed reservations but guest not yet checked in. Includes today\'s expected arrivals.\n\nMonitor to prepare for incoming guests and ensure rooms are clean before arrival.',
      breakdown: [
        { label: 'Clean (Ready)', value: stats?.rooms?.reservedClean || 0, color: '#10b981' },
        { label: 'Dirty (Need Cleaning)', value: stats?.rooms?.reservedDirty || 0, color: '#f59e0b' }
      ]
    },
    {
      title: 'Housekeeping Tasks',
      value: stats?.housekeeping?.pending || 0,
      icon: Clock,
      color: '#06b6d4',
      subtext: `${stats?.housekeeping?.completedToday || 0} completed today`,
      badge: stats?.housekeeping?.urgent > 0 ? 'urgent' : stats?.housekeeping?.pending > 5 ? 'warning' : null,
      tooltip: 'Housekeeping Tasks = Pending + In-Progress cleaning tasks\n\nActive tasks requiring attention. Includes room cleaning, deep cleaning, inspection, and maintenance.\n\nCompleted Today shows productivity. Target: Complete all tasks before check-in time.',
      progress: stats?.housekeeping?.completedToday ? ((stats?.housekeeping?.completedToday / ((stats?.housekeeping?.completedToday || 0) + (stats?.housekeeping?.pending || 0))) * 100) : 0,
      target: 100
    },
    {
      title: 'Rooms Need Attention',
      value: ((stats?.rooms?.availableDirty || 0) + (stats?.rooms?.reservedDirty || 0) + (stats?.rooms?.maintenanceRooms || 0) + (stats?.rooms?.outOfServiceRooms || 0)),
      icon: AlertCircle,
      color: '#dc2626',
      subtext: `${(stats?.rooms?.availableDirty || 0) + (stats?.rooms?.reservedDirty || 0)} dirty · ${stats?.rooms?.maintenanceRooms || 0} maint · ${stats?.rooms?.outOfServiceRooms || 0} OOS`,
      tooltip: 'Rooms Need Attention = Sellable Dirty + Maintenance + Out of Service\n\nRooms affecting inventory that need immediate action:\n• Dirty (Available/Reserved): Needs housekeeping before/for guest\n• Maintenance: Under repair, cannot sell\n• Out of Service: Blocked, unavailable\n\nExcludes occupied dirty rooms (guest still in room).\n\nMinimize to maximize sellable inventory.',
      breakdown: [
        { label: 'Dirty (Sellable)', value: (stats?.rooms?.availableDirty || 0) + (stats?.rooms?.reservedDirty || 0), color: '#f59e0b' },
        { label: 'Maintenance', value: stats?.rooms?.maintenanceRooms || 0, color: '#ef4444' },
        { label: 'OOS', value: stats?.rooms?.outOfServiceRooms || 0, color: '#dc2626' }
      ]
    },
    {
      title: 'Total Bills',
      value: stats?.billing?.totalBills || 0,
      icon: FileText,
      color: '#64748b',
      subtext: 'All time',
      tooltip: 'Total Bills = All bills ever created in the system\n\nHistorical count of all invoices generated. Used for tracking business volume and ID sequencing.'
    }
  ];

  const statCards = [
    // Billing KPIs
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.billing?.todayRevenue || 0),
      icon: DollarSign,
      color: '#10b981',
      subtext: `${stats?.billing?.todayBillsCount || 0} bills today`
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.billing?.monthlyRevenue || 0),
      icon: TrendingUp,
      color: '#4f46e5',
      subtext: `${stats?.billing?.monthlyBillsCount || 0} bills this month`
    },
    {
      title: 'Total Bills',
      value: stats?.billing?.totalBills || 0,
      icon: FileText,
      color: '#f59e0b',
      subtext: 'All time'
    },
    // Rooms KPIs
    {
      title: 'Occupied Rooms',
      value: stats?.rooms?.occupiedRooms || 0,
      icon: Calendar,
      color: '#ef4444',
      subtext: `${stats?.rooms?.availableRooms || 0} available`
    },
    {
      title: 'Dirty Rooms',
      value: stats?.rooms?.dirtyRooms || 0,
      icon: Calendar,
      color: '#f97316',
      subtext: `${stats?.rooms?.totalRooms || 0} total`
    },
    // Bookings KPI
    {
      title: 'In-House Guests',
      value: stats?.bookings?.inHouse || 0,
      icon: Calendar,
      color: '#22c55e',
      subtext: `${stats?.bookings?.arrivalsToday || 0} arrivals · ${stats?.bookings?.departuresToday || 0} departures`
    },
    // Housekeeping KPI
    {
      title: 'HK Pending',
      value: stats?.housekeeping?.pending || 0,
      icon: Calendar,
      color: '#06b6d4',
      subtext: 'Tasks to complete'
    }
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time overview of your hotel operations</p>
      </div>

      {/* Tooltip Modal Overlay */}
      {activeTooltip && (
        <div className="tooltip-overlay" onClick={() => setActiveTooltip(null)}>
          <div className="tooltip-modal" onClick={(e) => e.stopPropagation()}>
            {activeTooltip}
          </div>
        </div>
      )}

      {/* Industry-Standard KPI Grid (4x3 layout like Opera PMS, Mews) */}
      <div className="kpi-grid">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                  <Icon size={20} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {kpi.badge && (
                    <span className={`kpi-badge badge-${kpi.badge}`}>
                      {kpi.badge === 'checkout' ? 'Check-outs' : 
                       kpi.badge === 'cleaning' ? 'Needs Cleaning' : 
                       kpi.badge === 'pending' ? 'Pending' : 
                       kpi.badge === 'urgent' ? 'Urgent' : 
                       kpi.badge === 'warning' ? 'High Load' : ''}
                    </span>
                  )}
                  {kpi.trend && (
                    <div className={`kpi-trend trend-${kpi.trend}`}>
                      {kpi.trend === 'high' ? '🔥 High' : kpi.trend === 'medium' ? '📊 Moderate' : '📉 Low'}
                    </div>
                  )}
                  {kpi.tooltip && (
                    <span 
                      className="kpi-info-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(activeTooltip === kpi.tooltip ? null : kpi.tooltip);
                      }}
                      title="Click for details"
                    >
                      <Info size={16} strokeWidth={2} />
                    </span>
                  )}
                </div>
              </div>
              <div className="kpi-content">
                <p className="kpi-title">{kpi.title}</p>
                <h2 className="kpi-value" style={{color: kpi.color}}>{kpi.value}</h2>
                <p className="kpi-subtext">{kpi.subtext}</p>
                
                {/* Visual Elements - Industry Standard */}
                
                {/* Progress Bar (for percentage-based KPIs) */}
                {kpi.progress !== undefined && (
                  <div className="kpi-progress-container">
                    <div className="kpi-progress-bar">
                      <div 
                        className="kpi-progress-fill"
                        style={{
                          width: `${Math.min(kpi.progress, 100)}%`,
                          background: kpi.progress >= 70 ? '#10b981' : kpi.progress >= 40 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                    {kpi.target && (
                      <span className="kpi-progress-label">
                        {Math.round(kpi.progress)}% {kpi.target !== 100 ? `of target` : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Benchmark Bar (compare actual vs benchmark) */}
                {kpi.benchmark !== undefined && kpi.actualValue !== undefined && (
                  <div className="kpi-benchmark-container">
                    <div className="kpi-benchmark-bar">
                      <div 
                        className="kpi-benchmark-actual"
                        style={{
                          width: `${Math.min((kpi.actualValue / kpi.benchmark) * 100, 100)}%`,
                          background: kpi.actualValue >= kpi.benchmark ? '#10b981' : '#f59e0b'
                        }}
                      ></div>
                      <div className="kpi-benchmark-line" style={{left: '100%'}}></div>
                    </div>
                    <div className="kpi-benchmark-labels">
                      <span style={{color: kpi.actualValue >= kpi.benchmark ? '#10b981' : '#f59e0b'}}>
                        {kpi.actualValue >= kpi.benchmark ? '✓ Above' : '⚠ Below'} benchmark
                      </span>
                      <span className="kpi-benchmark-target">₹{kpi.benchmark.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Breakdown Bars (for multi-component KPIs) */}
                {kpi.breakdown && (
                  <div className="kpi-breakdown">
                    {kpi.breakdown.map((item, i) => (
                      <div key={i} className="kpi-breakdown-item">
                        <div className="kpi-breakdown-header">
                          <span className="kpi-breakdown-label">{item.label}</span>
                          <span className="kpi-breakdown-value">{item.value}</span>
                        </div>
                        <div className="kpi-breakdown-bar">
                          <div 
                            className="kpi-breakdown-fill"
                            style={{
                              width: `${(item.value / Math.max(...kpi.breakdown.map(b => b.value), 1)) * 100}%`,
                              background: item.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trend Change Indicator */}
                {kpi.change && (
                  <div className={`kpi-change ${kpi.changeType}`}>
                    {kpi.changeType === 'positive' ? <ArrowUp size={14} /> : 
                     kpi.changeType === 'negative' ? <ArrowDown size={14} /> : <Minus size={14} />}
                    <span>{kpi.change} vs yesterday</span>
                  </div>
                )}

                {/* Sparkline Chart (for trend visualization) */}
                {kpi.sparkline && (
                  <div className="kpi-sparkline">
                    <svg width="100%" height="32" viewBox="0 0 100 32">
                      {/* Simple sparkline - will be populated with real data */}
                      <polyline
                        points="0,20 20,18 40,15 60,12 80,14 100,10"
                        fill="none"
                        stroke={kpi.color}
                        strokeWidth="2"
                        opacity="0.6"
                      />
                      <polyline
                        points="0,20 20,18 40,15 60,12 80,14 100,10 100,32 0,32"
                        fill={kpi.color}
                        opacity="0.1"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DUAL STATUS BREAKDOWN - Industry Standard (Opera PMS, Maestro, Cloudbeds, Mews) */}
      <div className="dashboard-row">
        {/* OCCUPANCY STATUS (Who is in the room) */}
        <div className="card room-status-card">
          <h2 className="card-title">Occupancy Status</h2>
          <p style={{fontSize: '13px', color: '#6b7280', marginBottom: '16px'}}>
            Who is using the room
          </p>
          <div className="room-status-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
            <div className="room-status-item" style={{borderLeftColor: '#ef4444'}}>
              <span className="room-status-count">{stats?.rooms?.occupiedRooms || 0}</span>
              <span className="room-status-label">Occupied</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#f97316'}}>
              <span className="room-status-count">{stats?.rooms?.reservedRooms || 0}</span>
              <span className="room-status-label">Reserved</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#10b981'}}>
              <span className="room-status-count">{stats?.rooms?.availableRooms || 0}</span>
              <span className="room-status-label">Available</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#6b7280'}}>
              <span className="room-status-count">{stats?.rooms?.blockedRooms || 0}</span>
              <span className="room-status-label">Blocked</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#dc2626'}}>
              <span className="room-status-count">{stats?.rooms?.outOfServiceRooms || 0}</span>
              <span className="room-status-label">Out of Service</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#3b82f6'}}>
              <span className="room-status-count">{stats?.rooms?.totalRooms || 0}</span>
              <span className="room-status-label">Total Rooms</span>
            </div>
          </div>
        </div>

        {/* HOUSEKEEPING STATUS (Cleanliness state) */}
        <div className="card room-status-card">
          <h2 className="card-title">Housekeeping Status</h2>
          <p style={{fontSize: '13px', color: '#6b7280', marginBottom: '16px'}}>
            Room cleanliness condition
          </p>
          <div className="room-status-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
            <div className="room-status-item" style={{borderLeftColor: '#06b6d4'}}>
              <span className="room-status-count">{stats?.rooms?.cleanRooms || 0}</span>
              <span className="room-status-label">Clean</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#fbbf24'}}>
              <span className="room-status-count">{stats?.rooms?.dirtyRooms || 0}</span>
              <span className="room-status-label">Dirty</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#10b981'}}>
              <span className="room-status-count">{stats?.rooms?.inspectedRooms || 0}</span>
              <span className="room-status-label">Inspected</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#a78bfa'}}>
              <span className="room-status-count">{stats?.rooms?.pickupRooms || 0}</span>
              <span className="room-status-label">Pickup Needed</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#f59e0b'}}>
              <span className="room-status-count">{stats?.rooms?.maintenanceRooms || 0}</span>
              <span className="room-status-label">Maintenance</span>
            </div>
            <div className="room-status-item" style={{borderLeftColor: '#6b7280', background: 'transparent', border: '2px dashed #e5e7eb'}}>
              <span style={{fontSize: '11px', color: '#9ca3af', textAlign: 'center', display: 'block', padding: '8px'}}>
                Rooms can have both statuses simultaneously<br/>
                <strong style={{color: '#3b82f6'}}>Example: Reserved + Dirty</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Status Report - NEW */}
      <div className="card" style={{marginBottom: '32px'}}>
        <h2 className="card-title">Combined Status Report (Dual Status)</h2>
        <p style={{fontSize: '13px', color: '#6b7280', marginBottom: '16px'}}>
          Rooms with combined occupancy and housekeeping status
        </p>
        <div className="room-status-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
          <div className="room-status-item" style={{borderLeftColor: '#f97316', background: '#fff7ed'}}>
            <span className="room-status-count">{stats?.rooms?.reservedDirty || 0}</span>
            <span className="room-status-label">Reserved + Dirty</span>
            <span style={{fontSize: '11px', color: '#9ca3af', display: 'block', marginTop: '4px'}}>
              Needs urgent cleaning
            </span>
          </div>
          <div className="room-status-item" style={{borderLeftColor: '#10b981', background: '#f0fdf4'}}>
            <span className="room-status-count">{stats?.rooms?.reservedClean || 0}</span>
            <span className="room-status-label">Reserved + Clean</span>
            <span style={{fontSize: '11px', color: '#9ca3af', display: 'block', marginTop: '4px'}}>
              Ready for arrival
            </span>
          </div>
          <div className="room-status-item" style={{borderLeftColor: '#fbbf24', background: '#fffbeb'}}>
            <span className="room-status-count">{stats?.rooms?.availableDirty || 0}</span>
            <span className="room-status-label">Available + Dirty</span>
            <span style={{fontSize: '11px', color: '#9ca3af', display: 'block', marginTop: '4px'}}>
              Clean before selling
            </span>
          </div>
          <div className="room-status-item" style={{borderLeftColor: '#06b6d4', background: '#ecfeff'}}>
            <span className="room-status-count">{stats?.rooms?.availableClean || 0}</span>
            <span className="room-status-label">Available + Clean</span>
            <span style={{fontSize: '11px', color: '#9ca3af', display: 'block', marginTop: '4px'}}>
              Ready to sell
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        {/* Upcoming Arrivals Chart (Next 7 Days) - Mews style */}
        <div className="card">
          <h2 className="card-title">Upcoming Arrivals (Next 7 Days)</h2>
          {stats?.bookings?.upcomingArrivals && stats.bookings.upcomingArrivals.length > 0 ? (
            <div className="arrival-chart">
              {stats.bookings.upcomingArrivals.map((day, idx) => {
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
                const dateNum = date.getDate();
                const maxCount = Math.max(...stats.bookings.upcomingArrivals.map(d => d.count), 1);
                const barHeight = (day.count / maxCount) * 100;
                
                return (
                  <div key={idx} className="arrival-bar-wrapper">
                    <div className="arrival-bar-container">
                      <div 
                        className="arrival-bar" 
                        style={{height: `${barHeight}%`, background: idx === 0 ? '#3b82f6' : '#93c5fd'}}
                        title={`${day.count} arrivals on ${day.date}`}
                      >
                        {day.count > 0 && <span className="arrival-count">{day.count}</span>}
                      </div>
                    </div>
                    <div className="arrival-label">
                      <div className="arrival-day">{dayName}</div>
                      <div className="arrival-date">{dateNum}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">No upcoming arrivals</p>
          )}
        </div>
      </div>

      {/* Recent Bills Table */}
      <div className="card">
        <h2 className="card-title">Recent Transactions</h2>
        {recentBills.length === 0 ? (
          <p className="no-data">No bills yet. Create your first bill!</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((bill) => (
                  <tr key={bill._id}>
                    <td><strong>{bill.billNumber}</strong></td>
                    <td>{formatDate(bill.date)}</td>
                    <td>{bill.customer.name}</td>
                    <td><strong>{formatCurrency(bill.grandTotal)}</strong></td>
                    <td>
                      <span className={`badge badge-${bill.status === 'Paid' ? 'success' : bill.status === 'Unpaid' ? 'warning' : 'danger'}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's Activity - Arrivals, Departures, In-House (Opera PMS style) */}
      <div className="activity-grid">
        <div className="card">
          <div className="card-header-with-icon">
            <h2 className="card-title">Arrivals Today</h2>
            <span className="card-count">{arrivals.length}</span>
          </div>
          {arrivals.length===0 ? <p className="no-data">No arrivals today</p> : (
            <ul className="guest-list">
              {arrivals.map(b=> (
                <li key={b._id} className="guest-item">
                  <div className="guest-info">
                    <strong>{b.guest?.name}</strong>
                    <span className="guest-room">Room {b.roomNumber}</span>
                  </div>
                  <div className="guest-dates">
                    {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ({b.nights}n)
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="card">
          <div className="card-header-with-icon">
            <h2 className="card-title">Departures Today</h2>
            <span className="card-count">{departures.length}</span>
          </div>
          {departures.length===0 ? <p className="no-data">No departures today</p> : (
            <ul className="guest-list">
              {departures.map(b=> (
                <li key={b._id} className="guest-item">
                  <div className="guest-info">
                    <strong>{b.guest?.name}</strong>
                    <span className="guest-room">Room {b.roomNumber}</span>
                  </div>
                  <div className="guest-dates">
                    {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ({b.nights}n)
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="card">
          <div className="card-header-with-icon">
            <h2 className="card-title">In-House Guests</h2>
            <span className="card-count">{inhouse.length}</span>
          </div>
          {inhouse.length===0 ? <p className="no-data">No in-house guests</p> : (
            <ul className="guest-list">
              {inhouse.slice(0, 10).map(b=> (
                <li key={b._id} className="guest-item">
                  <div className="guest-info">
                    <strong>{b.guest?.name}</strong>
                    <span className="guest-room">Room {b.roomNumber}</span>
                  </div>
                  <div className="guest-balance">
                    Balance: {formatCurrency(b.folio?.balance ?? 0)}
                  </div>
                </li>
              ))}
              {inhouse.length > 10 && (
                <li className="guest-item-more">
                  +{inhouse.length - 10} more guests
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
