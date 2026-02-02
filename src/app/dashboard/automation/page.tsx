"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Phone,
  MessageSquare,
  Voicemail,
  Settings,
  Play,
  Pause,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  ArrowRight,
} from "lucide-react"

export default function AutomationPage() {
  const [automationEnabled, setAutomationEnabled] = useState(false)
  const [callbackNumber, setCallbackNumber] = useState("")

  const stats = {
    voicemailsSent: 1247,
    deliveryRate: 94.2,
    callbackRate: 8.7,
    activeLeads: 342,
  }

  const recentActivity = [
    {
      id: 1,
      type: "voicemail",
      lead: "John Smith",
      state: "GA",
      status: "delivered",
      time: "2 min ago",
    },
    {
      id: 2,
      type: "voicemail",
      lead: "Sarah Johnson",
      state: "FL",
      status: "delivered",
      time: "5 min ago",
    },
    {
      id: 3,
      type: "callback",
      lead: "Michael Brown",
      state: "TX",
      status: "received",
      time: "12 min ago",
    },
    {
      id: 4,
      type: "voicemail",
      lead: "Emily Davis",
      state: "CA",
      status: "failed",
      time: "15 min ago",
    },
    {
      id: 5,
      type: "voicemail",
      lead: "Robert Wilson",
      state: "AZ",
      status: "pending",
      time: "18 min ago",
    },
  ]

  const statusIcons = {
    delivered: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    received: <Phone className="h-4 w-4 text-blue-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
  }

  const statusColors = {
    delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voicemail Automation</h1>
          <p className="text-muted-foreground">
            Automated ringless voicemail delivery system
          </p>
        </div>
        <Badge
          variant="outline"
          className={automationEnabled ? "bg-green-50 border-green-500" : ""}
        >
          <span
            className={`mr-2 h-2 w-2 rounded-full ${automationEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
          />
          {automationEnabled ? "System Active" : "System Paused"}
        </Badge>
      </div>

      {/* Upgrade CTA for non-subscribers */}
      <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Automation Add-on</h3>
              <p className="text-sm text-muted-foreground">
                Hands-free voicemail delivery to all your leads - $299/month
              </p>
            </div>
          </div>
          <Button>
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voicemails Sent</CardTitle>
            <Voicemail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.voicemailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Callback Rate</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.callbackRate}%</div>
            <p className="text-xs text-muted-foreground">Leads responded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLeads}</div>
            <p className="text-xs text-muted-foreground">Leads pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Automation Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Controls</CardTitle>
            <CardDescription>Configure your voicemail delivery settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Enable Automation</p>
                <p className="text-sm text-muted-foreground">
                  Automatically send voicemails to new leads
                </p>
              </div>
              <button
                onClick={() => setAutomationEnabled(!automationEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  automationEnabled ? "bg-green-500" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    automationEnabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Callback Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Callback Number</label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={callbackNumber}
                onChange={(e) => setCallbackNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This number will be included in your voicemail script
              </p>
            </div>

            {/* Voicemail Script Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voicemail Script Preview</label>
              <div className="p-4 rounded-lg bg-muted text-sm">
                <p>
                  "Hi, this is a message for{" "}
                  <span className="text-primary">[Owner Name]</span>. I'm reaching out
                  regarding the property at{" "}
                  <span className="text-primary">[Property Address]</span>. There may be
                  surplus funds from a recent foreclosure that you could be entitled to.
                  Please call me back at{" "}
                  <span className="text-primary">
                    {callbackNumber || "[Your Number]"}
                  </span>{" "}
                  to learn more. Thank you."
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" disabled={!automationEnabled}>
                <Play className="mr-2 h-4 w-4" />
                Start Queue
              </Button>
              <Button variant="outline" className="flex-1" disabled={!automationEnabled}>
                <Pause className="mr-2 h-4 w-4" />
                Pause Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest voicemail delivery attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {activity.type === "voicemail" ? (
                      <Voicemail className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Phone className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{activity.lead}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.state} - {activity.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcons[activity.status as keyof typeof statusIcons]}
                    <Badge
                      variant="outline"
                      className={statusColors[activity.status as keyof typeof statusColors]}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Full Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* DNC Compliance Notice */}
      <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950">
        <CardContent className="flex items-start gap-4 py-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              DNC Compliance Notice
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              All leads are automatically checked against the Federal DNC Registry and
              state-specific Do Not Call lists. Numbers flagged as DNC are excluded from
              the voicemail queue. Our system refreshes DNC data every 31 days per FCC
              requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
