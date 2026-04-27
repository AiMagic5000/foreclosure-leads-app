"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { usePin } from "@/lib/pin-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Clock,
  ArrowRight,
  Loader2,
  Send,
  XCircle,
} from "lucide-react"

const SMS_PORTAL_URL = "https://sms.alwaysencrypted.com"
const SMS_API_URL = "https://sms-api.alwaysencrypted.com"
const GATEWAY_TOKEN = "71c22b1899596908dce80c03f42ef09a082f10a74bdc25fdb49bfa62dc87ebde"
const APK_DOWNLOAD_URL = "https://seafile.alwaysencrypted.com/f/aae0cf4a0fbf46ab8644/?dl=1"

interface SmsMessage {
  id: string
  recipient: string
  message: string
  status: "delivered" | "pending" | "failed"
  sent_at: string
}

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [value])

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
        <code className="flex-1 text-sm font-mono break-all select-all">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: SmsMessage["status"] }) {
  switch (status) {
    case "delivered":
      return (
        <Badge variant="outline" className="bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Delivered
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-300">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      )
  }
}

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
  const { accountType } = usePin()
  const hasAccess = accountType === "partnership" || accountType === "owner_operator" || accountType === "admin"

  const [gatewayConnected, setGatewayConnected] = useState<boolean | null>(null)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [messagesSent, setMessagesSent] = useState<number>(0)
  const [recentMessages, setRecentMessages] = useState<SmsMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user || !hasAccess) {
      setLoading(false)
      return
    }

    // Check gateway status and fetch recent messages
    async function fetchData() {
      try {
        const res = await fetch(`${SMS_API_URL}/api/v1/gateway/devices`, {
          headers: { "x-api-key": GATEWAY_TOKEN },
        })
        if (res.ok) {
          const data = await res.json()
          const devices = data?.data || data?.devices || []
          if (devices.length > 0) {
            const device = devices[0]
            setGatewayConnected(true)
            setDeviceName(device.name || device.model || "Android Device")
            setLastSeen(device.lastSeen || device.updatedAt || null)
            setMessagesSent(device.messagesSent || device.sentCount || 0)
          } else {
            setGatewayConnected(false)
          }
        } else {
          setGatewayConnected(false)
        }
      } catch {
        setGatewayConnected(false)
      }

      // Fetch recent messages
      try {
        const res = await fetch(`${SMS_API_URL}/api/v1/gateway/devices/${GATEWAY_TOKEN}/sms?limit=10`, {
          headers: { "x-api-key": GATEWAY_TOKEN },
        })
        if (res.ok) {
          const data = await res.json()
          const messages = data?.data || data?.messages || []
          setRecentMessages(
            messages.slice(0, 10).map((m: Record<string, unknown>) => ({
              id: (m.id || m._id || crypto.randomUUID()) as string,
              recipient: (m.recipient || m.to || m.phone || "") as string,
              message: (m.message || m.body || m.text || "") as string,
              status: (m.status === "failed" ? "failed" : m.status === "pending" ? "pending" : "delivered") as SmsMessage["status"],
              sent_at: (m.sent_at || m.sentAt || m.createdAt || m.created_at || new Date().toISOString()) as string,
            }))
          )
        }
      } catch {
        // Messages fetch failed silently -- table will show empty state
      }

      setLoading(false)
    }

    fetchData()
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

      {/* Section 1: Connection Status */}
      {gatewayConnected === true ? (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Your SMS Gateway is Active
                </h3>
                <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Device: </span>
                    <span className="font-medium">{deviceName}</span>
                  </div>
                  {lastSeen && (
                    <div>
                      <span className="text-muted-foreground">Last seen: </span>
                      <span className="font-medium">{formatDateTime(lastSeen)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Messages sent: </span>
                    <span className="font-medium">{messagesSent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : gatewayConnected === false ? (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Set Up Your SMS Gateway
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Android phone to start sending SMS messages automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Section 2: Quick Setup (only if not connected) */}
      {gatewayConnected === false && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Quick Setup</CardTitle>
            </div>
            <CardDescription>
              Three steps to connect your phone as an SMS gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A5F] text-white text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-sm">Download</p>
                <p className="text-sm text-muted-foreground">
                  Download the free SMS Gateway app to your Android phone.
                </p>
                <a
                  href={APK_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    Download App
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>

            <div className="border-t" />

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A5F] text-white text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1 space-y-3">
                <p className="font-semibold text-sm">Connect</p>
                <p className="text-sm text-muted-foreground">
                  Open the app, tap <strong>Private Server</strong>, and enter these details:
                </p>
                <div className="space-y-3 max-w-lg">
                  <CopyBox label="Server URL" value={SMS_API_URL} />
                  <CopyBox label="API Token" value={GATEWAY_TOKEN} />
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A5F] text-white text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-sm">Done</p>
                <p className="text-sm text-muted-foreground">
                  Your phone will start sending messages automatically. You can also view
                  and reply to messages from this dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: SMS Portal Link */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Full SMS Portal</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  View your full SMS inbox, conversations, and reply to messages from any device.
                </p>
              </div>
            </div>
            <a
              href={SMS_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <Button className="bg-[#1E3A5F] hover:bg-[#162d4a] text-white">
                Open SMS Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-3 ml-14">
            You can also access this from your phone's browser.
          </p>
        </CardContent>
      </Card>

      {/* Section 4: Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </div>
          <CardDescription>
            Last 10 SMS messages sent from your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No messages sent yet. Set up your gateway to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date/Time</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Recipient</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Message</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((msg) => (
                    <tr key={msg.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(msg.sent_at)}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap font-medium">
                        {formatPhone(msg.recipient)}
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <span className="line-clamp-1 max-w-xs text-muted-foreground">
                          {msg.message}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={msg.status} />
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
