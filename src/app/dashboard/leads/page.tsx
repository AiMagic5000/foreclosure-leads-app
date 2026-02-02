"use client"

import { useState } from "react"
import { Metadata } from "next"
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Mock data for leads
const mockLeads = [
  {
    id: "lead_001",
    ownerName: "John Michael Smith",
    propertyAddress: "123 Main Street",
    city: "Atlanta",
    state: "Georgia",
    stateAbbr: "GA",
    zipCode: "30301",
    parcelId: "14-0012-0034-056",
    saleDate: "2026-01-15",
    saleAmount: 285000,
    mortgageAmount: 220000,
    lenderName: "Bank of America",
    foreclosureType: "non-judicial",
    primaryPhone: "(404) 555-1234",
    primaryEmail: "jsmith@email.com",
    status: "new",
    source: "Georgia Public Notice",
    scrapedAt: "2026-02-01T06:00:00Z",
  },
  {
    id: "lead_002",
    ownerName: "Maria Elena Garcia",
    propertyAddress: "456 Oak Avenue",
    city: "Phoenix",
    state: "Arizona",
    stateAbbr: "AZ",
    zipCode: "85001",
    parcelId: "123-45-678",
    saleDate: "2026-01-18",
    saleAmount: 342000,
    mortgageAmount: 275000,
    lenderName: "Wells Fargo",
    foreclosureType: "non-judicial",
    primaryPhone: "(602) 555-5678",
    primaryEmail: null,
    status: "contacted",
    source: "Maricopa County Recorder",
    scrapedAt: "2026-02-01T06:00:00Z",
  },
  {
    id: "lead_003",
    ownerName: "Robert James Johnson",
    propertyAddress: "789 Pine Road",
    city: "Denver",
    state: "Colorado",
    stateAbbr: "CO",
    zipCode: "80201",
    parcelId: "2024-0045-00123",
    saleDate: "2026-01-20",
    saleAmount: 425000,
    mortgageAmount: 350000,
    lenderName: "Chase Bank",
    foreclosureType: "non-judicial",
    primaryPhone: "(303) 555-9012",
    primaryEmail: "rjohnson@gmail.com",
    status: "callback",
    source: "Denver Public Trustee",
    scrapedAt: "2026-02-01T06:00:00Z",
  },
  {
    id: "lead_004",
    ownerName: "Sarah Ann Williams",
    propertyAddress: "321 Elm Street",
    city: "Portland",
    state: "Oregon",
    stateAbbr: "OR",
    zipCode: "97201",
    parcelId: "R123456",
    saleDate: "2026-01-22",
    saleAmount: 380000,
    mortgageAmount: 310000,
    lenderName: "US Bank",
    foreclosureType: "both",
    primaryPhone: "(503) 555-3456",
    primaryEmail: "swilliams@yahoo.com",
    status: "new",
    source: "Multnomah County",
    scrapedAt: "2026-02-01T06:00:00Z",
  },
  {
    id: "lead_005",
    ownerName: "Michael David Brown",
    propertyAddress: "654 Cedar Lane",
    city: "Seattle",
    state: "Washington",
    stateAbbr: "WA",
    zipCode: "98101",
    parcelId: "7890123456",
    saleDate: "2026-01-25",
    saleAmount: 510000,
    mortgageAmount: 420000,
    lenderName: "KeyBank",
    foreclosureType: "non-judicial",
    primaryPhone: "(206) 555-7890",
    primaryEmail: "mbrown@outlook.com",
    status: "skip_traced",
    source: "King County Recorder",
    scrapedAt: "2026-02-01T06:00:00Z",
  },
]

const states = [
  "All States",
  "Georgia",
  "Arizona",
  "Colorado",
  "Oregon",
  "Washington",
  "Tennessee",
  "Nevada",
  "Texas",
  "Florida",
  "California",
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "skip_traced", label: "Skip Traced" },
  { value: "contacted", label: "Contacted" },
  { value: "callback", label: "Callback" },
  { value: "converted", label: "Converted" },
]

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedState, setSelectedState] = useState("All States")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])

  const statusColors = {
    new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    skip_traced: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    contacted: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    callback: "bg-green-500/10 text-green-600 dark:text-green-400",
    converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  } as const

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesState =
      selectedState === "All States" || lead.state === selectedState

    const matchesStatus =
      selectedStatus === "all" || lead.status === selectedStatus

    return matchesSearch && matchesState && matchesStatus
  })

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foreclosure Leads</h1>
          <p className="text-muted-foreground">
            {filteredLeads.length} leads found
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled={selectedLeads.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export ({selectedLeads.length})
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table (Mobile Card View / Desktop Table) */}
      <div className="space-y-4">
        {/* Desktop Table Header */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                onChange={toggleAllLeads}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
            <div className="col-span-3">Property Owner</div>
            <div className="col-span-3">Address</div>
            <div className="col-span-2">Sale Info</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1">Status</div>
          </div>
        </div>

        {/* Leads */}
        {filteredLeads.map((lead) => (
          <Card
            key={lead.id}
            className={cn(
              "transition-colors",
              selectedLeads.includes(lead.id) && "border-primary bg-primary/5"
            )}
          >
            <CardContent className="p-4">
              {/* Desktop Row */}
              <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => toggleLeadSelection(lead.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="col-span-3">
                  <div className="font-medium">{lead.ownerName}</div>
                  <div className="text-sm text-muted-foreground">
                    APN: {lead.parcelId}
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div>{lead.propertyAddress}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.city}, {lead.stateAbbr} {lead.zipCode}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      ${lead.saleAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(lead.saleDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  {lead.primaryPhone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {lead.primaryPhone}
                    </div>
                  )}
                  {lead.primaryEmail && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{lead.primaryEmail}</span>
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex items-center justify-between">
                  <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                    {lead.status.replace("_", " ")}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="lg:hidden space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleLeadSelection(lead.id)}
                      className="h-4 w-4 rounded border-gray-300 mt-1"
                    />
                    <div>
                      <div className="font-medium">{lead.ownerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.city}, {lead.stateAbbr}
                      </div>
                    </div>
                  </div>
                  <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                    {lead.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{lead.propertyAddress}, {lead.city}, {lead.stateAbbr} {lead.zipCode}</span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${lead.saleAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(lead.saleDate).toLocaleDateString()}
                  </div>
                </div>

                {(lead.primaryPhone || lead.primaryEmail) && (
                  <div className="flex flex-wrap gap-4 text-sm border-t pt-3">
                    {lead.primaryPhone && (
                      <a
                        href={`tel:${lead.primaryPhone}`}
                        className="flex items-center gap-1 text-primary"
                      >
                        <Phone className="h-4 w-4" />
                        {lead.primaryPhone}
                      </a>
                    )}
                    {lead.primaryEmail && (
                      <a
                        href={`mailto:${lead.primaryEmail}`}
                        className="flex items-center gap-1 text-primary"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No leads found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
