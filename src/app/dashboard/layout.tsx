"use client"

import { useAgentManager } from "@/components/agent-manager-modal"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { HeaderUserMenu } from "@/components/header-user-menu"
import {
  Inbox,
  LayoutDashboard,
  Users,
  Map,
  Settings,
  Download,
  Zap,
  Briefcase,
  Gift,
  ClipboardList,
  GraduationCap,
  Radio,
  UserCheck,
  Shield,
  Menu,
  X,
  Bell,
  ChevronRight,
  Sun,
  Moon,
  Building2,
  TrendingUp,
  Scale,
  UserCircle,
  FolderKanban,
  FileStack,
  Phone,
  Voicemail,
  Mail,
  Lock,
  Gavel,
  Landmark,
  Upload,
  MessageSquare,
  Activity,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardSectionVideo } from "@/components/dashboard-section-video"
import { ImpersonationBanner } from "@/components/impersonation-banner"
import { TimeTracker } from "@/components/time-tracker"
import { FreeUpgradeBanner } from "@/components/free-upgrade-banner"
import { UPGRADE_URL } from "@/lib/upgrade"
import { ChatWidget } from "@/components/chat-widget"
import { ActivityTracker } from "@/components/activity-tracker"
import { cn } from "@/lib/utils"
import { PRODUCT_UPDATES, LATEST_UPDATE_ID } from "@/lib/product-updates"
import { PinProvider, usePin } from "@/lib/pin-context"
import { AgentManagerProvider } from "@/components/agent-manager-modal"

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  badge?: { text: string; color: string }
  allTiers?: boolean // unlock this item for every tier even when its section is gated
}

interface NavSection {
  label: string
  tier: "basic" | "partnership" | "owner_operator" | "admin"
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: "Getting Started",
    tier: "basic",
    items: [
      { name: "My Account", href: "/dashboard/settings", icon: Settings },
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "FREE Training", href: "/dashboard/closing-training", icon: GraduationCap, badge: { text: "New", color: "indigo" } },
      { name: "Live Webcast", href: "/dashboard/live-webcast", icon: Radio, badge: { text: "Live", color: "red" } },
      { name: "State Laws", href: "/dashboard/states", icon: Map },
      { name: "State Rules", href: "/dashboard/admin/state-rules", icon: Scale, badge: { text: "Paid", color: "violet" } },
      { name: "My Leads", href: "/dashboard/my-leads", icon: FileStack, badge: { text: "New", color: "emerald" } },
      { name: "Import Leads", href: "/dashboard/import", icon: Upload, badge: { text: "Paid", color: "violet" } },
    ],
  },
  {
    label: "Communications",
    tier: "partnership",
    items: [
      { name: "My AI Avatar", href: "/dashboard/admin/ai-agent", icon: Bot, badge: { text: "Beta", color: "purple" }, allTiers: true },
      { name: "Ringless Drips", href: "/dashboard/ringless-drips", icon: Voicemail, badge: { text: "New", color: "red" } },
      { name: "SMS Messages", href: "/dashboard/sms-messages", icon: MessageSquare },
    ],
  },
  {
    label: "Recovery Tools",
    tier: "basic",
    items: [
      { name: "Hire a Closer", href: "/dashboard/hire-closer", icon: Briefcase, badge: { text: "Pro", color: "amber" } },
      { name: "Contract Admin", href: "/dashboard/contract-admin", icon: ClipboardList, badge: { text: "5%", color: "purple" } },
      { name: "Contingent Attorneys Network", href: "/dashboard/contingent-attorneys", icon: Scale, badge: { text: "New", color: "violet" } },
      { name: "Contingency Incentives", href: "/dashboard/contingency-incentives", icon: Gift, badge: { text: "Comp.", color: "emerald" } },
      { name: "Tax Deeds", href: "/dashboard/tax-deeds", icon: Landmark, badge: { text: "New", color: "emerald" } },
      { name: "Automation", href: "/dashboard/automation", icon: Zap, badge: { text: "Add-on", color: "blue" } },
    ],
  },
  {
    label: "Business Suite",
    tier: "basic",
    items: [
      { name: "Asset Recovery Agent", href: "/dashboard/recovery-agent", icon: UserCheck, badge: { text: "Program", color: "blue" } },
      { name: "Owner Operator", href: "/dashboard/owner-operator", icon: Briefcase, badge: { text: "Program", color: "red" } },
      { name: "Agent Onboarding", href: "/dashboard/white-label", icon: FolderKanban, badge: { text: "Biz", color: "sky" } },
    ],
  },
  {
    label: "Owner Operator Admin",
    tier: "admin",
    items: [
      // Admin hub + people
      { name: "Admin", href: "/dashboard/admin", icon: Shield, badge: { text: "Staff", color: "red" } },
      { name: "User Data", href: "/dashboard/user-data", icon: UserCircle, badge: { text: "CRM", color: "teal" } },
      { name: "User Activity", href: "/dashboard/admin/user-activity", icon: Activity, badge: { text: "Live", color: "blue" } },
      { name: "Pipeline Monitor", href: "/dashboard/admin/pipeline", icon: Activity, badge: { text: "Live", color: "emerald" } },
      { name: "Agent Ext's", href: "/dashboard/admin/extensions", icon: Phone, badge: { text: "888", color: "emerald" } },
      // Lead sources
      { name: "Fresh Leads", href: "/dashboard/admin/fresh-leads", icon: Inbox, badge: { text: "Issue", color: "emerald" } },
      { name: "Foreclosure Leads", href: "/dashboard/leads", icon: Users },
      { name: "Pre-Foreclosure", href: "/dashboard/pre-foreclosure", icon: Gavel, badge: { text: "New", color: "orange" } },
      { name: "Title Leads", href: "/dashboard/title-leads", icon: Building2, badge: { text: "5%", color: "cyan" } },
      { name: "Real Estate Leads", href: "/dashboard/real-estate-leads", icon: TrendingUp, badge: { text: "8%", color: "orange" } },
      { name: "Attorney Leads", href: "/dashboard/attorney-leads", icon: Scale, badge: { text: "10%", color: "violet" } },
      { name: "Export", href: "/dashboard/export", icon: Download },
      // Compliance + legal
      { name: "Compliance", href: "/dashboard/admin/compliance", icon: Shield, badge: { text: "Gate", color: "red" } },
    ],
  },
]

const TIER_ORDER: Record<string, number> = {
  basic: 0,
  partnership: 1,
  junior_owner_operator: 2,
  owner_operator: 3,
  admin: 4,
}

// Distinct accent color per nav tab so the sidebar icons read as colorful
// (like a native app), instead of all sharing the text color. Keyed by href;
// anything unlisted falls back to a stable color from PALETTE by hashing href.
const NAV_ICON_COLORS: Record<string, string> = {
  "/dashboard": "#6366f1",
  "/dashboard/closing-training": "#10b981",
  "/dashboard/live-webcast": "#ef4444",
  "/dashboard/settings": "#0ea5e9",
  "/dashboard/states": "#f59e0b",
  "/dashboard/admin/state-rules": "#8b5cf6",
  "/dashboard/my-leads": "#14b8a6",
  "/dashboard/import": "#f97316",
  "/dashboard/admin/ai-agent": "#a855f7",
  "/dashboard/ringless-drips": "#e11d48",
  "/dashboard/sms-messages": "#3b82f6",
  "/dashboard/hire-closer": "#d97706",
  "/dashboard/contract-admin": "#7c3aed",
  "/dashboard/automation": "#2563eb",
  "/dashboard/tax-deeds": "#059669",
  "/dashboard/recovery-agent": "#2563eb",
  "/dashboard/owner-operator": "#dc2626",
  "/dashboard/white-label": "#0284c7",
  "/dashboard/contingency-incentives": "#16a34a",
}
const NAV_ICON_PALETTE = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#14b8a6", "#f97316", "#0ea5e9", "#a855f7", "#22c55e"]
function navIconColor(href: string): string {
  if (NAV_ICON_COLORS[href]) return NAV_ICON_COLORS[href]
  let h = 0
  for (let i = 0; i < href.length; i++) h = (h * 31 + href.charCodeAt(i)) >>> 0
  return NAV_ICON_PALETTE[h % NAV_ICON_PALETTE.length]
}

// Glossy multicolor Microsoft Fluent Emoji (3D) icons per tab — matches the
// reference dashboard. Hotlinked from jsDelivr (all URLs verified 200); on any
// load error we fall back to the Unicode emoji, then to the colored Lucide icon.
const FLUENT_BASE = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets"
const NAV_FLUENT: Record<string, { folder: string; file: string; emoji: string }> = {
  "/dashboard": { folder: "House", file: "house", emoji: "🏠" },
  "/dashboard/closing-training": { folder: "Graduation cap", file: "graduation_cap", emoji: "🎓" },
  "/dashboard/live-webcast": { folder: "Television", file: "television", emoji: "📺" },
  "/dashboard/settings": { folder: "Bust in silhouette", file: "bust_in_silhouette", emoji: "👤" },
  "/dashboard/states": { folder: "Balance scale", file: "balance_scale", emoji: "⚖️" },
  "/dashboard/admin/state-rules": { folder: "Scroll", file: "scroll", emoji: "📜" },
  "/dashboard/my-leads": { folder: "Fire", file: "fire", emoji: "🔥" },
  "/dashboard/import": { folder: "Inbox tray", file: "inbox_tray", emoji: "📥" },
  "/dashboard/admin/ai-agent": { folder: "Robot", file: "robot", emoji: "🤖" },
  "/dashboard/ringless-drips": { folder: "Loudspeaker", file: "loudspeaker", emoji: "📢" },
  "/dashboard/sms-messages": { folder: "Speech balloon", file: "speech_balloon", emoji: "💬" },
  "/dashboard/hire-closer": { folder: "Briefcase", file: "briefcase", emoji: "💼" },
  "/dashboard/contract-admin": { folder: "Memo", file: "memo", emoji: "📝" },
  "/dashboard/automation": { folder: "Gear", file: "gear", emoji: "⚙️" },
  "/dashboard/tax-deeds": { folder: "Bank", file: "bank", emoji: "🏦" },
  "/dashboard/recovery-agent": { folder: "Handshake", file: "handshake", emoji: "🤝" },
  "/dashboard/owner-operator": { folder: "Crown", file: "crown", emoji: "👑" },
  "/dashboard/white-label": { folder: "Rocket", file: "rocket", emoji: "🚀" },
  "/dashboard/contingency-incentives": { folder: "Wrapped gift", file: "wrapped_gift", emoji: "🎁" },
  "/dashboard/admin": { folder: "Shield", file: "shield", emoji: "🛡️" },
  "/dashboard/admin/compliance": { folder: "Check mark button", file: "check_mark_button", emoji: "✅" },
  "/dashboard/user-data": { folder: "Busts in silhouette", file: "busts_in_silhouette", emoji: "👥" },
  "/dashboard/admin/user-activity": { folder: "Chart increasing", file: "chart_increasing", emoji: "📈" },
  "/dashboard/admin/pipeline": { folder: "Bar chart", file: "bar_chart", emoji: "📊" },
  "/dashboard/admin/fresh-leads": { folder: "Sparkles", file: "sparkles", emoji: "✨" },
  "/dashboard/leads": { folder: "House with garden", file: "house_with_garden", emoji: "🏡" },
  "/dashboard/pre-foreclosure": { folder: "Hammer", file: "hammer", emoji: "🔨" },
  "/dashboard/title-leads": { folder: "Office building", file: "office_building", emoji: "🏢" },
  "/dashboard/real-estate-leads": { folder: "Houses", file: "houses", emoji: "🏘️" },
  "/dashboard/attorney-leads": { folder: "Classical building", file: "classical_building", emoji: "🏛️" },
  "/dashboard/export": { folder: "Outbox tray", file: "outbox_tray", emoji: "📤" },
}
function fluentUrl(d: { folder: string; file: string }): string {
  return `${FLUENT_BASE}/${d.folder.replace(/ /g, "%20")}/3D/${d.file}_3d.png`
}

// One nav icon: glossy 3D Fluent PNG → Unicode emoji on image error → colored
// Lucide icon if the tab has no Fluent mapping.
function FluentNavIcon({ href, fallback: Fallback }: {
  href: string
  fallback: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}) {
  const def = NAV_FLUENT[href]
  const [broken, setBroken] = useState(false)
  // My Account uses the FRI eagle logo instead of a generic icon.
  if (href === "/dashboard/settings") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/images/fri-bird.png"
        alt=""
        width={22}
        height={22}
        loading="lazy"
        draggable={false}
        className="h-[22px] w-[22px] flex-shrink-0 object-contain"
      />
    )
  }
  if (!def) return <Fallback className="h-5 w-5 flex-shrink-0" style={{ color: navIconColor(href) }} />
  if (broken) {
    return <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center text-[18px] leading-none" role="img" aria-label={href}>{def.emoji}</span>
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fluentUrl(def)}
      alt=""
      width={22}
      height={22}
      loading="lazy"
      draggable={false}
      onError={() => setBroken(true)}
      className="h-[22px] w-[22px] flex-shrink-0 object-contain"
    />
  )
}

function tierAccess(userTier: string, sectionTier: string): boolean {
  return (TIER_ORDER[userTier] ?? 0) >= (TIER_ORDER[sectionTier] ?? 0)
}

function sectionGradient(tier: string, dark: boolean): string {
  const gradients: Record<string, { light: string; dark: string }> = {
    basic: {
      light: "bg-gradient-to-b from-emerald-50/70 to-emerald-50/20",
      dark: "bg-gradient-to-b from-emerald-900/20 to-emerald-900/5",
    },
    partnership: {
      light: "bg-gradient-to-b from-blue-50/70 to-blue-50/20",
      dark: "bg-gradient-to-b from-blue-900/20 to-blue-900/5",
    },
    owner_operator: {
      light: "bg-gradient-to-b from-amber-50/70 to-amber-50/20",
      dark: "bg-gradient-to-b from-amber-900/20 to-amber-900/5",
    },
    admin: {
      light: "bg-gradient-to-b from-rose-50/70 to-rose-50/20",
      dark: "bg-gradient-to-b from-rose-900/20 to-rose-900/5",
    },
  }
  return gradients[tier]?.[dark ? "dark" : "light"] || ""
}

function sectionLabelColor(_tier: string, dark: boolean): string {
  return dark ? "text-slate-300" : "text-gray-700"
}

const badgeColorMap: Record<string, string> = {
  cyan: "bg-cyan-500/20 text-cyan-500",
  orange: "bg-orange-500/20 text-orange-500",
  violet: "bg-violet-500/20 text-violet-500",
  emerald: "bg-emerald-500/20 text-emerald-500",
  amber: "bg-amber-500/20 text-amber-500",
  purple: "bg-purple-500/20 text-purple-500",
  indigo: "bg-indigo-500/20 text-indigo-500",
  sky: "bg-sky-500/20 text-sky-500",
  blue: "bg-blue-500/20 text-blue-500",
  red: "bg-red-500/20 text-red-500",
  teal: "bg-teal-500/20 text-teal-500",
}

function BadgeLabel({ color, text }: { color: string; text: string }) {
  const classes = badgeColorMap[color] || "bg-gray-500/20 text-gray-500"
  return (
    <span className={`ml-auto text-xs ${classes} px-2 py-0.5 rounded-full`}>
      {text}
    </span>
  )
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { openAgentManager } = useAgentManager()
  const pathname = usePathname()
  const { accountType, banned, banReason, impersonating, clearImpersonation } = usePin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  // Product updates: dot blinks until the user opens the bell, then read state
  // persists in localStorage (re-blinks when a newer update ships).
  const [updatesUnread, setUpdatesUnread] = useState(false)
  useEffect(() => {
    // Deferred (microtask) so the effect body has no synchronous setState —
    // localStorage is only readable client-side, hence the effect.
    queueMicrotask(() => {
      try {
        const readId = Number(localStorage.getItem("product-updates-read-id") || 0)
        setUpdatesUnread(readId < LATEST_UPDATE_ID)
      } catch { setUpdatesUnread(true) }
    })
  }, [])
  const openNotifications = () => {
    setNotifOpen(!notifOpen)
    if (!notifOpen && updatesUnread) {
      try { localStorage.setItem("product-updates-read-id", String(LATEST_UPDATE_ID)) } catch {}
      setUpdatesUnread(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
      const stored = localStorage.getItem("dashboard-theme")
      if (stored === "dark") {
        setIsDark(true)
      }
    })
    // Notify admin of dashboard login (debounced server-side)
    const lastPing = sessionStorage.getItem("login-notified")
    if (!lastPing) {
      sessionStorage.setItem("login-notified", "1")
      fetch("/api/login-notify", { method: "POST" }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const timeoutId = setTimeout(() => {
      localStorage.setItem("dashboard-theme", isDark ? "dark" : "light")
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [isDark, mounted])

  const toggleTheme = () => setIsDark(!isDark)

  const bg = isDark ? "bg-slate-950" : "bg-gray-50"
  const cardBg = isDark ? "bg-slate-900" : "bg-white"
  const borderColor = isDark ? "border-slate-800" : "border-gray-200"
  const textColor = isDark ? "text-white" : "text-gray-900"
  const mutedText = isDark ? "text-slate-400" : "text-gray-500"

  // Banned accounts get a full-screen block — no dashboard, no content.
  if (banned) {
    // Non-payment bans get a "pay to reactivate" screen instead of a plain suspension notice.
    const paymentDue = !!banReason && /payment due|non-?payment|past.?due/i.test(banReason)
    return (
      <div className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: "#241c12" }}>
        <div className="w-full max-w-md sm:max-w-lg overflow-hidden rounded-2xl border-2 text-center shadow-2xl" style={{ backgroundColor: "#f4ecd8", borderColor: "#8a6a43" }}>
          {/* Suspension artwork — landscape on desktop, portrait on mobile */}
          <img
            src="/account-suspended-desktop.jpg"
            alt="Account suspended - Foreclosure Recovery Inc."
            className="hidden sm:block w-full"
          />
          <img
            src="/account-suspended-mobile.jpg"
            alt="Account suspended - Foreclosure Recovery Inc."
            className="block sm:hidden w-full"
          />
          <div className="p-7">
            <img
              src="https://cdn.prod.website-files.com/67ec4cfbdf0509c176a8cdfe/69897785586ae271c69d085e_image%20(1).png"
              alt="Foreclosure Recovery Inc."
              className="mx-auto mb-4 h-9 w-auto"
            />
            <h1 className="text-xl font-bold" style={{ color: "#5b4327" }}>{paymentDue ? "Payment due" : "Account suspended"}</h1>
            {paymentDue ? (
              <>
                <p className="mt-2 text-sm" style={{ color: "#6b5640" }}>
                  Your account is on hold for a past-due payment. Complete your payment below to reactivate your account and restore full access right away.
                </p>
                <button type="button" onClick={openAgentManager} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white shadow-md" style={{ backgroundColor: "#b8860b" }}>
                  Complete payment &amp; reactivate
                </button>
                <p className="mt-4 text-sm" style={{ color: "#6b5640" }}>
                  Questions? Reach us at <a href="tel:+18885458007" className="font-semibold underline" style={{ color: "#8a5a1f" }}>(888) 545-8007</a> or <a href="mailto:support@usforeclosureleads.com" className="font-semibold underline" style={{ color: "#8a5a1f" }}>support@usforeclosureleads.com</a>.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm" style={{ color: "#6b5640" }}>
                  Your account has been suspended and dashboard access is disabled.
                  {banReason ? <> Reason: <span className="font-semibold" style={{ color: "#5b4327" }}>{banReason}</span>.</> : null}
                </p>
                <p className="mt-3 text-sm" style={{ color: "#6b5640" }}>
                  If you believe this is a mistake, contact us at <a href="tel:+18885458007" className="font-semibold underline" style={{ color: "#8a5a1f" }}>(888) 545-8007</a> or <a href="mailto:support@usforeclosureleads.com" className="font-semibold underline" style={{ color: "#8a5a1f" }}>support@usforeclosureleads.com</a>.
                </p>
              </>
            )}
            {impersonating ? (
              <button
                onClick={() => clearImpersonation()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#8a6a43" }}
              >
                Exit impersonation &mdash; back to admin
              </button>
            ) : (
              <div className="mt-5"><HeaderUserMenu /></div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen", bg)}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          cardBg,
          borderColor,
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className={cn("flex h-16 items-center justify-between px-4 border-b bg-white", borderColor)}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/us-foreclosure-leads-logo.png"
                alt="US Foreclosure Leads"
                width={200}
                height={85}
                className="w-[200px] h-auto"
              />
            </Link>
            <button
              className="lg:hidden p-2 -mr-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-900" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
            {navSections.map((section) => {
              const accessible = tierAccess(accountType, section.tier)
              return (
                <div
                  key={section.label}
                  className={cn("rounded-xl p-2", sectionGradient(section.tier, isDark))}
                >
                  <p
                    className={cn(
                      "text-[11px] font-extrabold uppercase tracking-widest px-3 mb-1.5",
                      sectionLabelColor(section.tier, isDark)
                    )}
                  >
                    {section.label}
                    {!accessible && (
                      <Lock className="inline h-3 w-3 ml-1.5 -mt-0.5 opacity-60" />
                    )}
                  </p>
                  {section.items.map((item) => {
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === item.href || pathname.startsWith(item.href + "/")
                    const isLocked = !accessible && !item.allTiers
                    const isAccount = item.href === "/dashboard/settings"

                    return (
                      <Link
                        key={item.name}
                        href={isLocked ? "#" : item.href}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault()
                          } else {
                            setSidebarOpen(false)
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isLocked && "opacity-40 cursor-not-allowed",
                          isActive && !isLocked
                            ? (isAccount ? "bg-blue-600 text-white" : "bg-emerald-500 text-white")
                            : isAccount && !isLocked
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200"
                              : cn(
                                  isDark ? "text-slate-300" : "text-gray-700",
                                  !isLocked && (isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"),
                                  !isLocked && "hover:text-emerald-500"
                                )
                        )}
                      >
                        <FluentNavIcon href={item.href} fallback={item.icon} />
                        {isAccount ? <span className="font-semibold text-red-600">{item.name}</span> : item.name}
                        {isLocked ? (
                          <Lock className="ml-auto h-3.5 w-3.5 opacity-60" />
                        ) : item.badge ? (
                          <BadgeLabel
                            color={item.badge.color}
                            text={item.badge.text}
                          />
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          <div className={cn("p-4 border-t space-y-4", borderColor)}>
            {accountType === "partnership" ? (
              /* Paid agents already own ARA — pitch the next tier instead. */
              <div className="rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 p-3 text-white">
                <p className="font-semibold text-sm text-center">Upgrade to become an</p>
                <Link href="/dashboard/owner-operator" className="block">
                  <Button
                    size="sm"
                    className="w-full mt-2 h-auto whitespace-normal py-2 text-xs leading-tight bg-[#09274c] text-white hover:bg-[#0e3a70] border border-amber-300/40"
                  >
                    OWNER OPERATOR
                  </Button>
                </Link>
                <p className="mt-2 text-center text-[11px] font-semibold text-white/95">
                  Own the whole operation &mdash; your brand, your business
                </p>
              </div>
            ) : accountType === "owner_operator" || accountType === "junior_owner_operator" ? null : (
              <div className="rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 p-3 text-white">
                <p className="font-semibold text-sm text-center">Upgrade to become an</p>
                <button type="button" onClick={openAgentManager} className="block">
                  <Button
                    size="sm"
                    className="w-full mt-2 h-auto whitespace-normal py-2 text-xs leading-tight bg-red-600 text-white hover:bg-red-700 border border-red-400/30"
                  >
                    ASSET RECOVERY AGENT
                  </Button>
                </button>
                <a
                  href="https://usforeclosureleads.com/arb-sections.html#guarantee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-center text-[11px] font-semibold text-white"
                >
                  Money Back Guarantee <span className="underline opacity-90">see details</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 lg:px-6", cardBg, borderColor)}>
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className={cn("h-6 w-6", textColor)} />
          </button>

          {/* Mobile: call button against the hamburger */}
          <a
            href="tel:+18885458007"
            className="lg:hidden inline-flex flex-col leading-tight rounded-lg bg-[#dc2626] px-2.5 py-1 text-white shadow-sm"
            title="Call us — (888) 545-8007 · 9 to 5 Pacific, 7 days a week"
          >
            <span className="inline-flex items-center gap-1 text-xs font-bold">
              <Phone className="h-3.5 w-3.5 flex-none" /> (888) 545-8007
            </span>
            <span className="text-[9px] text-white/70">9–5 PT · 7 days/wk</span>
          </a>

          <div className={cn("hidden sm:flex items-center gap-2 text-sm", mutedText)}>
            <Link href="/dashboard" className={cn("hover:text-emerald-500")}>
              Dashboard
            </Link>
            {pathname !== "/dashboard" && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className={cn(textColor, "capitalize")}>
                  {pathname.split("/").pop()}
                </span>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Desktop: call button on the bell line */}
            <a
              href="tel:+18885458007"
              className="hidden lg:inline-flex flex-col leading-tight rounded-lg bg-[#dc2626] px-3 py-1.5 text-white shadow-sm transition hover:bg-[#b91c1c]"
              title="Call us — (888) 545-8007 · 9 to 5 Pacific, 7 days a week"
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                <Phone className="h-4 w-4 flex-none" /> (888) 545-8007
              </span>
              <span className="text-[10px] font-medium text-white/70">9–5 PT · 7 days a week</span>
            </a>
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-yellow-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={openNotifications}>
                <Bell className={cn("h-5 w-5", isDark ? "text-slate-300" : "text-gray-600")} />
                {updatesUnread && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                )}
              </Button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className={cn(
                    "absolute right-0 top-full mt-2 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-xl border shadow-lg p-4 space-y-3",
                    isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"
                  )}>
                    <h4 className={cn("text-sm font-bold", textColor)}>What&apos;s New</h4>
                    <div className="space-y-2">
                      {PRODUCT_UPDATES.map((u) => (
                        <a
                          key={u.id}
                          href={u.href || "#"}
                          className={cn(
                            "block rounded-lg border px-3 py-2.5 transition-colors",
                            isDark ? "border-slate-700 hover:bg-slate-800" : "border-gray-100 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm font-semibold", textColor)}>{u.title}</p>
                            <span className="flex-none text-[10px] text-muted-foreground">{u.date}</span>
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{u.body}</p>
                        </a>
                      ))}
                    </div>
                    <h4 className={cn("text-sm font-bold pt-1", textColor)}>Need Help?</h4>
                    <a
                      href="mailto:support@usforeclosureleads.com"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isDark ? "hover:bg-slate-800" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={cn("font-medium text-sm", textColor)}>Email Support</p>
                        <p className="text-xs text-muted-foreground">support@usforeclosureleads.com</p>
                      </div>
                    </a>
                    <a
                      href="tel:+18885458007"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isDark ? "hover:bg-slate-800" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={cn("font-medium text-sm", textColor)}>Call Support</p>
                        <p className="text-xs text-muted-foreground">(888) 545-8007</p>
                      </div>
                    </a>
                  </div>
                </>
              )}
            </div>

            <HeaderUserMenu />
          </div>
        </header>

        <main className="p-4 lg:p-6 min-w-0 max-w-full overflow-x-hidden">
          <ImpersonationBanner />
          <TimeTracker />
          <FreeUpgradeBanner />
          <DashboardSectionVideo />
          {children}
        </main>
      </div>
      {pathname !== "/dashboard/live-webcast" && <ChatWidget />}
      <ActivityTracker />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  // Soft block: flagged accounts can sign in and browse the public site, but
  // every dashboard route serves the blocked notice instead of content.
  if (isLoaded && user?.publicMetadata?.blocked) {
    if (typeof window !== "undefined") window.location.replace("/blocked")
    return null
  }
  return (
    <PinProvider>
      <AgentManagerProvider>
        <DashboardInner>{children}</DashboardInner>
      </AgentManagerProvider>
    </PinProvider>
  )
}
