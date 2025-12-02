"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { CheckCircle2, Users, DollarSign, BarChart3, Settings, Shield, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

export default function POSProductPage() {
  const features = [
    { icon: CheckCircle2, label: "Table Management", desc: "Real-time table status and reservations" },
    { icon: Users, label: "Ordering System", desc: "Seamless customer ordering experience" },
    { icon: DollarSign, label: "Payment Processing", desc: "Multiple payment methods integrated" },
    { icon: BarChart3, label: "Analytics", desc: "Sales insights and performance metrics" },
    { icon: Settings, label: "Kitchen Display", desc: "Real-time kitchen order management" },
    { icon: Shield, label: "Inventory", desc: "Stock tracking and automatic reordering" },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-orange-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-red-500/20 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              Restaurant <span className="text-gradient">POS System</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              Next-generation point of sale for modern restaurants. From quick service to fine dining, 
              streamline operations and maximize profitability.
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
            <h2 className="text-3xl font-bold mb-12 text-center">Comprehensive Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform"
                >
                  <feature.icon className="w-10 h-10 text-orange-500 mb-4" />
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
            <h2 className="text-3xl font-bold mb-12 text-center">Why Choose BillSutra POS?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Efficiency</h3>
                <p className="text-gray-400">Reduce order errors, speed up service, and improve customer satisfaction.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Profitability</h3>
                <p className="text-gray-400">Track costs, optimize menu pricing, and maximize margins automatically.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Integration</h3>
                <p className="text-gray-400">Seamlessly integrate with delivery platforms and accounting systems.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Support</h3>
                <p className="text-gray-400">24/7 dedicated support and regular updates included with your plan.</p>
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
