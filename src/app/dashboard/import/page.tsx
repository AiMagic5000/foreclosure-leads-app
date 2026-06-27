"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePin } from "@/lib/pin-context"
import { LeadsWorkspace } from "@/app/dashboard/my-leads/page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Lock,
  Upload,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react"

// Canonical fields posted to /api/import. Keys MUST match the API contract.
const CANONICAL_FIELDS: { key: string; label: string }[] = [
  { key: "owner_name", label: "Owner Name" },
  { key: "property_address", label: "Property Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "state_abbr", label: "State Abbr" },
  { key: "zip_code", label: "Zip" },
  { key: "county", label: "County" },
  { key: "primary_phone", label: "Phone" },
  { key: "primary_email", label: "Email" },
  { key: "amount", label: "Amount / Surplus" },
  { key: "case_number", label: "Case Number" },
  { key: "notes", label: "Notes" },
]

const LEAD_TYPES = [
  "Foreclosure Surplus",
  "Tax Deed Surplus",
  "Probate",
  "Pre-Foreclosure",
  "General / Other",
]

const NONE = "__none__"

// --- Client-side CSV parser. Handles quoted fields, escaped quotes, commas, CRLF. ---
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0
  const n = text.length

  while (i < n) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }

    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ",") {
      row.push(field)
      field = ""
      i++
      continue
    }
    if (c === "\r") {
      i++
      continue
    }
    if (c === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      i++
      continue
    }
    field += c
    i++
  }
  // flush last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  // drop fully-empty trailing rows
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""))
}

// Fuzzy auto-map a CSV header to a canonical field key.
function guessField(header: string): string | null {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!h) return null
  const has = (...words: string[]) => words.some((w) => h.includes(w))

  if (has("owner") || (has("name") && !has("city", "county", "company"))) return "owner_name"
  if (has("propertyaddress", "siteaddress", "situsaddress")) return "property_address"
  if (has("address", "street", "addr")) return "property_address"
  if (has("cityname") || h === "city" || (has("city") && !has("capacity"))) return "city"
  if (has("stateabbr", "stateabbreviation", "st") && h !== "street") return "state_abbr"
  if (h === "state" || has("statename")) return "state"
  if (has("zip", "postal")) return "zip_code"
  if (has("county", "parish")) return "county"
  if (has("phone", "mobile", "cell", "tel")) return "primary_phone"
  if (has("email", "mail") && !has("mailingaddress")) return "primary_email"
  if (has("amount", "surplus", "overage", "balance", "excess")) return "amount"
  if (has("case", "docket", "claim")) return "case_number"
  if (has("note", "comment", "memo", "remark")) return "notes"
  return null
}

function UpgradeGate() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Import</h1>
        <p className="text-muted-foreground">Bring your own lists into your pipeline</p>
      </div>
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-semibold">Lead Import is a paid feature</h2>
            <p className="text-sm text-muted-foreground">
              Already sitting on old lead lists? Upload them here and re-touch every contact
              with automated ringless voicemail, SMS, and email. Your imported leads land
              right in your My Leads tab, ready to work like any other lead. Upgrade your plan
              to unlock importing.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Link href="/dashboard/settings">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Upgrade Your Plan
              </Button>
            </Link>
            <Link
              href="/dashboard/my-leads"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to My Leads
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ImportTool() {
  const [leadType, setLeadType] = useState(LEAD_TYPES[0])
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [dataRows, setDataRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [parseError, setParseError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  // Bumped after each successful import so the embedded leads workspace remounts
  // and refetches, surfacing the freshly imported leads immediately.
  const [refreshKey, setRefreshKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setParseError(null)
    setResult(null)
    setImportError(null)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (parsed.length < 1) {
        setParseError("That file looks empty. Please upload a CSV with a header row.")
        return
      }
      const headerRow = parsed[0].map((h) => h.trim())
      const rows = parsed.slice(1)
      setFileName(file.name)
      setHeaders(headerRow)
      setDataRows(rows)

      // Auto-guess mapping: for each canonical field, find first header that maps to it.
      const auto: Record<string, string> = {}
      for (const field of CANONICAL_FIELDS) {
        const match = headerRow.find((h) => guessField(h) === field.key)
        auto[field.key] = match ?? NONE
      }
      setMapping(auto)
    } catch {
      setParseError("Could not read that file. Make sure it is a valid .csv file.")
    }
  }

  const setFieldMapping = (fieldKey: string, header: string) => {
    setMapping((prev) => ({ ...prev, [fieldKey]: header }))
  }

  // Build canonical rows from current mapping.
  const mappedRows = useMemo(() => {
    if (!headers.length) return []
    const headerIndex: Record<string, number> = {}
    headers.forEach((h, idx) => {
      if (!(h in headerIndex)) headerIndex[h] = idx
    })
    return dataRows.map((row) => {
      const out: Record<string, string> = {}
      for (const field of CANONICAL_FIELDS) {
        const header = mapping[field.key]
        if (!header || header === NONE) continue
        const idx = headerIndex[header]
        if (idx === undefined) continue
        const val = (row[idx] ?? "").trim()
        if (val) out[field.key] = val
      }
      return out
    })
  }, [headers, dataRows, mapping])

  const importableCount = useMemo(
    () =>
      mappedRows.filter(
        (r) => r.owner_name || r.property_address || r.primary_phone || r.primary_email
      ).length,
    [mappedRows]
  )

  const previewRows = mappedRows.slice(0, 5)

  const handleImport = async () => {
    setIsImporting(true)
    setImportError(null)
    setResult(null)
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadType, rows: mappedRows }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.error === "upgrade_required") {
          setImportError("Importing requires a paid plan. Please upgrade to continue.")
        } else {
          setImportError(data?.error || "Import failed. Please try again.")
        }
        return
      }
      setResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 })
      setRefreshKey((k) => k + 1)
    } catch {
      setImportError("Something went wrong during import. Please try again.")
    } finally {
      setIsImporting(false)
    }
  }

  const resetImport = () => {
    setFileName(null)
    setHeaders([])
    setDataRows([])
    setMapping({})
    setResult(null)
    setImportError(null)
    setParseError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Success panel
  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Import</h1>
          <p className="text-muted-foreground">Bring your own lists into your pipeline</p>
        </div>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold">
                Imported {result.imported} lead{result.imported === 1 ? "" : "s"}
              </h2>
              <p className="text-sm text-muted-foreground">
                They&apos;re now in your My Leads tab, ready for voicemail, SMS, and email
                outreach.
                {result.skipped > 0 && (
                  <>
                    {" "}
                    {result.skipped} row{result.skipped === 1 ? "" : "s"} skipped (no name,
                    address, phone, or email).
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <Link href="/dashboard/my-leads">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Go to My Leads
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={resetImport}>
                Import Another List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Imported leads -- full My Leads functionality (SMS, email, certified mail, voicemail) */}
        <div className="border-t pt-6">
          <LeadsWorkspace importedOnly key={refreshKey} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Import</h1>
        <p className="text-muted-foreground">
          Upload your own lead lists and work them like any other lead
        </p>
      </div>

      {/* VSL Videos — two-up: how to import, then how lead type drives outreach */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-2xl border bg-black">
              <video
                controls
                preload="metadata"
                poster="/videos/lead-import-poster.jpg"
                className="h-auto w-full"
              >
                <source src="/videos/lead-import-16x9.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Start here: how to import your existing lists and put them on autopilot.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-2xl border bg-black">
              <video
                controls
                preload="metadata"
                poster="/videos/lead-import-integration-poster.jpg"
                className="h-auto w-full"
              >
                <source src="/videos/lead-import-integration-16x9.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Watch next: how the lead type you pick reshapes your voicemail, SMS, and email.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How lead type changes your outreach */}
      <Card className="border-slate-200 bg-slate-50 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-white rounded-t-xl">
          <CardTitle className="text-lg text-[#09274c]">How importing works — and why the lead type matters</CardTitle>
          <CardDescription>
            Pick the right type when you upload. Every voicemail, text, and email you draft from
            that lead is written to match it — no manual editing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Steps */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Upload className="h-5 w-5 text-emerald-600" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">1. Upload your file</p>
                <p className="text-xs text-slate-500">
                  Drop in a CSV or spreadsheet of leads you already own.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">2. Pick the lead type</p>
                <p className="text-xs text-slate-500">
                  Tax Deed, Pre-Foreclosure, Foreclosure Surplus, Probate, or General. This is the
                  switch that controls your wording.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">3. Map columns &amp; import</p>
                <p className="text-xs text-slate-500">
                  Match your headers to ours. The leads land in My Leads tagged with their type.
                </p>
              </div>
            </div>
          </div>

          {/* What the type changes */}
          <div className="rounded-xl border border-[#09274c] bg-gradient-to-br from-[#09274c] to-[#0f2d56] p-5 shadow-md">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#C8A84B]">
              When you draft outreach, the type rewrites all three channels
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-900">Voicemail drop</span>
                </div>
                <p className="text-xs text-slate-500">
                  Reads the right sale wording for the lead — a tax sale, an upcoming sale, or a
                  completed foreclosure — instead of one-size-fits-all.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-900">SMS text</span>
                </div>
                <p className="text-xs text-slate-500">
                  References the correct event, so a tax-sale owner never gets a foreclosure text
                  and a pre-foreclosure owner hears the sale hasn&apos;t happened yet.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-900">Email draft</span>
                </div>
                <p className="text-xs text-slate-500">
                  Subject line and body match the type — &ldquo;tax sale&rdquo;,
                  &ldquo;upcoming foreclosure sale&rdquo;, or &ldquo;foreclosure sale&rdquo;. One
                  template, written correctly every time.
                </p>
              </div>
            </div>
          </div>

          {/* Per-type cheat sheet */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-red-200 border-l-4 border-l-red-500 bg-red-50 p-3 shadow-sm">
              <p className="text-sm font-semibold text-red-700">Tax Deed Surplus</p>
              <p className="mt-1 text-xs text-slate-600">
                For overages from a county tax sale (FL/GA tax-deed work). Wording talks about the
                tax sale and back taxes — no lender or mortgage language.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 p-3 shadow-sm">
              <p className="text-sm font-semibold text-amber-700">Pre-Foreclosure</p>
              <p className="mt-1 text-xs text-slate-600">
                The sale hasn&apos;t happened yet. Wording is softer and time-sensitive — protect
                the equity before the sale, not recover it after.
              </p>
            </div>
            <div className="rounded-lg border border-slate-300 border-l-4 border-l-slate-500 bg-slate-100 p-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">Foreclosure Surplus</p>
              <p className="mt-1 text-xs text-slate-600">
                A completed mortgage foreclosure. Standard surplus wording — equity above the
                lender&apos;s claim after the sale. Probate and General use this too.
              </p>
            </div>
          </div>

          <p className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm">
            <span className="font-semibold text-[#09274c]">Tip:</span> each lead in My Leads shows a colored type badge so you always know which script
            it will use before you send.
          </p>
        </CardContent>
      </Card>

      {/* Why import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why import your old lists?</CardTitle>
          <CardDescription>
            Those leads you already paid for still have value. Re-touch them on autopilot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Ringless Voicemail</p>
                <p className="text-xs text-muted-foreground">
                  Drop a voicemail without ringing the phone.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium">SMS Outreach</p>
                <p className="text-xs text-muted-foreground">
                  Text contacts straight from your dashboard.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Email Automation</p>
                <p className="text-xs text-muted-foreground">
                  Send personalized email drafts in a click.
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Imported contacts flow into your{" "}
            <Link href="/dashboard/my-leads" className="font-medium text-emerald-700 underline-offset-4 hover:underline">
              My Leads
            </Link>{" "}
            tab and are assigned only to you.
          </p>
        </CardContent>
      </Card>

      {/* Step 1: Lead type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Lead Type</CardTitle>
          <CardDescription>What kind of leads are in this list?</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={leadType}
            onChange={(e) => setLeadType(e.target.value)}
            className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {LEAD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Step 2: CSV upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 2: Upload CSV</CardTitle>
          <CardDescription>
            Upload a .csv file with a header row. Parsed right here in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-8 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/30">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName ? fileName : "Click to choose a CSV file"}
            </span>
            <span className="text-xs text-muted-foreground">
              {fileName
                ? `${dataRows.length} data row${dataRows.length === 1 ? "" : "s"} found`
                : "Accepted format: .csv"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {parseError && <p className="text-sm text-red-600">{parseError}</p>}
        </CardContent>
      </Card>

      {/* Step 3: Column mapping */}
      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 3: Map Your Columns</CardTitle>
            <CardDescription>
              We auto-matched your columns. Adjust any that look wrong.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {CANONICAL_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <label className="min-w-0 truncate text-sm font-medium">{field.label}</label>
                  <select
                    value={mapping[field.key] ?? NONE}
                    onChange={(e) => setFieldMapping(field.key, e.target.value)}
                    className="w-1/2 min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    <option value={NONE}>- none -</option>
                    {headers.map((h, idx) => (
                      <option key={`${h}-${idx}`} value={h}>
                        {h || `(column ${idx + 1})`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {headers.length > 0 && previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>First {previewRows.length} mapped rows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    {CANONICAL_FIELDS.map((f) => (
                      <th key={f.key} className="whitespace-nowrap px-2 py-1.5 font-medium text-muted-foreground">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-b">
                      {CANONICAL_FIELDS.map((f) => (
                        <td key={f.key} className="whitespace-nowrap px-2 py-1.5">
                          {r[f.key] || <span className="text-muted-foreground">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import action */}
      {headers.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {importableCount} of {mappedRows.length} row
              {mappedRows.length === 1 ? "" : "s"} ready to import.
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isImporting || importableCount === 0}
                onClick={handleImport}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import {importableCount} Lead{importableCount === 1 ? "" : "s"}
                  </>
                )}
              </Button>
              {importError && <p className="text-sm text-red-600">{importError}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Imported leads -- full My Leads functionality (SMS, email, certified mail, voicemail) */}
      <div className="border-t pt-6">
        <LeadsWorkspace importedOnly key={refreshKey} />
      </div>
    </div>
  )
}

export default function ImportPage() {
  const { accountType, isAdmin } = usePin()
  const isPaid = accountType !== "basic" || isAdmin

  if (!isPaid) return <UpgradeGate />
  return <ImportTool />
}
