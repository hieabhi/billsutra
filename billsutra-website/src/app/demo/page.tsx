"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Play, Download, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-float" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              Experience <span className="text-gradient">BillSutra HMS</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              Watch our comprehensive video tutorial and try the live demo of our Hotel Management System.
            </p>
          </motion.div>

          {/* Video Tutorial Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto mb-20"
          >
            <div className="glass-strong rounded-3xl p-2 shadow-2xl">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20" />
                
                {/* Video Placeholder - Replace with actual video */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                      <Play className="w-12 h-12 text-white fill-white ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">BillSutra HMS Complete Tutorial</h3>
                    <p className="text-gray-400">15 minutes • Learn all features</p>
                  </div>
                </div>

                {/* When you have a video, replace the above with: */}
                {/* <video 
                  controls 
                  className="w-full h-full"
                  poster="/path-to-thumbnail.jpg"
                >
                  <source src="/path-to-video.mp4" type="video/mp4" />
                </video> */}
              </div>
            </div>
          </motion.div>

          {/* Tutorial Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-4xl mx-auto mb-20"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">What You'll Learn</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Complete booking workflow from reservation to checkout",
                "Room management and housekeeping coordination",
                "Guest billing and payment processing",
                "Real-time dashboard and analytics",
                "Food & beverage integration",
                "Reports and financial management"
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl glass hover:glass-strong transition-all"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Live Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass-strong rounded-3xl p-8 md:p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Try the Live Demo</h2>
              <p className="text-xl text-gray-400 mb-8">
                Download and run BillSutra HMS on your Windows computer
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/hms-demo"
                  className="group px-8 py-4 rounded-2xl bg-white text-gray-950 font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/50"
                >
                  <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Launch Interactive Demo
                </Link>
                
                <a
                  href="/downloads/BillSutra-HMS-Setup.exe"
                  download
                  className="px-8 py-4 rounded-2xl glass-strong font-semibold text-lg hover:scale-105 transition-all flex items-center justify-center gap-3 hover:glass-strong group cursor-pointer"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce transition-all" />
                  Download Desktop App
                </a>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>Windows 10/11</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>No installation required</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>Sample data included</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
