"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { statesData } from "@/data/states"
import { stateOverageGuide } from "@/data/state-overage-guide"
import { stateFlags } from "@/data/state-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Scale, Clock, DollarSign, FileText, ExternalLink, X, Info, Lock, Users, TrendingUp } from "lucide-react"
import { CountyMap } from "@/components/county-map"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase"

export default function StatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [stateLeadCounts, setStateLeadCounts] = useState<Record<string, number>>({})
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { isSignedIn, user } = useUser()
  const isPaid = isSignedIn === true
  const selectedStates = isPaid ? ["GA", "FL", "TX", "CA", "AZ", "NV", "CO", "WA", "OR", "TN"] : []

  useEffect(() => {
    async function fetchLeadCounts() {
      const { data, error } = await supabase
        .from("state_data")
        .select("state_abbr, lead_count") as { data: { state_abbr: string; lead_count: number }[] | null; error: unknown }
      if (!error && data) {
        const counts: Record<string, number> = {}
        for (const row of data) {
          counts[row.state_abbr] = row.lead_count ?? 0
        }
        setStateLeadCounts(counts)
      }
    }
    fetchLeadCounts()
  }, [])

  const filteredStates = statesData.filter((state) => {
    const matchesSearch =
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.abbr.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || state.foreclosureType === selectedType
    return matchesSearch && matchesType
  })

  // Updated colors to match map: Blue for Judicial, Red for Non-Judicial
  const typeColors = {
    judicial: "bg-blue-600 text-white dark:bg-blue-700 dark:text-white",
    "non-judicial": "bg-red-600 text-white dark:bg-red-700 dark:text-white",
    both: "bg-purple-600 text-white dark:bg-purple-700 dark:text-white",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">State Information</h1>
        <p className="text-muted-foreground">
          Detailed foreclosure statutes and regulations for all 50 states
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search states..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("all")}
          >
            All Types
          </Button>
          <Button
            variant={selectedType === "judicial" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("judicial")}
          >
            Judicial
          </Button>
          <Button
            variant={selectedType === "non-judicial" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("non-judicial")}
          >
            Non-Judicial
          </Button>
          <Button
            variant={selectedType === "both" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("both")}
          >
            Both
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total States</CardDescription>
            <CardTitle className="text-3xl">{statesData.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Judicial</CardDescription>
            <CardTitle className="text-3xl">
              {statesData.filter((s) => s.foreclosureType === "judicial").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Non-Judicial</CardDescription>
            <CardTitle className="text-3xl">
              {statesData.filter((s) => s.foreclosureType === "non-judicial").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Both Types</CardDescription>
            <CardTitle className="text-3xl">
              {statesData.filter((s) => s.foreclosureType === "both").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Interactive County Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Foreclosure Map</CardTitle>
          <CardDescription>
            Click any county to view lead data. Blue = Judicial, Red = Non-Judicial.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <CountyMap isDark={isDark} />
        </CardContent>
      </Card>

      {/* States Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredStates.map((state) => (
          <Card
            key={state.abbr}
            className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => setSelectedState(state.abbr)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {stateFlags[state.abbr] && (
                    <a
                      href={stateFlags[state.abbr].wikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 hover:opacity-80 transition-opacity"
                      title={`${state.name} on Wikipedia`}
                    >
                      <img
                        src={stateFlags[state.abbr].flagUrl}
                        alt={`Flag of ${state.name}`}
                        className="h-8 w-auto rounded-sm border border-border shadow-sm"
                        loading="lazy"
                      />
                    </a>
                  )}
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{state.name}</CardTitle>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={typeColors[state.foreclosureType]}>{state.foreclosureType}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{(stateLeadCounts[state.abbr] || 0).toLocaleString()} leads</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statutes */}
              <div className="space-y-2">
                {state.taxOverageStatute && (
                  <div className="flex items-start gap-2 text-sm">
                    <Scale className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">Tax Overage:</span>{" "}
                      <span className="text-muted-foreground">{state.taxOverageStatute}</span>
                    </div>
                  </div>
                )}
                {state.mortgageOverageStatute && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">Mortgage Overage:</span>{" "}
                      <span className="text-muted-foreground">{state.mortgageOverageStatute}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {state.claimWindow && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{state.claimWindow}</span>
                  </div>
                )}
                {state.feeLimits && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{state.feeLimits}</span>
                  </div>
                )}
              </div>

              {/* Data Sources */}
              {state.sources.length > 0 && (
                <div className="pt-2 border-t relative">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Data Sources</p>
                  <div className={`flex flex-wrap gap-1 ${!isPaid ? "select-none" : ""}`} style={!isPaid ? { filter: "blur(4px)" } : undefined}>
                    {state.sources.slice(0, 3).map((source, idx) => (
                      <a
                        key={idx}
                        href={isPaid ? source.url : "#"}
                        target={isPaid ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        onClick={isPaid ? undefined : (e) => e.preventDefault()}
                      >
                        {source.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                    {state.sources.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{state.sources.length - 3} more
                      </span>
                    )}
                  </div>
                  {!isPaid && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                        <Lock className="h-3 w-3" />
                        <span>Subscribe to view</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStates.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No states found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* State Overage Detail Popup */}
      {selectedState && (() => {
        const stateInfo = statesData.find(s => s.abbr === selectedState)
        const overageInfo = stateOverageGuide[selectedState]
        if (!stateInfo) return null

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedState(null)}
          >
            <div
              className="bg-background border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b">
                <div className="flex items-center gap-3">
                  {stateFlags[selectedState] && (
                    <a
                      href={stateFlags[selectedState].wikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 hover:opacity-80 transition-opacity"
                      title={`${stateInfo.name} on Wikipedia`}
                    >
                      <img
                        src={stateFlags[selectedState].flagUrl}
                        alt={`Flag of ${stateInfo.name}`}
                        className="h-10 w-auto rounded-sm border border-border shadow-sm"
                      />
                    </a>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{stateInfo.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={typeColors[stateInfo.foreclosureType]}>
                        {stateInfo.foreclosureType}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{(stateLeadCounts[selectedState] || 0).toLocaleString()} vetted leads</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedState(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Lead Count Banner */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{(stateLeadCounts[selectedState] || 0).toLocaleString()} Vetted Leads Available</span>
                  </div>
                  {isPaid && selectedStates.includes(selectedState) ? (
                    <a
                      href={`/dashboard/leads?state=${selectedState}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-white bg-primary px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Leads
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <a
                      href="/dashboard/settings"
                      className="inline-flex items-center gap-1 text-xs font-medium text-white bg-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-500 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Lock className="h-3 w-3" />
                      {!isPaid ? "Subscribe to Access" : "Add This State"}
                    </a>
                  )}
                </div>
              </div>

              {/* Statutes */}
              <div className="p-5 space-y-4">
                {(overageInfo?.taxOverageStatute || stateInfo.taxOverageStatute) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold">Tax Overage Statute</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {overageInfo?.taxOverageStatute || stateInfo.taxOverageStatute}
                    </p>
                  </div>
                )}

                {(overageInfo?.mortgageOverageStatute || stateInfo.mortgageOverageStatute) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-semibold">Mortgage Overage Statute</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {overageInfo?.mortgageOverageStatute || stateInfo.mortgageOverageStatute}
                    </p>
                  </div>
                )}

                {stateInfo.claimWindow && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold">Claim Window</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{stateInfo.claimWindow}</p>
                  </div>
                )}

                {stateInfo.feeLimits && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold">Fee Limits</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{stateInfo.feeLimits}</p>
                  </div>
                )}

                {/* Notes from 50 States Overage Guide */}
                {overageInfo?.notes && (
                  <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Overage Notes</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {overageInfo.notes}
                    </p>
                  </div>
                )}

                {/* Data Sources - Blurred for unpaid */}
                {stateInfo.sources.length > 0 && (
                  <div className="pt-4 border-t relative">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Data Sources</p>
                    <div className={`flex flex-wrap gap-2 ${!isPaid ? "select-none" : ""}`} style={!isPaid ? { filter: "blur(4px)" } : undefined}>
                      {stateInfo.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={isPaid ? source.url : "#"}
                          target={isPaid ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
                          onClick={isPaid ? undefined : (e) => e.preventDefault()}
                        >
                          {source.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                    {!isPaid && (
                      <div className="absolute inset-0 flex items-center justify-center pt-4">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                          <Lock className="h-3 w-3" />
                          <span>Subscribe to view sources</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
