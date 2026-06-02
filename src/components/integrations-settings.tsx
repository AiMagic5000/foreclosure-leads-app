"use client"

import { useState, useEffect, useCallback } from "react"
import { usePin } from "@/lib/pin-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Voicemail, MessageSquare, CheckCircle2, Loader2, ExternalLink } from "lucide-react"

function asPinSuffix(pinId?: string) {
  return pinId ? `?asPinId=${pinId}` : ""
}

export function IntegrationsSettings() {
  const { impersonating } = usePin()
  const pinId = impersonating?.pinId
  const q = asPinSuffix(pinId)

  // SlyBroadcast
  const [sbEmail, setSbEmail] = useState("")
  const [sbPass, setSbPass] = useState("")
  const [sbConnected, setSbConnected] = useState(false)
  const [sbBusy, setSbBusy] = useState(false)
  const [sbMsg, setSbMsg] = useState<string | null>(null)

  // TextBee
  const [tbKey, setTbKey] = useState("")
  const [tbDevice, setTbDevice] = useState("")
  const [tbConnected, setTbConnected] = useState(false)
  const [tbBusy, setTbBusy] = useState(false)
  const [tbMsg, setTbMsg] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const [sb, tb] = await Promise.all([
        fetch(`/api/user/slybroadcast${q}`).then((r) => r.json()),
        fetch(`/api/user/textbee${q}`).then((r) => r.json()),
      ])
      setSbConnected(!!sb?.connected)
      if (sb?.emailMasked) setSbEmail(sb.emailMasked)
      setTbConnected(!!tb?.connected)
    } catch { /* ignore */ }
  }, [q])

  useEffect(() => { loadStatus() }, [loadStatus])

  async function saveSly() {
    setSbBusy(true); setSbMsg(null)
    try {
      const res = await fetch("/api/user/slybroadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sbEmail.trim(), password: sbPass.trim(), asPinId: pinId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Save failed")
      setSbConnected(true); setSbPass(""); setSbMsg("Saved — your ringless voicemails are wired up.")
    } catch (e) { setSbMsg(e instanceof Error ? e.message : "Save failed") } finally { setSbBusy(false) }
  }

  async function saveTextbee() {
    setTbBusy(true); setTbMsg(null)
    try {
      const res = await fetch("/api/user/textbee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: tbKey.trim(), deviceId: tbDevice.trim(), asPinId: pinId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Save failed")
      setTbConnected(true); setTbKey(""); setTbDevice(""); setTbMsg("Saved — your SMS gateway is connected.")
    } catch (e) { setTbMsg(e instanceof Error ? e.message : "Save failed") } finally { setTbBusy(false) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* SlyBroadcast / Ringless */}
      <Card id="slybroadcast" className="scroll-mt-24 border-2 border-[#1a7a3a]/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Voicemail className="h-5 w-5 text-[#1a7a3a]" />
            <CardTitle>Ringless Voicemail (SlyBroadcast)</CardTitle>
            {sbConnected && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected
              </span>
            )}
          </div>
          <CardDescription>
            Add the login you created at{" "}
            <a href="https://www.slybroadcast.com/signup.php" target="_blank" rel="noopener noreferrer" className="font-medium text-[#1a7a3a] underline">
              slybroadcast.com <ExternalLink className="inline h-3 w-3" />
            </a>{" "}
            so we can send your drips.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">SlyBroadcast email / username</label>
            <Input value={sbEmail} onChange={(e) => setSbEmail(e.target.value)} placeholder="you@email.com" autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">SlyBroadcast password</label>
            <Input type="password" value={sbPass} onChange={(e) => setSbPass(e.target.value)} placeholder={sbConnected ? "•••••••• (saved)" : "Your password"} autoComplete="off" />
          </div>
          <Button onClick={saveSly} disabled={sbBusy} className="w-full bg-[#1a7a3a] hover:bg-[#156030]">
            {sbBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : sbConnected ? "Update credentials" : "Save credentials"}
          </Button>
          {sbMsg && <p className="text-sm text-slate-600">{sbMsg}</p>}
        </CardContent>
      </Card>

      {/* TextBee / SMS */}
      <Card id="textbee" className="scroll-mt-24 border-2 border-[#2563eb]/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#2563eb]" />
            <CardTitle>SMS Gateway (TextBee)</CardTitle>
            {tbConnected && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected
              </span>
            )}
          </div>
          <CardDescription>
            From{" "}
            <a href="https://app.textbee.dev/dashboard" target="_blank" rel="noopener noreferrer" className="font-medium text-[#2563eb] underline">
              app.textbee.dev <ExternalLink className="inline h-3 w-3" />
            </a>{" "}
            — generate an API key and copy your Device ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">API Key</label>
            <Input value={tbKey} onChange={(e) => setTbKey(e.target.value)} placeholder={tbConnected ? "•••• (saved — paste to replace)" : "Your TextBee API key"} autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Device ID</label>
            <Input value={tbDevice} onChange={(e) => setTbDevice(e.target.value)} placeholder={tbConnected ? "•••• (saved)" : "Your device ID"} autoComplete="off" />
          </div>
          <Button onClick={saveTextbee} disabled={tbBusy} className="w-full bg-[#2563eb] hover:bg-[#1d4fd7]">
            {tbBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : tbConnected ? "Update credentials" : "Save credentials"}
          </Button>
          {tbMsg && <p className="text-sm text-slate-600">{tbMsg}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
