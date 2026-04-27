import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Database,
  Download,
  Shield,
  Clock,
  Map,
  GraduationCap,
  FileText,
  Phone,
  ArrowRight,
  Star,
} from "lucide-react";
import { RoiCalculator } from "@/components/landing/RoiCalculator";
import { CalendlyBooking } from "@/components/landing/CalendlyBooking";

export const metadata = {
  title:
    "Pricing -- Asset Recovery Agent Partnership | $995 Total Program Fee",
  description:
    "Asset Recovery Agent Partnership: $995 total. Pay in full, three monthly payments of $331, or in-house financing. 50/50 split on 30% recovery fee, 50 exclusive leads per week, full training, automation, and MyStateFunds claim processing included.",
  keywords:
    "asset recovery agent partnership, surplus funds recovery program, foreclosure recovery, recovery agent business, asset recovery training",
};

const ENROLL_URL =
  "https://stan.store/alliepearson/p/asset-recovery-agent-partnership";

const programFeatures = [
  "50 verified, exclusive leads per week (yours alone)",
  "Certified letters mailed to your leads on your behalf",
  "Ongoing support -- phone, email, dashboard",
  "Full training program (audio, video, written)",
  "Outreach automation -- ringless voicemail, SMS, email drips with your contact info",
  "Dedicated landing page on USForeclosureRecovery.com",
  "Shared 800 inbound number with your own personal extension",
  "Professional email at yourname@usforeclosurerecovery.com",
  "Dashboard-managed lead outreach",
  "Access to the company registration inbox + lead-tracking back office",
  "Free claim processing through MyStateFunds.com (same platform we use internally)",
  "No business entity required -- 1099 sub-contractor. Have a business? We can bill it directly.",
];

const paymentOptions = [
  {
    title: "Pay $995 in Full",
    price: "$995",
    sub: "one-time",
    note: "Full access immediately, including the Vegas Vacation Client Incentive.",
  },
  {
    title: "3 Monthly Payments",
    price: "$331",
    sub: "per month for 3 months",
    note: "Total $995. Vegas Vacation Client Incentive activates after final payment.",
  },
  {
    title: "In-House Financing",
    price: "0%",
    sub: "interest, no third-party credit pull",
    note: "For applicants whose budget doesn't fit the standard plan or whose credit limits other options. Vegas Vacation Client Incentive activates after final payment. Call (888) 545-8007 to apply.",
  },
];

const faqs = [
  {
    question: "How much is the program?",
    answer:
      "The Asset Recovery Agent Partnership is $995 total. You can pay $995 in full, split it into three monthly payments of $331 (totaling $995), or apply for in-house financing at 0% interest with no third-party credit pull.",
  },
  {
    question: "What is the commission structure?",
    answer:
      "50/50 split on the recovery fee, which is up to 30% of the recovered surplus. State caps apply -- Texas, for example, caps recovery agent fees at 20%. Balance payments only come from cases you close.",
  },
  {
    question: "How many leads do I get?",
    answer:
      "50 verified, exclusive foreclosure surplus fund leads per week. Exclusive means yours alone -- never shared with another agent. Each lead is skip-traced, DNC-scrubbed, and ready for outreach. Certified letters are mailed to each lead on your behalf with proof of service, jurisdiction language, and a free claims guide.",
  },
  {
    question: "Do I need my own business or LLC?",
    answer:
      "No. You can work as a 1099 sub-contractor with no entity formation required. Already have a business? We can bill the business directly and pay case earnings into the business bank account in lieu of a 1099.",
  },
  {
    question: "What is the Vegas Vacation Client Incentive?",
    answer:
      "It's a complimentary Vegas vacation we offer to your clients when they sign their contingency agreement -- a closing tool that drives client urgency and lifts conversion on outreach. Pay-in-full enrollees can offer it immediately. Three-payment and in-house financing enrollees can offer it once their final payment is received. Trip details, fulfillment partners, and travel windows are determined and communicated by Foreclosure Recovery Inc. once your client's signed contingency agreement is on file.",
  },
  {
    question: "What is the Money Back Guarantee?",
    answer:
      "If after 12 months of active participation you have not closed a deal, we refund the full $995 program payment. Standard qualification: complete training within 60 days, work leads each week, use our phone system (calls recorded), maintain monthly support contact, follow scripts and processes, and stay in good standing with the program terms.",
  },
  {
    question: "What does MyStateFunds.com do for me?",
    answer:
      "MyStateFunds.com is the claim-processing platform we use internally for our own recoveries. Every signed contingency you bring in gets processed through it, included free with the program. You hand off the signed agreement -- the platform handles the claim mechanics. (This used to be a separate $395 upsell. It is now built into the partnership.)",
  },
  {
    question: "What happens after I enroll?",
    answer:
      "Training, lead delivery, automation, and support activate immediately upon your first payment. Your dedicated landing page on USForeclosureRecovery.com goes live within five business days. Your shared 800 extension and yourname@usforeclosurerecovery.com email are provisioned in the same window.",
  },
];

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
            <Link
              href="/states-guide"
              className="text-sm hover:text-primary transition-colors hidden sm:block"
            >
              50 States Guide
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            One Program. Three Ways to Pay.
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Asset Recovery Agent Partnership
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            $995 total program fee. 50/50 split on the recovery fee. 50
            exclusive leads per week. Everything you need to start closing
            recoveries.
          </p>
        </div>
      </section>

      {/* ROI Calculator */}
      <RoiCalculator />

      {/* Single Pricing Card */}
      <section className="pb-16 pt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">The Program</Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">
                  Asset Recovery Agent Partnership
                </CardTitle>
                <CardDescription>
                  50/50 split on the 30% recovery fee. Balance payments only
                  from cases you close. Money Back Guarantee.
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">$995</span>
                  <span className="text-muted-foreground ml-2">
                    total program fee
                  </span>
                </div>
                <div className="pt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Limited new agent spots this week
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide">
                  What's Included
                </h3>
                <ul className="space-y-3 mb-6">
                  {programFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide">
                  Payment Options
                </h3>
                <div className="grid gap-3 mb-4">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.title}
                      className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm">{option.title}</p>
                        <p className="text-xl font-bold text-primary">
                          {option.price}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            {option.sub}
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {option.note}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Vegas Vacation Client Incentive */}
                <div className="mt-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-400 rounded-lg p-4">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-2">
                    Vegas Vacation Client Incentive
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    A complimentary Vegas vacation you can offer to your clients
                    when they sign their contingency agreement. It is a closing
                    tool that drives client urgency, not an agent reward.
                    Pay-in-full enrollees can offer it immediately. Three-payment
                    and in-house financing enrollees can offer it once final
                    payment is received. Trip details, fulfillment partners, and
                    travel windows are determined and communicated by
                    Foreclosure Recovery Inc. once your client's signed
                    contingency agreement is on file.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <a
                  href={ENROLL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full" size="lg">
                    Enroll Now -- $995
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="tel:8885458007" className="w-full">
                  <Button className="w-full" size="lg" variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Apply for In-House Financing -- (888) 545-8007
                  </Button>
                </a>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Signals beneath pricing card */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Star rating */}
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-2 text-sm font-medium text-gray-700">
                4.9 / 5 -- 200+ agent reviews
              </span>
            </div>

            {/* Testimonial */}
            <blockquote className="text-gray-700 text-lg leading-relaxed max-w-xl mx-auto">
              &ldquo;Recovered $34,000 in my first 60 days. The leads are fresh,
              exclusive, and the certified letters mean homeowners actually
              answer the phone when I call.&rdquo;
              <footer className="text-sm text-gray-500 mt-2">
                -- Marcus T., Asset Recovery Agent
              </footer>
            </blockquote>

            {/* Guarantee */}
            <div className="inline-flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-left max-w-md mx-auto">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-green-800 leading-relaxed">
                <span className="font-semibold">Money Back Guarantee.</span> If
                after 12 months of active participation you have not closed a
                deal, we refund the full $995 program payment. Standard
                qualification: complete training within 60 days, work leads each
                week, use our phone system, follow scripts and processes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built Into the Program
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Daily Updates",
                description:
                  "Fresh leads pulled every 24 hours from county records across all 50 states",
              },
              {
                icon: Shield,
                title: "DNC Compliance",
                description:
                  "Automatic checking against federal and state Do Not Call registry lists",
              },
              {
                icon: Map,
                title: "3,200+ County Map",
                description:
                  "Interactive map covering every county with foreclosure activity data",
              },
              {
                icon: Download,
                title: "CSV Export",
                description:
                  "Download your leads for use in any CRM, dialer, or spreadsheet",
              },
              {
                icon: Phone,
                title: "Ringless Voicemail",
                description:
                  "Built-in voicemail drop system for compliant outreach at scale",
              },
              {
                icon: GraduationCap,
                title: "Closing Training",
                description:
                  "Full-module course covering the entire surplus funds recovery process",
              },
              {
                icon: FileText,
                title: "Contract Templates",
                description:
                  "POA forms, fee agreements, and claim forms ready to use",
              },
              {
                icon: Database,
                title: "Property Enrichment",
                description:
                  "Assessed value, tax data, lot size, market value, beds/baths/sqft",
              },
            ].map((feature, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6 text-center">
                  <feature.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Booking */}
      <CalendlyBooking />

      {/* FAQ */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
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
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Recovering Surplus Funds?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            $995 total. Three ways to pay. Money Back Guarantee.
          </p>
          <a href={ENROLL_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-lg px-8">
              Enroll Now -- $995
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Foreclosure Recovery Inc. All
            rights reserved.
          </p>
          <p className="mt-2">
            All payments processed by Start My Business Incorporated (
            <a
              href="https://startmybusiness.us"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              StartMyBusiness.us
            </a>
            )
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
