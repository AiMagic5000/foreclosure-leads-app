"use client"

import { useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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
  Zap,
  Briefcase,
  ClipboardList,
  GraduationCap,
  Building2,
  Globe,
  ArrowRight,
  Lock,
  TrendingUp,
  Camera,
  X,
  Check,
} from "lucide-react"

const DEFAULT_AVATAR = "/avatars/default-shield.jpg"

export default function SettingsPage() {
  const { user } = useUser()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailDigest, setEmailDigest] = useState("daily")
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_AVATAR)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [showUpdateCard, setShowUpdateCard] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("multi-state")
  const [cardSaved, setCardSaved] = useState(false)
  const [planChanged, setPlanChanged] = useState(false)

  const plans = [
    {
      id: "single-state",
      name: "Single State",
      price: 99,
      description: "Access leads in 1 state",
      features: ["1 state of your choice", "Unlimited leads", "CSV export", "Email support"],
    },
    {
      id: "five-state",
      name: "5-State Bundle",
      price: 249,
      description: "Access leads in up to 5 states",
      features: ["Up to 5 states", "Unlimited leads", "CSV export", "Priority support", "Weekly digest"],
    },
    {
      id: "multi-state",
      name: "Multi-State",
      price: 499,
      description: "Access all 50 states",
      features: ["All 50 states", "Unlimited leads", "CSV + API export", "Priority support", "Daily digest", "Dedicated account manager"],
      popular: true,
    },
  ]

  const handleChangePlan = () => {
    setPlanChanged(true)
    setTimeout(() => {
      setPlanChanged(false)
      setShowChangePlan(false)
    }, 2000)
  }

  const handleUpdateCard = () => {
    setCardSaved(true)
    setTimeout(() => {
      setCardSaved(false)
      setShowUpdateCard(false)
    }, 2000)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setProfileImage(ev.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

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
        <Card className="border-2 border-blue-900" style={{ borderStyle: "dashed", backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(30,58,95,0.07) 4px, rgba(30,58,95,0.07) 5px)" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover border-2 border-background shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium">
                  {user?.fullName || "User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress || "email@example.com"}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Change profile photo
                </button>
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
        <Card className="bg-[#0f172a] text-white border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-white/80" />
              <CardTitle className="text-white">Subscription</CardTitle>
            </div>
            <CardDescription className="text-white/70">Manage your plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-white/20 bg-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg text-white">{subscription.plan} Plan</h4>
                  <p className="text-2xl font-bold text-white">
                    ${subscription.price}
                    <span className="text-sm font-normal text-white/70">/month</span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/20 border-emerald-400 text-emerald-200"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/70">
                <Calendar className="h-4 w-4" />
                <span>Next billing: {subscription.nextBilling}</span>
              </div>
            </div>

            {/* Selected States */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                <MapPin className="h-4 w-4" />
                <span>Selected States ({subscription.selectedStates.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subscription.selectedStates.map((state) => (
                  <Badge key={state} className="bg-white/15 text-white border-white/20 hover:bg-white/25">
                    {state}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div className="p-3 rounded-lg border border-white/20 bg-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Automation Add-on</p>
                  <p className="text-sm text-white/70">+$299/month</p>
                </div>
                {subscription.automationAddon ? (
                  <Badge className="bg-emerald-500/20 border-emerald-400 text-emerald-200">
                    Active
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                    Add
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-white/15 text-white hover:bg-white/25 border border-white/20" onClick={() => setShowChangePlan(true)}>
                Change Plan
              </Button>
              <Button className="flex-1 bg-white/15 text-white hover:bg-white/25 border border-white/20" onClick={() => setShowUpdateCard(true)}>
                Update Card
              </Button>
            </div>

            <Button variant="ghost" className="w-full text-red-300 hover:text-red-200 hover:bg-red-500/20">
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Upgrades & Add-ons */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Upgrades & Add-ons</CardTitle>
            </div>
            <CardDescription>Expand your asset recovery business with premium features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Automation */}
              <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Zap className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Automation</h4>
                    {subscription.automationAddon ? (
                      <Badge variant="outline" className="text-[10px] bg-green-50 border-green-400 text-green-700">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">+$299/mo</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Automated voicemail drops, lead follow-up sequences, and smart scheduling on autopilot.</p>
                <Link href="/dashboard/automation">
                  <Button variant="outline" size="sm" className="w-full">
                    {subscription.automationAddon ? "Manage" : "Add to Plan"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Hire a Closer */}
              <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Briefcase className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Hire a Closer</h4>
                    <Badge variant="outline" className="text-[10px]">10% of Service Fee</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Vetted recovery agents who close leads on recorded lines with full transcripts and training tools.</p>
                <Link href="/dashboard/hire-closer">
                  <Button variant="outline" size="sm" className="w-full">
                    Browse 12 Agents
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Contract Admin */}
              <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <ClipboardList className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Contract Admin</h4>
                    <Badge variant="outline" className="text-[10px]">5% of Service Fee</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Administrators handle attorneys, notaries, client follow-up, and document filing. Attorney fees separate.</p>
                <Link href="/dashboard/contract-admin">
                  <Button variant="outline" size="sm" className="w-full">
                    Browse 12 Admins
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Closing Training */}
              <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <GraduationCap className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Closing Training</h4>
                    <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-400 text-indigo-700">New</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">8-module video course covering the full closing process. Earn your Certified Recovery Closer credential.</p>
                <Link href="/dashboard/closing-training">
                  <Button variant="outline" size="sm" className="w-full">
                    Start Training
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Multi-State Upgrade */}
              <div className="rounded-xl border-0 p-5 space-y-3 relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/15">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Multi-State Access</h4>
                    <Badge className="text-[10px] bg-white/20 text-white border-white/30">$499/mo</Badge>
                  </div>
                </div>
                <p className="text-xs text-white/80">Unlock all 50 states for lead generation. Maximize your pipeline with nationwide coverage.</p>
                <Button size="sm" className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold">
                  Upgrade Now
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Fully Built Business */}
              <div className="rounded-xl border border-emerald-500/30 p-5 space-y-3 relative overflow-hidden bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-600/10">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Fully Built Business</h4>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-400 text-emerald-700">Premium</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Complete asset recovery business with 45 points of compliance, LLC formation, contracts, and everything you need.</p>
                <a href="https://assetrecoverybusiness.com/" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                    Learn More
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Fee Structure Summary */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Fee Structure at a Glance
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-background border">
                  <span className="text-muted-foreground">Closer Fee</span>
                  <span className="font-medium">10% of service fee</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-background border">
                  <span className="text-muted-foreground">Contract Admin Fee</span>
                  <span className="font-medium">5% of service fee</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-background border">
                  <span className="text-muted-foreground">Attorney Fees</span>
                  <span className="font-medium">Billed separately</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-background border">
                  <span className="text-muted-foreground">Example: $100K recovery (25% fee)</span>
                  <span className="font-medium text-emerald-600">You keep $21,250</span>
                </div>
              </div>
            </div>
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

      {/* Change Plan Modal */}
      {showChangePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChangePlan(false)} />
          <div className="relative bg-background rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Change Your Plan</h2>
                <p className="text-sm text-muted-foreground">Select the plan that fits your business</p>
              </div>
              <button
                onClick={() => setShowChangePlan(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                    selectedPlan === plan.id
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border hover:border-muted-foreground/30"
                  } ${plan.popular ? "relative" : ""}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        {selectedPlan === plan.id && (
                          <Check className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${plan.price}</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="sticky bottom-0 bg-background border-t p-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Changes take effect on your next billing cycle
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowChangePlan(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                  onClick={handleChangePlan}
                  disabled={planChanged}
                >
                  {planChanged ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Plan Updated
                    </span>
                  ) : (
                    "Confirm Change"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Card Modal */}
      {showUpdateCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpdateCard(false)} />
          <div className="relative bg-background rounded-2xl shadow-2xl border w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Update Payment Method</h2>
                <p className="text-sm text-muted-foreground">Enter your new card details</p>
              </div>
              <button
                onClick={() => setShowUpdateCard(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Current card on file</p>
                  <p className="text-muted-foreground">Visa ending in 4242</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Name on Card</label>
                  <Input placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Card Number</label>
                  <Input placeholder="4242 4242 4242 4242" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Expiration</label>
                    <Input placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">CVC</label>
                    <Input placeholder="123" maxLength={4} type="password" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Billing ZIP Code</label>
                  <Input placeholder="12345" maxLength={10} />
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Your payment information is encrypted and stored securely. We never store your full card number.</span>
              </div>
            </div>

            <div className="border-t p-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpdateCard(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleUpdateCard}
                disabled={cardSaved}
              >
                {cardSaved ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Card Saved
                  </span>
                ) : (
                  "Save Card"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
