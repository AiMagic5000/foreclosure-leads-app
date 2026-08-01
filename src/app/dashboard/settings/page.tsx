"use client"

import { useAgentManager } from "@/components/agent-manager-modal"
import { PaymentMethodsNote } from '@/components/payment-methods-note'
import { useState, useRef, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { IntegrationsSettings } from "@/components/integrations-settings"
import { usePin } from "@/lib/pin-context"
import { PhoneUnlock } from "@/components/phone-unlock"
import { DocumentUploader } from "@/components/document-uploader"
import { CheckProofConsent } from "@/components/check-proof-consent"
import { EsignNotarySection } from "@/components/esign-notary-section"
import { PaymentSetupSection } from "@/components/payment-setup-section"
import { ComplianceDocs } from "@/components/compliance-docs"
import { ReferralSection } from "@/components/dashboard/referral-section"
import { MyLandersSection } from "@/components/dashboard/my-landers-section"
import { MyActivityPills, ContingencyPills, useEngagement } from "@/components/dashboard/my-engagement"
import {
  User,
  CreditCard,
  Bell,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Briefcase,
  ClipboardList,
  GraduationCap,
  Building2,
  ArrowRight,
  TrendingUp,
  Camera,
  Mail,
} from "lucide-react"

// Default avatar = the FRI eagle (same bird as the chat bubble) when there is no Google/uploaded photo.
const DEFAULT_AVATAR = "/images/fri-bird.png"

export default function SettingsPage() {
  const { openAgentManager } = useAgentManager()
  const { user } = useUser()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailDigest, setEmailDigest] = useState("daily")
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_AVATAR)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [accountType, setAccountType] = useState<string>("")
  const { accountType: ctxAccountType, impersonating } = usePin()
  const engagement = useEngagement()
  useEffect(() => {
    setAccountType(ctxAccountType || "")
  }, [ctxAccountType])
  const isOwnerOperator = ["owner_operator", "admin"].includes(accountType)
  const isAgent = ["partnership", "junior_owner_operator"].includes(accountType)
  const isFreeTier = !isOwnerOperator && !isAgent
  // When admin is viewing-as another account, show that account's identity here.
  const displayName = impersonating?.name || user?.fullName || "User"
  const displayEmail = impersonating?.email || user?.primaryEmailAddress?.emailAddress || ""
  // Prefer a freshly uploaded image, otherwise the REAL Google photo (only when
  // user.hasImage — user.imageUrl is otherwise Clerk's generated gradient), then
  // fall back to the FRI eagle. (hasImage distinguishes a real photo from Clerk's default.)
  const avatarSrc = impersonating
    ? DEFAULT_AVATAR
    : (profileImage !== DEFAULT_AVATAR ? profileImage : (user?.hasImage ? user.imageUrl : DEFAULT_AVATAR))

  // Load the saved custom avatar (persisted server-side; survives refresh/devices).
  useEffect(() => {
    fetch("/api/user/avatar")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.url) setProfileImage(d.url) })
      .catch(() => {})
  }, [])

  const [avatarBusy, setAvatarBusy] = useState(false)
  // Upload the new photo and persist it — the old FileReader preview was
  // client-only and vanished on refresh.
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarBusy(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/user/avatar", { method: "POST", body: fd })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d?.url) setProfileImage(d.url)
    } catch { /* keep current avatar on failure */ }
    setAvatarBusy(false)
  }
  // The default FRI eagle is always available — one click restores it.
  const resetAvatar = async () => {
    setAvatarBusy(true)
    try {
      await fetch("/api/user/avatar", { method: "DELETE" })
      setProfileImage(DEFAULT_AVATAR)
    } catch { /* ignore */ }
    setAvatarBusy(false)
  }

  // Mock add-on data
  const subscription = {
    automationAddon: true,
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-x-hidden">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/fri-bird.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground">Manage your account and subscription</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 min-w-0 [&>*]:min-w-0">
        {/* Access Status Section — #your-tier anchor target (closing-training resource upgrade popup links here) */}
        <Card id="your-tier" className="scroll-mt-24 bg-[#0f172a] text-white border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-white/80" />
              <CardTitle className="text-white">Access Status</CardTitle>
            </div>
            <CardDescription className="text-white/70">Your lead access and PIN information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tier — reflects the account's real package: Free, Asset Recovery Agent, or Owner Operator */}
            <div className="p-4 rounded-lg border border-white/20 bg-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">Your Tier</p>
                  <h4 className="font-semibold text-lg text-white">
                    {isOwnerOperator ? "Owner Operator — Full Access" : isAgent ? "Asset Recovery Agent" : "Free Tier"}
                  </h4>
                  <p className="text-2xl font-bold text-white">
                    {isOwnerOperator ? "$7,495" : isAgent ? "$995" : "Free"}
                    {(isOwnerOperator || isAgent) && (
                      <span className="text-sm font-normal text-white/70 ml-1">{isOwnerOperator ? "platform access" : "agent program"}</span>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className={isFreeTier ? "bg-white/10 border-white/30 text-white/80" : "bg-emerald-500/20 border-emerald-400 text-emerald-200"}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {isFreeTier ? "Free" : "Active"}
                </Badge>
              </div>
              <p className="text-sm text-white/70">
                {isOwnerOperator
                  ? "All 50 states, skip-traced leads, automation, and the full business build-out are included — the complete platform."
                  : isAgent
                  ? "up to 125 exclusive DNC-scrubbed leads every week, certified letters mailed for you, RVM / SMS / email automation under your name, and your dedicated landing page."
                  : "You have free access to browse the platform and preview our resource documents under each free tier video. Upgrade to a paid program to unlock weekly exclusive leads and outreach under your name."}
              </p>
              {/* Free tier — partial closing-training access, folded into the tier card */}
              {isFreeTier && (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
                  <p className="text-sm text-white/70">
                    <span className="font-medium text-white">Free access: Closing Training.</span> Partial access to the closer training videos and resource docs — start learning now.
                  </p>
                  <Link
                    href="/dashboard/closing-training"
                    className="inline-flex flex-none items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-white/90"
                  >
                    Start training
                  </Link>
                </div>
              )}
            </div>

            {/* Free tier — upgrade to the $995 Asset Recovery Agent program */}
            {isFreeTier && (
              <div className="p-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10">
                <p className="font-medium text-white">Upgrade: Asset Recovery Agent</p>
                <p className="text-sm text-white/70 mb-3">$995 — weekly exclusive leads, certified mail, and outreach automation. Choose how to pay:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pay in full */}
                  <div className="flex flex-col justify-between rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Pay in full</p>
                      <p className="text-2xl font-bold text-white">$995</p>
                      <p className="text-xs text-white/60 mb-3">One-time, full access today.</p>
                    </div>
                    <button type="button" onClick={openAgentManager} className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
                      Pay $995
                    </button>
                  </div>
                  {/* 33% down */}
                  <div className="flex flex-col justify-between rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Get started — 33% down</p>
                      <p className="text-2xl font-bold text-white">$331</p>
                      <p className="text-xs text-white/60 mb-3">Start now, pay the balance over time (partnership plan).</p>
                    </div>
                    <button type="button" onClick={openAgentManager} className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
                      Start for $331
                    </button>
                  </div>
                </div>
                <PaymentMethodsNote compact />
              </div>
            )}

            {/* Business Build Out — included for Owner Operators, the upgrade routes for everyone else */}
            {isOwnerOperator ? (
              <div className="p-3 rounded-lg border border-white/20 bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">Full Business Build Out</p>
                    <p className="text-sm text-white/70">
                      Complete asset-recovery business with 45 points of compliance — included with your Owner Operator tier.
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/20 border-emerald-400 text-emerald-200">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Included
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">Upgrade: Complete Business Build Out</p>
                    <p className="text-sm text-white/70">
                      Your own brand, LLC, and white-label site — the Owner Operator tier. You keep 100% of the recovery fee. Pick your route:
                    </p>
                  </div>
                  <a
                    href="/dashboard/owner-operator"
                    className="inline-flex flex-none items-center justify-center rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/20"
                  >
                    See Features
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Complete build-out */}
                  <div className="flex flex-col justify-between rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Complete Build-Out</p>
                      <p className="text-2xl font-bold text-white">$7,495</p>
                      <p className="text-xs text-white/60 mb-3">or 4 payments of $1,874</p>
                    </div>
                    <button type="button" onClick={openAgentManager} className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
                      Enroll
                    </button>
                  </div>
                  {/* Already a Partner ($995 paid) */}
                  <div className="flex flex-col justify-between rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Already a Partner</p>
                      <p className="text-2xl font-bold text-white">$6,500</p>
                      <p className="text-xs text-white/60 mb-3">$7,495 &minus; $995 paid &middot; or 4 &times; $1,625</p>
                    </div>
                    <button type="button" onClick={openAgentManager} className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
                      Upgrade
                    </button>
                  </div>
                  {/* Partner + LLC */}
                  <div className="flex flex-col justify-between rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Partner + LLC</p>
                      <p className="text-2xl font-bold text-white">$6,000</p>
                      <p className="text-xs text-white/60 mb-3">$7,495 &minus; $995 &minus; $500 LLC &middot; or 4 &times; $926</p>
                    </div>
                    <button type="button" onClick={openAgentManager} className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
                      Upgrade
                    </button>
                  </div>
                </div>
                <PaymentMethodsNote compact />
                <p className="mt-2 text-xs text-white/50">Payment plans must be completed before website / build-out delivery.</p>
              </div>
            )}

            {/* Team brand image — under the upgrade tiers */}
            <div className="overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/foreclosure-recovery-team-v2.webp"
                alt="Foreclosure Recovery Inc team — the work you do matters"
                width={1320}
                height={566}
                loading="lazy"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile + Notifications stacked together in the right column */}
        <div className="space-y-6 min-w-0">
        {/* Profile Section */}
        <Card className="border-2 border-blue-900 shadow-xl ring-1 ring-blue-900/10" style={{ borderStyle: "dashed", backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(30,58,95,0.07) 4px, rgba(30,58,95,0.07) 5px)" }}>
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
                  src={avatarSrc}
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
                  {displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {displayEmail || "email@example.com"}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarBusy}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {avatarBusy ? "Saving..." : "Change profile photo"}
                  </button>
                  {profileImage !== DEFAULT_AVATAR && (
                    <button
                      type="button"
                      onClick={resetAvatar}
                      disabled={avatarBusy}
                      className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                    >
                      Use default logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input key={displayName} defaultValue={displayName === "User" ? "" : displayName} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  key={displayEmail}
                  defaultValue={displayEmail}
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
              <PhoneUnlock />
            </div>

            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* My Landing Pages -- agent page + claim lander with copy buttons */}
        <MyLandersSection />

        </div>

        {/* Outreach integrations — full width, under the account containers */}
        <div className="lg:col-span-2 space-y-3">
          {!isFreeTier && (
            <div className="flex items-start gap-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4">
              <Mail className="mt-0.5 h-5 w-5 flex-none text-amber-600" />
              <p className="text-sm text-amber-900">
                <strong>Action needed:</strong> Complete your Outreach Integrations below so we can issue your business
                email &mdash; <strong>firstname@usforeclosurerecovery.com</strong>. Your ringless voicemail and SMS must be
                connected before your mailbox is provisioned.
              </p>
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold tracking-tight">Outreach Integrations</h2>
            <p className="text-sm text-muted-foreground">Connect your ringless voicemail and SMS accounts so your drips and texts send under your own name.</p>
          </div>
          <IntegrationsSettings />
        </div>

        {/* Your activity — same four metrics the admin User Activity page tracks */}
        <MyActivityPills data={engagement} />

        {/* Contingency Agreements — signed agreements uploaded here unlock SIN incentives */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Contingency Agreements</CardTitle>
                </div>
                <CardDescription className="mt-1.5">
                  Upload a clear photo of each <strong>signed contingency agreement</strong> from a homeowner on your leads list.
                  These unlock your complimentary Sales Incentive Network incentives &mdash; only signed, uploaded agreements qualify.
                </CardDescription>
              </div>
              <ContingencyPills data={engagement} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentUploader folder="contingency-agreements" accept="image/*,video/*,application/pdf" />
          </CardContent>
        </Card>

        {/* Get Paid — 1099 / LLC payment setup, directly above Request a Notary */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardContent className="pt-6">
            <PaymentSetupSection />
          </CardContent>
        </Card>

        {/* Request a Notary / E-sign — its own section, directly below Contingency Agreements */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardContent className="pt-6">
            <EsignNotarySection />
          </CardContent>
        </Card>

        {/* Payout Proof Checks — uploaded check images for social proof (consent-gated) */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Payout Proof Checks</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-muted-foreground">
                Got paid on a claimant case? Upload a clear photo of your <strong>disbursement check</strong>.
                With your consent below, our team adds privacy markers (redacting names &amp; account
                numbers) and may feature it on social media and marketing as proof of payout.
              </p>
              <div className="aspect-video w-full shrink-0 overflow-hidden rounded-md border bg-white shadow-sm sm:w-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero-images/proof-2.png"
                  alt="Example payout disbursement check with privacy markers"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <DocumentUploader folder="check-proof" accept="image/*" />
            <CheckProofConsent />
          </CardContent>
        </Card>

        {/* Upgrades & Add-ons */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Upgrades & Add-ons</CardTitle>
            </div>
            <CardDescription>Expand your asset recovery business with premium features</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Communications Automation — feature row (image left, text right) */}
            <div className="rounded-xl border-0 overflow-hidden relative bg-gradient-to-br from-emerald-600 to-green-600 text-white mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="sm:w-1/3 shrink-0 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://foreclosure-db.alwaysencrypted.com/storage/v1/object/public/voicedrops/marketing/comms-automation-16x9.png" alt="Communications Automation" className="w-full h-auto object-contain rounded-lg" />
                </div>
                <div className="p-5 space-y-3 sm:w-2/3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/15">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">Communications Automation</h4>
                      {subscription.automationAddon ? (
                        <Badge className="text-[10px] bg-white/20 text-white border-white/30">Active</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-white/20 text-white border-white/30">+$299/mo</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-white/85">Don&apos;t want to do manual outreach? For <strong>$299/mo</strong> we run your voicemail drops, follow-up sequences, and scheduling on autopilot &mdash; in <strong>your own cloned voice</strong> &mdash; so you can focus on answering the calls and texts that come back.</p>
                  <p className="text-[11px] text-white/90 bg-white/10 border border-white/20 rounded-md px-2 py-1.5 inline-block">
                    Requires a voice sample: record about a minute in the <Link href="/dashboard/ringless-drips" className="font-semibold underline">Ringless Drips</Link> section so we can clone your voice.
                  </p>
                  <div>
                    <button type="button" onClick={openAgentManager} className="inline-block">
                      <Button size="sm" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold px-6">
                        Start Automating
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Hire a Closer */}
              <div className="rounded-xl border p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Briefcase className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Hire a Closer</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">10% of Service Fee</Badge>
                      <Badge variant="outline" className="text-[10px] bg-red-50 border-red-300 text-red-700">Owner Operator</Badge>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Vetted recovery agents who close leads on recorded lines with full transcripts and training tools. Available to Owner Operators.</p>
                <Link href={isOwnerOperator ? "/dashboard/hire-closer" : "/dashboard/owner-operator"}>
                  <Button variant="outline" size="sm" className="w-full">
                    {isOwnerOperator ? "Browse 12 Agents" : "Owner Operator feature"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Contract Admin — premium (Owner Operator) */}
              <div className="rounded-xl border-0 p-5 space-y-3 relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/15">
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Contract Admin</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="text-[10px] bg-white/20 text-white border-white/30">5% of Service Fee</Badge>
                      <Badge className="text-[10px] bg-white/20 text-white border-white/30">Owner Operator</Badge>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/80">Administrators handle attorneys, notaries, client follow-up, and document filing. Attorney fees separate. Available to Owner Operators.</p>
                <Link href="/dashboard/owner-operator">
                  <Button size="sm" className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold">
                    Learn More
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

              {/* Fully Built Business — premium (Owner Operator) */}
              <div className="rounded-xl border-0 p-5 space-y-3 relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/15">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Fully Built Business</h4>
                    <Badge className="text-[10px] bg-white/20 text-white border-white/30">Premium</Badge>
                  </div>
                </div>
                <p className="text-xs text-white/80">Complete asset recovery business with 45 points of compliance, LLC formation, contracts, and everything you need.</p>
                <Link href="/dashboard/owner-operator">
                  <Button size="sm" className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold">
                    Learn More
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
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
                  <span className="text-muted-foreground">Example: $100K recovery (30% fee)</span>
                  <span className="font-medium text-emerald-600">You keep $25,500</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refer & Earn — $100 on signup, $500 on payout */}
        <ReferralSection />

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

            <ComplianceDocs />

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

        {/* Notifications -- pinned bottom-right of the page */}
        <Card className="lg:col-start-2">
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
      </div>

    </div>
  )
}
