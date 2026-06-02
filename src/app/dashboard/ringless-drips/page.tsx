"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Mic, Square, Upload, Trash2, Phone, Loader2, Voicemail, CheckCircle2, ArrowRight } from "lucide-react"

interface Recording { name: string; label: string; url: string; created: string | null; size: number }

export default function RinglessDripsPage() {
  const { impersonating } = usePin()
  const asPinQ = impersonating ? `?asPinId=${impersonating.pinId}` : ""

  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/voice-recordings${asPinQ}`)
      const d = await res.json()
      setRecordings(d.recordings || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [asPinQ])

  useEffect(() => { load() }, [load])

  async function upload(blob: Blob, ext: string) {
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      const label = `voice-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}`
      fd.append("file", blob, `${label}.${ext}`)
      fd.append("label", label)
      if (impersonating) fd.append("asPinId", impersonating.pinId)
      const res = await fetch(`/api/user/voice-recordings?ts=${Date.now()}`, { method: "POST", body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Upload failed")
      await load()
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed") } finally { setBusy(false) }
  }

  async function startRecording() {
    setErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        upload(blob, "webm")
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true); setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => {
        if (s >= 75) { stopRecording() } // hard cap ~75s
        return s + 1
      }), 1000)
    } catch {
      setErr("Microphone access denied. Allow mic permission, or upload an audio file instead.")
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop()
    setRecording(false)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) await upload(f, (f.name.split(".").pop() || "mp3"))
    e.target.value = ""
  }

  async function del(name: string) {
    await fetch(`/api/user/voice-recordings?name=${encodeURIComponent(name)}${impersonating ? `&asPinId=${impersonating.pinId}` : ""}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Voicemail className="h-6 w-6 text-[#D82221]" />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E3A5F" }}>Ringless Drips</h1>
        </div>
        <p className="mt-1 text-muted-foreground">Record your real voice once — we turn it into scheduled ringless voicemails that drip to your claimants.</p>
      </div>

      {/* Voice recordings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0f172a]">Your voice recordings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Record <strong>about one minute</strong> of yourself reading naturally and expressively &mdash; a passage from a
          book, a web page, anything. Do a few. We use your real, warm voice to build multiple ringless voicemails that
          get scheduled across a drip sequence to your claimants &mdash; far more effective than a robotic message.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!recording ? (
            <button onClick={startRecording} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#D82221] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
              <Mic className="h-4 w-4" /> Record now
            </button>
          ) : (
            <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
              <Square className="h-4 w-4 fill-white" /> Stop ({elapsed}s)
            </button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Upload audio
            <input type="file" accept="audio/*" onChange={onFile} className="hidden" />
          </label>
          {busy && <span className="inline-flex items-center gap-1 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span>}
          {recording && <span className="text-sm font-medium text-[#D82221]">● Recording — read naturally…</span>}
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading recordings…</div>
          ) : recordings.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">No recordings yet. Record or upload your first one above.</p>
          ) : (
            recordings.map((r) => (
              <div key={r.name} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" />
                <span className="text-sm font-medium text-[#0f172a]">{r.label}</span>
                <audio controls src={r.url} className="h-8 max-w-[280px] flex-1" />
                <button onClick={() => del(r.name)} aria-label="Delete" className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SlyBroadcast setup */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1a7a3a]">Ringless Voicemail Engine</p>
        <h2 className="mt-1 text-lg font-bold text-[#0f172a]">Set up SlyBroadcast</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your ringless voicemails are delivered through SlyBroadcast &mdash; they land in a prospect&apos;s voicemail
          without their phone ringing, a proven way to generate warm callbacks. Set it up once:
        </p>
        <ol className="mt-3 space-y-2 text-sm text-slate-700">
          <li><strong className="text-[#0f172a]">1.</strong> Create an account at <a href="https://www.slybroadcast.com/signup.php" target="_blank" rel="noopener noreferrer" className="font-medium text-[#1a7a3a] underline">slybroadcast.com/signup.php</a>.</li>
          <li><strong className="text-[#0f172a]">2.</strong> Add a payment method and deposit $10 to activate the service.</li>
          <li><strong className="text-[#0f172a]">3.</strong> Add your SlyBroadcast login on your <strong className="text-[#0f172a]">My Account</strong> page so we can wire your recordings into your drip campaigns.</li>
        </ol>
        <a href="/dashboard/settings#slybroadcast" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1a7a3a] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
          Add my SlyBroadcast login <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* How drips work */}
      <div className="rounded-2xl bg-[#0f172a] p-6 text-white sm:p-8">
        <h2 className="text-xl font-bold">How your ringless drips work</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["1. You record", "A minute of your natural voice — a few takes."],
            ["2. We build the drops", "Your recordings become personalized ringless voicemails."],
            ["3. They drip out", "Scheduled across days to each claimant, driving warm callbacks and signed deals."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl bg-white/5 p-4">
              <p className="font-semibold text-white">{t}</p>
              <p className="mt-1 text-sm text-slate-300">{b}</p>
            </div>
          ))}
        </div>
        <a href="tel:+18885458007" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#D82221] px-5 py-3 text-base font-bold text-white transition hover:opacity-90">
          <Phone className="h-5 w-5" /> Questions? (888) 545-8007
        </a>
      </div>
    </div>
  )
}
