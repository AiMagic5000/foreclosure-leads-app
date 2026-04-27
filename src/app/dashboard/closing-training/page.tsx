"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Play,
  Lock,
  CheckCircle,
  Clock,
  BookOpen,
  GraduationCap,
  Award,
  Video,
  PlayCircle,
  Pencil,
  Save,
  XCircle,
  Upload,
  Plus,
  FolderOpen,
  Loader2,
  ChevronDown,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ResourceFolder } from "@/components/resource-folder"
import { usePin } from "@/lib/pin-context"

type ModuleStatus = "completed" | "current" | "locked"

type AccountTier = "basic" | "partnership" | "owner_operator" | "admin"

const ALL_TIERS: { value: AccountTier; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "partnership", label: "Partnership" },
  { value: "owner_operator", label: "Owner Operator" },
  { value: "admin", label: "Admin" },
]

interface TrainingModule {
  id: number
  module_number: number
  title: string
  description: string
  duration: string
  poster_url: string
  video_url: string
  status: ModuleStatus
  sort_order: number
  updated_at: string
  updated_by: string
  access_level: AccountTier[]
}

interface TrainingResource {
  id: string
  module_id: number
  file_name: string
  display_name: string
  file_url: string
  file_size: number
  file_type: string
  sort_order: number
  created_at: string
}

const ADMIN_EMAIL = "coreypearsonemail@gmail.com"
const CERTIFICATE_IMAGE_URL = "https://seafile.alwaysencrypted.com/f/4e64642120a34110bb75/?dl=1"

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

function isYouTubeOrVimeo(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url)
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

export default function ClosingTrainingPage() {
  const { user } = useUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || ""
  const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase()
  const { accountType } = usePin()
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [resources, setResources] = useState<TrainingResource[]>([])
  const [loading, setLoading] = useState(true)
  const [resourcesLoading, setResourcesLoading] = useState(false)

  // Admin edit state
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDuration, setEditDuration] = useState("")
  const [editVideoUrl, setEditVideoUrl] = useState("")
  const [saving, setSaving] = useState(false)

  // Admin resource upload state
  const [uploading, setUploading] = useState(false)
  const [showAddResource, setShowAddResource] = useState(false)

  // Admin add module state
  const [showAddModule, setShowAddModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const [newModuleDuration, setNewModuleDuration] = useState("")
  const [newModuleVideoUrl, setNewModuleVideoUrl] = useState("")
  const [newModulePosterUrl, setNewModulePosterUrl] = useState("")
  const [newModuleUploading, setNewModuleUploading] = useState<string | null>(null) // "poster" | "video" | null
  const [newModuleAccessLevel, setNewModuleAccessLevel] = useState<AccountTier[]>(["basic", "partnership", "owner_operator", "admin"])
  const [creatingModule, setCreatingModule] = useState(false)
  const [deletingModule, setDeletingModule] = useState(false)
  const [editAccessLevel, setEditAccessLevel] = useState<AccountTier[]>([])
  const [showAccessPopup, setShowAccessPopup] = useState<string | null>(null) // tier label string or null

  // Video playback ref
  const videoRef = useRef<HTMLVideoElement>(null)

  // Track which module video the user has clicked play on (shows poster until clicked)
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null)

  // Per-user progress tracking
  const [userCompletedModules, setUserCompletedModules] = useState<Set<number>>(new Set())
  const [markingComplete, setMarkingComplete] = useState(false)

  // Mobile accordion: track which module is expanded on mobile
  const [mobileExpandedId, setMobileExpandedId] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches)
    handler(mql)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/training/modules")
      const json = await res.json()
      if (json.data) {
        setModules(json.data)
        if (!selectedModule) {
          const current = json.data.find((m: TrainingModule) => m.status === "current") || json.data[0]
          setSelectedModule(current)
        }
      }
    } catch {
      // Modules will stay empty
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchResources = useCallback(async (moduleId: number) => {
    setResourcesLoading(true)
    try {
      const res = await fetch(`/api/training/resources?module_id=${moduleId}`)
      const json = await res.json()
      setResources(json.data || [])
    } catch {
      setResources([])
    } finally {
      setResourcesLoading(false)
    }
  }, [])

  const fetchUserProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/training/progress")
      const json = await res.json()
      if (json.data) {
        setUserCompletedModules(new Set(json.data.map((p: { module_id: number }) => p.module_id)))
      }
    } catch {
      // Progress stays empty
    }
  }, [])

  useEffect(() => {
    fetchModules()
    fetchUserProgress()
  }, [fetchModules, fetchUserProgress])

  useEffect(() => {
    if (selectedModule) {
      fetchResources(selectedModule.id)
    }
  }, [selectedModule, fetchResources])

  // All modules are selectable/viewable -- content access is gated separately
  function isModuleAccessible(): boolean {
    return true
  }

  // Status based on per-user completion
  function getEffectiveStatus(mod: TrainingModule): ModuleStatus {
    if (userCompletedModules.has(mod.id)) return "completed"
    if (isModuleAccessible()) return "current"
    return "locked"
  }

  async function markModuleComplete(moduleId: number) {
    setMarkingComplete(true)
    try {
      const res = await fetch("/api/training/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId }),
      })
      const json = await res.json()
      if (json.success) {
        setUserCompletedModules((prev) => new Set([...prev, moduleId]))
      }
    } catch {
      // Error
    } finally {
      setMarkingComplete(false)
    }
  }

  // Detect video duration from a URL using a hidden <video> element
  function detectVideoDuration(url: string, onDuration: (d: string) => void) {
    if (!url || isYouTubeOrVimeo(url)) return
    const vid = document.createElement("video")
    vid.preload = "metadata"
    vid.src = url
    vid.onloadedmetadata = () => {
      const secs = Math.round(vid.duration)
      if (secs > 0) {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        onDuration(`${m}:${String(s).padStart(2, "0")}`)
      }
      vid.remove()
    }
    vid.onerror = () => vid.remove()
  }

  // Check if user's tier has access to a module's content (video + resources)
  function hasContentAccess(mod: TrainingModule): boolean {
    if (isAdmin) return true
    const tier = (accountType || "basic") as AccountTier
    const levels = mod.access_level || ["basic", "partnership", "owner_operator", "admin"]
    return levels.includes(tier)
  }

  // Get the display label for required tiers
  function getRequiredTierLabel(mod: TrainingModule): string {
    const levels = mod.access_level || ["basic", "partnership", "owner_operator", "admin"]
    const labels: Record<string, string> = {
      basic: "Basic",
      partnership: "Partnership",
      owner_operator: "Owner Operator",
      admin: "Admin",
    }
    return levels.map((l) => labels[l] || l).join(" or ")
  }

  const completedCount = userCompletedModules.size
  const totalModules = modules.length
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0
  const isAllComplete = totalModules > 0 && completedCount >= totalModules

  // Calculate total duration from all module durations (format: "M:SS" or "MM:SS")
  const totalDurationLabel = useMemo(() => {
    let totalSeconds = 0
    for (const mod of modules) {
      const parts = mod.duration.split(":")
      if (parts.length === 2) {
        totalSeconds += parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
      }
    }
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.round((totalSeconds % 3600) / 60)
    if (hours > 0) {
      return `${hours} Hr ${mins} Min`
    }
    return `${mins} Minutes`
  }, [modules])

  // Admin edit handlers
  function startEditing() {
    if (!selectedModule) return
    setEditTitle(selectedModule.title)
    setEditDescription(selectedModule.description)
    setEditDuration(selectedModule.duration)
    setEditVideoUrl(selectedModule.video_url)
    setEditAccessLevel(selectedModule.access_level || ["basic", "partnership", "owner_operator", "admin"])
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveEdits() {
    if (!selectedModule) return
    setSaving(true)
    try {
      const res = await fetch("/api/training/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: selectedModule.id,
          title: editTitle,
          description: editDescription,
          duration: editDuration,
          video_url: editVideoUrl,
          access_level: editAccessLevel,
        }),
      })
      if (res.ok) {
        setEditing(false)
        // Refresh
        const updated = {
          ...selectedModule,
          title: editTitle,
          description: editDescription,
          duration: editDuration,
          video_url: editVideoUrl,
          access_level: editAccessLevel,
        }
        setSelectedModule(updated)
        setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      }
    } catch {
      // Error handling
    } finally {
      setSaving(false)
    }
  }

  async function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedModule) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "poster")

      const uploadRes = await fetch("/api/training/upload", { method: "POST", body: formData })
      const uploadJson = await uploadRes.json()

      if (uploadJson.url) {
        await fetch("/api/training/modules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module_id: selectedModule.id, poster_url: uploadJson.url }),
        })
        const updated = { ...selectedModule, poster_url: uploadJson.url }
        setSelectedModule(updated)
        setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      }
    } catch {
      // Error
    } finally {
      setSaving(false)
    }
  }

  async function handleResourceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedModule) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "resource")

      const uploadRes = await fetch("/api/training/upload", { method: "POST", body: formData })
      const uploadJson = await uploadRes.json()

      if (uploadJson.url) {
        await fetch("/api/training/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module_id: selectedModule.id,
            file_name: uploadJson.fileName,
            display_name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
            file_url: uploadJson.url,
            file_size: uploadJson.fileSize,
            file_type: file.type,
            sort_order: resources.length,
          }),
        })
        fetchResources(selectedModule.id)
      }
    } catch {
      // Error
    } finally {
      setUploading(false)
      setShowAddResource(false)
    }
  }

  async function handleDeleteResource(resourceId: string) {
    try {
      await fetch("/api/training/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resourceId }),
      })
      setResources((prev) => prev.filter((r) => r.id !== resourceId))
    } catch {
      // Error
    }
  }

  async function createNewModule() {
    if (!newModuleTitle.trim()) return
    setCreatingModule(true)
    try {
      const res = await fetch("/api/training/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newModuleTitle.trim(),
          description: newModuleDescription.trim(),
          duration: newModuleDuration.trim() || "0:00",
          video_url: newModuleVideoUrl.trim(),
          poster_url: newModulePosterUrl.trim(),
          access_level: newModuleAccessLevel,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setModules((prev) => [...prev, json.data])
        setSelectedModule(json.data)
        setShowAddModule(false)
        setNewModuleTitle("")
        setNewModuleDescription("")
        setNewModuleDuration("")
        setNewModuleVideoUrl("")
        setNewModulePosterUrl("")
        setNewModuleAccessLevel(["basic", "partnership", "owner_operator", "admin"])
        setEditing(false)
      }
    } catch {
      // Error
    } finally {
      setCreatingModule(false)
    }
  }

  async function deleteModule(moduleId: number) {
    if (!confirm("Delete this module and all its resources? This cannot be undone.")) return
    setDeletingModule(true)
    try {
      const res = await fetch("/api/training/modules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId }),
      })
      if (res.ok) {
        setModules((prev) => prev.filter((m) => m.id !== moduleId))
        if (selectedModule?.id === moduleId) {
          setSelectedModule(modules.find((m) => m.id !== moduleId) || null)
          setEditing(false)
        }
      }
    } catch {
      // Error
    } finally {
      setDeletingModule(false)
    }
  }

  function handleDownload(resource: TrainingResource) {
    const a = document.createElement("a")
    a.href = resource.file_url
    a.download = resource.file_name
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrint(resource: TrainingResource) {
    window.open(resource.file_url, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Closing Training</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Master every step of the asset recovery closing process -- from first contact to
          disbursement.
        </p>
      </div>

      {/* Stats Row -- horizontal on all screens */}
      <div className="grid gap-2 grid-cols-3 sm:gap-4">
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Modules</CardTitle>
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{totalModules}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Structured learning path</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Duration</CardTitle>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{totalDurationLabel}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Self-paced video lessons</p>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Certification</CardTitle>
            <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">Certificate</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Awarded on completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Module List + Video Player */}
      <div className="grid gap-6 lg:grid-cols-3 overflow-hidden">
        {/* LEFT -- Module List */}
        <Card className="lg:col-span-1 overflow-hidden min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">Modules</CardTitle>
            <CardDescription>
              {completedCount} of {totalModules} completed
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <div className="lg:max-h-[560px] lg:overflow-y-auto divide-y divide-border">
              {modules.map((mod) => {
                const isSelected = selectedModule?.id === mod.id
                const accessible = isAdmin || isModuleAccessible()
                const isMobileExpanded = isMobile && mobileExpandedId === mod.id

                return (
                  <div key={mod.id}>
                    <button
                      type="button"
                      disabled={!accessible}
                      onClick={() => {
                        if (!accessible) return
                        setPlayingVideoId(null)
                        if (isMobile) {
                          // Accordion toggle on mobile
                          const newId = mobileExpandedId === mod.id ? null : mod.id
                          setMobileExpandedId(newId)
                          if (newId !== null) {
                            setSelectedModule(mod)
                            setEditing(false)
                          }
                        } else {
                          setSelectedModule(mod)
                          setEditing(false)
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        isSelected && "bg-indigo-500/10",
                        accessible && !isSelected && "hover:bg-muted/60",
                        !accessible && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          getEffectiveStatus(mod) === "completed" && "bg-emerald-500/15 text-emerald-600",
                          getEffectiveStatus(mod) === "current" && "bg-indigo-500/15 text-indigo-500",
                          getEffectiveStatus(mod) === "locked" && "bg-slate-500/10 text-slate-500"
                        )}
                      >
                        {mod.module_number}
                      </span>
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
                      <div className="shrink-0 flex items-center gap-1.5">
                        {statusIcon(getEffectiveStatus(mod))}
                        {isAdmin && mod.access_level && mod.access_level.length < 4 && (
                          <span className="text-[10px] text-amber-500 font-medium">
                            {mod.access_level.map((t) => t === "owner_operator" ? "OO" : t === "partnership" ? "P" : t === "admin" ? "A" : "B").join("+")}
                          </span>
                        )}
                        {/* Mobile chevron indicator */}
                        {isMobile && accessible && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              isMobileExpanded && "rotate-180"
                            )}
                          />
                        )}
                      </div>
                    </button>

                    {/* Mobile accordion expanded content */}
                    {isMobileExpanded && accessible && selectedModule?.id === mod.id && (
                      <div className="px-3 pb-4 pt-2 space-y-4 bg-muted/30 border-t border-border/50 overflow-hidden">
                        {/* Video Player */}
                        <div className="rounded-xl overflow-hidden w-full">
                          <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                            {selectedModule.video_url && playingVideoId === selectedModule.id ? (
                              isYouTubeOrVimeo(selectedModule.video_url) ? (
                                <iframe
                                  src={getEmbedUrl(selectedModule.video_url)}
                                  className="absolute inset-0 w-full h-full rounded-xl"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={selectedModule.title}
                                />
                              ) : (
                                <video
                                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                                  controls
                                  autoPlay
                                  preload="metadata"
                                  key={`mobile-${selectedModule.video_url}`}
                                >
                                  <source src={selectedModule.video_url} type="video/mp4" />
                                </video>
                              )
                            ) : (
                              <div
                                className="absolute inset-0 rounded-xl overflow-hidden cursor-pointer"
                                onClick={() => {
                                  if (!selectedModule.video_url) return
                                  if (!hasContentAccess(selectedModule)) {
                                    setShowAccessPopup(getRequiredTierLabel(selectedModule))
                                    return
                                  }
                                  setPlayingVideoId(selectedModule.id)
                                }}
                              >
                                {selectedModule.poster_url && (
                                  <img
                                    src={selectedModule.poster_url}
                                    alt={selectedModule.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2 text-white/90">
                                    <div className={cn(
                                      "flex items-center justify-center h-14 w-14 rounded-full text-white shadow-xl",
                                      hasContentAccess(selectedModule) ? "bg-indigo-600/90 shadow-indigo-600/30" : "bg-slate-600/90 shadow-slate-600/30"
                                    )}>
                                      {hasContentAccess(selectedModule) ? (
                                        <Play className="h-6 w-6 ml-0.5" />
                                      ) : (
                                        <Lock className="h-5 w-5" />
                                      )}
                                    </div>
                                    <span className="text-xs font-medium">
                                      {!selectedModule.video_url ? "No video yet" : hasContentAccess(selectedModule) ? "Play" : "Restricted"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Module Description */}
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-foreground break-words">{selectedModule.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 break-words">{selectedModule.description}</p>
                        </div>

                        {/* Mark Complete / Completed */}
                        {hasContentAccess(selectedModule) && !userCompletedModules.has(selectedModule.id) && isModuleAccessible() && (
                          <Button
                            onClick={() => markModuleComplete(selectedModule.id)}
                            disabled={markingComplete}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 text-sm font-semibold"
                          >
                            {markingComplete ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Module as Complete
                              </>
                            )}
                          </Button>
                        )}

                        {userCompletedModules.has(selectedModule.id) && (
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Module Completed</span>
                          </div>
                        )}

                        {/* Resources */}
                        {(resources.length > 0 || isAdmin) && (
                          <div className="relative">
                            <div className={cn(!hasContentAccess(selectedModule) && "blur-sm pointer-events-none select-none")}>
                              <div className="flex items-center gap-2 mb-3">
                                <FolderOpen className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-semibold">Resources</span>
                                {resources.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {resources.length} file{resources.length !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                              {resourcesLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                </div>
                              ) : resources.length > 0 ? (
                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                                  {resources.map((resource) => (
                                    <ResourceFolder
                                      key={resource.id}
                                      displayName={resource.display_name}
                                      fileUrl={resource.file_url}
                                      onDownload={() => handleDownload(resource)}
                                      onPrint={() => handlePrint(resource)}
                                      onDelete={isAdmin ? () => handleDeleteResource(resource.id) : undefined}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  No resources for this module yet.
                                </p>
                              )}
                            </div>
                            {!hasContentAccess(selectedModule) && resources.length > 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
                                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5" />
                                    Requires {getRequiredTierLabel(selectedModule)} account
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Admin: Add New Module */}
            {isAdmin && !showAddModule && (
              <div className="p-3 border-t">
                <Button
                  onClick={() => setShowAddModule(true)}
                  variant="outline"
                  className="w-full text-indigo-600 border-indigo-600/30 hover:bg-indigo-600/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Module
                </Button>
              </div>
            )}

            {/* Admin: Add Module Form */}
            {isAdmin && showAddModule && (
              <div className="p-4 border-t space-y-3 bg-indigo-500/5">
                <p className="text-sm font-semibold text-indigo-600">New Module</p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="e.g. Advanced Filing Strategies"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <textarea
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description of this module"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration (M:SS)</label>
                  <input
                    type="text"
                    value={newModuleDuration}
                    onChange={(e) => setNewModuleDuration(e.target.value)}
                    placeholder="5:30"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                  />
                </div>

                {/* Poster Image Upload */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Video Poster / Thumbnail</label>
                  {newModulePosterUrl && (
                    <div className="mb-2 relative w-full rounded-md overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                      <img src={newModulePosterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewModulePosterUrl("")}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={newModuleUploading === "poster"}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setNewModuleUploading("poster")
                      try {
                        const fd = new FormData()
                        fd.append("file", file)
                        fd.append("type", "poster")
                        const res = await fetch("/api/training/upload", { method: "POST", body: fd })
                        const json = await res.json()
                        if (json.url) setNewModulePosterUrl(json.url)
                      } catch { /* */ } finally {
                        setNewModuleUploading(null)
                      }
                    }}
                    className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                  />
                  {newModuleUploading === "poster" && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading poster...
                    </div>
                  )}
                </div>

                {/* Video Upload or URL */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Video</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newModuleVideoUrl}
                      onChange={(e) => setNewModuleVideoUrl(e.target.value)}
                      placeholder="Paste YouTube/Vimeo URL or upload below"
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">or upload:</span>
                      <input
                        type="file"
                        accept="video/*"
                        disabled={newModuleUploading === "video"}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setNewModuleUploading("video")
                          try {
                            const fd = new FormData()
                            fd.append("file", file)
                            fd.append("type", "video")
                            const res = await fetch("/api/training/upload", { method: "POST", body: fd })
                            const json = await res.json()
                            if (json.url) {
                              setNewModuleVideoUrl(json.url)
                              detectVideoDuration(json.url, (d) => {
                                if (!newModuleDuration) setNewModuleDuration(d)
                              })
                            }
                          } catch { /* */ } finally {
                            setNewModuleUploading(null)
                          }
                        }}
                        className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                      />
                    </div>
                    {newModuleUploading === "video" && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Uploading video...
                      </div>
                    )}
                    {newModuleVideoUrl && (
                      <div className="text-xs text-emerald-600 font-medium truncate">
                        Video set: {newModuleVideoUrl.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                </div>

                {/* Access Level */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Access Level</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TIERS.map((tier) => (
                      <label key={tier.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newModuleAccessLevel.includes(tier.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewModuleAccessLevel((prev) => [...prev, tier.value])
                            } else {
                              setNewModuleAccessLevel((prev) => prev.filter((t) => t !== tier.value))
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        {tier.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={createNewModule}
                    disabled={creatingModule || !newModuleTitle.trim() || newModuleUploading !== null}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {creatingModule ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Create Module
                  </Button>
                  <Button onClick={() => { setShowAddModule(false); setNewModulePosterUrl(""); setNewModuleVideoUrl(""); setNewModuleAccessLevel(["basic", "partnership", "owner_operator", "admin"]) }} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT -- Video Player + Info (desktop only) */}
        <div className={cn("lg:col-span-2 space-y-4", isMobile && "hidden")}>
          {selectedModule && (
            <>
              {/* Video Player Area */}
              <Card className="overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  {selectedModule.video_url && playingVideoId === selectedModule.id ? (
                    isYouTubeOrVimeo(selectedModule.video_url) ? (
                      <iframe
                        src={getEmbedUrl(selectedModule.video_url)}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedModule.title}
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        controls
                        autoPlay
                        preload="metadata"
                        key={selectedModule.video_url}
                      >
                        <source src={selectedModule.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <div
                      className={cn("absolute inset-0 overflow-hidden", selectedModule.video_url && "cursor-pointer")}
                      onClick={() => {
                        if (!selectedModule.video_url) return
                        if (!hasContentAccess(selectedModule)) {
                          setShowAccessPopup(getRequiredTierLabel(selectedModule))
                          return
                        }
                        setPlayingVideoId(selectedModule.id)
                      }}
                    >
                      {/* Poster Image */}
                      {selectedModule.poster_url && (
                        <img
                          src={selectedModule.poster_url}
                          alt={selectedModule.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />

                      {/* Play Button or Lock */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {!hasContentAccess(selectedModule) ? (
                          <div className="flex flex-col items-center gap-2 text-white/80">
                            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-slate-600/90 text-white shadow-xl shadow-slate-600/30">
                              <Lock className="h-8 w-8" />
                            </div>
                            <span className="text-sm font-medium">Restricted Content</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-white/90">
                            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-indigo-600/90 text-white shadow-xl shadow-indigo-600/30">
                              <Play className="h-8 w-8 ml-1" />
                            </div>
                            <span className="text-sm font-medium">
                              {!selectedModule.video_url ? "No video uploaded yet" : "Play"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Module Badge */}
                  {!selectedModule.video_url && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-indigo-600/90 text-white border-0">
                        Module {selectedModule.module_number}
                      </Badge>
                    </div>
                  )}

                  {/* Duration Badge */}
                  {!selectedModule.video_url && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-slate-950/60 text-white border-white/20">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedModule.duration}
                      </Badge>
                    </div>
                  )}

                  {/* Completed Badge */}
                  {userCompletedModules.has(selectedModule.id) && !selectedModule.video_url && (
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
                    <div className="flex-1">
                      {editing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                              <input
                                type="text"
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Video URL (or YouTube/Vimeo link)
                              </label>
                              <input
                                type="text"
                                value={editVideoUrl}
                                onChange={(e) => setEditVideoUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Upload Poster Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePosterUpload}
                              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Upload Video File</label>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file || !selectedModule) return
                                setSaving(true)
                                try {
                                  const formData = new FormData()
                                  formData.append("file", file)
                                  formData.append("type", "video")
                                  const uploadRes = await fetch("/api/training/upload", {
                                    method: "POST",
                                    body: formData,
                                  })
                                  const uploadJson = await uploadRes.json()
                                  if (uploadJson.url) {
                                    setEditVideoUrl(uploadJson.url)
                                    detectVideoDuration(uploadJson.url, (d) => setEditDuration(d))
                                  }
                                } catch {
                                  // Error
                                } finally {
                                  setSaving(false)
                                }
                              }}
                              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Access Level</label>
                            <div className="flex flex-wrap gap-2">
                              {ALL_TIERS.map((tier) => (
                                <label key={tier.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editAccessLevel.includes(tier.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditAccessLevel((prev) => [...prev, tier.value])
                                      } else {
                                        setEditAccessLevel((prev) => prev.filter((t) => t !== tier.value))
                                      }
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  {tier.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-lg">{selectedModule.title}</CardTitle>
                          <CardDescription className="mt-1">{selectedModule.description}</CardDescription>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && !editing && (
                        <Button
                          onClick={startEditing}
                          variant="outline"
                          size="sm"
                          className="text-amber-600 border-amber-600/30 hover:bg-amber-600/10"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      {editing && (
                        <>
                          <Button
                            onClick={saveEdits}
                            size="sm"
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {saving ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Save
                          </Button>
                          <Button onClick={cancelEditing} variant="outline" size="sm">
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Cancel
                          </Button>
                          <Button
                            onClick={() => selectedModule && deleteModule(selectedModule.id)}
                            disabled={deletingModule}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600/30 hover:bg-red-600/10"
                          >
                            {deletingModule ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Delete
                          </Button>
                        </>
                      )}
                      {!editing && selectedModule.video_url && hasContentAccess(selectedModule) && (
                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25"
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
                              videoRef.current.play()
                            }
                          }}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          {userCompletedModules.has(selectedModule.id) ? "Rewatch" : "Start Module"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Mark as Complete / Completed Badge */}
              {selectedModule && hasContentAccess(selectedModule) && !userCompletedModules.has(selectedModule.id) && (
                <Button
                  onClick={() => markModuleComplete(selectedModule.id)}
                  disabled={markingComplete}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 py-6 text-base font-semibold"
                >
                  {markingComplete ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving Progress...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark Module as Complete
                    </>
                  )}
                </Button>
              )}

              {selectedModule && userCompletedModules.has(selectedModule.id) && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Module Completed</span>
                </div>
              )}

              {/* Resources Section */}
              {(resources.length > 0 || isAdmin) && (
                <Card className="relative">
                  <div className={cn(!hasContentAccess(selectedModule) && !isAdmin && "blur-sm pointer-events-none select-none")}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-indigo-500" />
                          <CardTitle className="text-lg">Module Resources</CardTitle>
                          {resources.length > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {resources.length} file{resources.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        {isAdmin && (
                          <Button
                            onClick={() => setShowAddResource(!showAddResource)}
                            size="sm"
                            variant="outline"
                            className="text-indigo-600 border-indigo-600/30 hover:bg-indigo-600/10"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Add Resource
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Admin upload form */}
                      {showAddResource && isAdmin && (
                        <div className="mb-6 p-4 rounded-lg border border-dashed border-indigo-500/40 bg-indigo-500/5">
                          <p className="text-sm font-medium mb-2">Upload a new resource file</p>
                          <input
                            type="file"
                            onChange={handleResourceUpload}
                            disabled={uploading}
                            className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                          />
                          {uploading && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </div>
                          )}
                        </div>
                      )}

                      {resourcesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                      ) : resources.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                          {resources.map((resource) => (
                            <ResourceFolder
                              key={resource.id}
                              displayName={resource.display_name}
                              fileUrl={resource.file_url}
                              onDownload={() => handleDownload(resource)}
                              onPrint={() => handlePrint(resource)}
                              onDelete={isAdmin ? () => handleDeleteResource(resource.id) : undefined}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No resources for this module yet.
                          {isAdmin && " Click 'Add Resource' to upload files."}
                        </p>
                      )}
                    </CardContent>
                  </div>
                  {!hasContentAccess(selectedModule) && !isAdmin && resources.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                      <div className="bg-background/90 backdrop-blur-sm rounded-lg px-6 py-3 border shadow-lg">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Resources require {getRequiredTierLabel(selectedModule)} account
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium">Course Progress</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {completedCount} of {totalModules} Modules Complete
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">{progressPercent}%</p>
        </CardContent>
      </Card>

      {/* All Training Complete Banner */}
      {isAllComplete && (
        <Card className="relative border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-slate-950/40 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />
          <CardContent className="flex flex-col items-center gap-4 py-10 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
              <GraduationCap className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-400">Training Complete!</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Congratulations! You have completed all training modules. Our team has been notified
              and will reach out to schedule your one-on-one call training session.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Certificate Achievement Card */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/20 to-slate-950/40">
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-8 px-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/15">
            <Award className="h-10 w-10 text-indigo-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold">Certified Recovery Closer</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete all {totalModules} modules to earn your Certified Recovery Closer
              credential. This certificate validates your ability to manage the full surplus fund
              recovery process from lead identification through disbursement.
            </p>
          </div>
          <div className="shrink-0">
            {isAllComplete ? (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Award className="h-4 w-4 mr-2" />
                Training Complete
              </Button>
            ) : (
              <Button
                disabled
                className="bg-indigo-600 opacity-60 cursor-not-allowed text-white"
              >
                <Lock className="h-4 w-4 mr-2" />
                {totalModules - completedCount} Modules Remaining
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certificate Image */}
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CERTIFICATE_IMAGE_URL}
          alt="Certified Recovery Closer Certificate - Asset Recovery Business Training Credential"
          className="max-w-full sm:max-w-2xl rounded-xl shadow-lg border border-indigo-500/20"
        />
      </div>

      {/* Access restriction popup */}
      {showAccessPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAccessPopup(null)}
        >
          <div
            className="bg-background rounded-xl p-6 max-w-sm mx-4 shadow-2xl border border-border text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Restricted Content</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This training module is available for <span className="font-medium text-foreground">{showAccessPopup}</span> accounts.
              Upgrade your plan to access this content.
            </p>
            <Button
              onClick={() => setShowAccessPopup(null)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
