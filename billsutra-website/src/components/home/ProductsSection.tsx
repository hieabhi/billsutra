"use client";

import { motion } from "framer-motion";
import { Hotel, Utensils, Pill, ArrowRight } from "lucide-react";
import Link from "next/link";

const products = [
  {
    id: "hms",
    name: "Hotel Management",
    description: "Complete property management with reservations, front desk, housekeeping, and billing.",
    icon: Hotel,
    gradient: "from-blue-500 via-cyan-500 to-blue-600",
    href: "/products/hms",
    status: "Available Now"
  },
  {
    id: "rms",
    name: "Restaurant POS",
    description: "Modern point-of-sale with table management, kitchen display, and inventory control.",
    icon: Utensils,
    gradient: "from-orange-500 via-red-500 to-pink-600",
    href: "/products/rms",
    status: "Coming Q2 2026"
  },
  {
    id: "pms",
    name: "Pharmacy System",
    description: "Prescription management, inventory tracking, and compliance reporting for pharmacies.",
    icon: Pill,
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    href: "/products/pms",
    status: "Coming Q3 2026"
  }
];

export function ProductsSection() {
  return (
    <section id="products" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Choose Your <span className="text-gradient">Solution</span>
          </h2>
          <p className="text-xl text-gray-400">
            Industry-specific software designed for your business needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={product.href} className="group block">
                <div className="glass-strong rounded-3xl p-8 hover:scale-105 transition-all h-full flex flex-col">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform`}>
                    <product.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${
                      product.status === "Available Now" ? "text-green-400" : "text-blue-400"
                    }`}>
                      {product.status}
                    </span>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
