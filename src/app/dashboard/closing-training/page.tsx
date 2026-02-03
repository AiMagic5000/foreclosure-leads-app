"use client"

import { useState } from "react"
import {
  Play,
  Lock,
  CheckCircle,
  Clock,
  BookOpen,
  GraduationCap,
  Award,
  ChevronRight,
  Video,
  PlayCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ModuleStatus = "completed" | "current" | "locked"

interface TrainingModule {
  id: number
  title: string
  description: string
  duration: string
  posterUrl: string
  status: ModuleStatus
}

const modules: TrainingModule[] = [
  {
    id: 1,
    title: "Introduction to Asset Recovery",
    description:
      "Overview of the surplus fund recovery industry, what overages are, and how the business model works.",
    duration: "24 min",
    posterUrl: "/training-posters/module-1-intro.jpg",
    status: "completed",
  },
  {
    id: 2,
    title: "Understanding Surplus Funds & Overages",
    description:
      "Deep dive into tax sale overages, mortgage surplus, and how counties hold unclaimed funds.",
    duration: "32 min",
    posterUrl: "/training-posters/module-2-surplus.jpg",
    status: "completed",
  },
  {
    id: 3,
    title: "Skip Tracing & Locating Homeowners",
    description:
      "Techniques for finding former homeowners, using public records, databases, and skip tracing tools.",
    duration: "28 min",
    posterUrl: "/training-posters/module-3-skip-tracing.jpg",
    status: "current",
  },
  {
    id: 4,
    title: "The Initial Call - Scripts & Techniques",
    description:
      "Call scripts, opening lines, building rapport, and qualifying leads on the first contact.",
    duration: "35 min",
    posterUrl: "/training-posters/module-4-initial-call.jpg",
    status: "locked",
  },
  {
    id: 5,
    title: "Handling Objections & Building Trust",
    description:
      "Common objections from homeowners, how to overcome resistance, and establishing credibility.",
    duration: "26 min",
    posterUrl: "/training-posters/module-5-objections.jpg",
    status: "locked",
  },
  {
    id: 6,
    title: "Contracts, Compliance & Legal Framework",
    description:
      "Understanding the legal requirements, contract structure, state-specific regulations, and compliance.",
    duration: "30 min",
    posterUrl: "/training-posters/module-6-compliance.jpg",
    status: "locked",
  },
  {
    id: 7,
    title: "Working with Attorneys & Notaries",
    description:
      "How to coordinate with attorneys, schedule notaries, and manage the legal filing process.",
    duration: "22 min",
    posterUrl: "/training-posters/module-7-attorneys.jpg",
    status: "locked",
  },
  {
    id: 8,
    title: "Closing the Deal & Disbursement",
    description:
      "Final steps from signed contract through court filing to collecting the disbursement check.",
    duration: "18 min",
    posterUrl: "/training-posters/module-8-closing.jpg",
    status: "locked",
  },
]

const COMPLETED_COUNT = modules.filter((m) => m.status === "completed").length
const TOTAL_MODULES = modules.length
const PROGRESS_PERCENT = Math.round((COMPLETED_COUNT / TOTAL_MODULES) * 100)

function statusIcon(status: ModuleStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    case "current":
      return <PlayCircle className="h-5 w-5 text-indigo-400" />
    case "locked":
      return <Lock className="h-5 w-5 text-slate-500" />
  }
}

export default function ClosingTrainingPage() {
  const defaultModule = modules.find((m) => m.status === "current") ?? modules[0]
  const [selectedModule, setSelectedModule] = useState<TrainingModule>(defaultModule)

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Closing Training</h1>
        <p className="text-muted-foreground">
          Master every step of the asset recovery closing process -- from first contact to
          disbursement.
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Modules
            </CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TOTAL_MODULES} Modules</div>
            <p className="text-xs text-muted-foreground">Structured learning path</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.5 Hours</div>
            <p className="text-xs text-muted-foreground">Self-paced video lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certification
            </CardTitle>
            <Award className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Certificate</div>
            <p className="text-xs text-muted-foreground">Awarded on completion</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Content: Module List + Video Player ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT -- Module List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Modules</CardTitle>
            <CardDescription>
              {COMPLETED_COUNT} of {TOTAL_MODULES} completed
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[560px] overflow-y-auto divide-y divide-border">
              {modules.map((mod) => {
                const isSelected = selectedModule.id === mod.id
                const isAccessible = mod.status !== "locked"

                return (
                  <button
                    key={mod.id}
                    type="button"
                    disabled={!isAccessible}
                    onClick={() => {
                      if (isAccessible) {
                        setSelectedModule(mod)
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      isSelected && "bg-indigo-500/10",
                      isAccessible && !isSelected && "hover:bg-muted/60",
                      !isAccessible && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Module Number */}
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        mod.status === "completed" && "bg-emerald-500/15 text-emerald-600",
                        mod.status === "current" && "bg-indigo-500/15 text-indigo-500",
                        mod.status === "locked" && "bg-slate-500/10 text-slate-500"
                      )}
                    >
                      {mod.id}
                    </span>

                    {/* Title + Duration */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-indigo-600 dark:text-indigo-400" : ""
                        )}
                      >
                        {mod.title}
                      </p>
                      <span className="text-xs text-muted-foreground">{mod.duration}</span>
                    </div>

                    {/* Status Icon */}
                    <div className="shrink-0">{statusIcon(mod.status)}</div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT -- Video Player + Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player Area */}
          <Card className="overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              {/* Poster / Background */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${selectedModule.posterUrl})` }}
              />
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                {selectedModule.status === "locked" ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Lock className="h-14 w-14" />
                    <span className="text-sm font-medium">Complete previous modules to unlock</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="group flex items-center justify-center h-20 w-20 rounded-full bg-indigo-600/90 text-white shadow-xl shadow-indigo-600/30 transition-transform hover:scale-110 active:scale-100"
                  >
                    <Play className="h-8 w-8 ml-1" />
                  </button>
                )}
              </div>

              {/* Module Badge */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-indigo-600/90 text-white border-0">
                  Module {selectedModule.id}
                </Badge>
              </div>

              {/* Duration Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="bg-slate-950/60 text-white border-white/20">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedModule.duration}
                </Badge>
              </div>

              {/* Status Badge */}
              {selectedModule.status === "completed" && (
                <div className="absolute bottom-4 right-4">
                  <Badge className="bg-emerald-600/90 text-white border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Module Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{selectedModule.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedModule.description}
                  </CardDescription>
                </div>
                {selectedModule.status !== "locked" && (
                  <Button className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25">
                    <Video className="h-4 w-4 mr-2" />
                    {selectedModule.status === "completed" ? "Rewatch" : "Start Module"}
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium">Course Progress</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {COMPLETED_COUNT} of {TOTAL_MODULES} Modules Complete
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
              style={{ width: `${PROGRESS_PERCENT}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">{PROGRESS_PERCENT}%</p>
        </CardContent>
      </Card>

      {/* ── Certificate Achievement Card ── */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/20 to-slate-950/40">
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-8 px-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/15">
            <Award className="h-10 w-10 text-indigo-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold">Certified Recovery Closer</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete all {TOTAL_MODULES} modules to earn your Certified Recovery Closer
              credential. This certificate validates your ability to manage the full surplus fund
              recovery process from lead identification through disbursement.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              disabled
              className="bg-indigo-600 text-white opacity-60 cursor-not-allowed"
            >
              <Lock className="h-4 w-4 mr-2" />
              {TOTAL_MODULES - COMPLETED_COUNT} Modules Remaining
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
