'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import { 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  UserPlus,
  CheckCircle,
  MessageSquare
} from 'lucide-react'

interface Activity {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note' | 'lead_created' | 'task_completed' | 'message'
  description: string
  leadTitle?: string
  createdAt: string
}

const activityIcons: Record<Activity['type'], typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  lead_created: UserPlus,
  task_completed: CheckCircle,
  message: MessageSquare,
}

const activityColors: Record<Activity['type'], string> = {
  email: 'bg-blue-100 text-blue-600',
  call: 'bg-green-100 text-green-600',
  meeting: 'bg-purple-100 text-purple-600',
  note: 'bg-yellow-100 text-yellow-600',
  lead_created: 'bg-brand-100 text-brand-600',
  task_completed: 'bg-emerald-100 text-emerald-600',
  message: 'bg-pink-100 text-pink-600',
}

export function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return {
        activities: [
          {
            id: '1',
            type: 'meeting' as const,
            description: 'Bokat möte med Erik Svensson',
            leadTitle: 'Volvo Cars',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: '2',
            type: 'lead_created' as const,
            description: 'Ny lead skapad',
            leadTitle: 'Spotify AB',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
          {
            id: '3',
            type: 'task_completed' as const,
            description: 'Task slutförd: Skicka offert',
            leadTitle: 'H&M Digital',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          },
          {
            id: '4',
            type: 'email' as const,
            description: 'Email skickad till Anna Lindqvist',
            leadTitle: 'Klarna',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
        ],
      }
    },
  })

  const activities = data?.activities || []

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Senaste aktiviteten</h3>
        </div>
        <div className="card-body">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Senaste aktiviteten</h3>
        <a href="/activities" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          Visa alla →
        </a>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type]
            const colorClass = activityColors[activity.type]

            return (
              <div key={activity.id} className="flex gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.leadTitle && (
                      <>
                        <span className="text-xs font-medium text-brand-600">{activity.leadTitle}</span>
                        <span className="text-gray-300">·</span>
                      </>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDistance(new Date(activity.createdAt), new Date(), {
                        addSuffix: true,
                        locale: sv,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {activities.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Ingen aktivitet ännu</p>
          )}
        </div>
      </div>
    </div>
  )
}
