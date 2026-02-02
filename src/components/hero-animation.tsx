"use client"

import { useEffect, useState } from "react"

/**
 * Hero Animation - Motion Graphics Background
 * Shows the cycle: Leads → Phone Calls → Conversions → Happy Clients → Success
 * With accounting/money making theme and communication flow
 */
export function HeroAnimation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/70 z-10" />

      {/* Animated background pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient definitions */}
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="money-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0" />
            <stop offset="50%" stopColor="#1e3a5f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0" />
          </linearGradient>

          {/* Pulse animation */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid pattern */}
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="0.5"
            strokeOpacity="0.05"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Flowing connection lines */}
        <g className="animate-flow">
          {/* Main cycle path */}
          <path
            d="M 100,200 Q 300,100 500,200 T 900,200 Q 1100,300 900,400 T 500,400 Q 300,500 100,400 T 100,200"
            fill="none"
            stroke="url(#connection-gradient)"
            strokeWidth="2"
            strokeDasharray="10,5"
            className="animate-dash"
          />
        </g>

        {/* Cycle nodes - positioned around the hero */}
        <g className="cycle-nodes">
          {/* Node 1: Leads (Database icon representation) */}
          <g transform="translate(150, 150)" className="animate-pulse-slow">
            <circle r="40" fill="#1e3a5f" fillOpacity="0.1" />
            <circle r="30" fill="#1e3a5f" fillOpacity="0.15" />
            <circle r="20" fill="#1e3a5f" fillOpacity="0.2" />
            {/* Database icon */}
            <ellipse cx="0" cy="-8" rx="12" ry="4" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeOpacity="0.4" />
            <path d="M-12,-8 L-12,8 Q0,15 12,8 L12,-8" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeOpacity="0.4" />
            <ellipse cx="0" cy="0" rx="12" ry="4" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeOpacity="0.3" />
            <text x="0" y="55" textAnchor="middle" fill="#1e3a5f" fillOpacity="0.3" fontSize="11" fontWeight="500">LEADS</text>
          </g>

          {/* Node 2: Phone Calls */}
          <g transform="translate(350, 80)" className="animate-pulse-slow delay-1">
            <circle r="35" fill="#3b82f6" fillOpacity="0.1" />
            <circle r="25" fill="#3b82f6" fillOpacity="0.15" />
            {/* Phone icon */}
            <path
              d="M-8,-10 L-4,-10 Q0,-10 0,-6 L0,6 Q0,10 -4,10 L-8,10 Q-12,10 -12,6 L-12,-6 Q-12,-10 -8,-10"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              transform="rotate(-30)"
            />
            {/* Sound waves */}
            <path d="M8,-4 Q12,0 8,4" fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3" />
            <path d="M12,-6 Q18,0 12,6" fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.2" />
            <text x="0" y="50" textAnchor="middle" fill="#3b82f6" fillOpacity="0.3" fontSize="11" fontWeight="500">OUTREACH</text>
          </g>

          {/* Node 3: Conversions (Chart/Growth) */}
          <g transform="translate(600, 100)" className="animate-pulse-slow delay-2">
            <circle r="38" fill="#10b981" fillOpacity="0.1" />
            <circle r="28" fill="#10b981" fillOpacity="0.15" />
            {/* Chart bars */}
            <rect x="-15" y="5" width="6" height="10" fill="#10b981" fillOpacity="0.4" />
            <rect x="-5" y="-2" width="6" height="17" fill="#10b981" fillOpacity="0.4" />
            <rect x="5" y="-10" width="6" height="25" fill="#10b981" fillOpacity="0.4" />
            {/* Arrow up */}
            <path d="M-10,-15 L15,-15 L8,-8" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
            <text x="0" y="55" textAnchor="middle" fill="#10b981" fillOpacity="0.3" fontSize="11" fontWeight="500">CONVERSIONS</text>
          </g>

          {/* Node 4: Happy Clients (People/Hearts) */}
          <g transform="translate(850, 180)" className="animate-pulse-slow delay-3">
            <circle r="40" fill="#f59e0b" fillOpacity="0.1" />
            <circle r="30" fill="#f59e0b" fillOpacity="0.15" />
            {/* Person icon */}
            <circle cx="0" cy="-5" r="6" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
            <path d="M-10,15 Q-10,5 0,5 Q10,5 10,15" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
            {/* Heart */}
            <path
              d="M12,-8 C14,-12 18,-10 18,-6 C18,-2 12,4 12,4 C12,4 6,-2 6,-6 C6,-10 10,-12 12,-8"
              fill="#f59e0b"
              fillOpacity="0.3"
              transform="scale(0.6) translate(10,-5)"
            />
            <text x="0" y="55" textAnchor="middle" fill="#f59e0b" fillOpacity="0.3" fontSize="11" fontWeight="500">HAPPY CLIENTS</text>
          </g>

          {/* Node 5: Success/Money */}
          <g transform="translate(950, 350)" className="animate-pulse-slow delay-4">
            <circle r="45" fill="#10b981" fillOpacity="0.1" />
            <circle r="35" fill="#10b981" fillOpacity="0.15" />
            <circle r="25" fill="#10b981" fillOpacity="0.2" />
            {/* Dollar sign */}
            <text x="0" y="8" textAnchor="middle" fill="#10b981" fillOpacity="0.5" fontSize="28" fontWeight="bold">$</text>
            <text x="0" y="60" textAnchor="middle" fill="#10b981" fillOpacity="0.3" fontSize="11" fontWeight="500">SUCCESS</text>
          </g>
        </g>

        {/* Floating money particles */}
        <g className="money-particles">
          {[...Array(12)].map((_, i) => (
            <g key={i} className={`animate-float delay-${i % 5}`}>
              <text
                x={100 + (i * 90)}
                y={80 + (i % 3) * 150}
                fill="#10b981"
                fillOpacity={0.1 + (i % 3) * 0.05}
                fontSize={14 + (i % 3) * 4}
              >
                $
              </text>
            </g>
          ))}
        </g>

        {/* Connection arrows between nodes */}
        <g className="connections" strokeOpacity="0.15">
          {/* Leads to Outreach */}
          <line x1="180" y1="140" x2="320" y2="100" stroke="#1e3a5f" strokeWidth="2" strokeDasharray="4,4" className="animate-dash" />
          <polygon points="315,95 325,100 315,105" fill="#1e3a5f" fillOpacity="0.2" />

          {/* Outreach to Conversions */}
          <line x1="380" y1="90" x2="560" y2="100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" className="animate-dash delay-1" />
          <polygon points="555,95 565,100 555,105" fill="#3b82f6" fillOpacity="0.2" />

          {/* Conversions to Happy Clients */}
          <line x1="640" y1="110" x2="810" y2="170" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" className="animate-dash delay-2" />
          <polygon points="805,165 815,175 805,180" fill="#10b981" fillOpacity="0.2" />

          {/* Happy Clients to Success */}
          <line x1="880" y1="200" x2="920" y2="320" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" className="animate-dash delay-3" />
          <polygon points="915,315 925,325 920,315" fill="#f59e0b" fillOpacity="0.2" />
        </g>

        {/* Circular flow indicator */}
        <g transform="translate(550, 280)">
          <circle r="100" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="8,8" className="animate-spin-slow" />
          <circle r="120" fill="none" stroke="#10b981" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="12,12" className="animate-spin-reverse" />
        </g>

        {/* Data flow dots */}
        <g className="data-dots">
          {[...Array(8)].map((_, i) => (
            <circle
              key={i}
              r="3"
              fill="#1e3a5f"
              fillOpacity="0.2"
              className={`animate-travel-${i % 4}`}
            >
              <animateMotion
                dur={`${4 + i}s`}
                repeatCount="indefinite"
                path={`M ${100 + i * 100},200 Q ${200 + i * 50},${100 + (i % 2) * 100} ${300 + i * 100},200`}
              />
            </circle>
          ))}
        </g>
      </svg>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
            opacity: 0.2;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-dash {
          animation: dash 2s linear infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
          transform-origin: center;
        }

        .animate-spin-reverse {
          animation: spin-reverse 40s linear infinite;
          transform-origin: center;
        }

        .delay-1 { animation-delay: 0.5s; }
        .delay-2 { animation-delay: 1s; }
        .delay-3 { animation-delay: 1.5s; }
        .delay-4 { animation-delay: 2s; }
        .delay-5 { animation-delay: 2.5s; }
      `}</style>
    </div>
  )
}
