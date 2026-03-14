"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Users,
  Map,
  Settings,
  Download,
  Zap,
  Briefcase,
  ClipboardList,
  GraduationCap,
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
  Mail,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PinProvider, usePin } from "@/lib/pin-context"

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  badge?: { text: string; color: string }
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
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "My Leads", href: "/dashboard/my-leads", icon: FileStack, badge: { text: "New", color: "emerald" } },
      { name: "State Laws", href: "/dashboard/states", icon: Map },
      { name: "Closing Training", href: "/dashboard/closing-training", icon: GraduationCap, badge: { text: "New", color: "indigo" } },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
  {
    label: "Recovery Tools",
    tier: "basic",
    items: [
      { name: "Hire a Closer", href: "/dashboard/hire-closer", icon: Briefcase, badge: { text: "Pro", color: "amber" } },
      { name: "Contract Admin", href: "/dashboard/contract-admin", icon: ClipboardList, badge: { text: "5%", color: "purple" } },
      { name: "Automation", href: "/dashboard/automation", icon: Zap, badge: { text: "Add-on", color: "blue" } },
    ],
  },
  {
    label: "Business Suite",
    tier: "owner_operator",
    items: [
      { name: "White Label", href: "/dashboard/white-label", icon: FolderKanban, badge: { text: "Biz", color: "sky" } },
    ],
  },
  {
    label: "Administration",
    tier: "admin",
    items: [
      { name: "Foreclosure Leads", href: "/dashboard/leads", icon: Users },
      { name: "Title Leads", href: "/dashboard/title-leads", icon: Building2, badge: { text: "5%", color: "cyan" } },
      { name: "Real Estate Leads", href: "/dashboard/real-estate-leads", icon: TrendingUp, badge: { text: "8%", color: "orange" } },
      { name: "Attorney Leads", href: "/dashboard/attorney-leads", icon: Scale, badge: { text: "10%", color: "violet" } },
      { name: "Export", href: "/dashboard/export", icon: Download },
      { name: "Admin", href: "/dashboard/admin", icon: Shield, badge: { text: "Staff", color: "red" } },
      { name: "User Data", href: "/dashboard/user-data", icon: UserCircle, badge: { text: "CRM", color: "teal" } },
    ],
  },
]

const TIER_ORDER: Record<string, number> = {
  basic: 0,
  partnership: 1,
  owner_operator: 2,
  admin: 3,
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
  const pathname = usePathname()
  const { accountType } = usePin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("dashboard-theme")
    if (stored === "dark") {
      setIsDark(true)
    }
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
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/")
                    const isLocked = !accessible

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
                            ? "bg-emerald-500 text-white"
                            : cn(
                                isDark ? "text-slate-300" : "text-gray-700",
                                !isLocked && (isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"),
                                !isLocked && "hover:text-emerald-500"
                              )
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {item.name}
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
            <div className="rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 p-4 text-white">
              <p className="font-semibold text-sm">Fully Built Asset Recovery Business</p>
              <p className="text-xs opacity-90 mt-1">45 Points of Compliance</p>
              <a
                href="https://www.usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  size="sm"
                  className="w-full mt-3 bg-blue-800 text-white hover:bg-blue-900 border border-blue-400/30"
                >
                  Become a Senior Agent
                </Button>
              </a>
            </div>
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
              <Button variant="ghost" size="icon" className="relative" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell className={cn("h-5 w-5", isDark ? "text-slate-300" : "text-gray-600")} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className={cn(
                    "absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border shadow-lg p-4 space-y-3",
                    isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"
                  )}>
                    <h4 className={cn("text-sm font-bold", textColor)}>Need Help?</h4>
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

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PinProvider>
      <DashboardInner>{children}</DashboardInner>
    </PinProvider>
  )
}
