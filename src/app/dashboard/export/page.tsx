"use client"

import { useState } from "react"
import { statesData } from "@/data/states"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  FileSpreadsheet,
  FileJson,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react"

export default function ExportPage() {
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [dateRange, setDateRange] = useState("7")
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [includeSkipTrace, setIncludeSkipTrace] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const toggleState = (abbr: string) => {
    setSelectedStates((prev) =>
      prev.includes(abbr) ? prev.filter((s) => s !== abbr) : [...prev, abbr]
    )
  }

  const selectAllStates = () => {
    setSelectedStates(statesData.map((s) => s.abbr))
  }

  const clearSelection = () => {
    setSelectedStates([])
  }

  const handleExport = async () => {
    setIsExporting(true)
    // Simulated export - in production this would call an API endpoint
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsExporting(false)
    // Would trigger download here
  }

  const recentExports = [
    {
      id: 1,
      date: "2026-02-01",
      states: ["GA", "FL", "TX"],
      leads: 1247,
      format: "csv",
    },
    {
      id: 2,
      date: "2026-01-28",
      states: ["CA", "AZ", "NV"],
      leads: 892,
      format: "csv",
    },
    {
      id: 3,
      date: "2026-01-25",
      states: ["All States"],
      leads: 5834,
      format: "json",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Data</h1>
        <p className="text-muted-foreground">
          Download foreclosure leads in CSV or JSON format
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* State Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Select States</CardTitle>
                  <CardDescription>
                    Choose which states to include in your export
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllStates}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                {statesData.map((state) => (
                  <button
                    key={state.abbr}
                    onClick={() => toggleState(state.abbr)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedStates.includes(state.abbr)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-input"
                    }`}
                  >
                    {state.abbr}
                  </button>
                ))}
              </div>
              {selectedStates.length > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {selectedStates.length} state{selectedStates.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
              <CardDescription>Configure your export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "7", label: "Last 7 days" },
                    { value: "14", label: "Last 14 days" },
                    { value: "30", label: "Last 30 days" },
                    { value: "90", label: "Last 90 days" },
                    { value: "all", label: "All time" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={dateRange === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      exportFormat === "csv"
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-muted-foreground"
                    }`}
                  >
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium">CSV</p>
                      <p className="text-xs text-muted-foreground">
                        Compatible with Excel, Google Sheets
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportFormat("json")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      exportFormat === "json"
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-muted-foreground"
                    }`}
                  >
                    <FileJson className="h-8 w-8 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium">JSON</p>
                      <p className="text-xs text-muted-foreground">
                        For developers and CRM integration
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Include Skip Trace */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Include Skip Trace Data</p>
                  <p className="text-sm text-muted-foreground">
                    Phone numbers, emails, and mailing addresses
                  </p>
                </div>
                <button
                  onClick={() => setIncludeSkipTrace(!includeSkipTrace)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    includeSkipTrace ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      includeSkipTrace ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Summary & Actions */}
        <div className="space-y-6">
          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">States</span>
                <span className="font-medium">
                  {selectedStates.length === 0
                    ? "None selected"
                    : selectedStates.length === statesData.length
                      ? "All states"
                      : `${selectedStates.length} states`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Date Range</span>
                <span className="font-medium">
                  {dateRange === "all" ? "All time" : `Last ${dateRange} days`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Format</span>
                <span className="font-medium uppercase">{exportFormat}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Skip Trace</span>
                <span className="font-medium">{includeSkipTrace ? "Included" : "Excluded"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Est. Records</span>
                <span className="font-medium text-lg">
                  {selectedStates.length === 0
                    ? "0"
                    : (selectedStates.length * 247).toLocaleString()}
                </span>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={selectedStates.length === 0 || isExporting}
                onClick={handleExport}
              >
                {isExporting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Export...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Exports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Exports</CardTitle>
              <CardDescription>Your last 3 exports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentExports.map((export_) => (
                <div
                  key={export_.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{export_.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {export_.states.join(", ")} - {export_.leads.toLocaleString()} leads
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase text-xs">
                      {export_.format}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
