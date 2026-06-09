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
import { TrustedSection } from "@/components/trusted-section";
import { ArbEmbed } from "@/components/landing/arb-embed";
import { ApiDocsPopup } from "@/components/api-docs-popup";
import { faqs } from "@/data/faqs";
import { statesData } from "@/data/states";
import { ClosingToolsSlideshow } from "@/components/landing/ClosingToolsSlideshow";
import { DashboardSlideshow } from "@/components/landing/DashboardSlideshow";
import { AnimatedFeatures } from "@/components/landing/AnimatedFeatures";
import { Footer } from "@/components/footer";

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
    { label: "Three monthly payments of $331", note: "Total $995, charged on the same date each month. Vegas Vacation Client Incentive activates after final payment.", href: "https://stan.store/alliepearson/p/asset-recovery-agent-partnership-13-down" },
    { label: "In-house financing", note: "0% interest, no third-party credit pull. For applicants whose budget doesn't fit the standard plan or whose credit limits other options. Vegas Vacation Client Incentive activates after final payment. Call (888) 545-8007 to apply." },
  ],
  cta: "Enroll Now -- $995",
  href: "https://stan.store/alliepearson/p/asset-recovery-agent-partnership",
  href331down: "https://stan.store/alliepearson/p/asset-recovery-agent-partnership-13-down",
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
                      Become An Asset Recovery Agent
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4 sm:mb-6 leading-[1.05]">
                    Stop Hunting Leads &amp; Start
                    <br />
                    <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                      Closing Foreclosure Surplus Overages.
                    </span>
                  </h1>
                  {/* Mobile-only hero video (positioned right under headline) */}
                  <div className="lg:hidden mb-5">
                    <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl border-2 border-white/60 bg-black" style={{ aspectRatio: "9 / 16" }}>
                      <video
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        preload="metadata"
                        poster="/videos/free-webcast-poster.jpg"
                      >
                        <source src="https://seafile.alwaysencrypted.com/f/ab2edd0eef4f4120a9f6/?dl=1" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-4 sm:mb-5 max-w-2xl leading-relaxed px-2 lg:px-0 mx-auto lg:mx-0">
                    Verified foreclosure surplus overages leads delivered to your dashboard every
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
                        Sign Up Free Now
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                    <Link href="/webcast" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full shadow-lg border border-gray-200"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Watch 20-Min Demo
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

              {/* Right 1/3 - Hero Video (desktop only — mobile shows it under headline) */}
              <div className="hidden lg:flex lg:w-1/3 flex-shrink-0 lg:justify-start">
                <div className="relative w-[75%] overflow-hidden rounded-2xl shadow-2xl border-2 border-white/60 bg-black" style={{ aspectRatio: "9 / 16" }}>
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    preload="metadata"
                    poster="/videos/free-webcast-poster.jpg"
                  >
                    <source src="https://seafile.alwaysencrypted.com/f/ab2edd0eef4f4120a9f6/?dl=1" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>

            {/* hero email-capture form removed per request */}
          </div>
        </section>

        {/* The complete Asset Recovery Business page — every section, image, and video, embedded (no duplicates) */}
        <ArbEmbed />
      </main>

      <Footer />
    </div>
  );
}
