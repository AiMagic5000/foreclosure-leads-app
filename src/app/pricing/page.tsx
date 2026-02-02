import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Zap, Shield, Phone, Database, Download, Clock } from "lucide-react"

export const metadata = {
  title: "Pricing - Asset Recovery Leads | Foreclosure Surplus Funds Data",
  description: "Choose the right plan for your foreclosure surplus funds recovery business. Single state $129/month or multi-state $499/month with skip-traced contacts and DNC compliance.",
  keywords: "foreclosure leads pricing, surplus funds recovery cost, tax deed leads subscription, mortgage overage data pricing",
}

const plans = [
  {
    name: "Single State",
    price: 129,
    description: "Perfect for agents focusing on one state market",
    popular: false,
    features: [
      { text: "1 state of your choice", included: true },
      { text: "Daily updated leads", included: true },
      { text: "Skip-traced contacts", included: true },
      { text: "DNC compliance checking", included: true },
      { text: "CSV export", included: true },
      { text: "Email support", included: true },
      { text: "Multi-state access", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Multi-State",
    price: 499,
    description: "For serious agents covering multiple markets",
    popular: true,
    features: [
      { text: "All 50 states access", included: true },
      { text: "Daily updated leads", included: true },
      { text: "Skip-traced contacts", included: true },
      { text: "DNC compliance checking", included: true },
      { text: "Unlimited CSV exports", included: true },
      { text: "Priority email support", included: true },
      { text: "API access", included: true },
      { text: "State statute guides", included: true },
    ],
  },
]

const addon = {
  name: "Automation Add-on",
  price: 299,
  description: "Hands-free voicemail outreach to your leads",
  features: [
    "AI-generated voicemail scripts",
    "Text-to-speech voicemail creation",
    "Ringless voicemail delivery",
    "Callback tracking dashboard",
    "DNC-compliant outreach",
    "Performance analytics",
  ],
}

const faqs = [
  {
    question: "What data is included with each lead?",
    answer: "Each lead includes property address, owner name, parcel ID, sale date, sale amount, lender/trustee info, and skip-traced contact data (phone numbers, emails, mailing address).",
  },
  {
    question: "How often is the data updated?",
    answer: "Our Crawl4AI system scrapes new foreclosure data every 24 hours, ensuring you always have access to the freshest leads in your selected markets.",
  },
  {
    question: "Is the skip trace data included or extra?",
    answer: "Skip-traced contact information is included with all plans at no additional cost. We provide phone numbers, emails, and mailing addresses for each lead.",
  },
  {
    question: "Can I change my selected state?",
    answer: "Yes, Single State subscribers can change their selected state once per billing cycle through the dashboard settings.",
  },
  {
    question: "What is DNC compliance checking?",
    answer: "We automatically check all phone numbers against the Federal Do Not Call registry and state-specific DNC lists. Numbers flagged as DNC are marked so you can ensure compliant outreach.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.",
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
          <Badge variant="secondary" className="mb-4">Simple, Transparent Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start recovering surplus funds with accurate, daily-updated foreclosure leads
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/sign-up" className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Automation Add-on */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-dashed border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <Zap className="h-6 w-6 text-primary" />
                      <h3 className="text-2xl font-bold">{addon.name}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">{addon.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">+${addon.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {addon.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 rounded-full bg-primary/20">
                      <Phone className="h-12 w-12 text-primary" />
                    </div>
                    <Button size="lg">
                      Add to Any Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">All Plans Include</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Daily Updates",
                description: "Fresh leads scraped every 24 hours from county records",
              },
              {
                icon: Shield,
                title: "DNC Compliance",
                description: "Automatic checking against federal and state DNC lists",
              },
              {
                icon: Database,
                title: "Skip Traced Data",
                description: "Phone, email, and mailing address for every lead",
              },
              {
                icon: Download,
                title: "CSV Export",
                description: "Download leads for use in your CRM or spreadsheet",
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
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
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
            Join hundreds of asset recovery professionals using our daily foreclosure data
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8">
              Start Your Subscription
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Asset Recovery Leads. All rights reserved.</p>
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
