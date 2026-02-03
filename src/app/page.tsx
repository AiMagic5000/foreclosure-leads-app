import Link from "next/link"
import Image from "next/image"
import { CheckCircle, Shield, Zap, MapPin, Phone, Clock, Database, ArrowRight, Star, Users, Building2, Play, TrendingUp, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { HeroAnimation } from "@/components/hero-animation"
import { ApiDocsPopup } from "@/components/api-docs-popup"
import { faqs } from "@/data/faqs"
import { statesData } from "@/data/states"

export default function LandingPage() {
  const stats = [
    { value: "3,200", label: "Counties Covered" },
    { value: "10K+", label: "Leads Monthly" },
    { value: "24hr", label: "Data Updates" },
    { value: "95%", label: "Skip Trace Rate" },
  ]

  const features = [
    {
      icon: Database,
      title: "Daily Fresh Leads",
      description: "Our proprietary system scrapes county recorders, public trustees, and auction sites every 24 hours across all 50 states.",
      image: "/dashboard.jpg"
    },
    {
      icon: Phone,
      title: "Skip-Traced Contacts",
      description: "Every lead includes phone numbers, emails, and mailing addresses found through FastPeopleSearch and TruePeopleSearch.",
      image: "/hero-agent.jpg"
    },
    {
      icon: Shield,
      title: "DNC Compliant",
      description: "Automatic scrubbing against Federal and State Do Not Call registries. Stay compliant, avoid fines.",
      image: null
    },
    {
      icon: Zap,
      title: "Voicemail Automation",
      description: "Optional add-on delivers personalized ringless voicemails with premium voice over generation.",
      image: null
    },
    {
      icon: MapPin,
      title: "3,200+ Counties Covered",
      description: "Access leads from all 50 states and 3,200+ counties. Filter by foreclosure type (judicial/non-judicial), sale date, surplus amount, and more.",
      image: null
    },
    {
      icon: Clock,
      title: "Real-Time Dashboard",
      description: "Mobile-first interface to access leads, track outreach, export data, and manage your pipeline anywhere.",
      image: "/dashboard.jpg"
    },
  ]

  const pricingPlans = [
    {
      name: "Single State",
      price: 129,
      description: "Perfect for agents focusing on one market",
      features: [
        "Choose any 1 state",
        "Unlimited lead access",
        "Skip-traced contacts",
        "DNC-scrubbed data",
        "CSV export",
        "Mobile dashboard",
        "Email support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Multi-State",
      price: 499,
      description: "For growing agencies and teams",
      features: [
        "All 50 states access",
        "Unlimited lead access",
        "Skip-traced contacts",
        "DNC-scrubbed data",
        "CSV & API export",
        "Priority support",
        "Team seats (up to 5)",
        "Custom filters",
      ],
      cta: "Dashboard",
      popular: true,
    },
    {
      name: "Automation Add-On",
      price: 299,
      description: "Done-for-you lead outreach",
      features: [
        "Requires base plan",
        "Auto voicemail delivery",
        "AI-generated scripts",
        "Personalized messages",
        "Callback tracking",
        "DNC compliance handled",
        "Weekly reports",
      ],
      cta: "Add Automation",
      popular: false,
    },
  ]

  const testimonials = [
    {
      quote: "I recovered $47,000 in surplus funds my first month using these leads. The skip tracing saves me hours every day.",
      author: "Marcus T.",
      role: "Surplus Recovery Agent, Texas",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      quote: "The automation add-on is a game changer. I get callbacks from my voicemails while I'm working other deals.",
      author: "Jennifer R.",
      role: "Asset Recovery Specialist, Florida",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    },
    {
      quote: "Finally, a lead source that's actually compliant. No more worrying about TCPA violations.",
      author: "David K.",
      role: "Recovery Agent, California",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
  ]

  const businessKitItems = [
    {
      title: "Step-by-Step Training Manual",
      description: "Complete guide to asset recovery business operations",
      image: "https://assetrecoverybusiness.com/images/training-manual-2026.png",
    },
    {
      title: "40+ Legal Document Templates",
      description: "Professional contracts, agreements, and claim forms",
      image: "https://assetrecoverybusiness.com/images/legal-docs-2026.png",
    },
    {
      title: "3,200+ US Counties Directory",
      description: "Comprehensive county-by-county contact database",
      image: "https://assetrecoverybusiness.com/images/us-county-directory-2026.png",
    },
  ]

  const nonJudicialCount = statesData.filter(s => s.foreclosureType === 'non-judicial').length
  const judicialCount = statesData.filter(s => s.foreclosureType === 'judicial').length

  return (
    <div className="min-h-screen bg-white">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Asset Recovery Leads",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": [
              {
                "@type": "Offer",
                "name": "Single State Plan",
                "price": "129",
                "priceCurrency": "USD",
                "priceValidUntil": "2026-12-31",
                "availability": "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                "name": "Multi-State Plan",
                "price": "499",
                "priceCurrency": "USD",
                "priceValidUntil": "2026-12-31",
                "availability": "https://schema.org/InStock"
              }
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "127",
              "bestRating": "5",
              "worstRating": "1"
            },
            "description": "Foreclosure surplus funds lead generation platform with daily data updates, skip tracing, DNC compliance, and voicemail automation for asset recovery professionals."
          })
        }}
      />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.slice(0, 20).map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Asset Recovery Business",
            "url": "https://foreclosure-leads.alwaysencrypted.com",
            "logo": "https://foreclosure-leads.alwaysencrypted.com/logo.png",
            "sameAs": [],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": "English"
            }
          })
        }}
      />

      <Header />

      <main>
        {/* Hero Section with Motion Graphics */}
        <section className="relative pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden min-h-[650px] md:min-h-[750px]">
          {/* Animated Background */}
          <HeroAnimation />

          <div className="container mx-auto px-4 sm:px-6 relative z-20">
            <div className="max-w-4xl mx-auto text-center pt-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-6 leading-tight">
                Fresh Foreclosure Leads,<br />
                <span className="text-[#1e3a5f]">Delivered 24/7/365</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
                Access tax deed surplus and mortgage overage leads across all 50 states.
                Skip-traced, DNC-compliant, and ready for outreach.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-16 px-4 sm:px-0">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full">
                    Start 7-Day Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Link href="#video" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full shadow-lg">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto pt-6 sm:pt-8 border-t border-gray-200">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f]">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-6 border-y border-gray-200 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#1e3a5f]" />
                <span className="text-sm font-medium">TCPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#1e3a5f]" />
                <span className="text-sm font-medium">DNC Scrubbed</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[#1e3a5f]" />
                <span className="text-sm font-medium">Updated Every 24 Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1e3a5f]" />
                <span className="text-sm font-medium">500+ Active Agents</span>
              </div>
            </div>
          </div>
        </section>

        {/* Video Explainer Section */}
        <section id="video" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">See It In Action</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Asset Recovery Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Watch how our platform helps you find and recover surplus funds for property owners.
              </p>
            </div>

            {/* Video Player */}
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <video
                  className="w-full h-full object-cover"
                  controls
                  poster="/video-poster-foreclosure-dashboard.png"
                  preload="metadata"
                >
                  <source src="/explainer.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video highlights */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <Database className="h-8 w-8 text-[#1e3a5f] mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Fresh Leads Daily</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <Phone className="h-8 w-8 text-[#3b82f6] mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Automated Outreach</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <DollarSign className="h-8 w-8 text-[#10b981] mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Earn 20-30% Fees</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Images */}
        <section id="features" className="py-20 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">Features</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Recover Surplus Funds
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From lead generation to outreach automation, we handle the heavy lifting
                so you can focus on closing deals and helping property owners.
              </p>
            </div>

            {/* Featured Image Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/dashboard.jpg"
                  alt="Analytics Dashboard"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-block px-3 py-1 bg-[#10b981] text-white text-sm font-medium rounded-full mb-2">Live Data</span>
                  <h3 className="text-xl font-bold text-white">Real-Time Analytics Dashboard</h3>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Every Lead, Every Deal</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Our powerful dashboard gives you complete visibility into your surplus funds recovery pipeline.
                  Track callbacks, monitor conversion rates, and see exactly where your money is coming from.
                </p>
                <ul className="space-y-3">
                  {['Real-time lead notifications', 'Conversion tracking', 'Revenue analytics', 'Export to CSV/Excel'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#10b981]" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="group p-6 rounded-xl border border-gray-200 hover:border-[#1e3a5f]/30 hover:shadow-lg transition-all bg-white">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#3b82f6] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works with Image */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">How It Works</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  From Data to Deals in 4 Simple Steps
                </h2>
                <div className="space-y-6">
                  {[
                    { step: "1", title: "We Scrape", desc: "Our system collects foreclosure data from county sources daily", color: "bg-[#1e3a5f]" },
                    { step: "2", title: "We Enrich", desc: "Skip tracing adds phone numbers, emails, and mailing addresses", color: "bg-[#3b82f6]" },
                    { step: "3", title: "We Scrub", desc: "DNC compliance checking removes restricted numbers", color: "bg-[#10b981]" },
                    { step: "4", title: "You Close", desc: "Access leads in your dashboard and start outreach", color: "bg-[#f59e0b]" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <div className={`h-10 w-10 rounded-full ${item.color} text-white font-bold text-lg flex items-center justify-center flex-shrink-0`}>
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/hero-agent.jpg"
                  alt="Recovery Agent at Work"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a5f]/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-[#10b981]" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">$12,400</p>
                        <p className="text-sm text-gray-500">Avg. Recovery Amount</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories with Image */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
                <Image
                  src="/happy-family.jpg"
                  alt="Happy Family Receiving Keys"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <span className="inline-block px-3 py-1 bg-[#f59e0b] text-white text-sm font-medium rounded-full mb-2">Success Story</span>
                  <h3 className="text-xl font-bold text-white">Helping Families Recover Their Funds</h3>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">Why It Matters</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Help Families. Earn Big.
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Surplus funds rightfully belong to former property owners - families who often have no idea the money exists.
                  You become the hero who connects them with funds they didn't know they had.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-[#10b981]">23%</p>
                    <p className="text-sm text-gray-500">Callback Rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-[#1e3a5f]">20-30%</p>
                    <p className="text-sm text-gray-500">Your Fee</p>
                  </div>
                </div>
                <Link href="/sign-up">
                  <Button size="lg" className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white">
                    Start Recovering Funds
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* State Coverage */}
        <section className="py-20 relative overflow-hidden">
          {/* Background Map Image */}
          <div className="absolute inset-0">
            <Image
              src="/us-map-coverage.jpg"
              alt="US Map Coverage"
              fill
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-[#10b981] uppercase tracking-wider mb-3">Coverage</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Comprehensive 50-State Coverage
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                We track foreclosures in every US state and 3,200+ counties, with detailed statute information
                for both tax deed and mortgage surplus funds.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#1e3a5f] text-white text-sm font-medium border border-white/20">
                  {nonJudicialCount} Non-Judicial States
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#f59e0b] text-white text-sm font-medium">
                  {judicialCount} Judicial States
                </span>
              </div>
              <Link href="/states-guide">
                <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base">
                  View 50 States Guide
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-2 sm:mb-3">Pricing</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Choose the plan that fits your business. All plans include a 7-day free trial.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`relative bg-white rounded-xl p-6 sm:p-8 ${plan.popular ? 'border-2 border-[#1e3a5f] shadow-xl md:scale-105' : 'border border-gray-200 shadow-lg'} ${plan.popular && index === 1 ? 'order-first md:order-none' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] text-white text-xs font-medium px-4 py-1 rounded-full whitespace-nowrap">Most Popular</span>
                    </div>
                  )}
                  <div className="text-center pb-4 sm:pb-6 border-b border-gray-200">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">{plan.description}</p>
                    <div className="mt-3 sm:mt-4">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 my-4 sm:my-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up" className="block">
                    <Button
                      className={`w-full text-sm sm:text-base py-2.5 sm:py-3 ${plan.popular ? 'bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Professional Business Kit Section */}
        <section className="py-20 bg-gradient-to-br from-[#1e3a5f] to-[#0f172a]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#10b981] text-white text-sm font-medium rounded-full mb-4">Included With Monthly Subscription</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Professional Business Kit
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Everything you need to start your asset recovery business. Shipped via FedEx within 48 hours.
              </p>
              <p className="text-2xl font-bold text-[#10b981] mt-4">$297 Value - FREE with Subscription</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {businessKitItems.map((item, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 text-center">
                  <div className="relative h-48 mb-6 rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/70 text-sm">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981]" />
                  <span>Ships in 48 Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981]" />
                  <span>FedEx 3-5 Day Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981]" />
                  <span>Exclusive County Directory</span>
                </div>
              </div>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base">
                  Get Your Business Kit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">Testimonials</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trusted by Recovery Agents Nationwide
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.author}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">FAQ</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about surplus funds recovery and our platform.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="bg-gray-50 border border-gray-200 rounded-xl px-6">
                    <AccordionTrigger className="text-left text-gray-900 hover:text-[#1e3a5f] py-4 font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#1e3a5f] to-[#0f172a]">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Recovering Surplus Funds?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join 500+ recovery agents who trust our platform for fresh, compliant leads.
                Start your 7-day free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base">
                    Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#video">
                  <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3 sm:mb-4">
                <Image
                  src="/us-foreclosure-leads-logo.png"
                  alt="US Foreclosure Leads"
                  width={240}
                  height={60}
                  className="h-12 w-auto max-w-[180px]"
                />
              </Link>
              <p className="text-xs sm:text-sm text-gray-500">
                Daily foreclosure lead data for surplus funds recovery professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li><Link href="#features" className="hover:text-[#1e3a5f]">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-[#1e3a5f]">Pricing</Link></li>
                <li><Link href="/states-guide" className="hover:text-[#1e3a5f]">50 States Guide</Link></li>
                <li><Link href="#faq" className="hover:text-[#1e3a5f]">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li><Link href="/blog" className="hover:text-[#1e3a5f]">Blog</Link></li>
                <li><Link href="/states-guide" className="hover:text-[#1e3a5f]">Guides</Link></li>
                <li><ApiDocsPopup /></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li><Link href="/privacy" className="hover:text-[#1e3a5f]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#1e3a5f]">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-[#1e3a5f]">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col items-center gap-4 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              &copy; 2026 Foreclosure Recovery Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
              <a
                href="https://usforeclosurerecovery.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1e3a5f] hover:text-[#3b82f6] font-medium"
              >
                USForeclosureRecovery.com
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://assetrecoverybusiness.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1e3a5f] hover:text-[#3b82f6] font-medium"
              >
                AssetRecoveryBusiness.com
              </a>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400">
              Data provided for informational purposes. Users are responsible for compliance with all applicable laws.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
