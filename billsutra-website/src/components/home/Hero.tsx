"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={containerRef} className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 noise-bg" />
      
      {/* Floating Orbs */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute top-20 left-[10%] w-96 h-96 bg-blue-500/30 rounded-full blur-[120px] animate-float"
      />
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "30%"]), opacity }}
        className="absolute top-40 right-[10%] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px] animate-float"
        transition={{ delay: 1 }}
      />
      <motion.div 
        className="absolute bottom-20 left-[30%] w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong text-sm font-medium mb-10 group hover:scale-105 transition-transform cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-gradient-gold">Introducing BillSutra v2.0 Enterprise</span>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl font-black tracking-[-0.02em] mb-8 leading-[0.95]"
          >
            <span className="block">The Future of</span>
            <span className="block text-gradient mt-2">Business Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl leading-relaxed font-light"
          >
            Transform chaos into clarity. BillSutra orchestrates your entire operation 
            with <span className="text-white font-medium">AI-powered intelligence</span>, real-time analytics, 
            and <span className="text-white font-medium">breathtaking simplicity</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto mb-16"
          >
            <Link
              href="/demo"
              className="group relative w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-gray-950 font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-3">
                <span className="group-hover:text-white transition-colors">Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 group-hover:text-white transition-all" />
              </div>
            </Link>
            <Link
              href="/demo"
              className="group w-full sm:w-auto px-10 py-5 rounded-2xl glass-strong font-semibold text-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 -ml-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 mb-20"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Free 14-day trial</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>No credit card</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-700" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>

        {/* Premium 3D Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-7xl perspective-1000"
        >
          <div className="relative rounded-3xl border border-white/10 glass-strong shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden aspect-[16/9] group transform-3d hover:scale-[1.02] transition-all duration-500">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Top Bar */}
            <div className="relative h-14 border-b border-white/10 flex items-center px-6 gap-6 bg-gray-900/80 backdrop-blur-xl">
              <div className="flex gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
              </div>
              <div className="h-8 flex-1 max-w-md rounded-lg bg-white/5 border border-white/10 px-4 flex items-center text-xs text-gray-500">
                billsutra.app/dashboard
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-8 grid grid-cols-12 gap-6 h-full bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl">
              {/* Sidebar */}
              <div className="col-span-2 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="h-10 w-full rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-blue-500/20 hover:to-indigo-500/20 border border-white/5 transition-all cursor-pointer"
                  />
                ))}
              </div>
              
              {/* Main Content */}
              <div className="col-span-10 grid grid-cols-3 gap-6">
                {/* Stat Cards */}
                {[
                  { label: "Revenue", value: "$125.5K", change: "+12.5%", color: "from-emerald-500 to-green-600" },
                  { label: "Bookings", value: "1,284", change: "+8.2%", color: "from-blue-500 to-indigo-600" },
                  { label: "Occupancy", value: "94.2%", change: "+3.1%", color: "from-purple-500 to-pink-600" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="h-36 rounded-2xl glass-strong p-6 hover:scale-105 transition-all cursor-pointer group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <div className="w-6 h-6 bg-white/20 rounded-lg" />
                    </div>
                    <div className="h-3 w-20 rounded bg-white/10 mb-3" />
                    <div className="h-6 w-24 rounded bg-white/30" />
                  </motion.div>
                ))}
                
                {/* Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="col-span-3 h-72 rounded-2xl glass-strong p-6 flex flex-col"
                >
                  <div className="h-6 w-32 rounded bg-white/20 mb-6" />
                  <div className="flex-1 flex items-end gap-3 px-2">
                    {[65, 85, 70, 95, 75, 90, 60, 80, 70, 98, 88, 75].map((height, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 1.3 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-400/80 rounded-t-lg hover:from-blue-500/60 hover:to-blue-400/100 transition-all cursor-pointer relative group"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="px-2 py-1 rounded bg-gray-900 text-xs text-white whitespace-nowrap shadow-lg">
                            ${(height * 1.2).toFixed(1)}K
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Multi-layered glow */}
          <div className="absolute -inset-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-30 blur-3xl -z-10 animate-glow" />
          <div className="absolute -inset-12 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-[100px] -z-20" />
        </motion.div>
      </div>
    </section>
  );
}
