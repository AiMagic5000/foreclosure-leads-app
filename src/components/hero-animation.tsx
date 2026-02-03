/**
 * Hero Animation - Motion Graphics Background
 * Shows the cycle: Leads → Phone Calls → Conversions → Happy Clients → Success
 * Arc goes OVER the hero text with sunset dimensional background
 * Uses real product images with CSS positioning
 */
import Image from "next/image"

export function HeroAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {/* Sunset dimensional background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 100% at 50% 100%, rgba(251, 146, 60, 0.25) 0%, rgba(249, 115, 22, 0.15) 30%, transparent 60%),
            radial-gradient(ellipse 120% 80% at 30% 90%, rgba(249, 115, 22, 0.18) 0%, transparent 50%),
            radial-gradient(ellipse 120% 80% at 70% 90%, rgba(234, 88, 12, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 100% 70% at 50% 70%, rgba(251, 191, 36, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30, 58, 95, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(255, 251, 235, 0.6) 50%, rgba(254, 215, 170, 0.4) 100%)
          `,
        }}
      />

      {/* Animated SVG Background - Arc pattern only */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ zIndex: 1 }}
      >
        <defs>
          <linearGradient id="sunsetFill" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.2" />
            <stop offset="40%" stopColor="#fdba74" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.05" />
          </linearGradient>
          <pattern id="movingDots" patternUnits="userSpaceOnUse" width="30" height="30">
            <circle cx="15" cy="15" r="1.5" fill="#1e3a5f" opacity="0.15">
              <animate attributeName="opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite" />
            </circle>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#movingDots)" />

        <path
          d="M 0,700 L 50,500 Q 100,400 180,280 Q 350,40 600,30 Q 850,40 1020,280 Q 1100,400 1150,500 L 1200,700 Z"
          fill="url(#sunsetFill)"
        />

        <path
          d="M 50,500 Q 100,400 180,280 Q 350,40 600,30 Q 850,40 1020,280 Q 1100,400 1150,500"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeOpacity="0.25"
          strokeDasharray="15,10"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-50" dur="3s" repeatCount="indefinite" />
        </path>

        <path
          d="M 80,520 Q 130,420 200,300 Q 380,80 600,60 Q 820,80 1000,300 Q 1070,420 1120,520"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="2"
          strokeOpacity="0.1"
          strokeDasharray="20,15"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="70" dur="4s" repeatCount="indefinite" />
        </path>

        {/* Moving dots */}
        <circle r="5" fill="#3b82f6">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M100,520 Q140,400 180,280" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle r="5" fill="#10b981">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M180,260 Q380,60 600,50" begin="0.6s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" begin="0.6s" />
        </circle>
        <circle r="5" fill="#f59e0b">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M600,50 Q820,60 1020,260" begin="1.2s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" begin="1.2s" />
        </circle>
        <circle r="5" fill="#10b981">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M1020,260 Q1060,400 1100,520" begin="1.8s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" begin="1.8s" />
        </circle>

        {/* Floating dollar signs */}
        {[
          { x: 150, y: 620, delay: 0, size: 22, color: '#10b981' },
          { x: 350, y: 590, delay: 1, size: 18, color: '#10b981' },
          { x: 500, y: 620, delay: 2, size: 24, color: '#f97316' },
          { x: 700, y: 600, delay: 0.5, size: 20, color: '#10b981' },
          { x: 850, y: 620, delay: 1.5, size: 22, color: '#f97316' },
          { x: 1000, y: 590, delay: 2.5, size: 18, color: '#10b981' },
        ].map((item, i) => (
          <text
            key={i}
            x={item.x}
            y={item.y}
            fill={item.color}
            fontSize={item.size}
            fontWeight="bold"
            opacity="0.12"
          >
            <animate
              attributeName="y"
              values={`${item.y};${item.y - 25};${item.y}`}
              dur="4s"
              repeatCount="indefinite"
              begin={`${item.delay}s`}
            />
            <animate
              attributeName="opacity"
              values="0.08;0.2;0.08"
              dur="4s"
              repeatCount="indefinite"
              begin={`${item.delay}s`}
            />
            $
          </text>
        ))}

        {/* Circular flow indicators */}
        <circle cx="600" cy="350" r="280" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="25,15">
          <animateTransform attributeName="transform" type="rotate" from="0 600 350" to="360 600 350" dur="90s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="350" r="350" fill="none" stroke="#f97316" strokeWidth="1" strokeOpacity="0.04" strokeDasharray="35,20">
          <animateTransform attributeName="transform" type="rotate" from="360 600 350" to="0 600 350" dur="120s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Image Nodes - Positioned with CSS */}
      {/* NODE 1: LEADS - Server (bottom left) */}
      <div className="absolute left-[5%] bottom-[15%] flex flex-col items-center animate-pulse" style={{ zIndex: 2 }}>
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-[#1e3a5f]/20 bg-[#1e3a5f]/10 shadow-lg">
          <Image
            src="/hero-images/leads-server.png"
            alt="Enterprise data server for foreclosure leads"
            fill
            className="object-cover"
          />
        </div>
        <span className="mt-2 text-xs md:text-sm font-semibold text-[#1e3a5f]">LEADS</span>
      </div>

      {/* NODE 2: OUTREACH - Phone (upper left arc) */}
      <div className="absolute left-[12%] top-[30%] flex flex-col items-center" style={{ zIndex: 2 }}>
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-blue-500/20 bg-blue-500/10 shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
          <Image
            src="/hero-images/outreach-phone.png"
            alt="Phone for automated outreach calls"
            fill
            className="object-cover"
          />
        </div>
        <span className="mt-2 text-xs font-semibold text-blue-500">OUTREACH</span>
      </div>

      {/* NODE 3: CONVERSIONS - Bar Chart (top center) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[5%] flex flex-col items-center" style={{ zIndex: 2 }}>
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-emerald-500/20 bg-emerald-500/10 shadow-lg animate-pulse">
          <Image
            src="/hero-images/bar-chart.png"
            alt="Growth chart showing conversion rates"
            fill
            className="object-cover"
          />
        </div>
        <span className="mt-2 text-xs md:text-sm font-semibold text-emerald-500">CONVERSIONS</span>
      </div>

      {/* NODE 4: HAPPY CLIENTS - Family (upper right arc) */}
      <div className="absolute right-[12%] top-[30%] flex flex-col items-center" style={{ zIndex: 2 }}>
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-amber-500/20 bg-amber-500/10 shadow-lg animate-bounce" style={{ animationDuration: '3.5s' }}>
          <Image
            src="/hero-images/happy-family.png"
            alt="Happy family who recovered surplus funds"
            fill
            className="object-cover"
          />
        </div>
        <span className="mt-2 text-xs font-semibold text-amber-500">HAPPY CLIENTS</span>
      </div>

      {/* NODE 5: SUCCESS - Phone with $86,294 (bottom right) */}
      <div className="absolute right-[5%] bottom-[15%] flex flex-col items-center animate-pulse" style={{ zIndex: 2 }}>
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-emerald-500/20 bg-emerald-500/10 shadow-lg">
          <Image
            src="/hero-images/success-phone.png"
            alt="Phone showing $86,294 bank balance"
            fill
            className="object-cover"
          />
        </div>
        <span className="mt-2 text-xs md:text-sm font-semibold text-emerald-500">SUCCESS</span>
      </div>
    </div>
  )
}
