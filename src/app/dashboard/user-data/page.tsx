"use client"

import { useState, useEffect } from "react"
import { useAdmin } from "@/lib/use-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  UserCircle,
  Shield,
  Loader2,
  Search,
  Users,
  Mail,
  Calendar,
  RefreshCw,
  Download,
  Clock,
  Crown,
  ArrowUpDown,
  Phone,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"

interface UserRecord {
  id: string
  clerk_id: string
  email: string
  full_name: string | null
  role: number | null
  subscription_tier: string | null
  subscription_status: string | null
  account_type: string | null
  selected_states: string[] | null
  automation_enabled: boolean | null
  created_at: string
  updated_at: string | null
  last_sign_in: string | null
  phone: string | null
  image_url: string | null
}

const tierLabels: Record<string, string> = {
  free: "Free",
  single_state: "Single State",
  multi_state: "Multi State",
  owner_operator: "Owner Operator",
}

const tierColors: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  single_state: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  multi_state: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  owner_operator: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  canceled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  past_due: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  trialing: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
}

const accountTypeLabels: Record<string, string> = {
  basic: "Basic",
  partnership: "Partnership",
  owner_operator: "Owner Operator",
  admin: "Admin",
}

const accountTypeColors: Record<string, string> = {
  basic: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  partnership: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  owner_operator: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  admin: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

type SortField = "created_at" | "email" | "subscription_tier" | "account_type"

export default function UserDataPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortAsc, setSortAsc] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const updateAccountType = async (userId: string, accountType: string) => {
    setSavingId(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, accountType }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, account_type: accountType } : u))
        )
      }
    } catch {
      // silently fail
    }
    setSavingId(null)
  }

  const updateSubscriptionTier = async (userId: string, tier: string) => {
    setSavingId(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscriptionTier: tier }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, subscription_tier: tier } : u))
        )
      }
    } catch {
      // silently fail
    }
    setSavingId(null)
  }

  const filteredUsers = users
    .filter((u) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        u.email.toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.subscription_tier || "").toLowerCase().includes(q) ||
        (u.account_type || "").toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortField === "created_at") {
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
      if (sortField === "email") {
        return dir * a.email.localeCompare(b.email)
      }
      if (sortField === "subscription_tier") {
        return dir * (a.subscription_tier || "free").localeCompare(b.subscription_tier || "free")
      }
      if (sortField === "account_type") {
        return dir * (a.account_type || "basic").localeCompare(b.account_type || "basic")
      }
      return 0
    })

  const exportCSV = () => {
    const headers = ["Email", "Name", "Account Type", "Tier", "Status", "States", "Phone", "Signed Up", "Last Sign In"]
    const rows = filteredUsers.map((u) => [
      u.email,
      u.full_name || "",
      accountTypeLabels[u.account_type || "basic"] || u.account_type || "basic",
      tierLabels[u.subscription_tier || "free"] || u.subscription_tier || "free",
      u.subscription_status || "active",
      (u.selected_states || []).join(";"),
      u.phone || "",
      new Date(u.created_at).toLocaleDateString(),
      u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : "",
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `user-data-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-blue-300/60 bg-gradient-to-br from-blue-50 via-blue-50 to-sky-50 shadow-[0_8px_30px_rgba(37,99,235,0.15)] backdrop-blur-sm dark:from-blue-950 dark:via-blue-950 dark:to-sky-950 dark:border-blue-700/40">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 ring-4 ring-blue-200/50 dark:from-blue-800 dark:to-blue-900 dark:ring-blue-700/50">
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              Senior Agent Access Only
            </h2>
            <p className="text-blue-800/70 dark:text-blue-300/70 text-sm leading-relaxed mb-4 sm:mb-6">
              The User Data section is available to Senior Agents (Owner Operators) who have purchased the full business build package. Call us to get started.
            </p>
            <p className="text-blue-800/70 dark:text-blue-300/70 text-sm mb-5 sm:mb-6">
              <a
                href="tel:+18885458007"
                className="text-blue-700 dark:text-blue-400 font-bold hover:text-blue-900 dark:hover:text-blue-200 underline underline-offset-2 decoration-blue-400/60 transition-colors"
              >
                (888) 545-8007
              </a>
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 text-sm sm:text-base"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalUsers = users.length
  const adminUsers = users.filter((u) => u.account_type === "admin").length
  const partnershipUsers = users.filter((u) => u.account_type === "partnership").length
  const ownerOperatorUsers = users.filter((u) => u.account_type === "owner_operator").length
  const recentSignups = users.filter((u) => {
    const d = new Date(u.created_at)
    const now = new Date()
    return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCircle className="h-6 w-6" />
            User Data
          </h1>
          <p className="text-muted-foreground">All registered accounts -- manage account types and tiers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredUsers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </div>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            </div>
            <p className="text-3xl font-bold">{adminUsers}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Owner Operators</CardTitle>
            </div>
            <p className="text-3xl font-bold">{ownerOperatorUsers}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Partnerships</CardTitle>
            </div>
            <p className="text-3xl font-bold">{partnershipUsers}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Last 7 Days</CardTitle>
            </div>
            <p className="text-3xl font-bold">{recentSignups}</p>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by email, name, tier, or account type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">
                      <button onClick={() => toggleSort("email")} className="flex items-center gap-1 hover:text-primary">
                        <Mail className="h-3.5 w-3.5" /> Email
                        {sortField === "email" && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">
                      <button onClick={() => toggleSort("account_type")} className="flex items-center gap-1 hover:text-primary">
                        Account Type
                        {sortField === "account_type" && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <button onClick={() => toggleSort("subscription_tier")} className="flex items-center gap-1 hover:text-primary">
                        Tier
                        {sortField === "subscription_tier" && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> Phone
                      </span>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-primary">
                        <Calendar className="h-3.5 w-3.5" /> Signed Up
                        {sortField === "created_at" && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Last Sign In
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const acctType = u.account_type || "basic"
                    const tier = u.subscription_tier || "free"
                    const status = u.subscription_status || "active"
                    const name = u.full_name || "--"
                    const isSaving = savingId === u.id

                    return (
                      <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {u.image_url ? (
                              <img
                                src={u.image_url}
                                alt=""
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <UserCircle className="h-4 w-4 text-slate-500" />
                              </div>
                            )}
                            <span className="font-medium">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{name}</td>
                        <td className="py-3 px-2">
                          <div className="relative">
                            <select
                              value={acctType}
                              onChange={(e) => updateAccountType(u.id, e.target.value)}
                              disabled={isSaving}
                              className="appearance-none bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium cursor-pointer hover:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-6 min-w-[130px]"
                            >
                              <option value="basic">Basic</option>
                              <option value="partnership">Partnership</option>
                              <option value="owner_operator">Owner Operator</option>
                              <option value="admin">Admin</option>
                            </select>
                            {isSaving ? (
                              <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-emerald-500" />
                            ) : (
                              <CheckCircle2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={tier}
                            onChange={(e) => updateSubscriptionTier(u.id, e.target.value)}
                            disabled={isSaving}
                            className="appearance-none bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs font-medium cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-6 min-w-[120px]"
                          >
                            <option value="free">Free</option>
                            <option value="single_state">Single State</option>
                            <option value="multi_state">Multi State</option>
                            <option value="owner_operator">Owner Operator</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={`text-xs ${statusColors[status] || statusColors.active}`}>
                            {status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground">
                          {u.phone || "--"}
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground">
                          {u.last_sign_in
                            ? new Date(u.last_sign_in).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "--"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
