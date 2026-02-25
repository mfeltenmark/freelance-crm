import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings'
import { TasksWidget } from '@/components/dashboard/TasksWidget'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Välkommen tillbaka, Micky</h2>
        <p className="text-gray-500 mt-1">Här är en överblick över din pipeline</p>
      </div>

      {/* Stats row */}
      <StatsCards />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingBookings />
        <TasksWidget />
      </div>

      {/* Activity feed */}
      <RecentActivity />
    </div>
  )
}
