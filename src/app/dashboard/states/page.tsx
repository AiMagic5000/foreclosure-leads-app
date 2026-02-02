"use client"

import { useState } from "react"
import { statesData } from "@/data/states"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Scale, Clock, DollarSign, FileText, ExternalLink } from "lucide-react"

export default function StatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")

  const filteredStates = statesData.filter((state) => {
    const matchesSearch =
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.abbr.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || state.foreclosureType === selectedType
    return matchesSearch && matchesType
  })

  const typeColors = {
    judicial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "non-judicial": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    both: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
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

      {/* States Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredStates.map((state) => (
          <Card key={state.abbr} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{state.name}</CardTitle>
                </div>
                <Badge className={typeColors[state.foreclosureType]}>{state.foreclosureType}</Badge>
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
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Data Sources</p>
                  <div className="flex flex-wrap gap-1">
                    {state.sources.slice(0, 3).map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
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
    </div>
  )
}
