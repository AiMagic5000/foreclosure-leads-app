import { Metadata } from "next"
import Link from "next/link"
import {
  Users,
  TrendingUp,
  Phone,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your foreclosure leads and manage your surplus funds recovery pipeline.",
}

export default function DashboardPage() {
  // Mock data - in production this would come from the database
  const stats = [
    {
      title: "Total Leads",
      value: "1,247",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      description: "This month",
    },
    {
      title: "Skip Traced",
      value: "1,089",
      change: "87%",
      changeType: "neutral" as const,
      icon: Phone,
      description: "Success rate",
    },
    {
      title: "DNC Clean",
      value: "892",
      change: "-8%",
      changeType: "negative" as const,
      icon: CheckCircle,
      description: "After scrubbing",
    },
    {
      title: "Callbacks",
      value: "47",
      change: "+23%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "This week",
    },
  ]

  const recentLeads = [
    {
      id: "1",
      ownerName: "John Smith",
      address: "123 Main St, Atlanta, GA 30301",
      state: "GA",
      saleAmount: 285000,
      status: "new",
      date: "2 hours ago",
    },
    {
      id: "2",
      ownerName: "Maria Garcia",
      address: "456 Oak Ave, Phoenix, AZ 85001",
      state: "AZ",
      saleAmount: 342000,
      status: "contacted",
      date: "4 hours ago",
    },
    {
      id: "3",
      ownerName: "Robert Johnson",
      address: "789 Pine Rd, Denver, CO 80201",
      state: "CO",
      saleAmount: 425000,
      status: "callback",
      date: "6 hours ago",
    },
    {
      id: "4",
      ownerName: "Sarah Williams",
      address: "321 Elm St, Portland, OR 97201",
      state: "OR",
      saleAmount: 380000,
      status: "new",
      date: "8 hours ago",
    },
    {
      id: "5",
      ownerName: "Michael Brown",
      address: "654 Cedar Ln, Seattle, WA 98101",
      state: "WA",
      saleAmount: 510000,
      status: "skip_traced",
      date: "10 hours ago",
    },
  ]

  const topStates = [
    { state: "Georgia", abbr: "GA", leads: 312, change: "+18%" },
    { state: "Arizona", abbr: "AZ", leads: 245, change: "+12%" },
    { state: "Colorado", abbr: "CO", leads: 198, change: "+8%" },
    { state: "Texas", abbr: "TX", leads: 176, change: "+22%" },
    { state: "Florida", abbr: "FL", leads: 154, change: "+5%" },
  ]

  const statusColors = {
    new: "bg-blue-500/10 text-blue-600",
    skip_traced: "bg-purple-500/10 text-purple-600",
    contacted: "bg-yellow-500/10 text-yellow-600",
    callback: "bg-green-500/10 text-green-600",
  } as const

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your foreclosure leads and recovery pipeline.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/leads">
            <Button>View All Leads</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.changeType === "positive" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : stat.changeType === "negative" ? (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={
                    stat.changeType === "positive"
                      ? "text-green-500"
                      : stat.changeType === "negative"
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }
                >
                  {stat.change}
                </span>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest foreclosure leads from today</CardDescription>
            </div>
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{lead.ownerName}</span>
                      <Badge variant="outline" className="text-xs">
                        {lead.state}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{lead.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right hidden sm:block">
                      <div className="font-medium">
                        ${lead.saleAmount.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {lead.date}
                      </div>
                    </div>
                    <Badge
                      className={statusColors[lead.status as keyof typeof statusColors]}
                    >
                      {lead.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top States */}
        <Card>
          <CardHeader>
            <CardTitle>Top States</CardTitle>
            <CardDescription>Leads by state this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStates.map((state, i) => (
                <div key={state.abbr} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{state.state}</span>
                      <span className="text-sm text-muted-foreground">
                        {state.leads} leads
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(state.leads / 312) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Update Notice */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Data last updated: Today at 6:00 AM PST
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Next update in 18 hours
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
