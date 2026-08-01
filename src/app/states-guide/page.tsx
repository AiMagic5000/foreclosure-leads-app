import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Info,
  Scale,
  Clock,
  DollarSign,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statesData, StateInfo } from "@/data/states";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "50 States Foreclosure Guide - Tax Deed & Mortgage Surplus Laws",
  description:
    "Comprehensive guide to foreclosure surplus funds laws in all 50 US states — mortgage surplus rules, claim windows, fee limits, and foreclosure types — plus which states sell tax deeds (surplus-producing) versus tax liens.",
  keywords: [
    "foreclosure laws by state",
    "tax deed surplus statutes",
    "mortgage overage laws",
    "surplus funds claim window",
    "judicial vs non-judicial foreclosure",
    "foreclosure fee limits",
    "state foreclosure guide",
  ],
};

function StateCard({ state }: { state: StateInfo }) {
  const foreclosureTypeColor = {
    judicial: "judicial",
    "non-judicial": "nonJudicial",
    both: "warning",
  } as const;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {state.name}
              <span className="text-sm font-normal text-muted-foreground">
                ({state.abbr})
              </span>
            </CardTitle>
          </div>
          <Badge variant={foreclosureTypeColor[state.foreclosureType]}>
            {state.foreclosureType === "both"
              ? "Both"
              : state.foreclosureType === "judicial"
              ? "Judicial"
              : "Non-Judicial"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {state.taxOverageStatute && (
          <div className="flex items-start gap-2">
            <Scale className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Tax Overage: </span>
              <span className="text-muted-foreground">
                {state.taxOverageStatute}
              </span>
            </div>
          </div>
        )}
        {state.mortgageOverageStatute && (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Mortgage: </span>
              <span className="text-muted-foreground">
                {state.mortgageOverageStatute}
              </span>
            </div>
          </div>
        )}
        {state.claimWindow && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Claim Window: </span>
              <span className="text-muted-foreground">{state.claimWindow}</span>
            </div>
          </div>
        )}
        {state.feeLimits && (
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Fee Limits: </span>
              <span className="text-muted-foreground">{state.feeLimits}</span>
            </div>
          </div>
        )}
        {state.timelineNotes && (
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">{state.timelineNotes}</p>
          </div>
        )}
        {state.sources.length > 0 && (
          <div className="pt-2 border-t">
            <p className="font-medium mb-1">Data Sources:</p>
            <div className="flex flex-wrap gap-1">
              {state.sources.map((source, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {source.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StatesGuidePage() {
  const judicialStates = statesData.filter(
    (s) => s.foreclosureType === "judicial"
  );
  const nonJudicialStates = statesData.filter(
    (s) => s.foreclosureType === "non-judicial"
  );
  const bothStates = statesData.filter((s) => s.foreclosureType === "both");

  return (
    <div className="min-h-screen bg-background">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "50 States Foreclosure Surplus Funds Guide",
            description:
              "Guide to mortgage surplus laws in all 50 US states, including which states hold tax deed sales that produce surplus and which sell tax liens",
            author: {
              "@type": "Organization",
              name: "Foreclosure Recovery Inc.",
            },
            datePublished: "2026-01-01",
            dateModified: new Date().toISOString().split("T")[0],
          }),
        }}
      />

      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            50 States Foreclosure Surplus Funds Guide
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Complete reference for mortgage overage laws across all US states,
            plus tax sale surplus rules for the states that sell tax deeds.
            Includes statutes, claim windows, fee limits, and data sources for
            each state.
          </p>
        </div>

        {/* Tax sales: deed vs lien — the accurate picture */}
        <div className="mb-12 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900">Do all states have tax sales?</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
            No &mdash; and the difference matters. Every state enforces delinquent
            property taxes, but they do it two different ways. Roughly{" "}
            <strong>30 states (and many counties in hybrid states) sell tax deeds</strong>{" "}
            &mdash; the property itself is auctioned, and when it sells for more than
            the taxes owed, the extra money is a surplus the former owner can claim.
            The remaining states sell <strong>tax lien certificates</strong> instead:
            investors buy the tax debt, the property is not auctioned, and no surplus
            is created at that sale (a surplus can only arise later if the lien itself
            is foreclosed to a deed).
          </p>
          <p className="mt-3 text-sm leading-relaxed text-amber-900/90">
            <strong>Mortgage foreclosure surplus is different:</strong> every state
            can produce mortgage foreclosure overages, which is why our foreclosure
            surplus coverage is genuinely 50-state. And since the U.S. Supreme
            Court&apos;s <em>Tyler v. Hennepin County</em> decision (2023), no state
            or its counties may keep tax sale surplus &mdash; the excess belongs to the
            former owner nationwide.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-lg">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">
              {nonJudicialStates.length}
            </div>
            <div className="text-xs text-muted-foreground">Non-Judicial</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">
              {judicialStates.length}
            </div>
            <div className="text-xs text-muted-foreground">Judicial</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {bothStates.length}
            </div>
            <div className="text-xs text-muted-foreground">Both</div>
          </Card>
        </div>

        {/* Non-Judicial States */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="nonJudicial" className="text-base px-4 py-2">
              Non-Judicial States
            </Badge>
            <span className="text-muted-foreground text-sm">
              Faster foreclosure process, often more surplus opportunities
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonJudicialStates.map((state) => (
              <StateCard key={state.abbr} state={state} />
            ))}
          </div>
        </section>

        {/* Judicial States */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="judicial" className="text-base px-4 py-2">
              Judicial States
            </Badge>
            <span className="text-muted-foreground text-sm">
              Court-supervised foreclosure process
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {judicialStates.map((state) => (
              <StateCard key={state.abbr} state={state} />
            ))}
          </div>
        </section>

        {/* Both States */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="warning" className="text-base px-4 py-2">
              Both Methods
            </Badge>
            <span className="text-muted-foreground text-sm">
              States allowing either judicial or non-judicial foreclosure
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bothStates.map((state) => (
              <StateCard key={state.abbr} state={state} />
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This information is provided for
              educational purposes only and should not be considered legal
              advice. Laws and regulations change frequently. Always verify
              current statutes with official state sources or consult with a
              licensed attorney before conducting surplus funds recovery
              activities in any state.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
