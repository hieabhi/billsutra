"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { X, Menu, Search, Bell, User, ChevronDown, Calendar, Users, DollarSign, BedDouble, ClipboardList, Settings, BarChart3, Home as HomeIcon } from "lucide-react";

export default function HMSDemo() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const stats = [
    { label: "Total Revenue", value: "$45,280", change: "+12.5%", icon: DollarSign, color: "from-emerald-500 to-green-600" },
    { label: "Occupancy Rate", value: "87%", change: "+5.2%", icon: BedDouble, color: "from-blue-500 to-indigo-600" },
    { label: "Total Guests", value: "234", change: "+18%", icon: Users, color: "from-purple-500 to-pink-600" },
    { label: "Avg. Daily Rate", value: "$185", change: "+3.8%", icon: BarChart3, color: "from-orange-500 to-red-600" },
  ];

  const recentBookings = [
    { id: "BK-001", guest: "John Smith", room: "201", checkIn: "Nov 27", checkOut: "Nov 30", status: "Confirmed", amount: "$450" },
    { id: "BK-002", guest: "Sarah Johnson", room: "305", checkIn: "Nov 28", checkOut: "Dec 02", status: "Checked In", amount: "$720" },
    { id: "BK-003", guest: "Michael Brown", room: "102", checkIn: "Nov 27", checkOut: "Nov 29", status: "Pending", amount: "$380" },
    { id: "BK-004", guest: "Emily Davis", room: "408", checkIn: "Nov 29", checkOut: "Dec 05", status: "Confirmed", amount: "$950" },
  ];

  const rooms = [
    { number: "101", type: "Deluxe", status: "Vacant Clean", rate: "$150" },
    { number: "102", type: "Standard", status: "Occupied", rate: "$120" },
    { number: "201", type: "Suite", status: "Occupied", rate: "$250" },
    { number: "202", type: "Deluxe", status: "Dirty", rate: "$150" },
    { number: "301", type: "Standard", status: "Vacant Clean", rate: "$120" },
    { number: "302", type: "Suite", status: "Reserved", rate: "$250" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-6 text-center">
        <p className="text-sm font-semibold">
          🎯 Interactive Demo Mode - Explore BillSutra HMS Features
        </p>
      </div>

      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xl">
                B
              </div>
              <span className="text-xl font-bold">BillSutra HMS</span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search guests, bookings, rooms..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold">Demo User</div>
                <div className="text-gray-500 text-xs">Administrator</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900/50 border-r border-white/10 min-h-[calc(100vh-120px)]">
          <nav className="p-4 space-y-2">
            {[
              { id: "dashboard", icon: HomeIcon, label: "Dashboard" },
              { id: "bookings", icon: Calendar, label: "Bookings" },
              { id: "rooms", icon: BedDouble, label: "Room Management" },
              { id: "guests", icon: Users, label: "Guests" },
              { id: "housekeeping", icon: ClipboardList, label: "Housekeeping" },
              { id: "reports", icon: BarChart3, label: "Reports" },
              { id: "settings", icon: Settings, label: "Settings" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                    <div className="text-3xl font-bold mb-2">{stat.value}</div>
                    <div className="text-sm text-emerald-500 font-semibold">{stat.change} vs last month</div>
                  </motion.div>
                ))}
              </div>

              {/* Chart */}
              <div className="glass-strong rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">Revenue Trend (Last 30 Days)</h2>
                <div className="h-64 flex items-end gap-2">
                  {[42, 68, 55, 78, 62, 85, 70, 92, 75, 88, 95, 82, 90, 78, 85, 92, 88, 95, 85, 90, 78, 88, 92, 85, 95, 88, 90, 85, 92, 98].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: i * 0.02 }}
                      className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-400/80 rounded-t-lg hover:from-blue-500/60 hover:to-blue-400/100 transition-all cursor-pointer"
                    />
                  ))}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="glass-strong rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Recent Bookings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                        <th className="pb-3 font-semibold">Booking ID</th>
                        <th className="pb-3 font-semibold">Guest Name</th>
                        <th className="pb-3 font-semibold">Room</th>
                        <th className="pb-3 font-semibold">Check In</th>
                        <th className="pb-3 font-semibold">Check Out</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking, i) => (
                        <motion.tr
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 font-mono text-sm text-blue-400">{booking.id}</td>
                          <td className="py-4">{booking.guest}</td>
                          <td className="py-4 font-semibold">{booking.room}</td>
                          <td className="py-4 text-sm text-gray-400">{booking.checkIn}</td>
                          <td className="py-4 text-sm text-gray-400">{booking.checkOut}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === "Checked In" ? "bg-green-500/20 text-green-400" :
                              booking.status === "Confirmed" ? "bg-blue-500/20 text-blue-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-4 font-semibold">{booking.amount}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "rooms" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold mb-8">Room Management</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room, i) => (
                  <motion.div
                    key={room.number}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold mb-1">Room {room.number}</div>
                        <div className="text-sm text-gray-400">{room.type}</div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">{room.rate}</div>
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      room.status === "Vacant Clean" ? "bg-green-500/20 text-green-400" :
                      room.status === "Occupied" ? "bg-blue-500/20 text-blue-400" :
                      room.status === "Reserved" ? "bg-purple-500/20 text-purple-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {room.status}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab !== "dashboard" && activeTab !== "rooms" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {activeTab === "bookings" && <Calendar className="w-10 h-10" />}
                {activeTab === "guests" && <Users className="w-10 h-10" />}
                {activeTab === "housekeeping" && <ClipboardList className="w-10 h-10" />}
                {activeTab === "reports" && <BarChart3 className="w-10 h-10" />}
                {activeTab === "settings" && <Settings className="w-10 h-10" />}
              </div>
              <h2 className="text-3xl font-bold mb-4 capitalize">{activeTab}</h2>
              <p className="text-xl text-gray-400 mb-8">
                This section is available in the full BillSutra HMS application.
              </p>
              <a
                href="/demo"
                className="inline-block px-8 py-4 rounded-2xl bg-white text-gray-950 font-bold hover:scale-105 transition-transform"
              >
                Download Full Version
              </a>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
