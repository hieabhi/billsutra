"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Hotel, Utensils, Pill, BarChart3, Users, ShieldCheck, Zap } from "lucide-react";
import { useRef, MouseEvent } from "react";

const features = [
  {
    title: "Hotel Management",
    description: "AI-powered property management with predictive booking engine, smart housekeeping, and guest experience automation.",
    icon: Hotel,
    gradient: "from-blue-500 via-cyan-500 to-blue-600",
    glowColor: "rgba(59, 130, 246, 0.4)",
  },
  {
    title: "Restaurant POS",
    description: "Next-gen point of sale with real-time kitchen orchestration, dynamic menu management, and contactless ordering.",
    icon: Utensils,
    gradient: "from-orange-500 via-red-500 to-pink-600",
    glowColor: "rgba(249, 115, 22, 0.4)",
  },
  {
    title: "Pharmacy System",
    description: "Intelligent inventory with expiry prediction, automated reordering, and regulatory compliance built-in.",
    icon: Pill,
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    glowColor: "rgba(34, 197, 94, 0.4)",
  },
  {
    title: "Advanced Analytics",
    description: "Real-time business intelligence with predictive insights, custom dashboards, and AI-powered recommendations.",
    icon: BarChart3,
    gradient: "from-purple-500 via-fuchsia-500 to-pink-600",
    glowColor: "rgba(168, 85, 247, 0.4)",
  },
  {
    title: "CRM & Loyalty",
    description: "Unified customer profiles with behavioral analytics, automated campaigns, and gamified loyalty programs.",
    icon: Users,
    gradient: "from-indigo-500 via-violet-500 to-purple-600",
    glowColor: "rgba(99, 102, 241, 0.4)",
  },
  {
    title: "Enterprise Security",
    description: "Military-grade encryption, zero-trust architecture, role-based access, and automated compliance reporting.",
    icon: ShieldCheck,
    gradient: "from-slate-500 via-gray-500 to-zinc-600",
    glowColor: "rgba(100, 116, 139, 0.4)",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), { stiffness: 400, damping: 30 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative p-8 rounded-3xl glass-strong hover:glass transition-all overflow-hidden cursor-pointer"
    >
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700`}
        style={{ transform: "translateZ(-50px)" }}
      />
      
      <div 
        className="absolute -inset-[100px] opacity-0 group-hover:opacity-100 blur-[60px] transition-opacity duration-500"
        style={{ 
          background: `radial-gradient(circle at center, ${feature.glowColor}, transparent 70%)`,
          transform: "translateZ(-100px)"
        }}
      />

      <motion.div 
        className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-2xl`}
        style={{ transform: "translateZ(50px)" }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <feature.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
      
      <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient transition-all relative" style={{ transform: "translateZ(30px)" }}>
        {feature.title}
      </h3>
      
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors relative" style={{ transform: "translateZ(20px)" }}>
        {feature.description}
      </p>

      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="solutions" className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-gradient">Powered by Advanced AI</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight"
          >
            One Platform,{" "}
            <span className="text-gradient block mt-2">Infinite Possibilities</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 leading-relaxed"
          >
            From boutique hotels to enterprise chains, fine dining to quick service, 
            independent pharmacies to retail networks—BillSutra adapts to your world 
            with <span className="text-white font-semibold">unmatched intelligence</span>.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 p-8 rounded-3xl glass-strong grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "50K+", label: "Active Users" },
            { value: "99.99%", label: "Uptime SLA" },
            { value: "24/7", label: "Support" },
            { value: "<100ms", label: "Response Time" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="text-center group cursor-pointer"
            >
              <div className="text-4xl md:text-5xl font-black text-gradient mb-2 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
