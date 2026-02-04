"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ResourceFolder } from "@/components/resource-folder"

type ModuleStatus = "completed" | "current" | "locked"

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

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  useEffect(() => {
    if (selectedModule) {
      fetchResources(selectedModule.id)
    }
  }, [selectedModule, fetchResources])

  // Determine if a module is accessible
  function isModuleAccessible(mod: TrainingModule): boolean {
    if (isAdmin) return true
    // Modules 1-2 are free for everyone (regardless of status)
    if (mod.module_number <= 2) return true
    // For non-admin on modules 3+, respect the status
    return mod.status === "completed" || mod.status === "current"
  }

  // For display purposes: admin sees all as accessible, free users see 1-2 unlocked
  function getEffectiveStatus(mod: TrainingModule): ModuleStatus {
    if (isAdmin) {
      // Admin sees the real status but can access everything
      return mod.status
    }
    return mod.status
  }

  const completedCount = modules.filter((m) => m.status === "completed").length
  const totalModules = modules.length
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

  // Admin edit handlers
  function startEditing() {
    if (!selectedModule) return
    setEditTitle(selectedModule.title)
    setEditDescription(selectedModule.description)
    setEditDuration(selectedModule.duration)
    setEditVideoUrl(selectedModule.video_url)
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Closing Training</h1>
        <p className="text-muted-foreground">
          Master every step of the asset recovery closing process -- from first contact to
          disbursement.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules} Modules</div>
            <p className="text-xs text-muted-foreground">Structured learning path</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.5 Hours</div>
            <p className="text-xs text-muted-foreground">Self-paced video lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certification</CardTitle>
            <Award className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Certificate</div>
            <p className="text-xs text-muted-foreground">Awarded on completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Module List + Video Player */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT -- Module List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Modules</CardTitle>
            <CardDescription>
              {completedCount} of {totalModules} completed
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[560px] overflow-y-auto divide-y divide-border">
              {modules.map((mod) => {
                const isSelected = selectedModule?.id === mod.id
                const accessible = isAdmin || isModuleAccessible(mod)

                return (
                  <button
                    key={mod.id}
                    type="button"
                    disabled={!accessible}
                    onClick={() => {
                      if (accessible) {
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
                        mod.status === "completed" && "bg-emerald-500/15 text-emerald-600",
                        mod.status === "current" && "bg-indigo-500/15 text-indigo-500",
                        mod.status === "locked" && "bg-slate-500/10 text-slate-500"
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
                    <div className="shrink-0">
                      {isAdmin && mod.status === "locked" ? (
                        <span className="text-xs text-amber-500 font-medium">Admin</span>
                      ) : (
                        statusIcon(getEffectiveStatus(mod))
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT -- Video Player + Info */}
        <div className="lg:col-span-2 space-y-4">
          {selectedModule && (
            <>
              {/* Video Player Area */}
              <Card className="overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  {selectedModule.video_url ? (
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
                        className="absolute inset-0 w-full h-full object-cover"
                        controls
                        poster={selectedModule.poster_url}
                        preload="metadata"
                        key={selectedModule.video_url}
                      >
                        <source src={selectedModule.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <>
                      {/* Poster / Background */}
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${selectedModule.poster_url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />

                      {/* Play Button or Lock */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {!isAdmin && selectedModule.status === "locked" ? (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Lock className="h-14 w-14" />
                            <span className="text-sm font-medium">Complete previous modules to unlock</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-white/80">
                            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-indigo-600/90 text-white shadow-xl shadow-indigo-600/30">
                              <Play className="h-8 w-8 ml-1" />
                            </div>
                            <span className="text-sm font-medium">
                              {!selectedModule.video_url ? "No video uploaded yet" : "Play"}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
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
                  {selectedModule.status === "completed" && !selectedModule.video_url && (
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
                        </>
                      )}
                      {!editing && (isAdmin || selectedModule.status !== "locked") && (
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25">
                          <Video className="h-4 w-4 mr-2" />
                          {selectedModule.status === "completed" ? "Rewatch" : "Start Module"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Resources Section */}
              {(resources.length > 0 || isAdmin) && (
                <Card>
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
            <Button
              disabled={completedCount < totalModules}
              className={cn(
                "text-white",
                completedCount >= totalModules
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-indigo-600 opacity-60 cursor-not-allowed"
              )}
            >
              <Lock className="h-4 w-4 mr-2" />
              {totalModules - completedCount} Modules Remaining
            </Button>
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
    </div>
  )
}
