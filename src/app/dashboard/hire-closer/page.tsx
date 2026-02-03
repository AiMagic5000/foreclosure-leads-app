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
  {
    id: "ro-010",
    name: "Ryan O.",
    avatarUrl: "/avatars/ryan-oconnell.jpg",
    title: "Northeast Recovery Specialist",
    rating: 4.7,
    reviewCount: 143,
    completedDeals: 187,
    successRate: 88,
    responseTime: "< 25 min",
    feePercent: 10,
    avgRecovery: "$33,100",
    jurisdictions: ["Maine", "New Hampshire", "Vermont", "Rhode Island", "Connecticut"],
    specialties: ["Judicial Foreclosures", "Seasonal Properties", "Rural Claims"],
    bio: "Covers the New England states where surplus fund processes are deeply tied to local court systems. 5 years of experience navigating small-town clerks and county offices. Specializes in seasonal and vacation property claims where owners are often out of state.",
    memberSince: "2022",
    languages: ["English"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/ryan-oconnell.mp3",
  },
  {
    id: "jk-011",
    name: "Jennifer K.",
    avatarUrl: "/avatars/jennifer-kim.jpg",
    title: "West Coast Recovery Expert",
    rating: 4.9,
    reviewCount: 256,
    completedDeals: 321,
    successRate: 94,
    responseTime: "< 10 min",
    feePercent: 10,
    avgRecovery: "$44,500",
    jurisdictions: ["California", "Oregon", "Washington", "Hawaii"],
    specialties: ["Non-Judicial Foreclosures", "Trust Deed Surplus", "Multi-Unit Properties"],
    bio: "10 years covering the West Coast market where non-judicial foreclosure creates fast-moving surplus opportunities. Former escrow officer who understands title and closing processes inside and out. Handles multi-unit and investment property claims that others pass on.",
    memberSince: "2019",
    languages: ["English", "Korean"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/jennifer-kim.mp3",
  },
  {
    id: "wh-012",
    name: "William H.",
    avatarUrl: "/avatars/william-harris.jpg",
    title: "Senior Closing Consultant",
    rating: 4.8,
    reviewCount: 312,
    completedDeals: 402,
    successRate: 95,
    responseTime: "< 15 min",
    feePercent: 10,
    avgRecovery: "$39,900",
    jurisdictions: ["Georgia", "Alabama", "Mississippi", "Louisiana", "South Carolina"],
    specialties: ["Tax Sale Overages", "Estate Recovery", "Mentor & Trainer"],
    bio: "30 years in real estate and 10 years in surplus fund recovery. One of the most experienced closers on the platform. Serves as a mentor to newer agents and has trained over 50 closers. Deep relationships with attorneys and county officials across the Southeast.",
    memberSince: "2017",
    languages: ["English"],
    availability: "available",
    voiceSampleUrl: "/voice-samples/william-harris.mp3",
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
  const [showCallLog, setShowCallLog] = useState(false)
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

  const VALID_PINS = ["452026", "100045", "777888"]

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
        <Badge variant="outline" className="bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-300 w-fit">
          <Award className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
          {closers.length} Verified Agents
        </Badge>
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
            How Call Forwarding Works
          </CardTitle>
          <CardDescription>
            Every call is recorded, transcribed, and available for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-bold">1</span>
                <h4 className="font-medium text-sm">Forward Your Line</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Set your callback number to forward to your chosen closer. Calls route through our recorded line automatically.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold">2</span>
                <h4 className="font-medium text-sm">Recorded Conversations</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Every call is recorded on a compliant line. Both parties are notified. Full audio files available for download within minutes.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-500 text-white text-sm font-bold">3</span>
                <h4 className="font-medium text-sm">Full Transcripts</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                AI-powered transcription generates full conversation transcripts. Search, highlight, and annotate key moments.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold">4</span>
                <h4 className="font-medium text-sm">Training & Feedback</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Review calls by jurisdiction. Provide feedback, flag compliance issues, and build training libraries from top-performing calls.
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
              <p className="text-xs text-muted-foreground">Example: $100K recovery at 25% fee</p>
              <p className="text-sm"><span className="text-muted-foreground">Closer:</span> <strong>$2,500</strong> &middot; <span className="text-muted-foreground">Admin:</span> <strong>$1,250</strong> &middot; <span className="text-muted-foreground">You keep:</span> <strong className="text-emerald-600">$21,250</strong></p>
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
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => requirePin(() => {})}>
                          {pinUnlocked ? <Play className="h-3 w-3" /> : <Lock className="h-3 w-3 text-amber-500" />}
                          Audio
                        </Button>
                      )}
                      {record.hasTranscript && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => requirePin(() => {})}>
                          {pinUnlocked ? <FileText className="h-3 w-3" /> : <Lock className="h-3 w-3 text-amber-500" />}
                          Transcript
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => requirePin(() => {})}>
                        {pinUnlocked ? <Download className="h-3 w-3" /> : <Lock className="h-3 w-3 text-amber-500" />}
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
                    <span>Your Service Fee (25%)</span>
                    <span className="font-medium text-foreground">$25,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5">
                    <span>Closer Fee ({selectedCloser.feePercent}% of service fee)</span>
                    <span className="font-medium text-emerald-600">$2,500</span>
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
                  <Button className="flex-1" onClick={() => requirePin(() => {})}>
                    {pinUnlocked ? <PhoneForwarded className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    Enable Forwarding
                  </Button>
                  <Button variant="outline" onClick={() => requirePin(() => {})}>
                    {pinUnlocked ? <Phone className="h-4 w-4" /> : <Lock className="h-4 w-4 text-amber-500" />}
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
                  onClick={() => requirePin(() => {})}
                >
                  {pinUnlocked ? (
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2 text-amber-500" />
                  )}
                  Hire Contract Admin
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
