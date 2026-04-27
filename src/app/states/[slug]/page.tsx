import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle,
  MapPin,
  Clock,
  Shield,
  DollarSign,
  ArrowRight,
  FileText,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getStateBySlug,
  priorityStateSlugs,
  stateLandingData,
} from "@/data/state-landing-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return priorityStateSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};

  const title = `${state.name} Foreclosure Surplus Funds Leads | Foreclosure Recovery Inc.`;
  return {
    title,
    description: state.metaDescription,
    keywords: state.targetKeywords.join(", "),
    openGraph: {
      title,
      description: state.metaDescription,
      url: `https://usforeclosureleads.com/states/${slug}`,
    },
    alternates: {
      canonical: `https://usforeclosureleads.com/states/${slug}`,
    },
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default async function StateLandingPage({ params }: Props) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

  const otherStates = Object.values(stateLandingData).filter(
    (s) => s.abbr !== state.abbr
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${state.name} Foreclosure Surplus Funds Leads`,
    description: state.metaDescription,
    url: `https://usforeclosureleads.com/states/${slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://usforeclosureleads.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "States Guide",
          item: "https://usforeclosureleads.com/states-guide",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: state.name,
          item: `https://usforeclosureleads.com/states/${slug}`,
        },
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "Foreclosure Recovery Inc.",
      url: "https://usforeclosureleads.com",
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-[#1e3a5f] text-lg">
            Foreclosure Recovery Inc.
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/states-guide"
              className="text-sm text-gray-600 hover:text-[#1e3a5f] hidden sm:block"
            >
              50 States Guide
            </Link>
            <Link href="/sign-in">
              <Button
                size="sm"
                className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"
              >
                Access Leads
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="bg-gray-50 border-b py-2">
        <div className="container mx-auto px-4">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-[#1e3a5f]">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link href="/states-guide" className="hover:text-[#1e3a5f]">
                50 States Guide
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="text-gray-900 font-medium">{state.name}</li>
          </ol>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2040] py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Tier {state.tier} Priority State
                </span>
                <span className="text-blue-300 text-xs">
                  {state.difficulty} to Work
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {state.name} Foreclosure
                <br />
                <span className="text-blue-300">Surplus Fund Leads</span>
              </h1>

              <p className="text-lg text-blue-100 mb-8 max-w-2xl leading-relaxed">
                Daily-updated, skip-traced foreclosure surplus leads in{" "}
                {state.name}.
                {state.feeCap === "None (30% standard)"
                  ? " No finder fee cap -- keep the full 30% contingency."
                  : ` Fee cap: ${state.feeCap}.`}{" "}
                Average surplus: {fmt(state.avgSurplus)} per case.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-8 py-6 text-base font-semibold w-full sm:w-auto"
                  >
                    Access {state.name} Leads
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-white/10 border border-white/30 text-white hover:bg-white/20 px-8 py-6 text-base w-full sm:w-auto"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Key Stats */}
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1e3a5f]">
                  {fmt(state.avgSurplus)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Avg Surplus / Case</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1e3a5f]">
                  {state.monthlyLeads}+
                </p>
                <p className="text-sm text-gray-500 mt-1">Leads / Month</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1e3a5f]">30%</p>
                <p className="text-sm text-gray-500 mt-1">Your Fee</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1e3a5f]">24hr</p>
                <p className="text-sm text-gray-500 mt-1">Data Updates</p>
              </div>
            </div>
          </div>
        </section>

        {/* State Rules */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {state.name} Surplus Fund Rules
              </h2>
              <p className="text-gray-600 mb-8">
                Everything a recovery agent needs to know before working{" "}
                {state.name} surplus cases.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-[#1e3a5f]" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Foreclosure Type
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-[#1e3a5f] mb-1">
                    {state.foreclosureType}
                  </p>
                  <p className="text-sm text-gray-600">
                    {state.foreclosureType === "Non-Judicial"
                      ? "Handled by a trustee outside the court system. Faster process, more consistent surplus generation."
                      : state.foreclosureType === "Judicial"
                      ? "Court-supervised process. Surplus held by the court clerk until claimed."
                      : "Both judicial and non-judicial methods used depending on the loan type."}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Finder Fee Cap
                    </h3>
                  </div>
                  <p
                    className={`text-2xl font-bold mb-1 ${
                      state.feeCap === "None (30% standard)"
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {state.feeCap === "None (30% standard)"
                      ? "No Cap"
                      : state.feeCap}
                  </p>
                  <p className="text-sm text-gray-600">
                    {state.feeCap === "None (30% standard)"
                      ? "You can charge the full 30% contingency fee with no statutory limit."
                      : `State law limits the finder fee to ${state.feeCap}. Factor this into your case selection.`}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Claim Window
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-amber-700 mb-1">
                    {state.claimWindow}
                  </p>
                  <p className="text-sm text-gray-600">
                    Time-sensitive -- act promptly when a lead is identified to
                    avoid missing the window.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Key Statutes
                    </h3>
                  </div>
                  <p className="font-mono text-sm font-semibold text-gray-800 mb-1">
                    Tax: {state.taxStatute || "N/A"}
                  </p>
                  <p className="font-mono text-sm font-semibold text-gray-800 mb-3">
                    Mortgage: {state.mortgageStatute || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {state.statuteNotes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">
                Real Recovery
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                {state.name} Case Study: {fmt(state.caseStudy.amount)} Recovered
              </h2>

              <div className="bg-gradient-to-br from-[#1e3a5f]/5 to-blue-50 rounded-2xl p-8 border border-[#1e3a5f]/10">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-bold text-[#1e3a5f]">
                        {fmt(state.caseStudy.amount)}
                      </span>
                      <span className="text-sm text-gray-500">recovered</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {state.caseStudy.county} County
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {state.caseStudy.story}
                    </p>
                    <div className="pt-4 border-t border-[#1e3a5f]/10">
                      <p className="text-sm text-gray-600">
                        Agent earned:{" "}
                        <span className="font-semibold text-[#1e3a5f]">
                          {fmt(Math.round(state.caseStudy.amount * 0.3))}
                        </span>{" "}
                        (30% contingency fee)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                What You Get With {state.name} Leads
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Owner name and full property address",
                  "Skip-traced phone numbers and emails",
                  "DNC-scrubbed contact data",
                  "Surplus amount estimate",
                  "Sale date and case number",
                  "Mailing address for direct mail",
                  "Property details (beds, baths, sqft)",
                  "Daily lead updates within 24 hours of recording",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-[#1e3a5f] to-[#0f2040]">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <Shield className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start Recovering {state.name} Surplus Funds
              </h2>
              <p className="text-blue-200 text-lg mb-8 leading-relaxed">
                Get access to {state.monthlyLeads}+ monthly {state.name} leads
                -- skip-traced, DNC-compliant, and ready for outreach. Join
                hundreds of recovery agents using our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    className="bg-white text-[#1e3a5f] hover:bg-gray-100 px-10 py-6 text-base font-semibold w-full sm:w-auto"
                  >
                    Access {state.name} Leads
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-white/10 border border-white/30 text-white hover:bg-white/20 px-10 py-6 text-base w-full sm:w-auto"
                  >
                    See Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Other Priority States */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Other Priority States
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {otherStates.map((s) => (
                  <Link
                    key={s.abbr}
                    href={`/states/${s.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#1e3a5f]/40 hover:bg-blue-50/40 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1e3a5f]">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500">Tier {s.tier}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#1e3a5f]" />
                  </Link>
                ))}
                <Link
                  href="/states-guide"
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-300 hover:border-[#1e3a5f]/40 hover:bg-blue-50/40 transition-colors group col-span-2 sm:col-span-1"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-[#1e3a5f]">
                      All 50 States
                    </p>
                    <p className="text-xs text-gray-500">Full guide</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#1e3a5f]" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Foreclosure Recovery Inc. All
            rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/states-guide" className="hover:text-[#1e3a5f]">
              50 States Guide
            </Link>
            <Link href="/pricing" className="hover:text-[#1e3a5f]">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-[#1e3a5f]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#1e3a5f]">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
