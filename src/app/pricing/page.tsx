import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Database, Download, Shield, Clock, Map, GraduationCap, FileText, Phone, Building, Plus, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Pricing - Asset Recovery Leads | One-Time Access to Foreclosure Surplus Funds Data",
  description: "Get lifetime access to daily-updated foreclosure leads with skip tracing, DNC compliance, and property enrichment. 5-State Access starting at $495 one-time. No subscriptions.",
  keywords: "foreclosure leads pricing, surplus funds recovery cost, asset recovery leads one-time, tax deed leads pricing, no subscription foreclosure data",
}

const fiveStatePlan = {
  name: "5-State Lead Access",
  price: 495,
  label: "one-time",
  description: "Everything you need to run a profitable asset recovery operation across 5 states",
  cta: "https://startmybusinessinc.gumroad.com/l/vzqbhs",
  popular: true,
  features: [
    "Choose any 5 US states",
    "Daily updated foreclosure leads",
    "Full skip tracing (phones, emails, addresses)",
    "DNC Registry compliance checking",
    "Property enrichment (assessed value, tax data, lot size, year built, market value, beds/baths/sqft)",
    "Complete contract templates (POA, fee agreements, claim forms)",
    "Ringless voicemail system",
    "CSV export",
    "Interactive 3,200+ county map",
    "8-module Closing Training course",
    "Hire a Closer marketplace access",
    "Contract Admin services (5% fee)",
    "7-day support, 9am-5pm Pacific",
  ],
}

const additionalStatePlan = {
  name: "Additional State",
  price: 175,
  label: "one-time per state",
  description: "Expand your territory by adding any US state to your existing dashboard",
  cta: "https://startmybusinessinc.gumroad.com/l/blwra",
  features: [
    "Add any US state to your dashboard",
    "Same skip tracing, DNC checking, and enrichment",
    "Instant activation after purchase",
    "All the same data fields and exports",
  ],
}

const businessBuildOut = {
  name: "Asset Recovery Business Build Out",
  price: 2495,
  discountPrice: 2120.75,
  halfDown: 1060.38,
  label: "one-time",
  description: "A turnkey asset recovery business with your own professional website, compliance package, and everything in the 5-State plan included",
  cta: "https://assetrecoverybusiness.com/",
  features: [
    "Fully built asset recovery business website",
    "45 points of compliance",
    "Complete business formation documents",
    "Attorney-drafted contracts",
    "Professional branding package",
    "Everything in 5-State Lead Access included",
  ],
}

const faqs = [
  {
    question: "What data is included with each lead?",
    answer: "Each lead includes property address, owner name, parcel ID, sale date, sale amount, lender/trustee info, and full skip-traced contact data (phone numbers, emails, mailing address). Property enrichment adds assessed value, tax data, lot size, year built, estimated market value, and beds/baths/sqft.",
  },
  {
    question: "How often is the data updated?",
    answer: "Our system pulls new foreclosure data every 24 hours from county records across all 50 states. You always have access to the most current leads in your selected markets.",
  },
  {
    question: "Is this a subscription or one-time payment?",
    answer: "All plans are one-time payments. There are no monthly fees, no recurring billing, and no surprise charges. You pay once and get ongoing access to your selected states.",
  },
  {
    question: "Is the skip trace data included or extra?",
    answer: "Skip-traced contact information is included with every plan at no additional cost. We provide phone numbers, emails, and mailing addresses for each lead.",
  },
  {
    question: "Can I add more states later?",
    answer: "Yes. Start with 5 states, then add any additional US state for $175 each whenever you are ready. Each new state activates instantly on your dashboard.",
  },
  {
    question: "What is DNC compliance checking?",
    answer: "We automatically check all phone numbers against the Federal Do Not Call registry and state-specific DNC lists. Numbers flagged as DNC are clearly marked so you can keep your outreach compliant.",
  },
  {
    question: "Do you offer a free trial?",
    answer: "We do not offer a free trial. Because this is a one-time purchase with lifetime access, there is no trial period. You get full access to all features from day one.",
  },
  {
    question: "What is the returning customer discount on the Business Build Out?",
    answer: "Existing 5-State Lead Access customers receive a 15% discount on the Asset Recovery Business Build Out, bringing the price from $2,495 to $2,120.75. A half-down payment option of $1,060.38 is also available.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Asset Recovery Leads</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/states-guide" className="text-sm hover:text-primary transition-colors hidden sm:block">
              50 States Guide
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">One-Time Payment -- No Subscriptions</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, One-Time Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pay once, get lifetime access to daily-updated foreclosure leads with full skip tracing and property enrichment
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* 5-State Lead Access */}
            <Card className="relative border-primary shadow-lg lg:scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{fiveStatePlan.name}</CardTitle>
                <CardDescription>{fiveStatePlan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">${fiveStatePlan.price}</span>
                  <span className="text-muted-foreground ml-2">{fiveStatePlan.label}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {fiveStatePlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <a href={fiveStatePlan.cta} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full" size="lg">
                    Get 5-State Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>

            {/* Additional State */}
            <Card className="relative">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Plus className="h-5 w-5 text-primary" />
                  <CardTitle className="text-2xl">{additionalStatePlan.name}</CardTitle>
                </div>
                <CardDescription>{additionalStatePlan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">${additionalStatePlan.price}</span>
                  <span className="text-muted-foreground ml-2">{additionalStatePlan.label}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {additionalStatePlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <a href={additionalStatePlan.cta} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full" variant="outline" size="lg">
                    Add a State
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>

            {/* Business Build Out */}
            <Card className="relative border-2 border-dashed border-primary/50 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="secondary">Full Business Package</Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Building className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">{businessBuildOut.name}</CardTitle>
                </div>
                <CardDescription>{businessBuildOut.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">${businessBuildOut.price.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">{businessBuildOut.label}</span>
                </div>
                <div className="pt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Returning customer price: <span className="font-semibold text-green-600 dark:text-green-400">${businessBuildOut.discountPrice.toLocaleString()}</span>{" "}
                    <span className="text-xs">(15% off)</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Half-down option: <span className="font-semibold">${businessBuildOut.halfDown.toLocaleString()}</span> to start
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {businessBuildOut.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <a href={businessBuildOut.cta} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full" size="lg">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>

          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Included With Every Plan</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Daily Updates",
                description: "Fresh leads pulled every 24 hours from county records across all 50 states",
              },
              {
                icon: Shield,
                title: "DNC Compliance",
                description: "Automatic checking against federal and state Do Not Call registry lists",
              },
              {
                icon: Map,
                title: "3,200+ County Map",
                description: "Interactive map covering every county with foreclosure activity data",
              },
              {
                icon: Download,
                title: "CSV Export",
                description: "Download your leads for use in any CRM, dialer, or spreadsheet",
              },
              {
                icon: Phone,
                title: "Ringless Voicemail",
                description: "Built-in voicemail drop system for compliant outreach at scale",
              },
              {
                icon: GraduationCap,
                title: "Closing Training",
                description: "8-module course covering the entire surplus funds recovery process",
              },
              {
                icon: FileText,
                title: "Contract Templates",
                description: "POA forms, fee agreements, and claim forms ready to use",
              },
              {
                icon: Database,
                title: "Property Enrichment",
                description: "Assessed value, tax data, lot size, market value, beds/baths/sqft",
              },
            ].map((feature, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6 text-center">
                  <feature.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Recovering Surplus Funds?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of asset recovery professionals using our daily foreclosure data. One payment, lifetime access.
          </p>
          <a href={fiveStatePlan.cta} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-lg px-8">
              Get Started with 5-State Access
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Asset Recovery Leads. All rights reserved.</p>
          <p className="mt-2">
            All payments processed by Start My Business Incorporated (<a href="https://startmybusiness.us" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">StartMyBusiness.us</a>)
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
