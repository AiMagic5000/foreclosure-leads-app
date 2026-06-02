"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { usePin } from "@/lib/pin-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Loader2,
  Send,
} from "lucide-react"

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function SmsMessagesPage() {
  const { user, isLoaded } = useUser()
  const { accountType, impersonating } = usePin()
  const hasAccess = accountType === "partnership" || accountType === "junior_owner_operator" || accountType === "owner_operator" || accountType === "admin"

  interface TbState { connected: boolean; deviceId: string; apiKeyMasked: string; messages: { id: string; sender: string; message: string; receivedAt: string }[] }
  const [tb, setTb] = useState<TbState>({ connected: false, deviceId: "", apiKeyMasked: "", messages: [] })
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [deviceIdInput, setDeviceIdInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function saveTextbee() {
    setSaving(true); setSaveErr(null)
    try {
      const res = await fetch("/api/user/textbee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim(), deviceId: deviceIdInput.trim(), asPinId: impersonating?.pinId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Save failed")
      const st = await (await fetch("/api/user/textbee" + (impersonating ? `?asPinId=${impersonating.pinId}` : ""))).json()
      setTb(st); setApiKeyInput(""); setDeviceIdInput("")
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!isLoaded || !user || !hasAccess) {
      setLoading(false)
      return
    }
    fetch("/api/user/textbee" + (impersonating ? `?asPinId=${impersonating.pinId}` : ""))
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setTb(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoaded, user, hasAccess])

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading SMS Messages...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E3A5F" }}>
            SMS Messages
          </h1>
          <p className="text-muted-foreground">Send and manage SMS outreach from your phone</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Partnership Access Required</h3>
            <p className="text-muted-foreground max-w-md">
              SMS messaging is available to Partnership and Owner Operator accounts.
              Contact support to upgrade your access level.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E3A5F" }}>
          SMS Messages
        </h1>
        <p className="text-muted-foreground">
          Send and manage SMS outreach from your phone
        </p>
      </div>

      {/* TextBee SMS connection */}
      {tb.connected ? (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">TextBee is connected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your SMS sends through your own TextBee device &mdash; Device {tb.deviceId}, key {tb.apiKeyMasked}.
                </p>
                <button onClick={() => setTb({ ...tb, connected: false })} className="mt-3 text-sm font-medium text-[#2563eb] hover:underline">
                  Update credentials
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Connect TextBee</CardTitle>
            </div>
            <CardDescription>
              Your outreach sends through TextBee &mdash; a free Android SMS gateway. Connect your own device in about two minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Create a free account at <a href="https://textbee.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-[#2563eb] hover:underline">textbee.dev</a> &mdash; the Free tier is all you need.</li>
              <li>Install the TextBee app on your Android phone and register the device.</li>
              <li>Copy your <strong>API Key</strong> and <strong>Device ID</strong> from the TextBee dashboard and paste them below.</li>
            </ol>
            <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
              <div>
                <label className="text-xs font-medium text-muted-foreground">TextBee API Key</label>
                <Input value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-..." className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Device ID</label>
                <Input value={deviceIdInput} onChange={(e) => setDeviceIdInput(e.target.value)} placeholder="e.g. 688a8bbc6cd203ecb5781c50" className="mt-1" />
              </div>
            </div>
            {saveErr && <p className="text-sm text-red-600">{saveErr}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={saveTextbee} disabled={saving || !apiKeyInput.trim() || !deviceIdInput.trim()} className="bg-[#1E3A5F] text-white hover:bg-[#1E3A5F]/90">
                {saving ? "Connecting..." : "Connect TextBee"}
              </Button>
              <a href="https://app.textbee.dev/dashboard" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#2563eb] hover:underline">
                Open TextBee dashboard <ExternalLink className="inline h-3.5 w-3.5" />
              </a>
              <a href="/dashboard/settings#textbee" className="text-sm font-medium text-slate-500 hover:underline">
                Manage in My Account
              </a>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Section 4: Recent Replies (inbound via TextBee) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Recent Replies</CardTitle>
          </div>
          <CardDescription>
            Text messages homeowners have sent back to your TextBee device
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tb.connected ? (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Connect TextBee above to start receiving replies.</p>
            </div>
          ) : tb.messages.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No replies yet. When a homeowner texts back, it shows up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Received</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">From</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {tb.messages.map((msg) => (
                    <tr key={msg.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 whitespace-nowrap text-muted-foreground">
                        {msg.receivedAt ? formatDateTime(msg.receivedAt) : "—"}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap font-medium">
                        {formatPhone(msg.sender)}
                      </td>
                      <td className="py-3 px-2">
                        <span className="line-clamp-2 max-w-md text-muted-foreground">{msg.message}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: "#1E3A5F" }}>Common Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { q: "Will this affect my existing text messages or conversations?", a: "No. The SMS Gateway app runs completely separate from your regular messaging app. All your existing conversations, contacts, and messages stay exactly where they are. The gateway only sends messages that you queue from the dashboard -- it never touches your personal texts." },
              { q: "Will I lose any text messages on my phone?", a: "Absolutely not. The app does not read, modify, or delete any of your existing messages. It only sends new messages that you create through the web dashboard. Your normal SMS app continues to work exactly as before." },
              { q: "Can I still use my phone normally for texting?", a: "Yes. You can send and receive personal texts as usual. The gateway app runs quietly in the background and only activates when there is a new message queued from the dashboard." },
              { q: "What if I already use another SMS gateway?", a: "You can run both at the same time. The SMS Gateway app does not conflict with any other messaging service. If you want to switch over, just disable the other app when you are ready. No data is lost either way." },
              { q: "Does the app use a lot of battery or data?", a: "No. The app uses very little battery because it only wakes up briefly to check for new messages. Data usage is minimal. Most users do not notice any difference in battery life." },
              { q: "What happens if my phone is off or has no signal?", a: "Messages queue on the server and wait. As soon as your phone comes back online, the app picks up the queued messages and sends them automatically. Nothing is lost." },
              { q: "Can people reply to messages I send through the gateway?", a: "Yes. Messages are sent from your actual phone number, so replies come back to your phone as normal text messages." },
              { q: "Do the people I text know I am using a gateway?", a: "No. Messages appear as normal text messages from your phone number. There is no indication that the message was sent through a web dashboard." },
              { q: "How many messages can I send per day?", a: "There is no limit from the gateway. Your carrier may have daily limits (typically 200-500 depending on your plan). If you hit carrier limits, messages queue and send when the limit resets." },
              { q: "Can I use this on multiple phones?", a: "Yes. You can pair as many Android phones as you want. Each phone sends from its own number. The dashboard shows which device sent each message." },
              { q: "Does this work on iPhone?", a: "The gateway app is Android only. iPhones do not allow third-party apps to send SMS in the background. You can still use the web dashboard from an iPhone browser to view and manage messages." },
              { q: "What permissions does the app need?", a: "The app only needs permission to send SMS messages. It does not access your contacts, photos, camera, microphone, or location. It does not read your existing messages." },
              { q: "Can anyone see my personal texts through this?", a: "No. The gateway server only sees messages you send through the dashboard. It has zero access to your personal conversations, call history, or any other data on your phone." },
              { q: "My phone showed a security warning during install. Is this normal?", a: "Yes. Android shows warnings for any app not from the Google Play Store. You will need to tap Settings, turn on 'Allow from this source', then tap 'More details' and 'Install anyway'. This is standard for all business apps distributed outside of Play Store." },
              { q: "How do I uninstall or disconnect?", a: "Just uninstall the app like any other app. Your personal data, messages, and contacts remain untouched. You can also just turn off the app without uninstalling." },
            ].map(({ q, a }) => (
              <FaqAccordion key={q} question={q} answer={a} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors">
        <span className="text-sm font-medium">{question}</span>
        <svg className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t pt-2">{answer}</div>}
    </div>
  )
}
