"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Star,
  Phone,
  PhoneForwarded,
  MapPin,
  Shield,
  Clock,
  Download,
  FileText,
  Play,
  Pause,
  Volume2,
  Search,
  Award,
  TrendingUp,
  Headphones,
  MessageSquare,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

interface CloserProfile {
  id: string
  name: string
  avatarUrl: string
  title: string
  rating: number
  reviewCount: number
  completedDeals: number
  successRate: number
  responseTime: string
  feePercent: number
  avgRecovery: string
  jurisdictions: string[]
  specialties: string[]
  bio: string
  memberSince: string
  languages: string[]
  availability: "available" | "busy" | "offline"
  voiceSampleUrl: string
}

const closers: CloserProfile[] = [
  {
    id: "mt-001",
    name: "Marcus T.",
    avatarUrl: "/avatars/marcus-thompson.jpg",
    title: "Senior Asset Recovery Specialist",
    rating: 4.9,
    reviewCount: 247,
    completedDeals: 312,
    successRate: 94,
    responseTime: "< 15 min",
    feePercent: 10,
    avgRecovery: "$38,500",
    jurisdictions: ["Georgia", "Florida", "Alabama", "South Carolina", "Tennessee"],
    specialties: ["Tax Sale Overages", "Mortgage Surplus", "Estate Claims"],
    bio: "12+ years recovering surplus funds from foreclosure sales across the Southeast. Former county clerk with deep knowledge of judicial processes. Specializes in high-value mortgage surplus claims over $25,000.",
    memberSince: "2019",
    languages: ["English", "Spanish"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/marcus-thompson.mp3",
  },
  {
    id: "dr-002",
    name: "Diana R.",
    avatarUrl: "/avatars/diana-reyes.jpg",
    title: "Foreclosure Surplus Expert",
    rating: 4.8,
    reviewCount: 189,
    completedDeals: 256,
    successRate: 91,
    responseTime: "< 30 min",
    feePercent: 10,
    avgRecovery: "$31,200",
    jurisdictions: ["Texas", "California", "Arizona", "New Mexico", "Nevada"],
    specialties: ["Non-Judicial Foreclosures", "Bilingual Outreach", "Tax Deed Surplus"],
    bio: "Bilingual closer with 8 years of experience handling surplus fund claims in non-judicial states. Native Spanish speaker who connects with Hispanic homeowners often overlooked in the recovery process. Strong track record in Texas and California markets.",
    memberSince: "2020",
    languages: ["English", "Spanish"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/diana-reyes.mp3",
  },
  {
    id: "jp-003",
    name: "James P.",
    avatarUrl: "/avatars/james-patterson.jpg",
    title: "Certified Recovery Agent",
    rating: 4.9,
    reviewCount: 334,
    completedDeals: 428,
    successRate: 96,
    responseTime: "< 10 min",
    feePercent: 10,
    avgRecovery: "$47,800",
    jurisdictions: ["New York", "New Jersey", "Pennsylvania", "Connecticut", "Massachusetts"],
    specialties: ["Judicial Foreclosures", "Complex Liens", "Multi-party Claims"],
    bio: "Former real estate attorney turned asset recovery specialist. 15 years navigating complex judicial foreclosure processes in the Northeast. Handles multi-party claims and lien disputes that other closers avoid. Known for thorough documentation and high conversion on initial calls.",
    memberSince: "2018",
    languages: ["English"],
    availability: "busy",
    voiceSampleUrl: "/voice-samples/james-patterson.mp3",
  },
  {
    id: "kw-004",
    name: "Keisha W.",
    avatarUrl: "/avatars/keisha-washington.jpg",
    title: "Tax Sale Overage Specialist",
    rating: 4.7,
    reviewCount: 156,
    completedDeals: 198,
    successRate: 89,
    responseTime: "< 20 min",
    feePercent: 10,
    avgRecovery: "$24,600",
    jurisdictions: ["Illinois", "Ohio", "Michigan", "Indiana", "Wisconsin"],
    specialties: ["Tax Sale Overages", "County Auction Surplus", "Owner-Occupied Properties"],
    bio: "Focused on tax sale overages in the Midwest, where county auction processes vary significantly. 6 years of experience working directly with county treasurers and clerks. Specializes in owner-occupied properties where homeowners are unaware of surplus funds owed to them.",
    memberSince: "2021",
    languages: ["English"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/keisha-washington.mp3",
  },
  {
    id: "dc-005",
    name: "David C.",
    avatarUrl: "/avatars/david-chen.jpg",
    title: "Commercial Asset Recovery",
    rating: 4.8,
    reviewCount: 203,
    completedDeals: 267,
    successRate: 92,
    responseTime: "< 15 min",
    feePercent: 10,
    avgRecovery: "$52,400",
    jurisdictions: ["Washington", "Oregon", "Colorado", "Montana", "Idaho"],
    specialties: ["Commercial Properties", "High-Value Claims", "Trust & Estate Recovery"],
    bio: "Handles both residential and commercial surplus fund claims across the Pacific Northwest and Mountain states. CPA background brings financial analysis skills to complex claims. Averages $47,000 per recovered claim with a focus on commercial and trust-held properties.",
    memberSince: "2019",
    languages: ["English", "Mandarin"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/david-chen.mp3",
  },
  {
    id: "am-006",
    name: "Angela M.",
    avatarUrl: "/avatars/angela-morrison.jpg",
    title: "Estate Recovery Consultant",
    rating: 4.9,
    reviewCount: 278,
    completedDeals: 345,
    successRate: 95,
    responseTime: "< 10 min",
    feePercent: 10,
    avgRecovery: "$41,700",
    jurisdictions: ["Virginia", "North Carolina", "Maryland", "West Virginia", "Kentucky"],
    specialties: ["Estate Claims", "Heir Recovery", "Probate Surplus"],
    bio: "Specializes in the most challenging segment of surplus recovery: claims involving deceased owners and heir identification. Former probate paralegal with 10 years in foreclosure surplus. Maintains relationships with genealogical researchers for heir location services.",
    memberSince: "2018",
    languages: ["English"],
    availability: "busy",
    voiceSampleUrl: "/voice-samples/angela-morrison.mp3",
  },
  {
    id: "sm-007",
    name: "Sarah M.",
    avatarUrl: "/avatars/sarah-mitchell.jpg",
    title: "Residential Recovery Closer",
    rating: 4.8,
    reviewCount: 167,
    completedDeals: 215,
    successRate: 90,
    responseTime: "< 20 min",
    feePercent: 10,
    avgRecovery: "$28,400",
    jurisdictions: ["Louisiana", "Mississippi", "Arkansas", "Oklahoma"],
    specialties: ["Tax Sale Overages", "Residential Properties", "First-Time Homeowners"],
    bio: "7 years focused on residential surplus fund recovery in the Deep South. Empathetic approach that resonates with first-time homeowners who lost their homes. Consistently converts warm leads into signed contracts within 48 hours of first contact.",
    memberSince: "2021",
    languages: ["English"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/sarah-mitchell.mp3",
  },
  {
    id: "cm-008",
    name: "Carlos M.",
    avatarUrl: "/avatars/carlos-mendez.jpg",
    title: "Bilingual Recovery Agent",
    rating: 4.9,
    reviewCount: 221,
    completedDeals: 289,
    successRate: 93,
    responseTime: "< 15 min",
    feePercent: 10,
    avgRecovery: "$35,800",
    jurisdictions: ["Florida", "Texas", "California", "New Mexico", "Arizona"],
    specialties: ["Bilingual Closing", "HOA Foreclosures", "Condo Surplus"],
    bio: "Native Spanish speaker covering the largest Hispanic markets in the US. Former mortgage loan officer with 9 years in the lending industry before transitioning to surplus fund recovery. Expert at explaining complex legal processes in both languages and building trust quickly.",
    memberSince: "2020",
    languages: ["English", "Spanish", "Portuguese"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/carlos-mendez.mp3",
  },
  {
    id: "nf-009",
    name: "Nicole F.",
    avatarUrl: "/avatars/nicole-foster.jpg",
    title: "High-Value Claims Closer",
    rating: 4.8,
    reviewCount: 198,
    completedDeals: 234,
    successRate: 91,
    responseTime: "< 10 min",
    feePercent: 10,
    avgRecovery: "$56,200",
    jurisdictions: ["Maryland", "Virginia", "Delaware", "District of Columbia"],
    specialties: ["High-Value Claims", "Government Properties", "Military Families"],
    bio: "Focused on the DC metro area where property values and surplus amounts are above the national average. 8 years of experience with a focus on military families and government employees. Handles claims above $50,000 with meticulous documentation and follow-through.",
    memberSince: "2019",
    languages: ["English", "French"],
    availability: "busy",
    voiceSampleUrl: "/voice-samples/nicole-foster.mp3",
  },
]

interface CallRecord {
  id: string
  closerId: string
  leadName: string
  date: string
  duration: string
  outcome: "signed" | "callback" | "no-answer" | "declined"
  hasTranscript: boolean
  hasAudio: boolean
}

const mockCallRecords: CallRecord[] = [
  { id: "c1", closerId: "mt-001", leadName: "John Smith", date: "2026-01-31", duration: "14:32", outcome: "signed", hasTranscript: true, hasAudio: true },
  { id: "c2", closerId: "mt-001", leadName: "Maria Garcia", date: "2026-01-30", duration: "8:47", outcome: "callback", hasTranscript: true, hasAudio: true },
  { id: "c3", closerId: "dr-002", leadName: "Robert Johnson", date: "2026-01-31", duration: "22:15", outcome: "signed", hasTranscript: true, hasAudio: true },
  { id: "c4", closerId: "jp-003", leadName: "Sarah Williams", date: "2026-01-29", duration: "6:10", outcome: "no-answer", hasTranscript: false, hasAudio: true },
  { id: "c5", closerId: "kw-004", leadName: "Michael Brown", date: "2026-01-31", duration: "18:55", outcome: "signed", hasTranscript: true, hasAudio: true },
  { id: "c6", closerId: "am-006", leadName: "Emily Davis", date: "2026-01-30", duration: "11:20", outcome: "declined", hasTranscript: true, hasAudio: true },
]

export default function HireCloserPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCloser, setSelectedCloser] = useState<CloserProfile | null>(null)
  const [showCallLog, setShowCallLog] = useState(true)
  const [showCallLogAlert, setShowCallLogAlert] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [showOOContract, setShowOOContract] = useState(false)
  const [showAdminAlert, setShowAdminAlert] = useState(false)
  const [forwardNumber, setForwardNumber] = useState("")
  const [expandedReviews, setExpandedReviews] = useState<string | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggleVoiceSample = (closerId: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (playingVoice === closerId) {
      audioRef.current?.pause()
      setPlayingVoice(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(url)
      audio.onended = () => setPlayingVoice(null)
      audio.play()
      audioRef.current = audio
      setPlayingVoice(closerId)
    }
  }

  const filteredClosers = closers.filter((closer) => {
    const q = searchQuery.toLowerCase()
    return (
      closer.name.toLowerCase().includes(q) ||
      closer.title.toLowerCase().includes(q) ||
      closer.jurisdictions.some((j) => j.toLowerCase().includes(q)) ||
      closer.specialties.some((s) => s.toLowerCase().includes(q))
    )
  })

  const availabilityColors = {
    available: "bg-green-500",
    busy: "bg-yellow-500",
    offline: "bg-gray-400",
  }

  const availabilityLabels = {
    available: "Available Now",
    busy: "On a Call",
    offline: "Offline",
  }

  const outcomeColors = {
    signed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    callback: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "no-answer": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  }

  const renderStars = (rating: number) => {
    const full = Math.floor(rating)
    const hasHalf = rating - full >= 0.5
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < full
                ? "fill-amber-400 text-amber-400"
                : i === full && hasHalf
                  ? "fill-amber-400/50 text-amber-400"
                  : "fill-none text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    )
  }

  // PIN-gated access for action buttons (voice samples, contact, forwarding)
  const [pinUnlocked, setPinUnlocked] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""])
  const [pinError, setPinError] = useState("")
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const VALID_PINS = ["891691", "374829", "638271", "452026", "100045", "777888"]

  const requirePin = useCallback((action: () => void) => {
    if (pinUnlocked) {
      action()
      return
    }
    setPendingAction(() => action)
    setPinDigits(["", "", "", "", "", ""])
    setPinError("")
    setShowPinModal(true)
    setTimeout(() => pinInputRefs.current[0]?.focus(), 100)
  }, [pinUnlocked])

  const handlePinDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return

    const next = [...pinDigits]
    next[index] = value
    setPinDigits(next)
    setPinError("")

    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus()
    }

    if (value && index === 5) {
      const fullPin = next.join("")
      if (fullPin.length === 6) {
        if (VALID_PINS.includes(fullPin)) {
          setPinUnlocked(true)
          setShowPinModal(false)
          if (pendingAction) {
            setTimeout(() => pendingAction(), 50)
            setPendingAction(null)
          }
        } else {
          setPinError("Invalid PIN. Access denied.")
          setPinDigits(["", "", "", "", "", ""])
          setTimeout(() => pinInputRefs.current[0]?.focus(), 100)
        }
      }
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus()
    }
    if (e.key === "Escape") {
      setShowPinModal(false)
      setPendingAction(null)
    }
  }

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const next = ["", "", "", "", "", ""]
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    setPinDigits(next)
    if (pasted.length === 6) {
      if (VALID_PINS.includes(pasted)) {
        setPinUnlocked(true)
        setShowPinModal(false)
        if (pendingAction) {
          setTimeout(() => pendingAction(), 50)
          setPendingAction(null)
        }
      } else {
        setPinError("Invalid PIN. Access denied.")
        setPinDigits(["", "", "", "", "", ""])
        setTimeout(() => pinInputRefs.current[0]?.focus(), 100)
      }
    } else {
      pinInputRefs.current[pasted.length]?.focus()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hire a Closer</h1>
          <p className="text-muted-foreground">
            Vetted asset recovery agents ready to close your leads on recorded lines
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a href="/documents/FRI-Closer-Agreement.docx" download>
            <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950">
              <Download className="h-4 w-4 mr-1.5" />
              FRI Closer Agreement
            </Button>
          </a>
          <a href="/documents/Owner-Operator-Closer-Agreement.docx" download>
            <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950">
              <Download className="h-4 w-4 mr-1.5" />
              Owner Operator Closer Agreement
            </Button>
          </a>
          <Badge variant="outline" className="bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-300 w-fit">
            <Award className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            {closers.length} Verified Agents
          </Badge>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5 border">
        <Shield className="h-4 w-4 shrink-0" />
        <span>Agent last names are abbreviated to protect their privacy. Full identity is disclosed after hiring.</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, specialty, or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            How to Hire a Closer
          </CardTitle>
          <CardDescription>
            Follow these four steps to get a closer assigned to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold">1</span>
                <h4 className="font-medium text-sm">Review & Select</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Browse the closers below and find one you'd like to hire. Enter your 6-digit PIN when you click on a closer to listen to their voice sample and view their full profile.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold">2</span>
                <h4 className="font-medium text-sm">Notify Your Admin</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Let your administrator know your closer selection by emailing the closer's first name to{" "}
                <a href="mailto:claim@usforeclosurerecovery.com" className="text-blue-600 hover:underline font-medium">claim@usforeclosurerecovery.com</a>.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-500 text-white text-sm font-bold">3</span>
                <h4 className="font-medium text-sm">Sign the Agreement</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Download the Owner Operator Agreement from the top of this page. Print it, sign the signature page, and text a photo of it to{" "}
                <a href="sms:+17252877791" className="text-purple-600 hover:underline font-medium">(725) 287-7791</a>.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold">4</span>
                <h4 className="font-medium text-sm">Access Call Logs</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Once your closer is assigned, view full transcripts, download audio recordings from every conversation, and review case notes in the Call Log section below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Closers</CardDescription>
            <CardTitle className="text-3xl">{closers.filter((c) => c.availability === "available").length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Success Rate</CardDescription>
            <CardTitle className="text-3xl">
              {Math.round(closers.reduce((sum, c) => sum + c.successRate, 0) / closers.length)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Deals Closed</CardDescription>
            <CardTitle className="text-3xl">
              {closers.reduce((sum, c) => sum + c.completedDeals, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Rating</CardDescription>
            <CardTitle className="text-3xl">
              {(closers.reduce((sum, c) => sum + c.rating, 0) / closers.length).toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Fee Structure Banner */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40">
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Transparent Fee Structure
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Closers earn <strong className="text-foreground">10% of your service fee</strong> on each recovery.
                Contract administration can be farmed out for an additional <strong className="text-foreground">5%</strong>. Attorney fees are billed separately.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">Example: $100K recovery at 30% fee</p>
              <p className="text-sm"><span className="text-muted-foreground">Closer:</span> <strong>$3,000</strong> &middot; <span className="text-muted-foreground">Admin:</span> <strong>$1,500</strong> &middot; <span className="text-muted-foreground">You keep:</span> <strong className="text-emerald-600">$25,500</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredClosers.map((closer) => (
          <Card
            key={closer.id}
            className="overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
            onClick={() => setSelectedCloser(closer)}
          >
            <CardContent className="p-0">
              {/* Profile Header */}
              <div className="p-5 pb-4">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={closer.avatarUrl}
                      alt={closer.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-md"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${availabilityColors[closer.availability]}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-base truncate">{closer.name}</h3>
                        <p className="text-xs text-muted-foreground">{closer.title}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          closer.availability === "available"
                            ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-700 shrink-0 text-[10px]"
                            : closer.availability === "busy"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-700 shrink-0 text-[10px]"
                              : "shrink-0 text-[10px]"
                        }
                      >
                        {availabilityLabels[closer.availability]}
                      </Badge>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {renderStars(closer.rating)}
                      <span className="text-sm font-semibold">{closer.rating}</span>
                      <span className="text-xs text-muted-foreground">({closer.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-3 border-y bg-muted/30">
                <div className="p-3 text-center border-r">
                  <p className="text-lg font-bold">{closer.completedDeals}</p>
                  <p className="text-[10px] text-muted-foreground">Deals Closed</p>
                </div>
                <div className="p-3 text-center border-r">
                  <p className="text-lg font-bold">{closer.successRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Success Rate</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-lg font-bold">{closer.feePercent}%</p>
                  <p className="text-[10px] text-muted-foreground">of Service Fee</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 pt-4 space-y-3">
                {/* Jurisdictions */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {closer.jurisdictions.slice(0, 3).map((j) => (
                      <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {j}
                      </Badge>
                    ))}
                    {closer.jurisdictions.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        +{closer.jurisdictions.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {closer.specialties.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Response Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Avg. response: {closer.responseTime}</span>
                </div>

                {/* Voice Sample - PIN gated */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    requirePin(() => toggleVoiceSample(closer.id, closer.voiceSampleUrl, e))
                  }}
                >
                  {playingVoice === closer.id ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Playing Voice Sample...
                    </>
                  ) : (
                    <>
                      {pinUnlocked ? (
                        <Volume2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2 text-amber-500" />
                      )}
                      Listen to Voice Sample
                    </>
                  )}
                </Button>

                {/* View Profile CTA */}
                <Button
                  className="w-full"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedCloser(closer)
                  }}
                >
                  <PhoneForwarded className="h-4 w-4 mr-2" />
                  View Profile & Hire {closer.name.split(" ")[0]}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClosers.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No agents found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Call Log Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowCallLog(!showCallLog)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Call Log & Recordings
              </CardTitle>
              <CardDescription>Review all recorded calls, transcripts, and agent performance</CardDescription>
            </div>
            {showCallLog ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </CardHeader>
        {showCallLog && (
          <CardContent>
            <div className="space-y-3">
              {mockCallRecords.map((record) => {
                const agent = closers.find((c) => c.id === record.closerId)
                return (
                  <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      {agent && (
                        <img src={agent.avatarUrl} alt={agent.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{record.leadName}</p>
                        <p className="text-xs text-muted-foreground">
                          Closer: {agent?.name || "Unknown"} -- {record.date} -- {record.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={outcomeColors[record.outcome]}>
                        {record.outcome === "signed" ? "Signed" : record.outcome === "callback" ? "Callback" : record.outcome === "no-answer" ? "No Answer" : "Declined"}
                      </Badge>
                      {record.hasAudio && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowCallLogAlert(true)}>
                          <Play className="h-3 w-3" />
                          Audio
                        </Button>
                      )}
                      {record.hasTranscript && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowCallLogAlert(true)}>
                          <FileText className="h-3 w-3" />
                          Transcript
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowCallLogAlert(true)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <strong className="text-foreground">Jurisdiction-based training:</strong> Filter calls by state to review how closers handle
              jurisdiction-specific regulations. Use recorded calls to build training material and provide feedback on compliance,
              pitch quality, and objection handling.
            </div>
          </CardContent>
        )}
      </Card>

      {/* PIN Access Modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setShowPinModal(false); setPendingAction(null) }}
        >
          <div
            className="bg-background border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-6 sm:p-8 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-5">
              {/* Drag handle for mobile */}
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto sm:hidden" />

              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>

              <div>
                <h2 className="text-lg font-bold">Enter Your 6-Digit PIN</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Closer access is restricted to vetted agents and{" "}
                  <span className="font-semibold text-foreground">45 Points of Compliance</span> clients.
                </p>
              </div>

              {/* 6-Digit PIN Input */}
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePinPaste}>
                {pinDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { pinInputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold rounded-lg border-2 border-muted bg-muted/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-colors"
                    autoComplete="off"
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-sm text-red-500 font-medium">{pinError}</p>
              )}

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">How to get a PIN:</p>
                <div className="space-y-2 text-left">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Vetted Agent Program</p>
                      <p className="text-[10px] text-muted-foreground">Background check + compliance training</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gradient-to-r from-emerald-600/10 to-green-500/10 border border-emerald-500/20">
                    <Award className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">45 Points of Compliance</p>
                      <p className="text-[10px] text-muted-foreground">Full asset recovery business with closer access included.</p>
                      <a
                        href="https://assetrecoverybusiness.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-500"
                      >
                        Learn More <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => { setShowPinModal(false); setPendingAction(null) }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Closer Agreement Contract Modal */}
      {showContract && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowContract(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Independent Closer Agreement</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const printContent = document.getElementById("closer-contract-print")
                    if (!printContent) return
                    const win = window.open("", "_blank")
                    if (!win) return
                    win.document.write(`<!DOCTYPE html><html><head><title>Closer Agreement - Foreclosure Recovery Inc.</title><style>
                      @page { margin: 1in; size: letter; }
                      body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #111; }
                      h1 { font-size: 18pt; text-align: center; margin-bottom: 4pt; }
                      h2 { font-size: 14pt; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
                      h3 { font-size: 12pt; margin-top: 12pt; }
                      .center { text-align: center; }
                      .sig-line { border-bottom: 1px solid #000; width: 280px; display: inline-block; margin-bottom: 4pt; }
                      .sig-block { margin-top: 40px; }
                      .sig-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
                      .sig-col { width: 45%; }
                      .indent { margin-left: 24px; }
                      .page-break { page-break-before: always; }
                      ol { margin-left: 0; padding-left: 20px; }
                      ol li { margin-bottom: 8px; }
                      ul { margin-left: 20px; }
                      ul li { margin-bottom: 4px; }
                      .header-block { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
                      .header-block img { height: 50px; margin-bottom: 8px; }
                      .footer-note { font-size: 9pt; color: #666; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 8px; }
                    </style></head><body>` + printContent.innerHTML + `</body></html>`)
                    win.document.close()
                    win.print()
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Print / Save PDF
                </Button>
                <button onClick={() => setShowContract(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Contract Content */}
            <div id="closer-contract-print" className="px-8 py-6 text-gray-800 text-sm leading-relaxed" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>

              <div className="text-center mb-6 border-b-2 border-[#1e3a5f] pb-4">
                <img src="/us-foreclosure-leads-logo.png" alt="Foreclosure Recovery Inc." className="h-12 mx-auto mb-2" />
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">INDEPENDENT CLOSER SERVICES AGREEMENT</h1>
                <p className="text-xs text-gray-500 mt-1">Foreclosure Recovery Inc. -- 30 N Gould St, Ste R, Sheridan, WY 82801 -- (888) 545-8007</p>
              </div>

              <p className="mb-4">
                This Independent Closer Services Agreement (&quot;Agreement&quot;) is entered into as of the date of last signature below
                (&quot;Effective Date&quot;), by and between:
              </p>

              <p className="mb-2"><strong>Foreclosure Recovery Inc.</strong>, a Wyoming corporation, with its principal office located at
                30 N Gould St, Ste R, Sheridan, WY 82801 (hereinafter referred to as &quot;Company&quot;), and</p>

              <p className="mb-4"><strong>____________________________</strong> (&quot;Closer&quot;), an independent contractor operating
                under the Owner Operator Program, with a principal address at <strong>____________________________</strong>.</p>

              <p className="mb-6">Company and Closer are collectively referred to herein as the &quot;Parties&quot; and individually as a &quot;Party.&quot;</p>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE I -- RECITALS</h2>

              <p className="mb-2">WHEREAS, Company operates a foreclosure surplus fund recovery platform that identifies, processes, and recovers
                unclaimed surplus funds on behalf of former property owners following foreclosure sales; and</p>
              <p className="mb-2">WHEREAS, Closer is a qualified, vetted asset recovery professional who has been approved through Company&apos;s
                compliance screening process and desires to provide closing services for leads assigned through the platform; and</p>
              <p className="mb-4">WHEREAS, the Parties wish to establish the terms and conditions under which Closer will provide services
                to facilitate the recovery of surplus funds from state-held accounts on behalf of claimants.</p>
              <p className="mb-6">NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the Parties agree as follows:</p>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE II -- SCOPE OF SERVICES</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Lead Assignment.</strong> Company shall assign leads to Closer through the platform dashboard. Each lead represents
                  a potential claimant with surplus funds held by a state entity following a foreclosure sale.</li>
                <li><strong>Closer Responsibilities.</strong> Closer shall:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Contact assigned leads promptly via telephone, email, or other approved outreach methods;</li>
                    <li>Explain the surplus fund recovery process clearly and accurately to potential claimants;</li>
                    <li>Obtain executed contingency fee agreements from willing claimants;</li>
                    <li>Coordinate with Company on all documentation, filings, and claim submissions;</li>
                    <li>Maintain detailed records of all communications and outreach attempts;</li>
                    <li>Comply with all applicable federal, state, and local laws governing surplus fund recovery.</li>
                  </ul>
                </li>
                <li><strong>Recorded Lines.</strong> All telephone communications with leads shall be conducted on Company&apos;s recorded
                  line system. Closer acknowledges and consents to the recording of all calls for quality assurance, compliance monitoring,
                  and training purposes. Both parties to each call shall be notified of the recording at the start of the conversation.</li>
                <li><strong>Exclusivity of Leads.</strong> Leads assigned to Closer are exclusive to that Closer. Closer shall not share,
                  transfer, sell, or reassign leads to any third party without prior written consent from Company.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE III -- COMPENSATION</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Closer Fee.</strong> Closer shall receive a fee equal to <strong>ten percent (10%)</strong> of the total gross
                  amount recovered on each successfully closed claim. This fee is calculated on the total funds disbursed from the
                  state-held account to the claimant, before deduction of any service fees, attorney fees, or incidental expenses.</li>
                <li><strong>Payment Terms.</strong> Closer fees shall be paid within fifteen (15) business days of Company&apos;s receipt
                  of recovered funds from the state entity. Payment shall be made via direct deposit or company check, at Company&apos;s
                  discretion.</li>
                <li><strong>No Advance Payments.</strong> Closer shall not receive any advance payments, draws, or guaranteed minimums.
                  Compensation is strictly contingency-based and payable only upon successful recovery of funds.</li>
                <li><strong>Fee Disputes.</strong> Any dispute regarding fee calculation shall be resolved by reference to the state
                  disbursement records and Company&apos;s internal accounting. Company&apos;s records shall be considered authoritative
                  absent manifest error.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE IV -- EXPENSES AND INCIDENTAL COSTS</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Closer-Borne Expenses.</strong> Closer shall be solely responsible for the payment of all incidental costs and
                  expenses associated with the finalization and collection of each individual claimant&apos;s recovery, including but not
                  limited to:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li><strong>Attorney fees</strong> -- including but not limited to filing fees, motion preparation, court appearances, and legal consultation required for claim processing;</li>
                    <li><strong>Notary fees</strong> -- for notarization of affidavits, powers of attorney, and other required legal documents;</li>
                    <li><strong>Federal Express and courier fees</strong> -- for overnight or expedited delivery of time-sensitive documents to courts, state agencies, or claimants;</li>
                    <li><strong>Certified mail fees</strong> -- for all correspondence requiring proof of delivery, including USPS certified mail with return receipt requested;</li>
                    <li><strong>Court filing fees</strong> -- for motions, petitions, or other documents filed with any court of competent jurisdiction;</li>
                    <li><strong>Title search and document retrieval fees</strong> -- for obtaining property records, deed chains, or other supporting documentation;</li>
                    <li><strong>Skip tracing and location services</strong> -- if additional location efforts beyond Company-provided data are required;</li>
                    <li><strong>Any other incidental fees</strong> -- directly associated with the processing, finalization, and collection of a single claimant&apos;s surplus fund recovery.</li>
                  </ul>
                </li>
                <li><strong>No Reimbursement.</strong> Company shall not reimburse Closer for any expenses described in this Article.
                  All costs are the sole financial responsibility of Closer and are expected to be managed within the 10% fee structure.</li>
                <li><strong>Expense Records.</strong> Closer shall maintain receipts and records of all expenses incurred per claim for
                  a minimum of three (3) years and shall make such records available to Company upon reasonable request.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE V -- INDEPENDENT CONTRACTOR STATUS</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Independent Contractor.</strong> Closer is an independent contractor and not an employee, partner, agent, or
                  joint venturer of Company. Nothing in this Agreement shall be construed to create an employer-employee relationship.</li>
                <li><strong>Taxes and Benefits.</strong> Closer is solely responsible for all federal, state, and local taxes, including
                  self-employment taxes. Company will issue a Form 1099-NEC for all compensation exceeding $600 in any calendar year.
                  Closer is not entitled to any employee benefits, including health insurance, retirement plans, or workers&apos; compensation.</li>
                <li><strong>Tools and Equipment.</strong> Closer shall provide their own telephone, computer, internet access, and any
                  other tools or equipment necessary to perform services under this Agreement.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE VI -- CONFIDENTIALITY AND DATA PROTECTION</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Confidential Information.</strong> Closer shall maintain strict confidentiality of all lead data, claimant
                  personal information, Company trade secrets, proprietary processes, fee structures, client lists, and any other
                  information obtained through the platform or this engagement.</li>
                <li><strong>Non-Disclosure.</strong> Closer shall not disclose, publish, or disseminate Confidential Information to any
                  third party without prior written consent from Company, except as required by law or court order.</li>
                <li><strong>Data Handling.</strong> Closer shall handle all personally identifiable information (PII) in compliance with
                  applicable data protection laws, including but not limited to the Gramm-Leach-Bliley Act (GLBA), state privacy statutes,
                  and the Telephone Consumer Protection Act (TCPA).</li>
                <li><strong>Return of Materials.</strong> Upon termination of this Agreement, Closer shall immediately return or destroy
                  all Confidential Information, lead data, and Company materials in their possession.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE VII -- COMPLIANCE AND CONDUCT</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Legal Compliance.</strong> Closer shall comply with all applicable federal, state, and local laws, regulations,
                  and ordinances, including but not limited to the TCPA, Fair Debt Collection Practices Act (FDCPA), Do Not Call (DNC)
                  regulations, and state-specific foreclosure consultant statutes.</li>
                <li><strong>Professional Conduct.</strong> Closer shall conduct all interactions with claimants in a professional, honest,
                  and ethical manner. Misleading, deceptive, or high-pressure tactics are strictly prohibited and shall constitute grounds
                  for immediate termination.</li>
                <li><strong>Prohibited Activities.</strong> Closer shall not:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Collect any fees directly from claimants;</li>
                    <li>Make guarantees regarding recovery amounts or timelines;</li>
                    <li>Provide legal advice or represent themselves as an attorney (unless separately licensed);</li>
                    <li>Contact leads on the Do Not Call registry without prior DNC clearance from Company;</li>
                    <li>Use Company&apos;s name, logo, or branding in any unauthorized manner.</li>
                  </ul>
                </li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE VIII -- TERM AND TERMINATION</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Term.</strong> This Agreement shall commence on the Effective Date and continue for an initial term of twelve (12)
                  months, after which it shall automatically renew for successive twelve-month periods unless terminated by either Party.</li>
                <li><strong>Termination for Convenience.</strong> Either Party may terminate this Agreement at any time by providing thirty (30)
                  days&apos; written notice to the other Party.</li>
                <li><strong>Termination for Cause.</strong> Company may terminate this Agreement immediately, without notice, upon:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Closer&apos;s breach of any material term of this Agreement;</li>
                    <li>Closer&apos;s violation of applicable law or regulation;</li>
                    <li>Closer&apos;s engagement in fraud, dishonesty, or gross misconduct;</li>
                    <li>Closer&apos;s failure to meet minimum performance standards as communicated by Company.</li>
                  </ul>
                </li>
                <li><strong>Effect of Termination.</strong> Upon termination, Closer shall be entitled to fees for claims successfully
                  closed prior to termination that result in fund recovery. All pending leads shall revert to Company for reassignment.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE IX -- INDEMNIFICATION AND LIABILITY</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Indemnification.</strong> Closer shall indemnify, defend, and hold harmless Company, its officers, directors,
                  employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including
                  reasonable attorneys&apos; fees) arising out of or related to Closer&apos;s performance of services under this Agreement,
                  including but not limited to violations of law, negligence, or unauthorized representations.</li>
                <li><strong>Limitation of Liability.</strong> In no event shall Company&apos;s total liability under this Agreement exceed
                  the total fees paid to Closer in the twelve (12) months preceding the claim.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE X -- DISPUTE RESOLUTION</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Governing Law.</strong> This Agreement shall be governed by and construed in accordance with the laws of the
                  State of Wyoming, without regard to its conflicts of law provisions.</li>
                <li><strong>Mediation.</strong> Any dispute arising under this Agreement shall first be submitted to good-faith mediation
                  before a mutually agreed-upon mediator in Sheridan County, Wyoming.</li>
                <li><strong>Arbitration.</strong> If mediation is unsuccessful, the dispute shall be submitted to binding arbitration under
                  the rules of the American Arbitration Association, with the arbitration to take place in Sheridan County, Wyoming.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE XI -- GENERAL PROVISIONS</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Entire Agreement.</strong> This Agreement constitutes the entire agreement between the Parties and supersedes
                  all prior negotiations, representations, and agreements, whether written or oral.</li>
                <li><strong>Amendments.</strong> No amendment or modification of this Agreement shall be valid unless made in writing and
                  signed by both Parties.</li>
                <li><strong>Severability.</strong> If any provision of this Agreement is held to be invalid or unenforceable, the remaining
                  provisions shall continue in full force and effect.</li>
                <li><strong>Waiver.</strong> The failure of either Party to enforce any provision of this Agreement shall not constitute a
                  waiver of that Party&apos;s right to enforce that or any other provision in the future.</li>
                <li><strong>Assignment.</strong> Closer may not assign or transfer this Agreement or any rights or obligations hereunder
                  without the prior written consent of Company.</li>
                <li><strong>Notices.</strong> All notices shall be in writing and delivered to the addresses set forth above, or to such
                  other address as a Party may designate in writing.</li>
              </ol>

              {/* Signature Page */}
              <div style={{ pageBreakBefore: "always" }} className="mt-10 pt-6 border-t-2 border-[#1e3a5f]">
                <div className="text-center mb-8">
                  <h2 className="text-base font-bold text-gray-900">SIGNATURE PAGE</h2>
                  <p className="text-xs text-gray-500 mt-1">Independent Closer Services Agreement -- Foreclosure Recovery Inc.</p>
                </div>

                <p className="mb-8">
                  IN WITNESS WHEREOF, the Parties have executed this Independent Closer Services Agreement as of the date last written below.
                </p>

                <div className="grid grid-cols-2 gap-12 mt-10">
                  {/* Company */}
                  <div className="space-y-6">
                    <p className="font-bold text-sm">COMPANY:</p>
                    <p className="font-bold">Foreclosure Recovery Inc.</p>

                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Printed Name</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Title</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Date</p>
                    </div>
                  </div>

                  {/* Closer */}
                  <div className="space-y-6">
                    <p className="font-bold text-sm">CLOSER (Independent Contractor):</p>
                    <p className="font-bold">____________________________</p>

                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Printed Name</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Title / Company (if applicable)</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Date</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-4 border-t border-gray-300 text-center">
                  <p className="text-[10px] text-gray-400">
                    Foreclosure Recovery Inc. -- 30 N Gould St, Ste R, Sheridan, WY 82801 -- (888) 545-8007 --
                    This document is confidential and intended solely for the parties named above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Operator Closer Agreement Modal */}
      {showOOContract && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOOContract(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Owner Operator -- Closer Agreement</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById("oo-contract-print")
                    if (!el) return
                    const win = window.open("", "_blank")
                    if (!win) return
                    win.document.write(`<!DOCTYPE html><html><head><title>Owner Operator Closer Agreement</title><style>
                      @page { margin: 1in; size: letter; }
                      body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #111; }
                      h1 { font-size: 18pt; text-align: center; margin-bottom: 4pt; }
                      h2 { font-size: 14pt; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
                      .center { text-align: center; }
                      .sig-line { border-bottom: 1px solid #000; width: 280px; display: inline-block; }
                      ol { margin-left: 0; padding-left: 20px; }
                      ol li { margin-bottom: 8px; }
                      ul { margin-left: 20px; }
                      ul li { margin-bottom: 4px; }
                      .header-block { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
                      .footer-note { font-size: 9pt; color: #666; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 8px; }
                      .page-break { page-break-before: always; }
                    </style></head><body>` + el.innerHTML + `</body></html>`)
                    win.document.close()
                    win.print()
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Print / Save PDF
                </Button>
                <button onClick={() => setShowOOContract(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div id="oo-contract-print" className="px-8 py-6 text-gray-800 text-sm leading-relaxed" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>

              <div className="text-center mb-6 border-b-2 border-[#1e3a5f] pb-4">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">OWNER OPERATOR -- INDEPENDENT CLOSER SERVICES AGREEMENT</h1>
                <p className="text-xs text-gray-500 mt-1">Facilitated through the Foreclosure Recovery Inc. Platform</p>
              </div>

              <p className="mb-4">
                This Owner Operator -- Independent Closer Services Agreement (&quot;Agreement&quot;) is entered into as of the date
                of last signature below (&quot;Effective Date&quot;), by and between:
              </p>

              <p className="mb-2"><strong>____________________________</strong> (&quot;Owner Operator&quot;), a
                <strong> ____________________________</strong> [LLC / Corporation / Sole Proprietorship], organized under the laws of
                the State of <strong>____________________________</strong>, with its principal office located at
                <strong> ____________________________</strong>, and operating as a licensed participant in the Foreclosure Recovery Inc.
                Owner Operator Program; and</p>

              <p className="mb-4"><strong>____________________________</strong> (&quot;Closer&quot;), an independent contractor
                with a principal address at <strong>____________________________</strong>.</p>

              <p className="mb-6">Owner Operator and Closer are collectively referred to herein as the &quot;Parties&quot; and individually as a &quot;Party.&quot;</p>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE I -- RECITALS AND PURPOSE</h2>

              <p className="mb-2">WHEREAS, Owner Operator maintains an independent asset recovery business that identifies, processes,
                and recovers unclaimed surplus funds on behalf of former property owners following foreclosure sales; and</p>
              <p className="mb-2">WHEREAS, Owner Operator operates under the Foreclosure Recovery Inc. Owner Operator Program, which
                provides platform access, lead data, compliance infrastructure, and operational support; and</p>
              <p className="mb-2">WHEREAS, Closer is a qualified asset recovery professional who has been vetted and approved through
                the platform&apos;s compliance screening process; and</p>
              <p className="mb-4">WHEREAS, Owner Operator desires to engage Closer to provide lead closing services on Owner Operator&apos;s
                behalf, and Closer desires to provide such services under the terms set forth herein.</p>
              <p className="mb-6">NOW, THEREFORE, in consideration of the mutual covenants herein, the Parties agree as follows:</p>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE II -- SCOPE OF SERVICES</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Engagement.</strong> Owner Operator engages Closer as an independent contractor to contact, qualify, and close
                  surplus fund recovery leads assigned by Owner Operator through the platform dashboard.</li>
                <li><strong>Closer Duties.</strong> Closer shall:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Contact assigned leads promptly via telephone, email, or other approved outreach methods;</li>
                    <li>Clearly and accurately explain the surplus fund recovery process to potential claimants;</li>
                    <li>Obtain fully executed contingency fee agreements from willing claimants using Owner Operator&apos;s approved forms;</li>
                    <li>Coordinate with Owner Operator on all documentation, court filings, and claim submissions;</li>
                    <li>Maintain detailed records of all communications, outreach attempts, and claimant interactions;</li>
                    <li>Comply with all federal, state, and local laws governing surplus fund recovery and consumer outreach.</li>
                  </ul>
                </li>
                <li><strong>Recorded Lines.</strong> All telephone communications with leads shall be conducted on recorded lines provided
                  through the platform. Closer acknowledges and consents to recording of all calls. Both parties to each call shall be
                  notified of the recording at the start of the conversation.</li>
                <li><strong>Lead Exclusivity.</strong> Leads assigned to Closer by Owner Operator are exclusive to that Closer for the
                  duration of the assignment. Closer shall not share, transfer, sell, or reassign leads to any third party. Closer shall
                  not solicit or contact leads obtained through this engagement for any purpose outside this Agreement.</li>
                <li><strong>Owner Operator Authority.</strong> Closer acknowledges that Owner Operator retains full authority over lead
                  assignment, case strategy, client relationships, and all final decisions regarding claim filing and recovery. Closer
                  acts solely in a closing capacity and does not independently manage claims.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE III -- COMPENSATION</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Closer Fee.</strong> Closer shall receive a fee equal to <strong>ten percent (10%)</strong> of the total gross
                  amount recovered on each claim successfully closed by Closer. The fee is calculated on the total surplus funds disbursed
                  from the state-held account, before deduction of Owner Operator&apos;s service fee, attorney fees, or any incidental expenses.</li>
                <li><strong>Payment Terms.</strong> Closer fees shall be paid within fifteen (15) business days of Owner Operator&apos;s
                  receipt of recovered funds from the state entity. Payment shall be made via direct deposit, wire transfer, or company check
                  at Owner Operator&apos;s discretion.</li>
                <li><strong>Contingency Basis.</strong> Compensation is strictly contingency-based. Closer shall not receive any advance
                  payments, retainers, draws, salary, hourly wages, or guaranteed minimums. Payment is due only upon successful recovery
                  and receipt of funds.</li>
                <li><strong>Multiple Closers.</strong> Owner Operator may engage multiple closers simultaneously. Each closer&apos;s fee is
                  tied exclusively to claims they personally close. No closer is entitled to fees on claims closed by another closer or by
                  Owner Operator directly.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE IV -- EXPENSES AND INCIDENTAL COSTS</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Closer-Borne Expenses.</strong> Closer shall be solely responsible for the payment of all costs and expenses
                  associated with the finalization and collection of each individual claimant&apos;s recovery funds, including but not
                  limited to:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li><strong>Attorney fees</strong> -- all legal costs including filing fees, motion preparation, court appearances,
                      hearings, legal research, and attorney consultation required for claim processing in any jurisdiction;</li>
                    <li><strong>Notary fees</strong> -- notarization of affidavits, powers of attorney, assignments, and all other
                      documents requiring notarial acknowledgment;</li>
                    <li><strong>Federal Express and courier fees</strong> -- overnight, priority, and expedited delivery of time-sensitive
                      documents to courts, state agencies, attorneys, or claimants;</li>
                    <li><strong>Certified mail fees</strong> -- all correspondence requiring proof of delivery via USPS certified mail
                      with return receipt requested, including statutory notices and demand letters;</li>
                    <li><strong>Court filing fees</strong> -- fees for filing motions, petitions, claims, or other documents with any
                      court of competent jurisdiction;</li>
                    <li><strong>Title search and document retrieval fees</strong> -- costs for obtaining property records, deed chains,
                      lien searches, mortgage payoff statements, or other supporting documentation from county recorders or title companies;</li>
                    <li><strong>Process server fees</strong> -- costs for service of process when required by court rules or statute;</li>
                    <li><strong>Printing, copying, and document preparation costs</strong> -- all costs related to producing claim packages,
                      supporting exhibits, and court submissions;</li>
                    <li><strong>Travel expenses</strong> -- mileage, lodging, and meals if in-person court appearances or claimant meetings
                      are required;</li>
                    <li><strong>Any other incidental fees</strong> -- any cost directly associated with the processing, finalization,
                      and collection of surplus fund recovery for any individual claimant.</li>
                  </ul>
                </li>
                <li><strong>No Reimbursement by Owner Operator.</strong> Owner Operator shall not reimburse Closer for any expenses
                  described in this Article. All costs are the sole financial responsibility of Closer and are expected to be managed
                  within the 10% closer fee.</li>
                <li><strong>Expense Accounting.</strong> Closer shall maintain receipts, invoices, and detailed records of all expenses
                  incurred per claim for a minimum of four (4) years. Records shall be made available to Owner Operator upon reasonable
                  written request within ten (10) business days.</li>
                <li><strong>Pre-Approval for Extraordinary Expenses.</strong> For any single expense exceeding Five Hundred Dollars ($500.00)
                  on a single claim, Closer shall obtain prior written approval from Owner Operator before incurring the expense.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE V -- RELATIONSHIP OF THE PARTIES</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Independent Contractor.</strong> Closer is an independent contractor. Nothing in this Agreement creates an
                  employer-employee, partnership, joint venture, or agency relationship between the Parties. Closer has no authority to
                  bind Owner Operator to any contract, obligation, or commitment.</li>
                <li><strong>Taxes.</strong> Closer is solely responsible for all federal, state, and local taxes arising from compensation
                  received under this Agreement, including self-employment taxes. Owner Operator will issue Form 1099-NEC for total
                  compensation exceeding $600 in any calendar year.</li>
                <li><strong>No Benefits.</strong> Closer is not entitled to any employee benefits from Owner Operator, including health
                  insurance, retirement contributions, paid leave, or workers&apos; compensation coverage.</li>
                <li><strong>Equipment.</strong> Closer shall provide all tools, equipment, telephone, computer, internet access, and
                  office supplies necessary to perform services under this Agreement at Closer&apos;s own expense.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE VI -- CONFIDENTIALITY</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Confidential Information.</strong> Closer shall maintain strict confidentiality regarding all lead data,
                  claimant personal information, Owner Operator&apos;s business strategies, fee structures, client lists, proprietary
                  processes, and any information obtained through the platform or this engagement.</li>
                <li><strong>Non-Disclosure.</strong> Closer shall not disclose Confidential Information to any third party without prior
                  written consent from Owner Operator, except as required by law, regulation, or court order.</li>
                <li><strong>Non-Solicitation.</strong> During the term of this Agreement and for twelve (12) months following termination,
                  Closer shall not directly or indirectly solicit, contact, or attempt to do business with any claimant, lead, or client
                  introduced through Owner Operator or the platform for any purpose outside this Agreement.</li>
                <li><strong>Non-Compete.</strong> During the term of this Agreement, Closer shall not provide closing services for any
                  competing surplus fund recovery operation using leads, data, or contacts obtained through Owner Operator.</li>
                <li><strong>Data Protection.</strong> Closer shall handle all personally identifiable information in compliance with
                  applicable privacy laws, including the Gramm-Leach-Bliley Act, the Telephone Consumer Protection Act, and applicable
                  state data protection statutes.</li>
                <li><strong>Return of Materials.</strong> Upon termination, Closer shall immediately return or securely destroy all
                  Confidential Information, lead data, claimant files, and Owner Operator materials in Closer&apos;s possession.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE VII -- COMPLIANCE AND PROFESSIONAL STANDARDS</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Legal Compliance.</strong> Closer shall comply with all applicable federal, state, and local laws, including
                  the TCPA, FDCPA, DNC regulations, state foreclosure consultant statutes, and any jurisdiction-specific licensing
                  requirements.</li>
                <li><strong>Professional Conduct.</strong> Closer shall conduct all claimant interactions in a professional, honest, and
                  ethical manner. Misleading, deceptive, coercive, or high-pressure tactics are strictly prohibited.</li>
                <li><strong>Prohibited Actions.</strong> Closer shall not:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Collect any payment or fee directly from any claimant;</li>
                    <li>Guarantee specific recovery amounts, timelines, or outcomes;</li>
                    <li>Provide legal advice or hold themselves out as an attorney unless separately licensed to practice law;</li>
                    <li>Contact any individual on the Do Not Call registry without prior DNC clearance;</li>
                    <li>Use Owner Operator&apos;s business name, logo, or branding in any unauthorized manner;</li>
                    <li>File any document with a court or state agency without Owner Operator&apos;s prior written approval;</li>
                    <li>Negotiate fee modifications with claimants without Owner Operator&apos;s authorization.</li>
                  </ul>
                </li>
                <li><strong>Quality Standards.</strong> Owner Operator may establish and modify performance standards, response time
                  requirements, and quality benchmarks. Closer&apos;s continued engagement is contingent on meeting these standards.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE VIII -- TERM AND TERMINATION</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Term.</strong> This Agreement commences on the Effective Date and continues for an initial term of twelve (12)
                  months. It shall automatically renew for successive twelve-month periods unless terminated by either Party.</li>
                <li><strong>Termination for Convenience.</strong> Either Party may terminate by providing thirty (30) days&apos; written
                  notice to the other Party.</li>
                <li><strong>Termination for Cause.</strong> Owner Operator may terminate immediately, without notice, upon:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Material breach of any term of this Agreement;</li>
                    <li>Violation of applicable law, regulation, or court order;</li>
                    <li>Fraud, dishonesty, gross misconduct, or misrepresentation;</li>
                    <li>Breach of confidentiality or non-solicitation provisions;</li>
                    <li>Failure to meet performance standards after written notice and reasonable cure period.</li>
                  </ul>
                </li>
                <li><strong>Effect of Termination.</strong> Upon termination: (a) Closer is entitled to fees for claims successfully
                  closed and funded prior to termination; (b) all pending leads revert to Owner Operator; (c) Closer&apos;s platform
                  access shall be revoked; (d) confidentiality and non-solicitation obligations survive termination.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE IX -- INDEMNIFICATION AND LIABILITY</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Closer Indemnification.</strong> Closer shall indemnify, defend, and hold harmless Owner Operator, its
                  members, managers, officers, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses
                  (including reasonable attorneys&apos; fees) arising from Closer&apos;s performance under this Agreement, including
                  violations of law, negligence, misrepresentation, or unauthorized actions.</li>
                <li><strong>Owner Operator Indemnification.</strong> Owner Operator shall indemnify Closer against claims arising
                  directly from Owner Operator&apos;s own negligence or willful misconduct, to the extent not caused by Closer&apos;s
                  actions or omissions.</li>
                <li><strong>Limitation of Liability.</strong> Neither Party&apos;s total liability shall exceed the total fees paid or
                  payable to Closer under this Agreement in the twelve (12) months preceding the event giving rise to the claim.</li>
                <li><strong>Insurance.</strong> Closer is encouraged to maintain professional liability (errors and omissions) insurance
                  with minimum coverage of $500,000 per occurrence. Proof of insurance shall be provided to Owner Operator upon request.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE X -- DISPUTE RESOLUTION</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Governing Law.</strong> This Agreement shall be governed by the laws of the state in which Owner Operator&apos;s
                  business entity is organized, without regard to conflicts of law principles.</li>
                <li><strong>Good Faith Negotiation.</strong> The Parties shall attempt to resolve any dispute through good faith negotiation
                  for a period of thirty (30) days before pursuing other remedies.</li>
                <li><strong>Mediation.</strong> If negotiation fails, the dispute shall be submitted to mediation before a mutually agreed
                  mediator in Owner Operator&apos;s county of principal business.</li>
                <li><strong>Binding Arbitration.</strong> If mediation is unsuccessful, the dispute shall be resolved through binding
                  arbitration under the American Arbitration Association rules, with arbitration in Owner Operator&apos;s county of
                  principal business. The arbitrator&apos;s decision shall be final and enforceable in any court of competent jurisdiction.</li>
              </ol>

              <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mt-6 mb-3">ARTICLE XI -- GENERAL PROVISIONS</h2>

              <ol className="list-decimal ml-5 mb-4 space-y-2">
                <li><strong>Entire Agreement.</strong> This Agreement constitutes the entire agreement between the Parties regarding the
                  subject matter hereof and supersedes all prior negotiations, representations, and agreements.</li>
                <li><strong>Amendments.</strong> No amendment shall be valid unless in writing and signed by both Parties.</li>
                <li><strong>Severability.</strong> If any provision is held invalid, the remaining provisions continue in full force.</li>
                <li><strong>Waiver.</strong> Failure to enforce any provision does not waive future enforcement rights.</li>
                <li><strong>Assignment.</strong> Closer may not assign this Agreement without Owner Operator&apos;s prior written consent.
                  Owner Operator may assign this Agreement to any successor entity or affiliate.</li>
                <li><strong>Notices.</strong> All notices shall be in writing and delivered to the addresses set forth above via certified
                  mail, overnight courier, or email with delivery confirmation.</li>
                <li><strong>Counterparts.</strong> This Agreement may be executed in counterparts, each of which shall be deemed an original,
                  and all of which together shall constitute one and the same instrument. Electronic and digital signatures shall be deemed
                  valid and binding.</li>
                <li><strong>Platform Terms.</strong> Closer acknowledges that use of the Foreclosure Recovery Inc. platform is subject to
                  the platform&apos;s Terms of Service and Privacy Policy, which are incorporated herein by reference.</li>
              </ol>

              {/* Signature Page */}
              <div style={{ pageBreakBefore: "always" }} className="mt-10 pt-6 border-t-2 border-[#1e3a5f]">
                <div className="text-center mb-8">
                  <h2 className="text-base font-bold text-gray-900">SIGNATURE PAGE</h2>
                  <p className="text-xs text-gray-500 mt-1">Owner Operator -- Independent Closer Services Agreement</p>
                </div>

                <p className="mb-8">
                  IN WITNESS WHEREOF, the Parties have executed this Owner Operator -- Independent Closer Services Agreement
                  as of the date last written below.
                </p>

                <div className="grid grid-cols-2 gap-12 mt-10">
                  <div className="space-y-6">
                    <p className="font-bold text-sm">OWNER OPERATOR:</p>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Business Name (LLC / Corp)</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Printed Name</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Title</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Date</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="font-bold text-sm">CLOSER (Independent Contractor):</p>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Full Legal Name</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Business Name (if applicable)</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Address</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-full mb-1 h-8" />
                      <p className="text-xs text-gray-600">Date</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-4 border-t border-gray-300 text-center">
                  <p className="text-[10px] text-gray-400">
                    This agreement is facilitated through the Foreclosure Recovery Inc. Owner Operator Program.
                    Platform services subject to separate Terms of Service. -- (888) 545-8007
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closer Detail Modal */}
      {selectedCloser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedCloser(null)}
        >
          <div
            className="bg-background border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedCloser.avatarUrl}
                    alt={selectedCloser.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-md"
                  />
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${availabilityColors[selectedCloser.availability]}`}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedCloser.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedCloser.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(selectedCloser.rating)}
                    <span className="text-sm font-semibold">{selectedCloser.rating}</span>
                    <span className="text-xs text-muted-foreground">({selectedCloser.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCloser(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedCloser.completedDeals}</p>
                  <p className="text-xs text-muted-foreground">Deals Closed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedCloser.successRate}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedCloser.avgRecovery}</p>
                  <p className="text-xs text-muted-foreground">Avg. Recovery</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedCloser.responseTime}</p>
                  <p className="text-xs text-muted-foreground">Avg. Response</p>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Fee Structure
                </h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex justify-between">
                    <span>Example Recovery</span>
                    <span className="font-medium text-foreground">$100,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Service Fee (30%)</span>
                    <span className="font-medium text-foreground">$30,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5">
                    <span>Closer Fee ({selectedCloser.feePercent}% of service fee)</span>
                    <span className="font-medium text-emerald-600">$3,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract Admin (5% of service fee)</span>
                    <span className="font-medium text-blue-600">$1,250</span>
                  </div>
                  <div className="flex justify-between text-[10px] italic">
                    <span>Attorney fees billed separately per jurisdiction</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-semibold">
                    <span className="text-foreground">Your Net</span>
                    <span className="text-foreground">$21,250</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-sm font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedCloser.bio}</p>
              </div>

              {/* Jurisdictions */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Licensed Jurisdictions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCloser.jurisdictions.map((j) => (
                    <Badge key={j} variant="secondary" className="text-xs">{j}</Badge>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Specialties
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCloser.specialties.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>

              {/* Languages & Member Since */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Languages:</span>{" "}
                  <span className="font-medium">{selectedCloser.languages.join(", ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Member since:</span>{" "}
                  <span className="font-medium">{selectedCloser.memberSince}</span>
                </div>
              </div>

              {/* Call Forwarding Setup */}
              <div className="border-t pt-5 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <PhoneForwarded className="h-4 w-4 text-primary" />
                  Forward Calls to {selectedCloser.name.split(" ")[0]}
                </h4>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Your callback number (leads will call this number)</label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={forwardNumber}
                    onChange={(e) => setForwardNumber(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => setShowAdminAlert(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Enable Forwarding
                  </Button>
                  <Button variant="outline" onClick={() => setShowAdminAlert(true)}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  All forwarded calls are recorded on a compliant line. Both parties are notified at the start of each call.
                  Recordings and AI-generated transcripts are available within minutes.
                </p>
              </div>

              {/* Hire Contract Admin */}
              <div className="border-t pt-5 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Contract Administration
                </h4>
                <p className="text-xs text-muted-foreground">
                  Farm out paperwork, filing, and follow-ups to a dedicated contract admin for 5% of your service fee. They handle document prep, county filings, and client communication so you can focus on closing.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                  onClick={() => setShowAdminAlert(true)}
                >
                  <Shield className="h-4 w-4 mr-2 text-blue-500" />
                  Hire Contract Admin
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Call Log Access Alert */}
      {showCallLogAlert && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCallLogAlert(false)}
        >
          <div
            className="bg-background border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-6 sm:p-8 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto sm:hidden" />
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Headphones className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Closer Not Yet Assigned</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Once a closer has been assigned to your account, you will get full access to call logs, audio recordings, and AI-generated transcripts from your closer's conversations with leads.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-left space-y-1.5">
                <p className="text-xs font-semibold">What you'll get access to:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2"><Play className="h-3 w-3 text-emerald-500" /> Full call audio recordings</li>
                  <li className="flex items-center gap-2"><FileText className="h-3 w-3 text-emerald-500" /> AI-generated conversation transcripts</li>
                  <li className="flex items-center gap-2"><Download className="h-3 w-3 text-emerald-500" /> Downloadable files for training and review</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCallLogAlert(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Feature Alert */}
      {showAdminAlert && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAdminAlert(false)}
        >
          <div
            className="bg-background border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-6 sm:p-8 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto sm:hidden" />
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Administration Feature</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  This feature is managed by your administrator. Please contact your administrator to make this selection on your behalf.
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <a href="tel:+18885458007" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                  <Phone className="h-4 w-4" />
                  (888) 545-8007
                </a>
                <a href="mailto:support@usforeclosureleads.com" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                  <FileText className="h-4 w-4" />
                  support@usforeclosureleads.com
                </a>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setShowAdminAlert(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
