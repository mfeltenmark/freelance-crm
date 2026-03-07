'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
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

  return (
    <div className="space-y-6">
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
