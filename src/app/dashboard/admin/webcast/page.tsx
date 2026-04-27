'use client'

import { useState, useEffect, useCallback } from 'react'

interface Stats {
  totalRegistrants: number
  totalAttended: number
  totalPartnerApps: number
  totalProvisioned: number
  pendingEmails: number
  pendingSms: number
  voiceDropsSent: number
  attendanceRate: number
}

interface DripStats {
  pending: number
  sent: number
  failed: number
  skipped: number
}

interface Lead {
  id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  status: string
  created_at: string
  leads_account_provisioned: boolean
  voice_drop_sent: boolean
  email_drip_step: number | null
  sms_drip_step: number | null
  sms_consent: boolean
  assigned_session_time: string | null
}

interface PartnerApp {
  id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  state: string | null
  experience: string | null
  message: string | null
  status: string
  created_at: string
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    registered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    attended: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    converted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>
      {status}
    </span>
  )
}

export default function WebcastAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [dripStats, setDripStats] = useState<DripStats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [partnerApps, setPartnerApps] = useState<PartnerApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'registrants' | 'applications'>('registrants')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/webcast/admin/stats')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setStats(data.stats)
      setDripStats(data.dripStats)
      setLeads(data.recentLeads)
      setPartnerApps(data.recentPartnerApps)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
          <button onClick={fetchData} className="mt-2 text-sm underline text-red-600">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Webcast Command Center</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Evergreen webinar funnel performance</p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Registrants" value={stats.totalRegistrants} color="text-blue-600" />
          <StatCard label="Attended" value={stats.totalAttended} color="text-green-600" />
          <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} color="text-amber-600" />
          <StatCard label="Partnership Apps" value={stats.totalPartnerApps} color="text-purple-600" />
          <StatCard label="Accounts Provisioned" value={stats.totalProvisioned} color="text-emerald-600" />
          <StatCard label="Voice Drops Sent" value={stats.voiceDropsSent} color="text-indigo-600" />
          <StatCard label="Pending Emails" value={stats.pendingEmails} color="text-orange-600" />
          <StatCard label="Pending SMS" value={stats.pendingSms} color="text-pink-600" />
        </div>
      )}

      {/* Drip Pipeline */}
      {dripStats && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Email Drip Pipeline</h2>
          <div className="flex gap-6 text-sm">
            <div><span className="text-zinc-500">Pending:</span> <span className="font-medium text-yellow-600">{dripStats.pending}</span></div>
            <div><span className="text-zinc-500">Sent:</span> <span className="font-medium text-green-600">{dripStats.sent}</span></div>
            <div><span className="text-zinc-500">Failed:</span> <span className="font-medium text-red-600">{dripStats.failed}</span></div>
            <div><span className="text-zinc-500">Skipped:</span> <span className="font-medium text-zinc-400">{dripStats.skipped}</span></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('registrants')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'registrants'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Registrants ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Partnership Applications ({partnerApps.length})
        </button>
      </div>

      {/* Registrants Table */}
      {activeTab === 'registrants' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Phone</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Session</th>
                <th className="pb-2 pr-4">Email Step</th>
                <th className="pb-2 pr-4">SMS Step</th>
                <th className="pb-2 pr-4">Account</th>
                <th className="pb-2 pr-4">Voice Drop</th>
                <th className="pb-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {lead.first_name} {lead.last_name || ''}
                  </td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{lead.email}</td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{lead.phone || '--'}</td>
                  <td className="py-2 pr-4"><StatusBadge status={lead.status} /></td>
                  <td className="py-2 pr-4 text-zinc-500 text-xs">
                    {lead.assigned_session_time ? formatDate(lead.assigned_session_time) : '--'}
                  </td>
                  <td className="py-2 pr-4 text-center">{lead.email_drip_step ?? 0}/5</td>
                  <td className="py-2 pr-4 text-center">
                    {lead.sms_consent ? `${lead.sms_drip_step ?? 0}/5` : <span className="text-zinc-400">--</span>}
                  </td>
                  <td className="py-2 pr-4 text-center">
                    {lead.leads_account_provisioned ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-zinc-400">No</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-center">
                    {lead.voice_drop_sent ? (
                      <span className="text-green-600">Sent</span>
                    ) : (
                      <span className="text-zinc-400">--</span>
                    )}
                  </td>
                  <td className="py-2 text-zinc-500 text-xs">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-400">No registrants yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Partnership Applications Table */}
      {activeTab === 'applications' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Phone</th>
                <th className="pb-2 pr-4">State</th>
                <th className="pb-2 pr-4">Experience</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Message</th>
                <th className="pb-2">Applied</th>
              </tr>
            </thead>
            <tbody>
              {partnerApps.map((app) => (
                <tr key={app.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {app.first_name} {app.last_name || ''}
                  </td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{app.email}</td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{app.phone || '--'}</td>
                  <td className="py-2 pr-4">{app.state || '--'}</td>
                  <td className="py-2 pr-4">{app.experience || '--'}</td>
                  <td className="py-2 pr-4"><StatusBadge status={app.status} /></td>
                  <td className="py-2 pr-4 max-w-[200px] truncate text-zinc-500">{app.message || '--'}</td>
                  <td className="py-2 text-zinc-500 text-xs">{formatDate(app.created_at)}</td>
                </tr>
              ))}
              {partnerApps.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">No applications yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
