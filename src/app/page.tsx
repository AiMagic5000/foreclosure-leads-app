import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Shield,
  Zap,
  MapPin,
  Phone,
  Clock,
  Database,
  ArrowRight,
  Star,
  Users,
  Building2,
  Play,
  TrendingUp,
  DollarSign,
  FileText,
  Mail,
  Mic,
  GraduationCap,
  Inbox,
  HeadphonesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/header";
import { HeroAnimation } from "@/components/hero-animation";
import { LandingWebcastPlayer } from "@/components/landing-webcast-player";
import { ApiDocsPopup } from "@/components/api-docs-popup";
import { faqs } from "@/data/faqs";
import { statesData } from "@/data/states";
import { EmailCaptureForm } from "@/components/landing/EmailCaptureForm";
import { DashboardSlideshow } from "@/components/landing/DashboardSlideshow";

const STATS = [
  { value: "3,200", label: "Counties Covered" },
  { value: "10K+", label: "Leads Monthly" },
  { value: "24hr", label: "Data Updates" },
  { value: "95%", label: "Skip Trace Rate" },
] as const;

const FEATURES = [
  {
    icon: Database,
    title: "Daily Fresh Leads",
    description:
      "Our proprietary system scrapes county recorders, public trustees, and auction sites every 24 hours across 30+ non-judicial states.",
    image: "/dashboard.jpg",
  },
  {
    icon: Phone,
    title: "Skip-Traced Contacts",
    description:
      "Every lead includes phone numbers, emails, and mailing addresses found through FastPeopleSearch and TruePeopleSearch.",
    image: "/hero-agent.jpg",
  },
  {
    icon: Shield,
    title: "DNC Compliant",
    description:
      "Automatic scrubbing against Federal and State Do Not Call registries. Stay compliant, avoid fines.",
    image: null,
  },
  {
    icon: Zap,
    title: "Voicemail Automation",
    description:
      "Optional add-on delivers personalized ringless voicemails with premium voice over generation.",
    image: null,
  },
  {
    icon: MapPin,
    title: "3,200+ Counties Covered",
    description:
      "Access leads from 30+ non-judicial states and 3,200+ counties. Filter by foreclosure type, sale date, surplus amount, and more.",
    image: null,
  },
  {
    icon: Clock,
    title: "Real-Time Dashboard",
    description:
      "Mobile-first interface to access leads, track outreach, export data, and manage your pipeline anywhere.",
    image: "/dashboard.jpg",
  },
];

const PROGRAM = {
  name: "Asset Recovery Agent Partnership",
  price: 995,
  priceLabel: "total program fee",
  subtitle: "One program. Three ways to pay. Everything you need to start closing recoveries.",
  commission: "50/50 Split on Recovery Fee",
  commissionNote: "You receive 50% and the company receives 50% of up to 30% of the recovery fee. Some jurisdictions like Texas cap recovery agent fees at 20%. Balance payments only come from cases you close.",
  features: [
    "50 verified, exclusive leads per week (yours alone -- never shared with another agent)",
    "Certified letters mailed to your leads on your behalf, with proof of service, jurisdiction language, and a free claims guide",
    "Ongoing support -- phone, email, dashboard",
    "Full training program access (audio, video, written)",
    "Outreach automation -- ringless voicemail drops, SMS drips, email drips, all loaded with your name and contact info",
    "Dedicated landing page on USForeclosureRecovery.com",
    "Shared 800 inbound number with your own personal extension",
    "Professional email at yourname@usforeclosurerecovery.com",
    "Dashboard-managed lead outreach -- leads know you before you call",
    "Access to the company registration inbox and lead-tracking back office, so you can verify if any of your clients have signed up or contacted us directly",
    "Every signed contingency processed through MyStateFunds.com -- the same claim-processing platform we use internally, included free",
    "No business entity required -- work as a 1099 sub-contractor. Already have a business? We can bill the business directly and pay case earnings into the business bank account in lieu of a 1099.",
  ],
  paymentOptions: [
    { label: "Pay $995 in full", note: "Full access immediately, including the Vegas Vacation Client Incentive." },
    { label: "Three monthly payments of $331", note: "Total $995. Vegas Vacation Client Incentive activates after final payment." },
    { label: "In-house financing", note: "0% interest, no third-party credit pull. For applicants whose budget doesn't fit the standard plan or whose credit limits other options. Vegas Vacation Client Incentive activates after final payment. Call (888) 545-8007 to apply." },
  ],
  cta: "Enroll Now -- $995",
  href: "https://stan.store/alliepearson/p/asset-recovery-agent-partnership",
  callHref: "tel:8885458007",
};

const PARTNERSHIP_FAQ = [
  {
    q: "Do I need my own business or LLC to get started?",
    a: "No. You can work under our business as a 1099 sub-contractor with no business formation, LLC paperwork, or extra costs. If you already have a business, we can bill the business directly and pay case earnings into the business bank account in lieu of a 1099.",
  },
  {
    q: "What does my $995 program payment actually cover?",
    a: "Your $995 covers the full program: 50 exclusive verified leads per week, certified letters mailed on your behalf, full training program access (audio/video/written), outreach automation (ringless voicemail, SMS, email drips loaded with your contact info), a dedicated landing page on USForeclosureRecovery.com, your own extension on our shared 800 number, a professional email at yourname@usforeclosurerecovery.com, dashboard-managed lead outreach, access to the registration inbox and lead-tracking back office, and free claim processing through MyStateFunds.com.",
  },
  {
    q: "How do I get leads?",
    a: "You get 50 verified, exclusive leads assigned to your dashboard every week -- skip-traced, DNC-compliant, and yours alone. The automation system contacts them with your name and information before you even pick up the phone, and certified letters go out on your behalf.",
  },
  {
    q: "What payment options are available?",
    a: "Three options: (1) pay $995 in full, (2) three monthly payments of $331 totaling $995, or (3) in-house financing at 0% interest with no third-party credit pull -- available for applicants whose budget doesn't fit the standard plan or whose credit limits other options. Call (888) 545-8007 to apply for in-house financing.",
  },
  {
    q: "What is the Vegas Vacation Client Incentive?",
    a: "It's a complimentary Vegas vacation we offer to your clients when they sign their contingency agreement -- a closing tool that drives client urgency and lifts conversion. Pay-in-full enrollees can offer it immediately. Three-payment and in-house financing enrollees can begin offering it once their final payment is received. Trip details, fulfillment partners, and travel windows are determined and communicated by Foreclosure Recovery Inc. once your client's signed contingency agreement is on file.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I recovered $47,000 in surplus funds my first month using these leads. The skip tracing saves me hours every day.",
    author: "Marcus T.",
    role: "Surplus Recovery Agent, Virginia",
    rating: 5,
    image: "/marcus-t.jpg",
  },
  {
    quote:
      "The automation add-on is a game changer. I get callbacks from my voicemails while I'm working other deals.",
    author: "Jennifer R.",
    role: "Asset Recovery Specialist, Alabama",
    rating: 5,
    image: "/jennifer-r.jpg",
  },
  {
    quote:
      "Finally, a lead source that's actually compliant. No more worrying about TCPA violations.",
    author: "David K.",
    role: "Recovery Agent, Georgia",
    rating: 5,
    image: "/david-k.jpg",
  },
];

const BUSINESS_KIT_ITEMS = [
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
    image:
      "https://assetrecoverybusiness.com/images/us-county-directory-2026.png",
  },
];

const NON_JUDICIAL_COUNT = statesData.filter(
  (s) => s.foreclosureType === "non-judicial"
).length;
const JUDICIAL_COUNT = statesData.filter(
  (s) => s.foreclosureType === "judicial"
).length;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Asset Recovery Leads",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web Browser",
            offers: [
              {
                "@type": "Offer",
                name: "Asset Recovery Agent Partnership",
                price: "995",
                priceCurrency: "USD",
                priceValidUntil: "2026-12-31",
                availability: "https://schema.org/InStock",
              },
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              ratingCount: "127",
              bestRating: "5",
              worstRating: "1",
            },
            description:
              "Foreclosure surplus funds lead generation platform with daily data updates, skip tracing, DNC compliance, and voicemail automation for asset recovery professionals.",
          }),
        }}
      />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.slice(0, 20).map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Foreclosure Recovery Inc.",
            url: "https://usforeclosureleads.com",
            logo: "https://usforeclosureleads.com/favicon.svg",
            sameAs: [
              "https://assetrecoverybusiness.com",
              "https://usforeclosurerecovery.com",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              availableLanguage: "English",
            },
          }),
        }}
      />

      <Header />

      <main>
        {/* Hero Section with Motion Graphics */}
        <section className="relative pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden min-h-[650px] md:min-h-[750px]">
          {/* Background Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          >
            <source src="https://seafile.alwaysencrypted.com/f/da18d8035ceb4f05a9c2/?dl=1" type="video/mp4" />
          </video>
          {/* Animated Background */}
          <HeroAnimation />

          <div className="container mx-auto px-4 sm:px-6 relative z-20">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 items-center pt-8">
              {/* Left 2/3 - Hero Content (original dimensions) */}
              <div className="w-full lg:w-2/3 text-center lg:text-left">
                <div className="max-w-4xl mx-auto lg:mx-0">
                  <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-red-700 uppercase tracking-wider">
                      For Licensed Asset Recovery Agents
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4 sm:mb-6 leading-[1.05]">
                    Stop Hunting Leads.
                    <br />
                    <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                      Start Closing Recoveries.
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-4 sm:mb-5 max-w-2xl leading-relaxed px-2 lg:px-0 mx-auto lg:mx-0">
                    Verified surplus funds leads delivered to your dashboard every
                    24 hours -- skip-traced, DNC-scrubbed, and ready for outreach.
                    Trusted by 500+ recovery agents across all 50 states.
                  </p>
                  <div className="mb-8 sm:mb-10 max-w-2xl px-2 lg:px-0 mx-auto lg:mx-0">
                    <p className="text-base sm:text-lg md:text-xl font-semibold text-[#1e3a5f] leading-snug">
                      Keep up to <span className="text-red-600 font-black">30%</span> of every
                      surplus you successfully recover.
                      <sup>
                        <Link
                          href="/income-disclaimer"
                          className="text-[10px] sm:text-xs font-normal text-gray-500 hover:text-[#1e3a5f] underline decoration-dotted ml-1"
                        >
                          disclosure
                        </Link>
                      </sup>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      We deliver the data. You close the claim. Fee caps vary by state.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-3 px-4 sm:px-0">
                    <Link href="/sign-up" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full shadow-lg shadow-[#1e3a5f]/20"
                      >
                        Get Instant Dashboard Access
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                    <Link href="#video" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full shadow-lg border border-gray-200"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Watch 2-Min Demo
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 mb-10 sm:mb-16 px-4 sm:px-0 flex items-center justify-center lg:justify-start gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-[#10b981]" />
                    Free training included. No credit card required.
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-3xl pt-6 sm:pt-8 border-t border-gray-200 mx-auto lg:mx-0">
                    {STATS.map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f]">
                          {stat.value}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 1/3 - Hero Video (aligned to left edge of column, 25% smaller) */}
              <div className="w-[280px] sm:w-[300px] lg:w-1/3 flex-shrink-0 flex justify-center lg:justify-start">
                <div className="relative w-[75%] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/60 bg-black">
                  <video
                    className="w-full h-auto"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    preload="metadata"
                    poster="/video-poster-foreclosure-dashboard.png"
                  >
                    <source
                      src="https://seafile.alwaysencrypted.com/f/411cff3cc89a4cd7b2d1/?dl=1"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>
            </div>

            {/* Email Capture — inline hero */}
            <div className="mt-10 pt-8 border-t border-gray-200/60 max-w-2xl">
              <EmailCaptureForm source="hero_form" variant="hero" />
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
                <span className="text-sm font-medium">
                  Updated Every 24 Hours
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1e3a5f]" />
                <span className="text-sm font-medium">125+ Active Agents</span>
              </div>
            </div>
          </div>
        </section>

        {/* Video Explainer Section */}
        <section
          id="video"
          className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">
                See It In Action
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Asset Recovery Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Watch how our platform helps you find and recover surplus funds
                for property owners.
              </p>
            </div>

            {/* Live Webcast Player -- same HLS + restrictions as /webcast/live */}
            <div className="max-w-4xl mx-auto">
              <LandingWebcastPlayer />

              {/* Video highlights */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <Database className="h-8 w-8 text-[#1e3a5f] mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Fresh Leads Daily</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <Phone className="h-8 w-8 text-[#3b82f6] mx-auto mb-2" />
                  <p className="font-medium text-gray-900">
                    Automated Outreach
                  </p>
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
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">
                Features
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Recover Surplus Funds
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From lead generation to outreach automation, we handle the heavy
                lifting so you can focus on closing deals and helping property
                owners.
              </p>
            </div>

            {/* Featured Image Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://seafile.alwaysencrypted.com/f/ed91a1ea66a041c09263/?dl=1"
                  alt="Asset Recovery Leads Dashboard"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-block px-3 py-1 bg-[#10b981] text-white text-sm font-medium rounded-full mb-2">
                    Live Data
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Real-Time Analytics Dashboard
                  </h3>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Track Every Lead, Every Deal
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Our powerful dashboard gives you complete visibility into your
                  surplus funds recovery pipeline. Track callbacks, monitor
                  conversion rates, and see exactly where your money is coming
                  from.
                </p>
                <ul className="space-y-3">
                  {[
                    "Real-time lead notifications",
                    "Conversion tracking",
                    "Revenue analytics",
                    "Export to CSV/Excel",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#10b981]" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl border border-gray-200 hover:border-[#1e3a5f]/30 hover:shadow-lg transition-all bg-white"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#3b82f6] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
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
                <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">
                  How It Works
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  From Data to Deals in 4 Simple Steps
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      step: "1",
                      title: "We Scrape",
                      desc: "Our system collects foreclosure data from county sources daily",
                      color: "bg-[#1e3a5f]",
                    },
                    {
                      step: "2",
                      title: "We Enrich",
                      desc: "Skip tracing adds phone numbers, emails, and mailing addresses",
                      color: "bg-[#3b82f6]",
                    },
                    {
                      step: "3",
                      title: "We Scrub",
                      desc: "DNC compliance checking removes restricted numbers",
                      color: "bg-[#10b981]",
                    },
                    {
                      step: "4",
                      title: "You Close",
                      desc: "Access leads in your dashboard and start outreach",
                      color: "bg-[#f59e0b]",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <div
                        className={`h-10 w-10 rounded-full ${item.color} text-white font-bold text-lg flex items-center justify-center flex-shrink-0`}
                      >
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {item.title}
                        </h3>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/dashboard-preview.png"
                  alt="Asset Recovery Dashboard with Live Leads and Outreach Automation"
                  className="w-full h-auto"
                />
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
                  src="/foreclosure-surplus-funds-overages-business.jpg"
                  alt="Foreclosure surplus funds overages business"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <span className="inline-block px-3 py-1 bg-[#f59e0b] text-white text-sm font-medium rounded-full mb-2">
                    Success Story
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Helping Families Recover Their Funds
                  </h3>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">
                  Why It Matters
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Help Families. Earn Big.
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Surplus funds rightfully belong to former property owners -
                  families who often have no idea the money exists. You become
                  the hero who connects them with funds they didn't know they
                  had.
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
                  <Button
                    size="lg"
                    className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"
                  >
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
              <p className="text-sm font-medium text-[#10b981] uppercase tracking-wider mb-3">
                Coverage
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Comprehensive 50-State Coverage
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                We track foreclosures in every US state and 3,200+ counties,
                with detailed statute information for both tax deed and mortgage
                surplus funds.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#1e3a5f] text-white text-sm font-medium border border-white/20">
                  {NON_JUDICIAL_COUNT} Non-Judicial States
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#f59e0b] text-white text-sm font-medium">
                  {JUDICIAL_COUNT} Judicial States
                </span>
              </div>
              <Link href="/states-guide">
                <Button
                  size="lg"
                  className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base"
                >
                  View 50 States Guide
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* See Exactly What You're Getting */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 to-[#1e3a5f]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-[#10b981] uppercase tracking-wider mb-3">
                See Exactly What You're Getting
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                The Live Platform, MyStateFunds, and the Full Value Stack
              </h2>
              <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto">
                Preview the live agent dashboard, see how MyStateFunds processes
                your closed cases, and review every component included in your
                $995 partnership.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-14 max-w-6xl mx-auto">
              {/* Recovery Agent Dashboard slideshow */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <DashboardSlideshow />
                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">
                    Recovery Agent Dashboard
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Your complete business command center -- training,
                    documents, leads, and case pipeline.
                  </p>
                  <a
                    href="https://usforeclosureleads.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90"
                  >
                    View Live Dashboard →
                  </a>
                </div>
              </div>

              {/* USForeclosureRecovery platform */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative aspect-[16/9] bg-slate-900">
                  <Image
                    src="https://www.assetrecoverybusiness.com/images/usfr-hero-section.png?v=3"
                    alt="USForeclosureRecovery.com platform"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    YOUR LANDING PAGE
                  </div>
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">
                    Access to USForeclosureRecovery.com
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Direct access to our platform with your own dedicated
                    landing page, your name, and your contact info.
                  </p>
                  <a
                    href="https://usforeclosurerecovery.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#1e3a5f] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#2d4a6f]"
                  >
                    Visit Live Site →
                  </a>
                </div>
              </div>

              {/* MyStateFunds video */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl ring-2 ring-emerald-500">
                <div className="relative aspect-[16/9] bg-slate-900">
                  <video
                    src="https://seafile.alwaysencrypted.com/seafhttp/f/50097824aa6f4be997af/"
                    poster="https://seafile.alwaysencrypted.com/seafhttp/f/4869d9b8d7584d168432/"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="MyStateFunds claim processing"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-bold text-white tracking-wide">
                    <span className="line-through opacity-70 mr-1">$395</span>
                    INCLUDED
                  </div>
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">
                    Process Claims via MyStateFunds.com
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    Run every signed contingency through our claim-processing
                    platform -- the same system we use internally.
                  </p>
                  <p className="text-emerald-700 text-xs font-bold mb-4">
                    ✓ Included free with your $995 Partnership
                  </p>
                  <a
                    href="https://www.mystatefunds.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90"
                  >
                    Visit MyStateFunds.com →
                  </a>
                </div>
              </div>
            </div>

            {/* Value Stack */}
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Everything You Get Today
                </h3>
                <p className="text-white/70 text-base">
                  Total stack value <span className="line-through opacity-70">$4,791+</span>{" "}
                  -- yours for $995
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    icon: FileText,
                    title: "40+ Attorney-Curated Legal Documents",
                    value: "$1,200",
                    body:
                      "Client representation, contingency fee, POA, NDA, surplus claim form, heir affidavit, and more -- attorney-reviewed and valid in all 50 states.",
                  },
                  {
                    icon: Building2,
                    title: "Access to USForeclosureRecovery.com Platform",
                    value: "$1,500",
                    body:
                      "Your own dedicated landing page on the main site with your name and contact info. Look established from day one.",
                  },
                  {
                    icon: GraduationCap,
                    title: "Complete Training Dashboard (Video + Audio)",
                    value: "$997",
                    body:
                      "Full training library covering lead finding, contacting owners, filing claims, and collecting commissions.",
                  },
                  {
                    icon: Phone,
                    title: "Shared 800 Number + Pro Email",
                    value: "$297",
                    body:
                      "Your own extension on our shared 800 inbound line plus a yourname@usforeclosurerecovery.com address.",
                  },
                  {
                    icon: Mic,
                    title: "Automated Outreach -- RVM, SMS, Email",
                    value: "$500",
                    body:
                      "Ringless voicemail drops, SMS drips, and email campaigns sent automatically with your name and contact info.",
                  },
                  {
                    icon: Mail,
                    title: "Certified Letters Mailed for You",
                    value: "$297",
                    body:
                      "We mail certified letters with proof of service, jurisdiction-specific language, legal precedent, and a free claims guide.",
                  },
                  {
                    icon: Inbox,
                    title: "Company Registration Inbox + Lead Tracking",
                    value: "Included",
                    body:
                      "See every registration that comes through our website to verify if any of your clients have signed up or made contact directly.",
                  },
                  {
                    icon: HeadphonesIcon,
                    title: "Ongoing Support + 50 Exclusive Leads/Week",
                    value: "Priceless",
                    body:
                      "Phone, email, and dashboard support from our team. 50 verified leads per week, exclusive to you -- never shared.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 flex gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#3b82f6] flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="text-white font-semibold text-sm leading-tight">
                          {item.title}
                        </h4>
                        <div className="flex-shrink-0 text-right">
                          {item.value !== "Included" && item.value !== "Priceless" && (
                            <span className="text-red-400 line-through text-xs mr-1">
                              {item.value}
                            </span>
                          )}
                          <span className="text-emerald-400 text-xs font-bold">
                            Included
                          </span>
                        </div>
                      </div>
                      <p className="text-white/70 text-xs leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8 bg-gradient-to-r from-red-600 to-red-700 rounded-xl py-6 px-4">
                <p className="text-white text-lg font-semibold mb-1">
                  Total Value <span className="line-through opacity-70">$4,791+</span>
                </p>
                <p className="text-white text-3xl font-bold">
                  You Pay $995
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Or 3 monthly payments of $331 -- in-house 0% financing available
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-2 sm:mb-3">
                Pricing
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                One Program. Three Ways to Pay.
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Pay in full, split it into three monthly payments, or apply for
                in-house financing. No monthly software fees. Start recovering
                surplus funds today.
              </p>
              <a
                href="#guarantee"
                className="inline-block mt-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Money Back Guarantee
              </a>
            </div>
            <div className="grid grid-cols-1 max-w-4xl mx-auto">
              <div className="relative bg-white rounded-xl p-6 sm:p-8 border-2 border-[#1e3a5f] shadow-xl">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] text-white text-xs font-medium px-4 py-1 rounded-full whitespace-nowrap">
                    The Program
                  </span>
                </div>
                <div className="text-center pb-4 sm:pb-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {PROGRAM.name}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    {PROGRAM.subtitle}
                  </p>
                  <div className="mt-3 sm:mt-4">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ${PROGRAM.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      {PROGRAM.priceLabel}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-[#1e3a5f]">
                      {PROGRAM.commission}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed px-2">
                    {PROGRAM.commissionNote}
                  </p>
                </div>

                <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mt-6">
                  {/* LEFT: What's Included + CTAs */}
                  <div>
                    <h4 className="text-sm font-bold text-[#1e3a5f] mb-3 uppercase tracking-wide">What's Included</h4>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      {PROGRAM.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 sm:gap-3">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-xs sm:text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* PDF Download */}
                    <a
                      href="https://www.assetrecoverybusiness.com/Foreclosure-Recovery-Business-Programs-Guide.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-gradient-to-r from-[#1e3a5f] to-[#3b82f6] text-white py-3 rounded-lg text-sm font-bold mb-3 hover:opacity-90 transition-opacity"
                    >
                      Download Program Guide (PDF)
                    </a>

                    {/* Primary CTA */}
                    <a href={PROGRAM.href} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full text-sm sm:text-base py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 text-white font-bold">
                        {PROGRAM.cta}
                      </Button>
                    </a>

                    {/* In-house financing CTA */}
                    <a href={PROGRAM.callHref} className="block mt-3">
                      <Button className="w-full text-sm sm:text-base py-2.5 sm:py-3 bg-white hover:bg-gray-50 text-[#1e3a5f] border-2 border-[#1e3a5f]">
                        Apply for In-House Financing -- (888) 545-8007
                      </Button>
                    </a>
                  </div>

                  {/* RIGHT: Vegas + payment options + guarantee */}
                  <div className="flex flex-col gap-4">
                    {/* Vegas Vacation card with image */}
                    <div className="rounded-2xl overflow-hidden shadow-lg ring-2 ring-red-500">
                      <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: "url('https://www.assetrecoverybusiness.com/images/vegas-bonus.jpg')" }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-slate-900/85" />
                        <div className="absolute top-3 left-3 inline-block bg-gradient-to-r from-red-600 to-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                          🎰 CLOSING TOOL
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <div className="text-xl font-extrabold leading-tight">Vegas Vacation</div>
                          <div className="text-xs opacity-90 mt-0.5">Your clients receive a complimentary Vegas trip when they sign the contingency agreement -- a built-in closing tool.</div>
                        </div>
                      </div>
                      <div className="bg-white p-4">
                        <p className="text-xs font-bold text-[#1e3a5f] mb-1">When you can offer it:</p>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4 leading-snug">
                          <li>Pay in full → offer it to clients immediately</li>
                          <li>3-payment plan → offer once final payment received</li>
                          <li>In-house financing → offer once final payment received</li>
                        </ul>
                      </div>
                    </div>

                    {/* Payment options */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="font-bold text-[#1e3a5f] text-sm mb-3">3 ways to pay $995</p>
                      {PROGRAM.paymentOptions.map((option, k) => (
                        <div key={option.label} className={`flex gap-2 py-2 ${k < PROGRAM.paymentOptions.length - 1 ? "border-b border-dashed border-slate-200" : ""}`}>
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full ${k === 2 ? "bg-emerald-500" : "bg-[#1e3a5f]"} text-white text-[11px] font-bold flex items-center justify-center mt-0.5`}>
                            {k === 2 ? "$" : k + 1}
                          </span>
                          <div className="text-xs leading-snug">
                            <p className="font-semibold text-[#1e3a5f]">{option.label}</p>
                            <p className="text-gray-600 mt-0.5">{option.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Guarantee chip */}
                    <div className="bg-white border-2 border-emerald-500 rounded-lg p-3 text-center">
                      <p className="text-xs text-emerald-800 leading-snug">
                        🛡️ <strong>Money Back Guarantee</strong> -- if you actively participate for 12 months and have not closed a deal, we refund your full $995.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Website Delivery Policy */}
                <div className="mt-4 bg-amber-50 border border-amber-400 rounded-lg p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Delivery Policy:</strong> Training, lead delivery,
                    automation, and support activate immediately upon your first
                    payment. Your dedicated landing page on
                    USForeclosureRecovery.com goes live within five business
                    days of enrollment.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center mt-6 text-sm text-gray-500">
              <strong className="text-[#10b981]">In-house financing available for qualified candidates</strong><br />
              Begin your training and start earning immediately.
            </p>

            {/* Partnership FAQ */}
            <div className="max-w-3xl mx-auto mt-12">
              <h3 className="text-2xl font-extrabold text-[#1e3a5f] text-center mb-6">
                Common Questions About the Program
              </h3>
              <div className="space-y-4">
                {PARTNERSHIP_FAQ.map((faq) => (
                  <div key={faq.q} className="bg-slate-50 rounded-xl p-5 border-l-4 border-red-500">
                    <p className="font-bold text-[#1e3a5f] text-sm mb-2">{faq.q}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Professional Business Kit Section */}
        <section className="py-20 bg-gradient-to-br from-[#1e3a5f] to-[#0f172a]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-[#10b981] text-white text-sm font-medium rounded-full mb-4">
                Included With Monthly Subscription
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Professional Business Kit
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Everything you need to start your asset recovery business.
                Downloadable resources available immediately after enrollment.
              </p>
              <p className="text-2xl font-bold text-[#10b981] mt-4">
                $297 Value - FREE with Subscription
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {BUSINESS_KIT_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 text-center"
                >
                  <div className="relative h-48 mb-6 rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/70 text-sm">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981]" />
                  <span>Instant Digital Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981]" />
                  <span>Download Anywhere</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#10b981]" />
                  <span>Exclusive County Directory</span>
                </div>
              </div>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base"
                >
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
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">
                Testimonials
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trusted by Recovery Agents Nationwide
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {TESTIMONIALS.map((testimonial, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
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
                      <p className="font-semibold text-gray-900">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonial.role}
                      </p>
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
              <p className="text-sm font-medium text-[#1e3a5f] uppercase tracking-wider mb-3">
                FAQ
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about surplus funds recovery and our
                platform.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-6"
                  >
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
                Join 500+ recovery agents who trust our platform for fresh,
                compliant leads. One-time payment. No subscriptions. No
                recurring charges.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#pricing">
                  <Button
                    size="lg"
                    className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base"
                  >
                    Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#video">
                  <Button
                    size="lg"
                    className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base"
                  >
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
                  width={200}
                  height={85}
                  className="w-[200px] h-auto"
                />
              </Link>
              <p className="text-xs sm:text-sm text-gray-500">
                Daily foreclosure lead data for surplus funds recovery
                professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                Product
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li>
                  <Link href="#features" className="hover:text-[#1e3a5f]">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-[#1e3a5f]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/states-guide" className="hover:text-[#1e3a5f]">
                    50 States Guide
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-[#1e3a5f]">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                Resources
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li>
                  <Link href="/blog" className="hover:text-[#1e3a5f]">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/states-guide" className="hover:text-[#1e3a5f]">
                    Guides
                  </Link>
                </li>
                <li>
                  <ApiDocsPopup />
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                Legal
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500">
                <li>
                  <Link href="/privacy" className="hover:text-[#1e3a5f]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#1e3a5f]">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-[#1e3a5f]">
                    Compliance
                  </Link>
                </li>
                <li>
                  <Link href="/income-disclaimer" className="hover:text-[#1e3a5f]">
                    Income Disclaimer
                  </Link>
                </li>
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
              <span className="text-gray-300">|</span>
              <a
                href="https://startmybusiness.us"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1e3a5f] hover:text-[#3b82f6] font-medium"
              >
                StartMyBusiness.us
              </a>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 max-w-2xl">
              Website development and management provided by Start My Business
              Incorporated (StartMyBusiness.us). Foreclosure Recovery Inc., US
              Foreclosure Recovery, and Asset Recovery Business are partner
              entities of Start My Business Incorporated. Payment processing is
              handled by Start My Business Incorporated on behalf of all
              affiliated entities.
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400">
              Data provided for informational purposes. Users are responsible
              for compliance with all applicable laws.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
