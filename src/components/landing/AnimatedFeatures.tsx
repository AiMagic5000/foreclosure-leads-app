"use client";

import { motion } from "framer-motion";
import { Database, Phone, Shield, Zap, MapPin, Clock } from "lucide-react";

const FEATURES = [
  {
    icon: Database,
    title: "Daily Fresh Leads",
    description:
      "Our proprietary system scrapes county recorders, public trustees, and auction sites every 24 hours across 30+ non-judicial states.",
  },
  {
    icon: Phone,
    title: "Skip-Traced Contacts",
    description:
      "Every lead includes phone numbers, emails, and mailing addresses found through FastPeopleSearch and TruePeopleSearch.",
  },
  {
    icon: Shield,
    title: "DNC Compliant",
    description:
      "Automatic scrubbing against Federal and State Do Not Call registries. Stay compliant, avoid fines.",
  },
  {
    icon: Zap,
    title: "Voicemail Automation",
    description:
      "Optional add-on delivers personalized ringless voicemails with premium voice over generation.",
  },
  {
    icon: MapPin,
    title: "3,200+ Counties Covered",
    description:
      "Access leads from 30+ non-judicial states and 3,200+ counties. Filter by foreclosure type, sale date, surplus amount, and more.",
  },
  {
    icon: Clock,
    title: "Real-Time Dashboard",
    description:
      "Mobile-first interface to access leads, track outreach, export data, and manage your pipeline anywhere.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 110, damping: 15 },
  },
};

export function AnimatedFeatures() {
  return (
    <div className="relative">
      {/* Animated dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1e3a5f 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Animated gradient blobs */}
      <motion.div
        className="pointer-events-none absolute -top-20 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl"
        animate={{ x: [0, 60, -40, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-20 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl"
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            variants={cardVariants}
            whileHover={{ y: -6, transition: { duration: 0.18 } }}
            className="group relative bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-2xl transition-shadow overflow-hidden"
          >
            {/* Animated gradient border on hover */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(120deg, #1e3a5f, #3b82f6, #10b981, #3b82f6, #1e3a5f)",
                backgroundSize: "300% 300%",
                padding: "2px",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />

            {/* Icon with continuous subtle pulse + hover rotate */}
            <motion.div
              className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#3b82f6] flex items-center justify-center mb-4 shadow-lg"
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 3 + (i % 3) * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
              whileHover={{
                rotate: [0, -8, 8, -4, 0],
                scale: 1.1,
                transition: { duration: 0.5 },
              }}
            >
              {/* Icon glow */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-blue-400/40 blur-xl"
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
              <feature.icon className="relative h-7 w-7 text-white drop-shadow-md" />
            </motion.div>

            <h3 className="relative text-lg font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="relative text-gray-600 text-sm leading-relaxed">
              {feature.description}
            </p>

            {/* Animated accent line at bottom */}
            <motion.div
              className="absolute bottom-0 left-6 right-6 h-1 origin-left rounded-full bg-gradient-to-r from-[#1e3a5f] via-[#3b82f6] to-[#10b981]"
              animate={{ scaleX: [0, 0.4, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
