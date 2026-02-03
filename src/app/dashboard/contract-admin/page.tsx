"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Star,
  MapPin,
  Shield,
  Clock,
  Search,
  Award,
  TrendingUp,
  FileCheck,
  Scale,
  Phone,
  Gavel,
  Lock,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  CalendarCheck,
  Briefcase,
  ArrowRight,
} from "lucide-react"

interface AdminProfile {
  id: string
  name: string
  avatarUrl: string
  title: string
  rating: number
  reviewCount: number
  contractsManaged: number
  successRate: number
  responseTime: string
  feePercent: number
  jurisdictions: string[]
  services: string[]
  bio: string
  memberSince: string
  languages: string[]
  availability: "available" | "busy" | "offline"
  certifications: string[]
}

const admins: AdminProfile[] = [
  {
    id: "pw-001",
    name: "Patricia W.",
    avatarUrl: "/avatars/patricia-wells.jpg",
    title: "Senior Contract Administrator",
    rating: 4.9,
    reviewCount: 312,
    contractsManaged: 487,
    successRate: 97,
    responseTime: "< 2 hrs",
    feePercent: 5,
    jurisdictions: ["Georgia", "Florida", "Alabama", "South Carolina", "Tennessee", "North Carolina"],
    services: ["Attorney Coordination", "Notary Scheduling", "Client Follow-up", "Document Filing"],
    bio: "20+ years of paralegal experience before transitioning to contract administration for surplus fund recovery. Manages the full lifecycle from signed contract through disbursement. Maintains a network of 40+ attorneys and mobile notaries across the Southeast.",
    memberSince: "2019",
    languages: ["English"],
    availability: "available",
    certifications: ["Certified Paralegal (CP)", "Notary Public - GA"],
  },
  {
    id: "rj-002",
    name: "Raymond J.",
    avatarUrl: "/avatars/raymond-jackson.jpg",
    title: "Claims Processing Specialist",
    rating: 4.8,
    reviewCount: 245,
    contractsManaged: 378,
    successRate: 95,
    responseTime: "< 4 hrs",
    feePercent: 5,
    jurisdictions: ["Texas", "California", "Arizona", "New Mexico", "Nevada", "Colorado"],
    services: ["Claims Filing", "Court Document Prep", "Attorney Liaison", "Disbursement Tracking"],
    bio: "Former title company operations manager with 12 years handling foreclosure-related documentation. Knows the filing requirements for every county in Texas and California. Handles high-volume claim processing without dropping the ball on follow-ups.",
    memberSince: "2020",
    languages: ["English", "Spanish"],
    availability: "available",
    certifications: ["Certified Document Specialist", "Texas Notary"],
  },
  {
    id: "ln-003",
    name: "Lisa N.",
    avatarUrl: "/avatars/lisa-nguyen.jpg",
    title: "Client Relations Administrator",
    rating: 4.9,
    reviewCount: 289,
    contractsManaged: 412,
    successRate: 98,
    responseTime: "< 1 hr",
    feePercent: 5,
    jurisdictions: ["New York", "New Jersey", "Pennsylvania", "Connecticut", "Massachusetts", "Virginia"],
    services: ["Client Communication", "Status Updates", "Notary Coordination", "Payment Processing"],
    bio: "Specializes in keeping clients informed and engaged throughout the recovery process. Former customer success manager at a fintech startup. Runs a tight follow-up cadence that keeps claim abandonment rates below 3%. Clients consistently rate her communication as the best part of the experience.",
    memberSince: "2021",
    languages: ["English", "Vietnamese"],
    availability: "busy",
    certifications: ["Project Management Professional (PMP)", "NY Notary"],
  },
  {
    id: "tw-004",
    name: "Thomas W.",
    avatarUrl: "/avatars/thomas-wright.jpg",
    title: "Legal Coordination Manager",
    rating: 4.7,
    reviewCount: 198,
    contractsManaged: 305,
    successRate: 94,
    responseTime: "< 3 hrs",
    feePercent: 5,
    jurisdictions: ["Illinois", "Ohio", "Michigan", "Indiana", "Wisconsin", "Missouri"],
    services: ["Attorney Management", "Probate Filing", "Heir Documentation", "Court Appearances"],
    bio: "Retired county court administrator with 30 years of experience in the Midwest judicial system. Deep relationships with judges, clerks, and attorneys across Illinois, Ohio, and Michigan. Handles the complex probate and heir-related claims that require courthouse navigation and in-person filings.",
    memberSince: "2018",
    languages: ["English"],
    availability: "available",
    certifications: ["Court Certified Administrator", "IL Notary"],
  },
  {
    id: "vs-005",
    name: "Victoria S.",
    avatarUrl: "/avatars/victoria-santos.jpg",
    title: "Disbursement Processing Specialist",
    rating: 4.8,
    reviewCount: 234,
    contractsManaged: 356,
    successRate: 96,
    responseTime: "< 2 hrs",
    feePercent: 5,
    jurisdictions: ["Florida", "Georgia", "South Carolina", "North Carolina", "Virginia"],
    services: ["Disbursement Tracking", "Payment Processing", "Lien Verification", "Client Follow-up"],
    bio: "Former bank operations manager with 15 years in financial processing. Tracks every disbursement from court order through final payment. Maintains a 96% on-time disbursement rate and catches lien issues before they delay payments.",
    memberSince: "2020",
    languages: ["English", "Spanish"],
    availability: "available",
    certifications: ["Certified Treasury Professional", "FL Notary"],
  },
  {
    id: "mc-006",
    name: "Michael C.",
    avatarUrl: "/avatars/michael-coleman.jpg",
    title: "Probate Administration Expert",
    rating: 4.9,
    reviewCount: 267,
    contractsManaged: 398,
    successRate: 97,
    responseTime: "< 3 hrs",
    feePercent: 5,
    jurisdictions: ["Texas", "Oklahoma", "Arkansas", "Louisiana", "Mississippi"],
    services: ["Probate Filing", "Heir Location", "Estate Documentation", "Court Coordination"],
    bio: "Retired probate court clerk with 25 years of experience in the Southern district courts. Handles the most complex estate and heir-related surplus claims. His courthouse connections and procedural knowledge cut processing times in half compared to standard filings.",
    memberSince: "2019",
    languages: ["English"],
    availability: "available",
    certifications: ["Court Certified Administrator", "TX Notary"],
  },
  {
    id: "cp-007",
    name: "Christine P.",
    avatarUrl: "/avatars/christine-park.jpg",
    title: "Multi-State Filing Coordinator",
    rating: 4.8,
    reviewCount: 198,
    contractsManaged: 312,
    successRate: 95,
    responseTime: "< 2 hrs",
    feePercent: 5,
    jurisdictions: ["Washington", "Oregon", "California", "Nevada", "Idaho"],
    services: ["Multi-State Filing", "Document Preparation", "Notary Coordination", "Deadline Management"],
    bio: "Manages claims across multiple West Coast jurisdictions simultaneously. Former legal secretary at a real estate law firm with 10 years of document preparation experience. Known for meticulous deadline tracking and zero missed filing dates.",
    memberSince: "2021",
    languages: ["English", "Korean"],
    availability: "busy",
    certifications: ["Certified Legal Secretary", "WA Notary"],
  },
  {
    id: "rs-008",
    name: "Robert S.",
    avatarUrl: "/avatars/robert-stevens.jpg",
    title: "Attorney Liaison Specialist",
    rating: 4.7,
    reviewCount: 178,
    contractsManaged: 289,
    successRate: 93,
    responseTime: "< 4 hrs",
    feePercent: 5,
    jurisdictions: ["Pennsylvania", "New Jersey", "Delaware", "Maryland", "DC"],
    services: ["Attorney Retention", "Engagement Letters", "Legal Brief Review", "Court Scheduling"],
    bio: "Former legal office manager who built a network of 60+ surplus fund attorneys across the Mid-Atlantic region. Handles attorney retention, engagement letter negotiations, and court scheduling. Clients never have to worry about finding the right attorney for their jurisdiction.",
    memberSince: "2020",
    languages: ["English"],
    availability: "available",
    certifications: ["Paralegal Certificate", "PA Notary"],
  },
  {
    id: "ap-009",
    name: "Andrea P.",
    avatarUrl: "/avatars/andrea-phillips.jpg",
    title: "Client Communications Director",
    rating: 4.9,
    reviewCount: 312,
    contractsManaged: 445,
    successRate: 98,
    responseTime: "< 1 hr",
    feePercent: 5,
    jurisdictions: ["Ohio", "Indiana", "Kentucky", "West Virginia", "Minnesota"],
    services: ["Client Onboarding", "Status Updates", "Document Collection", "Complaint Resolution"],
    bio: "Built the client communication standard that many contract admins now follow. Former customer success director at a legal tech company. Her structured onboarding and follow-up cadence has reduced claim abandonment rates to under 2% across all her managed contracts.",
    memberSince: "2019",
    languages: ["English"],
    availability: "available",
    certifications: ["Customer Success Certified", "OH Notary"],
  },
  {
    id: "jm-010",
    name: "James M.",
    avatarUrl: "/avatars/james-mitchell.jpg",
    title: "Court Filing Specialist",
    rating: 4.8,
    reviewCount: 223,
    contractsManaged: 334,
    successRate: 94,
    responseTime: "< 3 hrs",
    feePercent: 5,
    jurisdictions: ["Colorado", "Montana", "Wyoming", "Utah", "New Mexico"],
    services: ["Court Filing", "Motion Preparation", "Hearing Coordination", "Document Certification"],
    bio: "Specializes in the unique court filing requirements of Mountain West states where each county has distinct procedural rules. Former court clerk with 8 years of experience. Handles motion preparation, hearing coordination, and certified document processing for surplus claims.",
    memberSince: "2021",
    languages: ["English", "Spanish"],
    availability: "available",
    certifications: ["Court Certified Clerk", "CO Notary"],
  },
  {
    id: "sw-011",
    name: "Sandra W.",
    avatarUrl: "/avatars/sandra-williams.jpg",
    title: "Senior Admin Coordinator",
    rating: 4.8,
    reviewCount: 256,
    contractsManaged: 378,
    successRate: 96,
    responseTime: "< 2 hrs",
    feePercent: 5,
    jurisdictions: ["Alabama", "Tennessee", "Georgia", "South Carolina", "Mississippi"],
    services: ["Full-Cycle Administration", "Notary Management", "Attorney Coordination", "Disbursement Tracking"],
    bio: "End-to-end contract administrator who handles every step from signed agreement to final disbursement. 18 years of paralegal experience across the Deep South. Manages a team of mobile notaries and maintains relationships with attorneys in every county she covers.",
    memberSince: "2018",
    languages: ["English"],
    availability: "busy",
    certifications: ["Advanced Paralegal Cert", "GA Notary"],
  },
  {
    id: "dt-012",
    name: "Derek T.",
    avatarUrl: "/avatars/derek-thompson.jpg",
    title: "Compliance & Audit Administrator",
    rating: 4.7,
    reviewCount: 189,
    contractsManaged: 267,
    successRate: 93,
    responseTime: "< 4 hrs",
    feePercent: 5,
    jurisdictions: ["Maine", "New Hampshire", "Vermont", "Rhode Island", "Connecticut"],
    services: ["Compliance Review", "Audit Preparation", "Record Keeping", "Regulatory Filing"],
    bio: "Former financial compliance officer who brings regulatory expertise to surplus fund administration. Ensures every contract and filing meets state-specific compliance requirements. Maintains detailed audit trails that protect both the recovery agent and the client.",
    memberSince: "2022",
    languages: ["English"],
    availability: "available",
    certifications: ["Certified Compliance Officer", "CT Notary"],
  },
]

interface TaskRecord {
  id: string
  adminId: string
  clientName: string
  taskType: "attorney" | "notary" | "follow-up" | "filing"
  status: "completed" | "in-progress" | "scheduled" | "pending"
  date: string
  notes: string
}

const mockTasks: TaskRecord[] = [
  { id: "t1", adminId: "pw-001", clientName: "John Smith", taskType: "attorney", status: "completed", date: "2026-01-31", notes: "Attorney retained - filing submitted to Fulton County" },
  { id: "t2", adminId: "pw-001", clientName: "Maria Garcia", taskType: "notary", status: "scheduled", date: "2026-02-03", notes: "Mobile notary scheduled for contract signing" },
  { id: "t3", adminId: "rj-002", clientName: "Robert Johnson", taskType: "filing", status: "in-progress", date: "2026-01-30", notes: "Surplus claim filed with Harris County - awaiting confirmation" },
  { id: "t4", adminId: "ln-003", clientName: "Sarah Williams", taskType: "follow-up", status: "completed", date: "2026-01-29", notes: "14-day follow-up call completed - client confirmed receipt of documents" },
  { id: "t5", adminId: "tw-004", clientName: "Michael Brown", taskType: "attorney", status: "in-progress", date: "2026-01-31", notes: "Probate attorney retained for heir verification in Cook County" },
  { id: "t6", adminId: "ln-003", clientName: "Emily Davis", taskType: "follow-up", status: "pending", date: "2026-02-02", notes: "Awaiting signed power of attorney from client" },
  { id: "t7", adminId: "vs-005", clientName: "Carlos Rivera", taskType: "filing", status: "completed", date: "2026-01-28", notes: "Disbursement verified and processed through Miami-Dade County clerk" },
  { id: "t8", adminId: "mc-006", clientName: "Dorothy Hayes", taskType: "attorney", status: "in-progress", date: "2026-01-30", notes: "Probate filing underway in Dallas County - heir located in Oklahoma" },
  { id: "t9", adminId: "cp-007", clientName: "Kevin Tran", taskType: "filing", status: "scheduled", date: "2026-02-04", notes: "Multi-state filing coordinated for WA and OR - documents prepped" },
  { id: "t10", adminId: "rs-008", clientName: "Angela Foster", taskType: "attorney", status: "completed", date: "2026-01-27", notes: "Attorney retained in Philadelphia - engagement letter signed and filed" },
  { id: "t11", adminId: "ap-009", clientName: "James Wilson", taskType: "follow-up", status: "completed", date: "2026-01-29", notes: "Client onboarding completed - all documents collected within 48 hrs" },
  { id: "t12", adminId: "jm-010", clientName: "Linda Martinez", taskType: "filing", status: "in-progress", date: "2026-01-31", notes: "Court motion filed in Denver County - hearing scheduled for Feb 10" },
  { id: "t13", adminId: "sw-011", clientName: "Paul Henderson", taskType: "notary", status: "completed", date: "2026-01-26", notes: "Mobile notary completed contract signing in Birmingham - docs returned" },
  { id: "t14", adminId: "dt-012", clientName: "Rebecca Stone", taskType: "filing", status: "pending", date: "2026-02-05", notes: "Compliance review in progress for CT filing - audit trail prepared" },
  { id: "t15", adminId: "vs-005", clientName: "Thomas Lee", taskType: "follow-up", status: "scheduled", date: "2026-02-03", notes: "Lien verification pending - follow-up with county recorder scheduled" },
  { id: "t16", adminId: "ap-009", clientName: "Sandra Chen", taskType: "follow-up", status: "in-progress", date: "2026-02-01", notes: "Status update sent - client reviewing final disbursement authorization" },
]

export default function ContractAdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null)
  const [showTaskLog, setShowTaskLog] = useState(false)

  const filteredAdmins = admins.filter((admin) => {
    const q = searchQuery.toLowerCase()
    return (
      admin.name.toLowerCase().includes(q) ||
      admin.title.toLowerCase().includes(q) ||
      admin.jurisdictions.some((j) => j.toLowerCase().includes(q)) ||
      admin.services.some((s) => s.toLowerCase().includes(q))
    )
  })

  const availabilityColors = {
    available: "bg-green-500",
    busy: "bg-yellow-500",
    offline: "bg-gray-400",
  }

  const availabilityLabels = {
    available: "Available",
    busy: "At Capacity",
    offline: "Offline",
  }

  const taskTypeIcons = {
    attorney: <Gavel className="h-4 w-4 text-blue-500" />,
    notary: <FileCheck className="h-4 w-4 text-purple-500" />,
    "follow-up": <Phone className="h-4 w-4 text-amber-500" />,
    filing: <FileText className="h-4 w-4 text-emerald-500" />,
  }

  const statusColors = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contract Administration</h1>
          <p className="text-muted-foreground">
            Hire administrators to handle attorneys, notaries, and client follow-up
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950 dark:border-purple-600 dark:text-purple-300 w-fit">
          <Award className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
          {admins.length} Verified Admins
        </Badge>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/60 border text-sm text-muted-foreground">
        <Shield className="h-4 w-4 shrink-0" />
        <p>Agent last names are abbreviated to protect their privacy. Full identity is disclosed after hiring.</p>
      </div>

      {/* Upgrade Gate */}
      <Card className="border-emerald-500/50 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/20">
              <Lock className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Fully Built Asset Recovery Business Required</h3>
              <p className="text-sm text-muted-foreground">
                Contract administration is exclusively available to clients who have purchased the Fully Built Asset Recovery Business package from usforeclosureleads.com.
              </p>
            </div>
          </div>
          <a href="https://assetrecoverybusiness.com/" target="_blank" rel="noopener noreferrer">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, service, or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Fee Banner */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40">
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" />
                Flat 5% of Service Fee
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contract admins handle attorney coordination, notary scheduling, document filing, and client communication so you can focus on closing more deals.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">Example: $100K recovery at 25% fee</p>
              <p className="text-sm"><span className="text-muted-foreground">Admin fee:</span> <strong className="text-purple-600">$1,250</strong> <span className="text-muted-foreground">for full-service admin (attorney fees separate)</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Admins</CardDescription>
            <CardTitle className="text-3xl">{admins.filter((a) => a.availability === "available").length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contracts Managed</CardDescription>
            <CardTitle className="text-3xl">
              {admins.reduce((sum, a) => sum + a.contractsManaged, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Success Rate</CardDescription>
            <CardTitle className="text-3xl">
              {Math.round(admins.reduce((sum, a) => sum + a.successRate, 0) / admins.length)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Rating</CardDescription>
            <CardTitle className="text-3xl">
              {(admins.reduce((sum, a) => sum + a.rating, 0) / admins.length).toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredAdmins.map((admin) => (
          <Card
            key={admin.id}
            className="overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
            onClick={() => setSelectedAdmin(admin)}
          >
            <CardContent className="p-0">
              {/* Profile Header */}
              <div className="p-5 pb-4">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={admin.avatarUrl}
                      alt={admin.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-md"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${availabilityColors[admin.availability]}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-base truncate">{admin.name}</h3>
                        <p className="text-xs text-muted-foreground">{admin.title}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          admin.availability === "available"
                            ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-700 shrink-0 text-[10px]"
                            : admin.availability === "busy"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-700 shrink-0 text-[10px]"
                              : "shrink-0 text-[10px]"
                        }
                      >
                        {availabilityLabels[admin.availability]}
                      </Badge>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {renderStars(admin.rating)}
                      <span className="text-sm font-semibold">{admin.rating}</span>
                      <span className="text-xs text-muted-foreground">({admin.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-3 border-y bg-muted/30">
                <div className="p-3 text-center border-r">
                  <p className="text-lg font-bold">{admin.contractsManaged}</p>
                  <p className="text-[10px] text-muted-foreground">Contracts</p>
                </div>
                <div className="p-3 text-center border-r">
                  <p className="text-lg font-bold">{admin.successRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Success Rate</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-lg font-bold">{admin.feePercent}%</p>
                  <p className="text-[10px] text-muted-foreground">of Service Fee</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 pt-4 space-y-3">
                {/* Jurisdictions */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {admin.jurisdictions.slice(0, 3).map((j) => (
                      <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {j}
                      </Badge>
                    ))}
                    {admin.jurisdictions.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        +{admin.jurisdictions.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {admin.services.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {admin.certifications.map((c) => (
                      <Badge key={c} className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Response Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Avg. response: {admin.responseTime}</span>
                </div>

                {/* CTA */}
                <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700" size="sm">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Hire {admin.name.split(" ")[0]}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAdmins.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No administrators found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      )}

      {/* What They Handle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            What Contract Admins Handle
          </CardTitle>
          <CardDescription>
            Full-service administration from signed contract through disbursement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium text-sm">Attorney Coordination</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Retain qualified attorneys in the correct jurisdiction, manage engagement letters, and coordinate all legal filings required for surplus fund claims.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-500" />
                <h4 className="font-medium text-sm">Notary Scheduling</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedule mobile notaries for contract signings, power of attorney documents, and affidavits. Manage the full notarization workflow from scheduling to document return.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-amber-500" />
                <h4 className="font-medium text-sm">Client Follow-up</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Regular status updates to clients, answer questions about the process, collect outstanding documents, and maintain engagement throughout the recovery timeline.
              </p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-500" />
                <h4 className="font-medium text-sm">Document Filing</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Prepare and file all court documents, track filing deadlines, manage claim status with county offices, and confirm disbursement processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Log */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowTaskLog(!showTaskLog)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Administration Log
              </CardTitle>
              <CardDescription>Track all admin tasks, filings, and follow-ups</CardDescription>
            </div>
            {showTaskLog ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </CardHeader>
        {showTaskLog && (
          <CardContent>
            <div className="space-y-3">
              {mockTasks.map((task) => {
                const admin = admins.find((a) => a.id === task.adminId)
                return (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      {taskTypeIcons[task.taskType]}
                      <div>
                        <p className="font-medium text-sm">{task.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          Admin: {admin?.name || "Unknown"} -- {task.date}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.notes}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${statusColors[task.status]}`}>
                      {task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Admin Detail Modal */}
      {selectedAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedAdmin(null)}
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
                    src={selectedAdmin.avatarUrl}
                    alt={selectedAdmin.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-md"
                  />
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${availabilityColors[selectedAdmin.availability]}`}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedAdmin.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(selectedAdmin.rating)}
                    <span className="text-sm font-semibold">{selectedAdmin.rating}</span>
                    <span className="text-xs text-muted-foreground">({selectedAdmin.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAdmin(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedAdmin.contractsManaged}</p>
                  <p className="text-xs text-muted-foreground">Contracts Managed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedAdmin.successRate}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedAdmin.feePercent}%</p>
                  <p className="text-xs text-muted-foreground">of Service Fee</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{selectedAdmin.responseTime}</p>
                  <p className="text-xs text-muted-foreground">Avg. Response</p>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
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
                    <span>Admin Fee ({selectedAdmin.feePercent}% of service fee)</span>
                    <span className="font-medium text-purple-600">$1,250</span>
                  </div>
                  <div className="flex justify-between text-[10px] italic">
                    <span>Attorney fees billed separately per jurisdiction</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-sm font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedAdmin.bio}</p>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-purple-500" />
                  Certifications
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAdmin.certifications.map((c) => (
                    <Badge key={c} className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">{c}</Badge>
                  ))}
                </div>
              </div>

              {/* Jurisdictions */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Jurisdictions Covered
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAdmin.jurisdictions.map((j) => (
                    <Badge key={j} variant="secondary" className="text-xs">{j}</Badge>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Services Provided
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAdmin.services.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>

              {/* Languages & Member Since */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Languages:</span>{" "}
                  <span className="font-medium">{selectedAdmin.languages.join(", ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Member since:</span>{" "}
                  <span className="font-medium">{selectedAdmin.memberSince}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="border-t pt-5">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Hire {selectedAdmin.name.split(" ")[0]} for Contract Admin
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  {selectedAdmin.feePercent}% of your service fee covers full administration from contract through disbursement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
