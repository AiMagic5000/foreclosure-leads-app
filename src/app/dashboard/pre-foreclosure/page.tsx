"use client"

import { AdminGate } from "@/components/admin-gate"
import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Calendar,
  MapPin,
  DollarSign,
  Home,
  Filter,
  Download,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PreForeclosureLead {
  id: string
  owner_name: string
  property_address: string
  city: string
  state_abbr: string
  zip_code: string
  county: string
  sale_date: string | null
  opening_bid: number | null
  redfin_estimate: number | null
  potential_surplus: number | null
  bedrooms: number | null
  bathrooms: number | null
  sq_ft: number | null
  year_built: number | null
  property_type: string | null
  data_source: string | null
  case_number: string | null
  redfin_url: string | null
  property_url: string | null
  status: string
  assigned_to: string | null
  notes: string | null
  created_at: string
}

type SortField = "owner_name" | "county" | "sale_date" | "redfin_estimate" | "potential_surplus" | "created_at"

const PAGE_SIZE = 50

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  monitoring: "bg-amber-100 text-amber-700",
  sale_occurred: "bg-purple-100 text-purple-700",
  surplus_found: "bg-emerald-100 text-emerald-700",
  contacted: "bg-sky-100 text-sky-700",
  agreement_signed: "bg-green-100 text-green-700",
  no_surplus: "bg-gray-100 text-gray-500",
  expired: "bg-red-100 text-red-600",
}

function formatCurrency(val: number | null): string {
  if (!val) return "--"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val)
}

function formatDate(d: string | null): string {
  if (!d) return "--"
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return d
  }
}

function PreForeclosureContent() {
  const [leads, setLeads] = useState<PreForeclosureLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [countyFilter, setCountyFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("sale_date")
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("pre_foreclosure_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000)

    if (!error && data) {
      setLeads(data as PreForeclosureLead[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const counties = useMemo(() => {
    const set = new Set(leads.map((l) => l.county).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])

  const filtered = useMemo(() => {
    let result = leads

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.owner_name?.toLowerCase().includes(q) ||
          l.property_address?.toLowerCase().includes(q) ||
          l.county?.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter)
    }

    if (countyFilter !== "all") {
      result = result.filter((l) => l.county === countyFilter)
    }

    result = [...result].sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

    return result
  }, [leads, search, statusFilter, countyFilter, sortField, sortAsc])

  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const stats = useMemo(() => {
    const total = leads.length
    const withEstimate = leads.filter((l) => l.redfin_estimate && l.redfin_estimate > 0)
    const avgEstimate = withEstimate.length ? withEstimate.reduce((s, l) => s + (l.redfin_estimate || 0), 0) / withEstimate.length : 0
    const upcoming = leads.filter((l) => {
      if (!l.sale_date) return false
      return new Date(l.sale_date) >= new Date()
    }).length
    const surplusFound = leads.filter((l) => l.status === "surplus_found").length
    return { total, avgEstimate, upcoming, surplusFound }
  }, [leads])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortAsc ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
    ) : null

  const handleExport = () => {
    const headers = ["Owner", "Address", "City", "State", "Zip", "County", "Sale Date", "Opening Bid", "Redfin Estimate", "Potential Surplus", "Status", "Source", "Case #"]
    const rows = filtered.map((l) => [
      l.owner_name,
      l.property_address,
      l.city,
      l.state_abbr,
      l.zip_code,
      l.county,
      l.sale_date || "",
      l.opening_bid || "",
      l.redfin_estimate || "",
      l.potential_surplus || "",
      l.status,
      l.data_source || "",
      l.case_number || "",
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pre-foreclosure-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Foreclosure Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upcoming foreclosure auction properties - monitor for surplus generation after sale
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Leads</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.upcoming.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Upcoming Sales</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgEstimate)}</p>
              <p className="text-xs text-gray-500">Avg Property Value</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.surplusFound}</p>
              <p className="text-xs text-gray-500">Surplus Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search owner, address, county..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="monitoring">Monitoring</option>
          <option value="sale_occurred">Sale Occurred</option>
          <option value="surplus_found">Surplus Found</option>
          <option value="contacted">Contacted</option>
          <option value="agreement_signed">Agreement Signed</option>
          <option value="no_surplus">No Surplus</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={countyFilter}
          onChange={(e) => { setCountyFilter(e.target.value); setPage(0) }}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white"
        >
          <option value="all">All Counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{filtered.length.toLocaleString()} leads found</span>
        <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pre-Foreclosure Leads Yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Pre-foreclosure leads from ForeclosureDataHub and other sources will appear here once imported.
            These are properties scheduled for foreclosure auction that may generate surplus funds after sale.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("owner_name")}>
                    <span className="flex items-center gap-1">Owner <SortIcon field="owner_name" /></span>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("county")}>
                    <span className="flex items-center gap-1">County <SortIcon field="county" /></span>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("sale_date")}>
                    <span className="flex items-center gap-1">Sale Date <SortIcon field="sale_date" /></span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("redfin_estimate")}>
                    <span className="flex items-center justify-end gap-1">Est. Value <SortIcon field="redfin_estimate" /></span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("potential_surplus")}>
                    <span className="flex items-center justify-end gap-1">Pot. Surplus <SortIcon field="potential_surplus" /></span>
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((lead) => (
                  <tr key={lead.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap max-w-[200px] truncate">
                      {lead.owner_name || "--"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        {lead.property_address ? `${lead.property_address}, ${lead.city || ""} ${lead.state_abbr || ""}` : "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.county || "--"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(lead.sale_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(lead.redfin_estimate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={lead.potential_surplus && lead.potential_surplus > 0 ? "text-emerald-600" : "text-gray-400"}>
                        {formatCurrency(lead.potential_surplus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[lead.status] || STATUS_COLORS.new)}>
                        {lead.status?.replace(/_/g, " ") || "new"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {lead.redfin_url && (
                          <a href={lead.redfin_url} target="_blank" rel="noopener noreferrer" title="Redfin" className="p-1 rounded hover:bg-gray-100">
                            <Home className="h-4 w-4 text-red-500" />
                          </a>
                        )}
                        {lead.property_url && (
                          <a href={lead.property_url} target="_blank" rel="noopener noreferrer" title="Auction" className="p-1 rounded hover:bg-gray-100">
                            <ExternalLink className="h-4 w-4 text-blue-500" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-gray-500">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PreForeclosurePage() {
  return (
    <AdminGate>
      <PreForeclosureContent />
    </AdminGate>
  )
}
