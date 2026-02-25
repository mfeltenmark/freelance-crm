'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  User,
  Plus
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { EventDetailModal } from '@/components/calendar/EventDetailModal'

interface Activity {
  id: string
  type: string
  subject: string | null
  description: string
  activityDate: string
  durationMinutes: number | null
  lead?: {
    id: string
    title: string
  }
  contact?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  metadata?: {
    meetingUrl?: string
    location?: string
  }
}

type ViewType = 'month' | 'week'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('month')
  const [selectedEvent, setSelectedEvent] = useState<Activity | null>(null)

  // Fetch activities for current month range
  const { data, isLoading } = useQuery({
    queryKey: ['calendar-activities', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      
      const res = await fetch(`/api/activities?limit=100`)
      if (!res.ok) throw new Error('Failed to fetch activities')
      return res.json()
    },
  })

  const activities: Activity[] = data?.activities || []

  // Get days for calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const grouped: Record<string, Activity[]> = {}
    activities.forEach(activity => {
      const dateKey = format(parseISO(activity.activityDate), 'yyyy-MM-dd')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(activity)
    })
    return grouped
  }, [activities])

  // Today's events
  const todaysEvents = useMemo(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    return (activitiesByDate[todayKey] || []).sort((a, b) => 
      new Date(a.activityDate).getTime() - new Date(b.activityDate).getTime()
    )
  }, [activitiesByDate])

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const getEventColor = (type: string) => {
    switch (type) {
      case 'MEETING': return 'bg-brand-600 text-white'
      case 'CALL': return 'bg-green-500 text-white'
      case 'EMAIL_SENT': 
      case 'EMAIL_RECEIVED': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kalender</h2>
          <p className="text-gray-500 mt-1">Dina möten och aktiviteter</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Nytt möte
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 card">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: sv })}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Idag
              </button>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setView('month')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium transition-colors',
                    view === 'month' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  Månad
                </button>
                <button
                  onClick={() => setView('week')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium transition-colors',
                    view === 'week' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  Vecka
                </button>
              </div>
            </div>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((day) => (
              <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayEvents = activitiesByDate[dateKey] || []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = isSameDay(day, currentDate)

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[100px] border-b border-r border-gray-100 p-2 transition-colors',
                    !isCurrentMonth && 'bg-gray-50',
                    isToday(day) && 'bg-brand-50/50'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1',
                    isToday(day) && 'bg-brand-600 text-white font-semibold',
                    !isToday(day) && !isCurrentMonth && 'text-gray-400',
                    !isToday(day) && isCurrentMonth && 'text-gray-900'
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          'w-full text-left px-1.5 py-0.5 text-xs rounded truncate',
                          getEventColor(event.type)
                        )}
                      >
                        {format(parseISO(event.activityDate), 'HH:mm')} {event.subject || event.type}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayEvents.length - 3} till
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar - Today's agenda */}
        <div className="space-y-6">
          {/* Today's events */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-600" />
                Idag
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {format(new Date(), 'EEEE d MMMM', { locale: sv })}
              </p>
            </div>
            <div className="card-body">
              {todaysEvents.length > 0 ? (
                <div className="space-y-3">
                  {todaysEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {event.subject || event.type}
                          </p>
                          {event.contact && (
                            <p className="text-sm text-gray-500 truncate">
                              {event.contact.firstName} {event.contact.lastName}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-semibold text-brand-600">
                            {format(parseISO(event.activityDate), 'HH:mm')}
                          </p>
                          {event.durationMinutes && (
                            <p className="text-xs text-gray-400">
                              {event.durationMinutes} min
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {event.metadata?.meetingUrl && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-brand-600">
                          <Video className="w-3 h-3" />
                          Videomöte
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Inga möten idag</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming meetings */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Kommande</h3>
            </div>
            <div className="card-body">
              {activities
                .filter(a => new Date(a.activityDate) > new Date())
                .slice(0, 5)
                .map((event) => (
                  <div 
                    key={event.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      event.type === 'MEETING' ? 'bg-brand-600' : 'bg-gray-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.subject || event.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(parseISO(event.activityDate), 'EEE d MMM, HH:mm', { locale: sv })}
                      </p>
                    </div>
                  </div>
                ))}

              {activities.filter(a => new Date(a.activityDate) > new Date()).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Inga kommande möten
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
