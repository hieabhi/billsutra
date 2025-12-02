"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { CheckCircle2, Package, DollarSign, AlertCircle, TrendingUp, Shield, Zap, Pill } from "lucide-react";

export default function PharmacyProductPage() {
  const features = [
    { icon: CheckCircle2, label: "Inventory Management", desc: "Real-time stock tracking and analytics" },
    { icon: Package, label: "Expiry Tracking", desc: "Automated expiry alerts and removal" },
    { icon: DollarSign, label: "Smart Reordering", desc: "Predictive reordering to avoid stockouts" },
    { icon: TrendingUp, label: "Sales Analytics", desc: "Detailed sales patterns and trends" },
    { icon: AlertCircle, label: "Compliance", desc: "Meet all regulatory requirements automatically" },
    { icon: Shield, label: "Data Security", desc: "HIPAA-compliant data protection" },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-green-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Pill className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              Pharmacy <span className="text-gradient">Management System</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              Complete pharmacy solution with intelligent inventory management, compliance tracking, and 
              automated alerts to keep your pharmacy running smoothly and profitably.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 rounded-2xl bg-white text-gray-950 font-bold hover:scale-105 transition-transform">
                Try Live Demo
              </button>
              <button className="px-8 py-4 rounded-2xl glass-strong font-semibold hover:scale-105 transition-transform">
                Request Demo Call
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto mb-24"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform"
                >
                  <feature.icon className="w-10 h-10 text-green-500 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{feature.label}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-4xl mx-auto glass-strong rounded-3xl p-12"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Why Pharmacies Choose BillSutra</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <Zap className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Prevent Stockouts</h3>
                  <p className="text-gray-400">AI-powered predictions ensure you never run out of critical medicines.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Reduce Waste</h3>
                  <p className="text-gray-400">Automated expiry tracking eliminates losses from expired medications.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Increase Revenue</h3>
                  <p className="text-gray-400">Data-driven insights help optimize pricing and margins.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Stay Compliant</h3>
                  <p className="text-gray-400">Built-in compliance reporting for all regulatory requirements.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} BillSutra. All rights reserved.</p>
      </footer>
    </main>
  );
}
