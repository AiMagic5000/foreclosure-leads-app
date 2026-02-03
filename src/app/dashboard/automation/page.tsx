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
  Database,
  ShieldCheck,
  UserCheck,
  Send,
} from "lucide-react"

export default function AutomationPage() {
  const [automationEnabled, setAutomationEnabled] = useState(false)
  const [callbackNumber, setCallbackNumber] = useState("")

  const stats = {
    voicemailsSent: 499,
    deliveryRate: 94.2,
    callbackRate: 8.7,
    activeLeads: 137,
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

      {/* How It Works - n8n Style Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            How Personalized Voicemail Outreach Works
          </CardTitle>
          <CardDescription>
            Our automated system builds a custom ringless voicemail for every prospect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* n8n-style workflow canvas */}
          <div className="relative bg-[#1a1a2e] dark:bg-[#0d0d1a] rounded-xl p-6 overflow-hidden">
            {/* Dot grid background like n8n canvas */}
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }} />

            {/* Desktop: horizontal node layout */}
            <div className="relative hidden sm:flex items-center gap-0 justify-between">
              {/* Node 1 */}
              <div className="relative z-10 flex flex-col items-center gap-2 flex-1 max-w-[180px]">
                <div className="w-14 h-14 rounded-xl bg-[#3b82f6] flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/30">
                  <Database className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold">Data Collection</p>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">Pull lead & property info</p>
                </div>
                {/* Output handle */}
                <div className="absolute right-[-6px] top-[24px] w-3 h-3 rounded-full bg-[#3b82f6] border-2 border-[#1a1a2e]" />
              </div>

              {/* Wire 1->2 */}
              <div className="flex-1 max-w-[60px] h-[2px] bg-gradient-to-r from-[#3b82f6] to-[#10b981] relative self-start mt-[30px]">
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#10b981]" />
              </div>

              {/* Node 2 */}
              <div className="relative z-10 flex flex-col items-center gap-2 flex-1 max-w-[180px]">
                <div className="w-14 h-14 rounded-xl bg-[#10b981] flex items-center justify-center shadow-lg shadow-green-500/30 border border-green-400/30">
                  <ShieldCheck className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold">DNC Scrubbing</p>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">Federal & state DNC check</p>
                </div>
                <div className="absolute left-[-6px] top-[24px] w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#1a1a2e]" />
                <div className="absolute right-[-6px] top-[24px] w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#1a1a2e]" />
              </div>

              {/* Wire 2->3 */}
              <div className="flex-1 max-w-[60px] h-[2px] bg-gradient-to-r from-[#10b981] to-[#8b5cf6] relative self-start mt-[30px]">
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#8b5cf6]" />
              </div>

              {/* Node 3 */}
              <div className="relative z-10 flex flex-col items-center gap-2 flex-1 max-w-[180px]">
                <div className="w-14 h-14 rounded-xl bg-[#8b5cf6] flex items-center justify-center shadow-lg shadow-purple-500/30 border border-purple-400/30">
                  <UserCheck className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold">Personalize</p>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">Custom message per lead</p>
                </div>
                <div className="absolute left-[-6px] top-[24px] w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-[#1a1a2e]" />
                <div className="absolute right-[-6px] top-[24px] w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-[#1a1a2e]" />
              </div>

              {/* Wire 3->4 */}
              <div className="flex-1 max-w-[60px] h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#f59e0b] relative self-start mt-[30px]">
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#f59e0b]" />
              </div>

              {/* Node 4 */}
              <div className="relative z-10 flex flex-col items-center gap-2 flex-1 max-w-[180px]">
                <div className="w-14 h-14 rounded-xl bg-[#f59e0b] flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-400/30">
                  <Send className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold">Ringless Delivery</p>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">Direct to voicemail</p>
                </div>
                <div className="absolute left-[-6px] top-[24px] w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-[#1a1a2e]" />
              </div>
            </div>

            {/* Mobile: vertical node layout */}
            <div className="relative sm:hidden flex flex-col items-center gap-0">
              {/* Node 1 */}
              <div className="relative z-10 flex items-center gap-3 w-full bg-[#222244] rounded-xl p-3 border border-[#3b82f6]/30">
                <div className="w-11 h-11 rounded-lg bg-[#3b82f6] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Data Collection</p>
                  <p className="text-gray-400 text-[10px] leading-tight">Pull lead & property info</p>
                </div>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#3b82f6] border-2 border-[#1a1a2e] z-20" />
              </div>

              {/* Wire 1->2 */}
              <div className="w-[2px] h-6 bg-gradient-to-b from-[#3b82f6] to-[#10b981]" />

              {/* Node 2 */}
              <div className="relative z-10 flex items-center gap-3 w-full bg-[#222244] rounded-xl p-3 border border-[#10b981]/30">
                <div className="w-11 h-11 rounded-lg bg-[#10b981] flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">DNC Scrubbing</p>
                  <p className="text-gray-400 text-[10px] leading-tight">Federal & state DNC check</p>
                </div>
                <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#1a1a2e] z-20" />
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#1a1a2e] z-20" />
              </div>

              {/* Wire 2->3 */}
              <div className="w-[2px] h-6 bg-gradient-to-b from-[#10b981] to-[#8b5cf6]" />

              {/* Node 3 */}
              <div className="relative z-10 flex items-center gap-3 w-full bg-[#222244] rounded-xl p-3 border border-[#8b5cf6]/30">
                <div className="w-11 h-11 rounded-lg bg-[#8b5cf6] flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Personalize</p>
                  <p className="text-gray-400 text-[10px] leading-tight">Custom message per lead</p>
                </div>
                <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-[#1a1a2e] z-20" />
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-[#1a1a2e] z-20" />
              </div>

              {/* Wire 3->4 */}
              <div className="w-[2px] h-6 bg-gradient-to-b from-[#8b5cf6] to-[#f59e0b]" />

              {/* Node 4 */}
              <div className="relative z-10 flex items-center gap-3 w-full bg-[#222244] rounded-xl p-3 border border-[#f59e0b]/30">
                <div className="w-11 h-11 rounded-lg bg-[#f59e0b] flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Ringless Delivery</p>
                  <p className="text-gray-400 text-[10px] leading-tight">Direct to voicemail</p>
                </div>
                <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-[#1a1a2e] z-20" />
              </div>
            </div>
          </div>

          {/* Detail cards below the canvas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#3b82f6] text-white text-sm font-bold">1</span>
                <h4 className="font-medium text-sm">Data Collection</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                We pull all lead data and property information for each prospect -- owner name, property address,
                county, state, foreclosure type, and surplus fund amounts.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#10b981] text-white text-sm font-bold">2</span>
                <h4 className="font-medium text-sm">DNC Scrubbing</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Before any outreach, every phone number is scrubbed against the Federal Do Not Call Registry
                and state-specific DNC lists. Non-compliant numbers are removed from the queue automatically.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#8b5cf6] text-white text-sm font-bold">3</span>
                <h4 className="font-medium text-sm">Personalized Message</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Each voicemail is generated using the prospect's actual data -- their name, property address,
                and relevant details -- so every message feels personal rather than a generic blast.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#f59e0b] text-white text-sm font-bold">4</span>
                <h4 className="font-medium text-sm">Ringless Delivery</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                The personalized voicemail is delivered directly to the prospect's voicemail box
                without ringing their phone. Non-intrusive with higher callback rates than cold calls.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <strong className="text-foreground">Compliance built in:</strong> Our system refreshes DNC data every 31 days
            per FCC requirements. State-specific regulations are applied based on the state each voicemail
            is delivered to, so your outreach stays compliant no matter where your leads are located.
          </div>
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
            <p className="text-xs text-muted-foreground">This week</p>
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
            <p className="text-xs text-muted-foreground">Leads pending this week</p>
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
