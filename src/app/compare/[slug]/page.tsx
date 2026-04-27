import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle,
  XCircle,
  Minus,
  ArrowRight,
  Star,
  TrendingUp,
  ChevronRight,
  Trophy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getComparisonBySlug,
  comparisonSlugs,
  type ComparisonFeature,
  type RoundupEntry,
} from "@/data/comparison-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return comparisonSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparisonBySlug(slug);
  if (!page) return {};

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.targetKeywords.join(", "),
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://usforeclosureleads.com/compare/${slug}`,
    },
    alternates: {
      canonical: `https://usforeclosureleads.com/compare/${slug}`,
    },
  };
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />;
  if (value === false)
    return <XCircle className="h-5 w-5 text-red-400 mx-auto" />;
  return (
    <span className="text-sm text-gray-700 text-center block">{value}</span>
  );
}

function FeatureRow({ feature }: { feature: ComparisonFeature }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="py-3.5 px-4 text-sm text-gray-800 font-medium">
        {feature.feature}
        {feature.note && (
          <p className="text-xs text-gray-500 font-normal mt-0.5 leading-relaxed">
            {feature.note}
          </p>
        )}
      </td>
      <td className="py-3.5 px-4 text-center bg-blue-50/40">
        <FeatureValue value={feature.us} />
      </td>
      <td className="py-3.5 px-4 text-center">
        <FeatureValue value={feature.them} />
      </td>
    </tr>
  );
}

function RoundupCard({ entry }: { entry: RoundupEntry }) {
  return (
    <div
      className={`rounded-2xl border-2 p-6 ${
        entry.isUs
          ? "border-[#1e3a5f] bg-gradient-to-br from-[#f0f5ff] to-white shadow-lg"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {entry.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                entry.rank === 1
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              #{entry.rank}
            </span>
            {entry.isUs && (
              <span className="text-xs font-semibold bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full">
                This Platform
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{entry.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{entry.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{entry.price}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Pros
            </span>
          </div>
          <ul className="space-y-1.5">
            {entry.pros.map((pro, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ThumbsDown className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              Cons
            </span>
          </div>
          <ul className="space-y-1.5">
            {entry.cons.map((con, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Best For
          </span>
          <p className="text-sm text-gray-700 mt-1">{entry.bestFor}</p>
        </div>
        <div
          className={`rounded-lg p-3 ${
            entry.isUs ? "bg-[#1e3a5f]/5" : "bg-gray-50"
          }`}
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Verdict
          </span>
          <p className="text-sm text-gray-800 mt-1 font-medium">
            {entry.verdict}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const page = getComparisonBySlug(slug);

  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    url: `https://usforeclosureleads.com/compare/${slug}`,
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
          name: "Compare",
          item: "https://usforeclosureleads.com/compare",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: page.title,
          item: `https://usforeclosureleads.com/compare/${slug}`,
        },
      ],
    },
  };

  const otherComparisons = comparisonSlugs
    .filter((s) => s !== slug)
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-[#1e3a5f] text-lg">
            USForeclosureLeads
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-[#1e3a5f] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/states-guide"
              className="text-sm text-gray-600 hover:text-[#1e3a5f] transition-colors"
            >
              States Guide
            </Link>
            <Link href="/sign-up">
              <Button
                size="sm"
                className="bg-[#1e3a5f] hover:bg-[#2d4a7a] text-white"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#1e3a5f] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href="/compare"
              className="hover:text-[#1e3a5f] transition-colors"
            >
              Compare
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">{page.title}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a5f] to-[#2d4a8a] text-white py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-blue-300 text-sm font-semibold uppercase tracking-wider mb-3">
            {page.isRoundup ? "Industry Ranking" : "Side-by-Side Comparison"}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {page.headline}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-3xl">
            {page.subheadline}
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-gray-700 text-lg leading-relaxed">{page.intro}</p>
        </div>
      </section>

      {/* Roundup vs Comparison */}
      {page.isRoundup && page.roundupEntries ? (
        <section className="py-10 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              2026 Rankings: All Surplus Fund Lead Sources
            </h2>
            <div className="space-y-6">
              {page.roundupEntries.map((entry) => (
                <RoundupCard key={entry.rank} entry={entry} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Feature Comparison Table */}
          <section className="py-10 bg-gray-50">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Feature Comparison
              </h2>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <table className="w-full bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 w-1/2">
                        Feature
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-bold text-[#1e3a5f] bg-blue-50/60 w-1/4">
                        {page.ourName}
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-gray-600 w-1/4">
                        {page.competitor}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.features.map((feature, i) => (
                      <FeatureRow key={i} feature={feature} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-10 bg-white">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Pricing Comparison
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border-2 border-[#1e3a5f] p-6 bg-blue-50/30">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] mb-2">
                    {page.ourName}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-3">
                    {page.ourPrice.label}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {page.ourPrice.notes}
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-gray-200 p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {page.competitor}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-3">
                    {page.theirPrice.label}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {page.theirPrice.notes}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Who Should Choose */}
          <section className="py-10 bg-gray-50">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Who Should Choose Each Option
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-[#1e3a5f] text-lg mb-4">
                    Choose {page.ourName} if...
                  </h3>
                  <ul className="space-y-3">
                    {page.whoShouldChooseUs.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-700 text-lg mb-4">
                    Choose {page.competitor} if...
                  </h3>
                  <ul className="space-y-3">
                    {page.whoShouldChooseThem.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Minus className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Line */}
          <section className="py-10 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                The Bottom Line
              </h2>
              <div className="bg-[#1e3a5f]/5 border-l-4 border-[#1e3a5f] rounded-r-xl p-6">
                <p className="text-gray-800 leading-relaxed text-lg">
                  {page.bottomLine}
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* CTA */}
      <section className="py-14 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a8a] text-white">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <TrendingUp className="h-10 w-10 text-blue-300 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">{page.ctaHeadline}</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Fresh leads in 19 non-judicial states. Skip-traced, DNC-scrubbed,
            and ready for outreach. No long-term commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button className="bg-white text-[#1e3a5f] hover:bg-blue-50 font-bold px-8 py-3 text-base rounded-xl shadow-lg">
                See Pricing
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3 text-base rounded-xl"
              >
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Other Comparisons */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            More Comparisons
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {otherComparisons.map((s) => {
              const other = getComparisonBySlug(s);
              if (!other) return null;
              return (
                <Link
                  key={s}
                  href={`/compare/${s}`}
                  className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#1e3a5f] hover:bg-blue-50/30 transition-all"
                >
                  <span className="text-sm font-medium text-gray-800 group-hover:text-[#1e3a5f] transition-colors">
                    {other.title}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1e3a5f] transition-colors flex-shrink-0 ml-2" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Foreclosure Recovery Inc. All
            rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-3">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link
              href="/states-guide"
              className="hover:text-white transition-colors"
            >
              States Guide
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
