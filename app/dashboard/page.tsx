'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { UpcomingMilestones } from '@/components/dashboard/UpcomingMilestones'
import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings'
import { TasksWidget } from '@/components/dashboard/TasksWidget'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0] || 'du'

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

  return (
    <div className="space-y-6">
      {/* Nya mäklarlead */}
      {pendingSignals.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Nya mäklarlead</h3>
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
