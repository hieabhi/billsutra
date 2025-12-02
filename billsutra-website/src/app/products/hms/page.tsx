"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Hotel, Calendar, Users, BedDouble, ClipboardList, DollarSign, BarChart3, Sparkles, CheckCircle2, Play } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Calendar,
    title: "Online Booking Engine",
    description: "Integrated reservation system with real-time availability, channel manager connectivity, and automated confirmations."
  },
  {
    icon: BedDouble,
    title: "Room Management",
    description: "Visual floor plans, 8-state room status workflow (Available, Occupied, Dirty, Clean, Inspected, Maintenance), and bulk operations."
  },
  {
    icon: Users,
    title: "Front Desk Operations",
    description: "Quick check-in/check-out, guest ID verification, group bookings, and walk-in management with real-time dashboard."
  },
  {
    icon: ClipboardList,
    title: "Housekeeping Automation",
    description: "Auto-task generation on checkout, priority scoring, mobile app integration, and performance tracking with 6 task types."
  },
  {
    icon: DollarSign,
    title: "Smart Folio & Billing",
    description: "GST-compliant invoicing, item master integration, multiple payment methods, advance payments, and negative balance support."
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time KPIs: Occupancy Rate, ADR, RevPAR, 30-day revenue trends, guest analytics, and customizable reports."
  }
];

const metrics = [
  { label: "Occupancy Tracking", value: "Real-time" },
  { label: "Room Types", value: "Unlimited" },
  { label: "Concurrent Bookings", value: "Unlimited" },
  { label: "Multi-property", value: "Supported" }
];

const pricingPlans = [
  {
    name: "Basic",
    price: "₹9,999",
    period: "/year",
    features: [
      "Up to 20 rooms",
      "5 staff accounts",
      "Basic reporting",
      "Email support",
      "Dashboard & KPIs"
    ],
    highlighted: false
  },
  {
    name: "Professional",
    price: "₹19,999",
    period: "/year",
    features: [
      "Up to 50 rooms",
      "15 staff accounts",
      "Advanced analytics",
      "Priority support",
      "All Basic features",
      "Housekeeping automation"
    ],
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "₹39,999",
    period: "/year",
    features: [
      "Unlimited rooms",
      "Unlimited staff",
      "API access",
      "24/7 phone support",
      "All Professional features",
      "Custom integrations"
    ],
    highlighted: false
  }
];

export default function HMSPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-float" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong text-sm font-medium mb-6">
                <Hotel className="w-4 h-4 text-blue-400" />
                <span>Hotel Management System</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
                Run Your Hotel Like a <span className="text-gradient">Fortune 500</span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Complete property management system trusted by hotels across India. From boutique properties to hotel chains—streamline operations, maximize revenue, and delight guests.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/hms-demo"
                  className="px-8 py-4 rounded-2xl bg-white text-gray-950 font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" />
                  Try Interactive Demo
                </Link>
                <Link
                  href="/demo"
                  className="px-8 py-4 rounded-2xl glass-strong font-semibold text-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  Watch Video Tutorial
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {metrics.map((metric, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{metric.value}</div>
                    <div className="text-sm text-gray-500">{metric.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-strong rounded-3xl p-6 shadow-2xl">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center mb-4">
                  <Hotel className="w-24 h-24 text-blue-500/20" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="h-12 bg-blue-500/20 rounded-xl" />
                    <div className="h-12 bg-green-500/20 rounded-xl" />
                    <div className="h-12 bg-purple-500/20 rounded-xl" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Everything You Need to <span className="text-gradient">Succeed</span>
            </h2>
            <p className="text-xl text-gray-400">
              Built on industry standards from Opera PMS, Mews, and Cloudbeds
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h2>
            <p className="text-xl text-gray-400">
              Choose the plan that fits your property size. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-3xl p-8 ${
                  plan.highlighted 
                    ? 'glass-strong border-2 border-blue-500 scale-105' 
                    : 'glass'
                }`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="px-4 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/demo"
                  className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'glass-strong hover:bg-white/10'
                  }`}
                >
                  Start Free Trial
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-12">
            All plans include 14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-12 text-center"
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Hotel?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join hundreds of hotels already using BillSutra HMS to streamline operations and maximize revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/hms-demo"
                className="px-8 py-4 rounded-2xl bg-white text-gray-950 font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Try Interactive Demo
              </Link>
              <Link
                href="mailto:contact@billsutra.com"
                className="px-8 py-4 rounded-2xl glass-strong font-semibold text-lg hover:scale-105 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
