import Link from "next/link"
import { CheckCircle, Shield, Zap, MapPin, Phone, Clock, Database, ArrowRight, Star, Users, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/header"
import { faqs } from "@/data/faqs"
import { statesData } from "@/data/states"

export default function LandingPage() {
  const stats = [
    { value: "50", label: "States Covered" },
    { value: "10K+", label: "Leads Monthly" },
    { value: "24hr", label: "Data Updates" },
    { value: "95%", label: "Skip Trace Rate" },
  ]

  const features = [
    {
      icon: Database,
      title: "Daily Fresh Leads",
      description: "Our Crawl4AI system scrapes county recorders, public trustees, and auction sites every 24 hours across all 50 states."
    },
    {
      icon: Phone,
      title: "Skip-Traced Contacts",
      description: "Every lead includes phone numbers, emails, and mailing addresses found through FastPeopleSearch and TruePeopleSearch."
    },
    {
      icon: Shield,
      title: "DNC Compliant",
      description: "Automatic scrubbing against Federal and State Do Not Call registries. Stay compliant, avoid fines."
    },
    {
      icon: Zap,
      title: "Voicemail Automation",
      description: "Optional add-on delivers personalized ringless voicemails via SlyBroadcast with MiniMax AI voice generation."
    },
    {
      icon: MapPin,
      title: "State-by-State Data",
      description: "Filter leads by state, foreclosure type (judicial/non-judicial), sale date, surplus amount, and more."
    },
    {
      icon: Clock,
      title: "Real-Time Dashboard",
      description: "Mobile-first interface to access leads, track outreach, export data, and manage your pipeline anywhere."
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
      cta: "Start Free Trial",
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
        "Compliance handled",
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
    },
    {
      quote: "The automation add-on is a game changer. I get callbacks from my voicemails while I'm working other deals.",
      author: "Jennifer R.",
      role: "Asset Recovery Specialist, Florida",
      rating: 5,
    },
    {
      quote: "Finally, a lead source that's actually compliant. No more worrying about TCPA violations.",
      author: "David K.",
      role: "Recovery Agent, California",
      rating: 5,
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
        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-24 lg:py-28 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xs sm:text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3 sm:mb-4">
                Updated Daily - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-6 leading-tight">
                Fresh Foreclosure Leads,<br />
                <span className="text-[#1e3a5f]">Delivered Daily</span>
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
                <Link href="#pricing" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full">
                    View Pricing
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

        {/* Features Section */}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="p-6 rounded-lg border border-gray-200 hover:border-[#1e3a5f]/30 hover:shadow-sm transition-all">
                  <div className="h-12 w-12 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-[#1e3a5f]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-50 border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">How It Works</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                From Data to Deals in 4 Simple Steps
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { step: "1", title: "We Scrape", desc: "Crawl4AI collects foreclosure data from county sources daily" },
                { step: "2", title: "We Enrich", desc: "Skip tracing adds phone numbers, emails, and mailing addresses" },
                { step: "3", title: "We Scrub", desc: "DNC compliance checking removes restricted numbers" },
                { step: "4", title: "You Close", desc: "Access leads in your dashboard and start outreach" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="h-14 w-14 rounded-full bg-[#1e3a5f] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* State Coverage */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">Coverage</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Comprehensive 50-State Coverage
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                We track foreclosures in every US state, with detailed statute information
                for both tax deed and mortgage surplus funds.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                  {nonJudicialCount} Non-Judicial States
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-orange-50 text-orange-700 text-sm font-medium">
                  {judicialCount} Judicial States
                </span>
              </div>
              <Link href="/states-guide">
                <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  View 50 States Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-12 sm:py-16 md:py-20 bg-gray-50 border-y border-gray-200">
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
                  className={`relative bg-white rounded-lg p-6 sm:p-8 ${plan.popular ? 'border-2 border-[#1e3a5f] shadow-lg md:scale-105' : 'border border-gray-200'} ${plan.popular && index === 1 ? 'order-first md:order-none' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#1e3a5f] text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">Most Popular</span>
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
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
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

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">Testimonials</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trusted by Recovery Agents Nationwide
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-gray-50 border-y border-gray-200">
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
                  <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-gray-200 rounded-lg px-6">
                    <AccordionTrigger className="text-left text-gray-900 hover:text-[#1e3a5f] py-4">
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
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center bg-[#1e3a5f] rounded-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Recovering Surplus Funds?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join 500+ recovery agents who trust our platform for fresh, compliant leads.
                Start your 7-day free trial today.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
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
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#1e3a5f]" />
                <span className="font-bold text-gray-900 text-sm sm:text-base">Asset Recovery Leads</span>
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
                <li><Link href="/guides" className="hover:text-[#1e3a5f]">Guides</Link></li>
                <li><Link href="/api" className="hover:text-[#1e3a5f]">API Docs</Link></li>
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
          <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Asset Recovery Business. All rights reserved.
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400">
              Data provided for informational purposes. Users are responsible for compliance with all applicable laws.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
