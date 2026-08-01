"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Copy, Check, Megaphone } from "lucide-react"
import { usePin } from "@/lib/pin-context"

// "My Landing Pages" card for the My Account tab. Shows the agent's two
// marketing links (personal agent page + claim-with lander) with copy buttons.
// Hidden entirely until the automation has set at least one URL. When an admin
// is viewing-as an agent, shows the AGENT's links (asPinId verified server-side).
export function MyLandersSection() {
  const { impersonating } = usePin()
  const [agentPageUrl, setAgentPageUrl] = useState<string | null>(null)
  const [claimLanderUrl, setClaimLanderUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const url = "/api/my-landers" + (impersonating?.pinId ? `?asPinId=${encodeURIComponent(impersonating.pinId)}` : "")
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setAgentPageUrl(d.agentPageUrl || null)
        setClaimLanderUrl(d.claimLanderUrl || null)
      })
      .catch(() => {})
  }, [impersonating?.pinId])

  if (!agentPageUrl && !claimLanderUrl) return null

  const copy = (key: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  const row = (key: string, label: string, hint: string, url: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">{url}</a>
      </div>
      <Button size="sm" variant="outline" className="shrink-0" onClick={() => copy(key, url)}>
        {copied === key ? <Check className="h-4 w-4 mr-1.5 text-emerald-600" /> : <Copy className="h-4 w-4 mr-1.5" />}
        {copied === key ? "Copied" : "Copy"}
      </Button>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-700" />
          <CardTitle>My Landing Pages</CardTitle>
        </div>
        <CardDescription>Your personal marketing links — share them anywhere</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {agentPageUrl && row("agent", "My Agent Page", "Your personal intro page with your AI avatar video.", agentPageUrl)}
        {claimLanderUrl && row("claim", "My Claim Page", "Homeowners submit their info here — you get an email on every submission.", claimLanderUrl)}
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
          <Megaphone className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Put these links on Instagram, Facebook, TikTok, business cards, ads, and in your outreach messages. When a homeowner submits the claim form, the details go straight to your business email.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
