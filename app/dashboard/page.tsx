'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { UpcomingMilestones } from '@/components/dashboard/UpcomingMilestones'
import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings'
import { TasksWidget } from '@/components/dashboard/TasksWidget'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0] || 'du'
  const queryClient = useQueryClient()
  const [polling, setPolling] = useState(false)

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const { data: mailSignals } = useQuery({
    queryKey: ['mail-signals-pending'],
    queryFn: async () => {
      const res = await fetch('/api/mail-signals?status=pending')
      if (!res.ok) throw new Error('Failed to fetch mail signals')
      return res.json()
    },
    refetchInterval: 60000,
  })

  const pendingSignals: any[] = mailSignals?.signals ?? []

  const { data: activeProjectsData } = useQuery({
    queryKey: ['projects', 'ACTIVE'],
    queryFn: async () => {
      const res = await fetch('/api/projects?status=ACTIVE')
      if (!res.ok) throw new Error('Failed to fetch active projects')
      return res.json()
    },
    refetchInterval: 60000,
  })

  const activeProjects: any[] = activeProjectsData?.projects ?? []

  return (
    <div className="space-y-6">
      {/* Nya mäklarlead */}
      {pendingSignals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Nya mäklarlead</h3>
            <button
              onClick={async () => {
                setPolling(true)
                await fetch('/api/gmail/poll-trigger', { method: 'POST' })
                await queryClient.invalidateQueries({ queryKey: ['mail-signals-pending'] })
                setPolling(false)
              }}
              disabled={polling}
              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={polling ? 'animate-spin' : ''} />
              {polling ? 'Hämtar...' : 'Hämta nya leads'}
            </button>
          </div>
          <div className="space-y-2">
            {pendingSignals.map((signal: any) => (
              <a
                key={signal.id}
                href={`/leads?mailSignalId=${signal.id}`}
                className="card p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors block"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Ny
                    </span>
                    <p className="font-medium text-gray-900 truncate">{signal.subject}</p>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {(() => {
                      const nameMatch = signal.from.match(/^([^<]+)</)
                      const emailMatch = signal.from.match(/<([^>]+)>/) || signal.from.match(/(\S+@\S+)/)
                      const name = nameMatch ? nameMatch[1].trim() : null
                      const domain = emailMatch ? emailMatch[1].split('@')[1] : null
                      if (name && domain) return `${name} · ${domain}`
                      if (name) return name
                      return domain || signal.from
                    })()}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                  {formatDistance(new Date(signal.createdAt), new Date(), { addSuffix: true, locale: sv })}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Aktiva uppdrag */}
      {activeProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Aktiva uppdrag</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((p: any) => {
              const thisMonth = new Date()
              const monthSessions = p.phases.flatMap((ph: any) => ph.sessions).filter((s: any) => {
                const d = new Date(s.startTime)
                return d.getMonth() === thisMonth.getMonth() &&
                  d.getFullYear() === thisMonth.getFullYear() &&
                  s.endTime
              })
              const monthHours = monthSessions.reduce((sum: number, s: any) => {
                const diff = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000
                return sum + Math.round(diff * 2) / 2
              }, 0)

              return (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="bg-white border-2 border-[#5e3a8c]/20 rounded-xl p-5 hover:border-[#5e3a8c]/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.lead?.company?.name || p.lead?.title}</p>
                    </div>
                    <span className="text-2xl font-bold text-[#5e3a8c]">{monthHours}h</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    {p.phases.length} {p.phases.length === 1 ? 'fas' : 'faser'} · loggat denna månad
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Välkommen tillbaka, {firstName}</h2>
        <p className="text-gray-500 mt-1">Här är en överblick över din pipeline</p>
      </div>

      {/* Live stats */}
      <StatsCards stats={data?.stats} />

      {/* Milestones + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingMilestones milestones={data?.upcomingMilestones} />
        <TasksWidget />
      </div>

      {/* Bookings + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingBookings />
        <RecentActivity />
      </div>
    </div>
  )
}
