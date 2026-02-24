import { UpcomingBookings } from '@/components/dashboard/UpcomingBookings'
import { TasksWidget } from '@/components/dashboard/TasksWidget'
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">CRM Dashboard</h1>
        <p className="text-gray-600 mb-8">Välkommen till ditt Lead Management System</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingBookings />
          <TasksWidget />
        </div>
      </div>
    </div>
  )
}
