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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PinProvider } from "@/lib/pin-context"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "States", href: "/dashboard/states", icon: Map },
  { name: "Hire a Closer", href: "/dashboard/hire-closer", icon: Briefcase },
  { name: "Contract Admin", href: "/dashboard/contract-admin", icon: ClipboardList },
  { name: "Closing Training", href: "/dashboard/closing-training", icon: GraduationCap },
  { name: "Automation", href: "/dashboard/automation", icon: Zap },
  { name: "Export", href: "/dashboard/export", icon: Download },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Admin", href: "/dashboard/admin", icon: Shield },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("dashboard-theme")
    if (stored === "dark") {
      setIsDark(true)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("dashboard-theme", isDark ? "dark" : "light")
    }
  }, [isDark, mounted])

  const toggleTheme = () => setIsDark(!isDark)

  // Theme colors
  const bg = isDark ? "bg-slate-950" : "bg-gray-50"
  const cardBg = isDark ? "bg-slate-900" : "bg-white"
  const borderColor = isDark ? "border-slate-800" : "border-gray-200"
  const textColor = isDark ? "text-white" : "text-gray-900"
  const mutedText = isDark ? "text-slate-400" : "text-gray-500"

  return (
    <PinProvider>
    <div className={cn("min-h-screen", bg)}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          cardBg,
          borderColor,
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn("flex h-16 items-center justify-between px-4 border-b bg-white", borderColor)}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/us-foreclosure-leads-logo.png"
                alt="US Foreclosure Leads"
                width={180}
                height={45}
                className="h-9 w-auto"
              />
            </Link>
            <button
              className="lg:hidden p-2 -mr-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-900" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-500 text-white"
                      : cn(mutedText, isDark ? "hover:bg-slate-800" : "hover:bg-gray-100", "hover:text-emerald-500")
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {item.name === "Automation" && (
                    <span className="ml-auto text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full">
                      Add-on
                    </span>
                  )}
                  {item.name === "Hire a Closer" && (
                    <span className="ml-auto text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                      Pro
                    </span>
                  )}
                  {item.name === "Contract Admin" && (
                    <span className="ml-auto text-xs bg-purple-500/20 text-purple-500 px-2 py-0.5 rounded-full">
                      5%
                    </span>
                  )}
                  {item.name === "Closing Training" && (
                    <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-500 px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                  {item.name === "Admin" && (
                    <span className="ml-auto text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
                      Staff
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Upgrade CTAs */}
          <div className={cn("p-4 border-t space-y-4", borderColor)}>
            {/* Automation Add-on */}
            <Link href="/dashboard/automation" className="block">
              <div className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-500 p-4 text-white cursor-pointer hover:opacity-90 transition-opacity">
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  Automation
                </p>
                <p className="text-xs opacity-90 mt-1">Automated outreach on autopilot</p>
                <div className="w-full mt-3 bg-white/20 text-white text-center text-xs font-medium py-1.5 px-3 rounded-md">
                  View Automation
                </div>
              </div>
            </Link>

            {/* Full Business Package */}
            <div className="rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 p-4 text-white">
              <p className="font-semibold text-sm">Fully Built Asset Recovery Business</p>
              <p className="text-xs opacity-90 mt-1">45 Points of Compliance</p>
              <a
                href="https://assetrecoverybusiness.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  size="sm"
                  className="w-full mt-3 bg-green-700 text-white hover:bg-green-800 border border-green-400/30"
                >
                  Upgrade Now
                </Button>
              </a>
            </div>

            {/* Additional State */}
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <p className="font-semibold text-sm">Need More States?</p>
              <p className="text-xs opacity-90 mt-1">Add states for $175 each</p>
              <a
                href="https://startmybusinessinc.gumroad.com/l/blwra"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  size="sm"
                  className="w-full mt-3 bg-white text-blue-600 hover:bg-gray-100"
                >
                  Add a State
                </Button>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 lg:px-6", cardBg, borderColor)}>
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className={cn("h-6 w-6", textColor)} />
          </button>

          {/* Breadcrumb */}
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

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle - ALWAYS VISIBLE */}
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

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className={cn("h-5 w-5", isDark ? "text-slate-300" : "text-gray-600")} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* User */}
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

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </PinProvider>
  )
}
