"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { FileFolder } from "@/components/file-folder"
import {
  Bot, Mic, Square, Upload, Loader2, ShieldCheck, Sparkles, Camera,
  CheckCircle2, Mail, MessageSquare, Voicemail, PhoneCall, Clock, Image as ImageIcon,
  ChevronDown, Download, Star,
} from "lucide-react"

interface Recording { name: string; label: string; url: string; created: string | null; size: number }
interface Doc { name: string; label: string; url: string; created: string | null; size: number }

// Three reference poses we need to build a realistic video avatar.
const POSES = [
  { key: "front", label: "Front", hint: "Face the camera straight on" },
  { key: "left", label: "Left side", hint: "Turn ~45° to your left" },
  { key: "right", label: "Right side", hint: "Turn ~45° to your right" },
] as const

// Easy, warm read-aloud passages (~1 minute each) so the agent has something natural
// to read while we capture clean voice for cloning. Expressive everyday topics read
// better than technical text.
const READING_SCRIPTS = [
  {
    title: "A morning walk",
    text: "There is something peaceful about an early morning walk. The air is cool and still, and the streets are quiet before the day begins. You can hear birds in the trees, and the sky slowly turns from gray to soft gold. With every step, your mind clears a little more. You notice small things you usually rush past — a neighbor's garden, a friendly dog, the smell of fresh coffee from an open window. Walking is one of the simplest ways to feel better. It costs nothing, it asks for nothing, and it gives you a few quiet minutes that belong only to you. By the time you head back home, you feel awake, calm, and ready for whatever the day brings. A short walk can change the whole shape of your day, and it reminds you that the best things in life are often very simple.",
  },
  {
    title: "Why we love stories",
    text: "People have told stories for as long as we can remember. Long before books or phones, families gathered around a fire and shared tales of adventure, courage, and love. A good story pulls you in and makes you forget the time. You feel what the characters feel, and for a little while, their world becomes your own. Stories teach us without ever lecturing. They show us how other people live, what they fear, and what they hope for. They help us understand people who are nothing like us, and they remind us that we are not alone in what we feel. Whether it is a movie, a song, or a quiet conversation at the end of the day, a good story has the power to comfort us, to inspire us, and to bring people closer together. That is why we will always love them.",
  },
  {
    title: "The comfort of a good meal",
    text: "Few things bring people together like a good meal. The kitchen fills with warm smells, the table is set, and slowly everyone gathers around. It does not have to be fancy. Sometimes the best meals are the simplest ones, made with care and shared with people you love. Food is about more than just eating. It is about taking a moment to slow down, to talk, and to enjoy each other's company. A shared meal can turn an ordinary evening into a memory you keep for years. We laugh, we tell stories, and we forget our worries for a while. Long after the plates are cleared, what we remember is the feeling — the warmth, the laughter, and the simple sense that we belong. A good meal feeds the body, but the time we spend around the table feeds something even deeper.",
  },
]

// Single source for the consent wording — shown on the agree screen and in the
// "view the agreement you accepted" dropdown after the agent consents.
const CONSENT_TEXT = "You keep all rights to your name, voice, and likeness. By agreeing, you give Foreclosure Recovery Inc. permission to create and electronically transmit your cloned voice and video avatar for your claimant communications via SMS, email, ringless voicemail, and an optional AI outbound agent that works on your behalf. You can withdraw consent at any time by contacting support, after which we stop using and delete your voice and avatar assets."

export default function AiAgentPage() {
  // Available on every tier — basic accounts can set up their avatar too.
  const { impersonating } = usePin()
  const asPinQ = impersonating ? `?asPinId=${impersonating.pinId}` : ""

  const [consented, setConsented] = useState(false)
  const [agreeChecked, setAgreeChecked] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  // voice
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // images
  const [docs, setDocs] = useState<Doc[]>([])
  const [uploadingPose, setUploadingPose] = useState<string | null>(null)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)
  const [cameraPose, setCameraPose] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const camStreamRef = useRef<MediaStream | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const [c, v, d] = await Promise.all([
        fetch("/api/user/ai-agent-consent").then((r) => r.json()).catch(() => ({})),
        fetch(`/api/user/voice-recordings${asPinQ}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/user/documents?folder=ai-avatar${impersonating ? `&asPinId=${impersonating.pinId}` : ""}`).then((r) => r.json()).catch(() => ({})),
      ])
      if (c?.consented) setConsented(true)
      setRecordings(v?.recordings || [])
      setDocs(d?.documents || [])
    } catch { /* ignore */ }
  }, [asPinQ, impersonating])

  useEffect(() => { loadAll() }, [loadAll])

  // Attach the live camera stream to the preview when the capture modal opens.
  useEffect(() => {
    if (cameraPose && videoRef.current && camStreamRef.current) {
      videoRef.current.srcObject = camStreamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraPose])

  async function grantConsent() {
    setSavingConsent(true); setErr(null)
    try {
      const res = await fetch("/api/user/ai-agent-consent", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agreed: true }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not save consent")
      setConsented(true)
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not save consent") } finally { setSavingConsent(false) }
  }

  // ---- voice (same capture as Ringless Drips) ----
  async function uploadVoice(blob: Blob, ext: string) {
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      const label = `voiceclone-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}`
      fd.append("file", blob, `${label}.${ext}`)
      fd.append("label", label)
      if (impersonating) fd.append("asPinId", impersonating.pinId)
      const res = await fetch(`/api/user/voice-recordings?ts=${Date.now()}`, { method: "POST", body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Upload failed")
      await loadAll()
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed") } finally { setBusy(false) }
  }

  async function startRecording() {
    setErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const candidates = ["audio/mp4", "audio/mpeg", "audio/webm;codecs=opus", "audio/webm"]
      const supported = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
        ? candidates.find((t) => MediaRecorder.isTypeSupported(t)) : undefined
      const mr = supported ? new MediaRecorder(stream, { mimeType: supported }) : new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onerror = () => { setErr("Recording was interrupted by the browser. Please try again, or upload an audio file instead."); stopRecording() }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const mt = mr.mimeType || "audio/webm"
        const ext = mt.includes("mp4") ? "m4a" : mt.includes("mpeg") ? "mp3" : mt.includes("ogg") ? "ogg" : "webm"
        const blob = new Blob(chunksRef.current, { type: mt })
        if (blob.size < 1024) { setErr("That recording came back empty — your browser may have blocked the mic. Please try again, or upload an audio file."); return }
        uploadVoice(blob, ext)
      }
      stream.getAudioTracks().forEach((t) => { t.onended = () => stopRecording() })
      mr.start(1000); mediaRef.current = mr // timeslice so nothing is lost if it stops early
      setRecording(true); setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => { if (s >= 120) stopRecording(); return s + 1 }), 1000)
    } catch { setErr("Microphone access denied. Allow mic permission, or upload an audio file instead.") }
  }
  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop(); setRecording(false)
  }
  async function onAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) await uploadVoice(f, (f.name.split(".").pop() || "mp3"))
    e.target.value = ""
  }
  async function delVoice(name: string) {
    await fetch(`/api/user/voice-recordings?name=${encodeURIComponent(name)}${impersonating ? `&asPinId=${impersonating.pinId}` : ""}`, { method: "DELETE" })
    loadAll()
  }

  // ---- images (3 poses) — shared upload for both file-picker and live camera ----
  async function uploadPose(poseKey: string, blob: Blob, ext: string) {
    setUploadingPose(poseKey); setErr(null)
    try {
      const fd = new FormData()
      fd.append("file", blob, `${poseKey}.${ext}`)
      fd.append("folder", "ai-avatar")
      if (impersonating) fd.append("asPinId", impersonating.pinId)
      const res = await fetch("/api/user/documents", { method: "POST", body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Upload failed")
      await loadAll()
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "Upload failed") } finally { setUploadingPose(null) }
  }
  async function onPoseFile(poseKey: string, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""
    if (f) await uploadPose(poseKey, f, f.name.split(".").pop() || "jpg")
  }

  // Promote an existing (older) photo to be the slot's primary. The documents API
  // PATCH renames it with a fresh timestamp prefix, so it sorts newest-first and
  // becomes the displayed primary; the previously-primary photo drops into the
  // slot's slideshow of older photos.
  async function setPrimaryPose(poseKey: string, doc: Doc) {
    setSettingPrimary(doc.name); setErr(null)
    try {
      const res = await fetch("/api/user/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: doc.name, label: poseKey, folder: "ai-avatar", ...(impersonating ? { asPinId: impersonating.pinId } : {}) }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not set primary photo")
      await loadAll()
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "Could not set primary photo") } finally { setSettingPrimary(null) }
  }

  // Live webcam / phone-camera capture for a pose.
  async function openCamera(poseKey: string) {
    setErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false,
      })
      camStreamRef.current = stream
      setCameraPose(poseKey)
    } catch { setErr("Camera access denied. Allow camera permission, or use Upload instead.") }
  }
  function closeCamera() {
    camStreamRef.current?.getTracks().forEach((t) => t.stop())
    camStreamRef.current = null
    setCameraPose(null)
  }
  function capturePhoto() {
    const v = videoRef.current; const pose = cameraPose
    if (!v || !pose) return
    const canvas = document.createElement("canvas")
    canvas.width = v.videoWidth || 720; canvas.height = v.videoHeight || 960
    canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => { if (blob) uploadPose(pose, blob, "jpg"); closeCamera() }, "image/jpeg", 0.92)
  }

  const poseDoc = (key: string) => docs.find((d) => d.name.replace(/^\d+-/, "").toLowerCase().startsWith(key))
  // All photos for a pose, newest-first (the API returns docs sorted by created_at desc).
  // [0] is the current primary; the rest are older primaries shown in the slot's slideshow.
  const poseDocs = (key: string) => docs.filter((d) => d.name.replace(/^\d+-/, "").toLowerCase().startsWith(key))

  const gateCls = consented ? "" : "pointer-events-none select-none opacity-50"

  return (
    <div className="max-w-5xl space-y-8 pb-16 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white"><Bot className="h-6 w-6" /></div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E3A5F]">My AI Avatar</h1>
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">Beta</span>
          </div>
          <p className="text-sm text-slate-500">Clone your voice and build your video avatar — so your claimants warm up to you while you focus elsewhere.</p>
        </div>
      </div>

      {/* VSL */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0f172a] shadow-sm">
        {!videoFailed ? (
          <video
            controls
            playsInline
            poster="/images/ai-agent-intro-poster.jpg"
            className="aspect-video w-full bg-black"
            onError={() => setVideoFailed(true)}
          >
            <source src="/videos/ai-agent-intro.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-700 to-[#0f172a] text-center text-white">
            <Sparkles className="h-8 w-8" />
            <p className="text-lg font-bold">Meet your AI Agent</p>
            <p className="max-w-md text-sm text-slate-300">A 60-second walkthrough of how your voice + avatar build trust with claimants on autopilot. (Intro video rendering — drops here shortly.)</p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Voicemail, "Your real voice", "Ringless voicemails drop in your own voice, so the first time a claimant hears you it already feels familiar."],
          [Camera, "Your video avatar", "A realistic on-camera intro for email and your landing page — you, introducing yourself, without filming every time."],
          [PhoneCall, "Warms the relationship", "Consistent, friendly touches across SMS, email, and voicemail build trust before you ever pick up the phone."],
          [Clock, "Works while you focus", "Your AI agent nurtures every claimant in the background while you spend your time closing and filing."],
        ].map(([Icon, t, b]) => {
          const I = Icon as typeof Bot
          return (
            <div key={t as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <I className="h-6 w-6 text-violet-600" />
              <h3 className="mt-3 text-sm font-bold text-[#0f172a]">{t as string}</h3>
              <p className="mt-1 text-sm text-slate-600">{b as string}</p>
            </div>
          )
        })}
      </div>

      {/* Example realism */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-bold text-[#0f172a]">The realism we build to</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">Your avatar is built to look like a real, professional headshot — examples below. Good source photos (clear, well-lit, front + both sides) are what make it convincing.</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["/images/ai-avatar-example-male.jpg", "Example avatar"],
            ["/images/ai-avatar-example-female.jpg", "Example avatar"],
            ["/images/ai-avatar-example-black-male.jpg", "Example avatar"],
            ["/images/ai-avatar-example-hispanic-female.jpg", "Example avatar"],
          ].map(([src, alt]) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={alt} className="aspect-[3/4] w-full rounded-xl border border-slate-200 object-cover" />
          ))}
        </div>
      </div>

      {/* Consent */}
      <div className={`rounded-2xl border-2 p-6 shadow-sm ${consented ? "border-emerald-200 bg-emerald-50" : "border-violet-300 bg-violet-50"}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className={`h-5 w-5 ${consented ? "text-emerald-600" : "text-violet-600"}`} />
          <h2 className="text-lg font-bold text-[#0f172a]">Likeness &amp; communication consent</h2>
        </div>
        {consented ? (
          <div className="mt-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> You&apos;ve granted consent. Your voice + avatar capture is unlocked below.</p>
            <details className="group mt-3 rounded-xl border border-emerald-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <span>View the agreement you accepted</span>
                <ChevronDown className="h-4 w-4 flex-none text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-sm leading-6 text-slate-600">{CONSENT_TEXT}</p>
            </details>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-700">
              You keep <strong>all rights to your name, voice, and likeness</strong>. By agreeing, you give Foreclosure Recovery Inc.
              permission to create and electronically transmit your cloned voice and video avatar for <strong>your</strong> claimant
              communications via <strong>SMS, email, ringless voicemail, and an optional AI outbound agent</strong> that works on your
              behalf. You can withdraw consent at any time by contacting support, after which we stop using and delete your voice + avatar assets.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-[#0f172a]">
              <input type="checkbox" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)} className="mt-0.5 h-4 w-4" />
              <span>I have read and agree. I authorize the creation and electronic transmission of my voice + likeness for my claimant communications as described above.</span>
            </label>
            <button
              onClick={grantConsent}
              disabled={!agreeChecked || savingConsent}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {savingConsent ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Agree &amp; unlock capture
            </button>
          </>
        )}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {/* Voice clone */}
      <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition ${gateCls}`}>
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-[#D82221]" />
          <h2 className="text-lg font-bold text-[#0f172a]">1. Clone your voice</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">Record about <strong>one minute</strong> reading naturally and expressively. Pick one of the passages below, open it, and read it aloud — a few takes is even better. We use these to clone your voice for ringless voicemail drops.</p>

        {/* Read-aloud passages — ~1 minute each */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pick a passage and read it aloud</p>
          {READING_SCRIPTS.map((s, i) => (
            <details key={s.title} className="group rounded-xl border border-slate-200 bg-slate-50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-[#0f172a]">
                <span>{i + 1}. {s.title} <span className="ml-1 font-normal text-slate-400">· about 1 minute</span></span>
                <ChevronDown className="h-4 w-4 flex-none text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-[15px] leading-7 text-slate-700">{s.text}</p>
            </details>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!recording ? (
            <button onClick={startRecording} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#D82221] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"><Mic className="h-4 w-4" /> Record now</button>
          ) : (
            <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"><Square className="h-4 w-4 fill-white" /> Stop ({elapsed}s)</button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Upload audio
            <input type="file" accept="audio/*" onChange={onAudioFile} className="hidden" />
          </label>
          {busy && <span className="inline-flex items-center gap-1 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span>}
          {recording && <span className="text-sm font-medium text-[#D82221]">● Recording — read naturally…</span>}
        </div>
        {recordings.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {recordings.map((r) => (
              <FileFolder key={r.name} label={r.label} audioSrc={r.url} onDownload={() => window.open(r.url, "_blank")} onDelete={() => delVoice(r.name)} />
            ))}
          </div>
        )}
      </div>

      {/* Avatar photos */}
      <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition ${gateCls}`}>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-bold text-[#0f172a]">2. Three photos for your avatar</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">Upload a clear, well-lit photo from each angle, or use your camera. Set the <strong>primary</strong> photo for each slot — your older photos stay in that slot&apos;s slideshow so you can switch back anytime. These build your video avatar, used for your email, SMS, and landing-page introductions to your claimants.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {POSES.map((p) => {
            const all = poseDocs(p.key)
            const doc = all[0]            // current primary (newest)
            const older = all.slice(1)    // previous primaries -> slideshow
            const isUp = uploadingPose === p.key
            return (
              <div key={p.key} className="flex flex-col gap-2">
                <div className="group relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center">
                  {doc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.url} alt={p.label} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <>
                      <Camera className="h-7 w-7 text-slate-400" />
                      <span className="mt-2 text-sm font-bold text-[#0f172a]">{p.label}</span>
                      <span className="mt-0.5 px-2 text-xs text-slate-500">{p.hint}</span>
                    </>
                  )}
                  {doc && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white"><CheckCircle2 className="h-3 w-3" /> {p.label} · Primary</span>}
                  {doc && (
                    <a
                      href={`${doc.url}${doc.url.includes("?") ? "&" : "?"}download=${encodeURIComponent(doc.label || p.key)}`}
                      download={doc.label || `${p.key}.jpg`}
                      onClick={(e) => e.stopPropagation()}
                      title="Download original image"
                      className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-800 shadow transition hover:bg-white"
                    >
                      <Download className="h-3 w-3" /> Save
                    </a>
                  )}
                  {isUp && <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-white"><Loader2 className="h-6 w-6 animate-spin" /></span>}
                  <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/20 text-[11px] font-bold text-white">
                    <button type="button" onClick={() => openCamera(p.key)} className="flex flex-1 items-center justify-center gap-1 bg-violet-600/90 py-2 transition hover:bg-violet-600"><Camera className="h-3.5 w-3.5" /> Camera</button>
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 bg-slate-800/85 py-2 transition hover:bg-slate-800"><Upload className="h-3.5 w-3.5" /> Upload<input type="file" accept="image/*" onChange={(e) => onPoseFile(p.key, e)} className="hidden" /></label>
                  </div>
                </div>

                {/* Slideshow of older photos for this slot — tap one to make it primary */}
                {older.length > 0 && (
                  <div>
                    <p className="px-0.5 text-[11px] font-semibold text-slate-500">Your other {p.label.toLowerCase()} photos — tap to make primary</p>
                    <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
                      {older.map((od) => {
                        const setting = settingPrimary === od.name
                        return (
                          <button
                            key={od.name}
                            type="button"
                            onClick={() => setPrimaryPose(p.key, od)}
                            disabled={setting}
                            title="Make this the primary photo"
                            className="relative h-16 w-12 flex-none overflow-hidden rounded-md border border-slate-200 ring-offset-1 transition hover:ring-2 hover:ring-violet-500 disabled:opacity-60"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={od.url} alt="Previous photo" className="h-full w-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                              {setting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Star className="h-4 w-4 text-white opacity-0 drop-shadow transition hover:opacity-100" />}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Example claimant landing page */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          Your SMS messages and emails include GIF images that look like videos — your claimant taps one to meet your AI agent, so they can put a face with the name behind every message. You&apos;re also welcome to add your social media to your communications.
        </div>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-bold text-[#0f172a]">Example: your claimant intro page</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">This is the kind of landing page your avatar and voice power — a warm, trustworthy intro that confirms you are real and walks the claimant to the next step. It stays inside your platform; claimants never leave.</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <iframe src="/meet-your-agents-example.html" title="Example claimant intro landing page" className="h-[640px] w-full bg-white" />
        </div>
      </div>

      {/* Upsell note */}
      <div className="rounded-2xl bg-[#0f172a] p-6 text-white sm:p-8">
        <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-violet-300" /><MessageSquare className="h-5 w-5 text-violet-300" /></div>
        <h2 className="mt-3 text-xl font-bold">Then your AI agent goes to work</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Once your voice + avatar are built, we wire them into your claimant outreach — voicemail, email, and SMS in your own voice and face.</p>
        <a href="tel:+18885458007" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-base font-bold text-white transition hover:opacity-90"><PhoneCall className="h-5 w-5" /> Questions? (888) 545-8007</a>
      </div>

      {/* Live camera capture modal */}
      {cameraPose && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} autoPlay playsInline muted className="max-h-[68vh] w-auto rounded-2xl border border-white/10" />
          <p className="mt-3 text-sm text-white/80">
            <span className="font-bold text-white">{POSES.find((p) => p.key === cameraPose)?.label}</span> — {POSES.find((p) => p.key === cameraPose)?.hint}
          </p>
          <div className="mt-4 flex gap-3">
            <button onClick={capturePhoto} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"><Camera className="h-4 w-4" /> Capture photo</button>
            <button onClick={closeCamera} className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
