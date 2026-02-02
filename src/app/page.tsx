import Link from "next/link"
import { CheckCircle, TrendingUp, Shield, Zap, MapPin, Phone, Clock, Database, ArrowRight, Star, Users, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
    <div className="min-h-screen bg-background">
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
            "url": "https://dashboard.assetrecoverybusiness.com",
            "logo": "https://dashboard.assetrecoverybusiness.com/logo.png",
            "sameAs": [],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": "English"
            }
          })
        }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Asset Recovery Leads</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
            <Link href="/states-guide" className="text-sm font-medium hover:text-primary transition-colors">50 States Guide</Link>
            <Link href="#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" variant="gradient">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6">
                Updated Daily - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Fresh Foreclosure Leads,{" "}
                <span className="gradient-text">Delivered Daily</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Access tax deed surplus and mortgage overage leads across all 50 states.
                Skip-traced, DNC-compliant, and ready for outreach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/sign-up">
                  <Button size="xl" variant="gradient" className="w-full sm:w-auto">
                    Start 7-Day Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    View Pricing
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 border-y bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">TCPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">DNC Scrubbed</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <span className="text-sm font-medium">Updated Every 24 Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">500+ Active Agents</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to Recover Surplus Funds
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From lead generation to outreach automation, we handle the heavy lifting
                so you can focus on closing deals and helping property owners.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
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
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* State Coverage */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Coverage</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Comprehensive 50-State Coverage
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                We track foreclosures in every US state, with detailed statute information
                for both tax deed and mortgage surplus funds.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="nonJudicial" className="text-base px-4 py-2">
                  {nonJudicialCount} Non-Judicial States
                </Badge>
                <Badge variant="judicial" className="text-base px-4 py-2">
                  {judicialCount} Judicial States
                </Badge>
              </div>
              <Link href="/states-guide">
                <Button variant="outline" size="lg">
                  View 50 States Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Pricing</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your business. All plans include a 7-day free trial.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/sign-up" className="block">
                      <Button
                        className="w-full"
                        variant={plan.popular ? "gradient" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by Recovery Agents Nationwide
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about surplus funds recovery and our platform.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Recovering Surplus Funds?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join 500+ recovery agents who trust our platform for fresh, compliant leads.
                Start your 7-day free trial today.
              </p>
              <Link href="/sign-up">
                <Button size="xl" className="bg-white text-blue-600 hover:bg-gray-100">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold">Asset Recovery Leads</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Daily foreclosure lead data for surplus funds recovery professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/states-guide" className="hover:text-foreground">50 States Guide</Link></li>
                <li><Link href="#faq" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-foreground">Guides</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-foreground">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Asset Recovery Business. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Data provided for informational purposes. Users are responsible for compliance with all applicable laws.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
