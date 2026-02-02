"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  User,
  CreditCard,
  Bell,
  Shield,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useUser()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailDigest, setEmailDigest] = useState("daily")

  // Mock subscription data
  const subscription = {
    plan: "Multi-State",
    price: 499,
    status: "active",
    nextBilling: "March 2, 2026",
    selectedStates: ["GA", "FL", "TX", "CA", "AZ", "NV", "CO", "WA", "OR", "TN"],
    automationAddon: true,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and subscription</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-medium">
                  {user?.fullName || "User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress || "email@example.com"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input defaultValue={user?.fullName || ""} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  defaultValue={user?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Managed by Clerk authentication
                </p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input placeholder="Your company name" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input type="tel" placeholder="(555) 123-4567" />
              </div>
            </div>

            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>Manage your plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{subscription.plan} Plan</h4>
                  <p className="text-2xl font-bold">
                    ${subscription.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-50 border-green-500 text-green-700"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Next billing: {subscription.nextBilling}</span>
              </div>
            </div>

            {/* Selected States */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                <span>Selected States ({subscription.selectedStates.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subscription.selectedStates.map((state) => (
                  <Badge key={state} variant="secondary">
                    {state}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automation Add-on</p>
                  <p className="text-sm text-muted-foreground">+$299/month</p>
                </div>
                {subscription.automationAddon ? (
                  <Badge variant="outline" className="bg-green-50 border-green-500">
                    Active
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm">
                    Add
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                Change Plan
              </Button>
              <Button variant="outline" className="flex-1">
                Update Card
              </Button>
            </div>

            <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new leads and callbacks
                </p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Digest Frequency</label>
              <div className="flex gap-2">
                {["daily", "weekly", "never"].map((option) => (
                  <Button
                    key={option}
                    variant={emailDigest === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmailDigest(option)}
                    className="capitalize"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Notify me about:</p>
              {[
                { label: "New leads in my states", checked: true },
                { label: "Callback received", checked: true },
                { label: "Voicemail delivery status", checked: false },
                { label: "Weekly performance report", checked: true },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security & Compliance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Security & Compliance</CardTitle>
            </div>
            <CardDescription>Account security and legal compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Account Secured
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Two-factor authentication is enabled via Clerk
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Compliance Documents</h4>
              {[
                { name: "TCPA Compliance Guide", date: "Updated Feb 2026" },
                { name: "DNC Registry Guidelines", date: "Updated Jan 2026" },
                { name: "State Telemarketing Laws", date: "Updated Feb 2026" },
              ].map((doc, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.date}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>

            <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Important Reminder
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You are responsible for complying with all applicable federal and
                    state telemarketing laws. Review our compliance guides before
                    contacting leads.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
