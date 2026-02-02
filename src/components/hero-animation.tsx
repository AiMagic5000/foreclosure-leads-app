"use client"

import { useEffect, useState } from "react"

/**
 * Hero Animation - Motion Graphics Background
 * Shows the cycle: Leads → Phone Calls → Conversions → Happy Clients → Success
 * Highly visible animated background with the business flow
 */
export function HeroAnimation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Semi-transparent overlay for text readability */}
      <div className="absolute inset-0 bg-white/80 z-10" />

      {/* Animated SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated dash pattern */}
          <pattern id="movingDots" patternUnits="userSpaceOnUse" width="20" height="20">
            <circle cx="10" cy="10" r="2" fill="#1e3a5f" opacity="0.3">
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2s" repeatCount="indefinite" />
            </circle>
          </pattern>
        </defs>

        {/* Background grid */}
        <rect width="100%" height="100%" fill="url(#movingDots)" />

        {/* Flowing curved path connecting all nodes */}
        <path
          d="M 100,350 C 250,150 350,150 450,250 S 650,450 750,350 S 950,150 1100,350"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="3"
          strokeOpacity="0.2"
          strokeDasharray="15,10"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-50" dur="2s" repeatCount="indefinite" />
        </path>

        {/* NODE 1: LEADS - Database Icon */}
        <g transform="translate(120, 320)">
          {/* Pulsing circle background */}
          <circle r="60" fill="#1e3a5f" fillOpacity="0.1">
            <animate attributeName="r" values="55;65;55" dur="3s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.05;0.15;0.05" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r="45" fill="#1e3a5f" fillOpacity="0.15" />

          {/* Database icon */}
          <ellipse cx="0" cy="-12" rx="20" ry="8" fill="none" stroke="#1e3a5f" strokeWidth="3" />
          <path d="M-20,-12 L-20,12 Q0,25 20,12 L20,-12" fill="none" stroke="#1e3a5f" strokeWidth="3" />
          <ellipse cx="0" cy="0" rx="20" ry="8" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeOpacity="0.5" />
          <ellipse cx="0" cy="12" rx="20" ry="8" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeOpacity="0.3" />

          {/* Label */}
          <text x="0" y="80" textAnchor="middle" fill="#1e3a5f" fontSize="16" fontWeight="600">LEADS</text>
          <text x="0" y="98" textAnchor="middle" fill="#64748b" fontSize="11">Fresh Data Daily</text>
        </g>

        {/* Animated arrow from Leads to Outreach */}
        <g>
          <line x1="190" y1="300" x2="310" y2="220" stroke="url(#blueGradient)" strokeWidth="3" strokeOpacity="0.4">
            <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
          </line>
          {/* Moving dot along path */}
          <circle r="6" fill="#3b82f6">
            <animateMotion dur="2s" repeatCount="indefinite" path="M190,300 L310,220" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* NODE 2: OUTREACH - Phone Icon */}
        <g transform="translate(380, 180)">
          <circle r="55" fill="#3b82f6" fillOpacity="0.1">
            <animate attributeName="r" values="50;60;50" dur="3s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle r="40" fill="#3b82f6" fillOpacity="0.15" />

          {/* Phone icon */}
          <rect x="-12" y="-20" width="24" height="40" rx="4" fill="none" stroke="#3b82f6" strokeWidth="3" />
          <line x1="-6" y1="14" x2="6" y2="14" stroke="#3b82f6" strokeWidth="2" />

          {/* Sound waves */}
          <path d="M18,-8 Q26,0 18,8" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.6">
            <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
          </path>
          <path d="M24,-14 Q36,0 24,14" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4">
            <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="1s" repeatCount="indefinite" begin="0.3s" />
          </path>

          <text x="0" y="75" textAnchor="middle" fill="#3b82f6" fontSize="16" fontWeight="600">OUTREACH</text>
          <text x="0" y="93" textAnchor="middle" fill="#64748b" fontSize="11">Automated Calls</text>
        </g>

        {/* Arrow from Outreach to Conversions */}
        <g>
          <line x1="450" y1="200" x2="550" y2="280" stroke="url(#blueGradient)" strokeWidth="3" strokeOpacity="0.4">
            <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </line>
          <circle r="6" fill="#10b981">
            <animateMotion dur="2s" repeatCount="indefinite" path="M450,200 L550,280" begin="0.5s" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </circle>
        </g>

        {/* NODE 3: CONVERSIONS - Chart Icon */}
        <g transform="translate(620, 340)">
          <circle r="55" fill="#10b981" fillOpacity="0.1">
            <animate attributeName="r" values="50;60;50" dur="3s" repeatCount="indefinite" begin="1s" />
          </circle>
          <circle r="40" fill="#10b981" fillOpacity="0.15" />

          {/* Bar chart */}
          <rect x="-22" y="5" width="12" height="20" fill="#10b981" fillOpacity="0.7">
            <animate attributeName="height" values="10;20;10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="y" values="15;5;15" dur="2s" repeatCount="indefinite" />
          </rect>
          <rect x="-6" y="-5" width="12" height="30" fill="#10b981" fillOpacity="0.8">
            <animate attributeName="height" values="20;30;20" dur="2s" repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="y" values="5;-5;5" dur="2s" repeatCount="indefinite" begin="0.3s" />
          </rect>
          <rect x="10" y="-15" width="12" height="40" fill="#10b981">
            <animate attributeName="height" values="30;40;30" dur="2s" repeatCount="indefinite" begin="0.6s" />
            <animate attributeName="y" values="-5;-15;-5" dur="2s" repeatCount="indefinite" begin="0.6s" />
          </rect>

          {/* Trend arrow */}
          <path d="M-25,-20 L25,-25 L18,-18" fill="none" stroke="#10b981" strokeWidth="3" />

          <text x="0" y="75" textAnchor="middle" fill="#10b981" fontSize="16" fontWeight="600">CONVERSIONS</text>
          <text x="0" y="93" textAnchor="middle" fill="#64748b" fontSize="11">Deals Closed</text>
        </g>

        {/* Arrow from Conversions to Happy Clients */}
        <g>
          <line x1="690" y1="320" x2="790" y2="240" stroke="url(#greenGradient)" strokeWidth="3" strokeOpacity="0.4">
            <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="1s" />
          </line>
          <circle r="6" fill="#f59e0b">
            <animateMotion dur="2s" repeatCount="indefinite" path="M690,320 L790,240" begin="1s" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1s" />
          </circle>
        </g>

        {/* NODE 4: HAPPY CLIENTS - Person with Heart */}
        <g transform="translate(860, 200)">
          <circle r="55" fill="#f59e0b" fillOpacity="0.1">
            <animate attributeName="r" values="50;60;50" dur="3s" repeatCount="indefinite" begin="1.5s" />
          </circle>
          <circle r="40" fill="#f59e0b" fillOpacity="0.15" />

          {/* Person icon */}
          <circle cx="-5" cy="-10" r="10" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <path d="M-20,25 Q-20,5 -5,5 Q10,5 10,25" fill="none" stroke="#f59e0b" strokeWidth="3" />

          {/* Heart */}
          <path d="M18,-5 C20,-10 26,-8 26,-3 C26,2 18,10 18,10 C18,10 10,2 10,-3 C10,-8 16,-10 18,-5" fill="#f59e0b">
            <animate attributeName="transform" values="scale(1);scale(1.2);scale(1)" dur="1s" repeatCount="indefinite" />
          </path>

          <text x="0" y="75" textAnchor="middle" fill="#f59e0b" fontSize="16" fontWeight="600">HAPPY CLIENTS</text>
          <text x="0" y="93" textAnchor="middle" fill="#64748b" fontSize="11">Money Recovered</text>
        </g>

        {/* Arrow from Happy Clients to Success */}
        <g>
          <line x1="930" y1="230" x2="1010" y2="320" stroke="url(#goldGradient)" strokeWidth="3" strokeOpacity="0.4">
            <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="1.5s" />
          </line>
          <circle r="6" fill="#10b981">
            <animateMotion dur="2s" repeatCount="indefinite" path="M930,230 L1010,320" begin="1.5s" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1.5s" />
          </circle>
        </g>

        {/* NODE 5: SUCCESS - Dollar Sign */}
        <g transform="translate(1080, 380)">
          <circle r="65" fill="#10b981" fillOpacity="0.1">
            <animate attributeName="r" values="60;70;60" dur="3s" repeatCount="indefinite" begin="2s" />
          </circle>
          <circle r="50" fill="#10b981" fillOpacity="0.15" />
          <circle r="35" fill="#10b981" fillOpacity="0.2" />

          {/* Dollar sign */}
          <text x="0" y="15" textAnchor="middle" fill="#10b981" fontSize="50" fontWeight="bold">$</text>

          <text x="0" y="85" textAnchor="middle" fill="#10b981" fontSize="16" fontWeight="600">SUCCESS</text>
          <text x="0" y="103" textAnchor="middle" fill="#64748b" fontSize="11">Surplus Funds Claimed</text>
        </g>

        {/* Floating dollar signs */}
        {[
          { x: 200, y: 500, delay: 0, size: 24 },
          { x: 400, y: 480, delay: 1, size: 20 },
          { x: 550, y: 520, delay: 2, size: 28 },
          { x: 750, y: 490, delay: 0.5, size: 22 },
          { x: 950, y: 510, delay: 1.5, size: 26 },
          { x: 300, y: 100, delay: 2.5, size: 18 },
          { x: 700, y: 80, delay: 3, size: 20 },
          { x: 1000, y: 120, delay: 0.8, size: 22 },
        ].map((item, i) => (
          <text
            key={i}
            x={item.x}
            y={item.y}
            fill="#10b981"
            fontSize={item.size}
            fontWeight="bold"
            opacity="0.15"
          >
            <animate
              attributeName="y"
              values={`${item.y};${item.y - 30};${item.y}`}
              dur="4s"
              repeatCount="indefinite"
              begin={`${item.delay}s`}
            />
            <animate
              attributeName="opacity"
              values="0.1;0.25;0.1"
              dur="4s"
              repeatCount="indefinite"
              begin={`${item.delay}s`}
            />
            $
          </text>
        ))}

        {/* Circular flow indicator */}
        <circle cx="600" cy="350" r="200" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeOpacity="0.08" strokeDasharray="20,10">
          <animateTransform attributeName="transform" type="rotate" from="0 600 350" to="360 600 350" dur="60s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="350" r="250" fill="none" stroke="#10b981" strokeWidth="1" strokeOpacity="0.06" strokeDasharray="30,15">
          <animateTransform attributeName="transform" type="rotate" from="360 600 350" to="0 600 350" dur="80s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}
