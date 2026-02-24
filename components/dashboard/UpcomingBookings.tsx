'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Video, MapPin } from 'lucide-react'
import { format, formatDistance, isPast, isFuture } from 'date-fns'
import { sv } from 'date-fns/locale'

interface Booking {
  id: string
  subject: string
  activityDate: string
  durationMinutes: number
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
    bookingId?: string
    eventType?: string
  }
}

export function UpcomingBookings() {
  const { data, isLoading } = useQuery({
    queryKey: ['upcoming-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/activities?type=MEETING&upcoming=true&limit=5')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      return res.json() as Promise<{ activities: Booking[] }>
    },
    refetchInterval: 60000, // Refresh every minute
  })

  const bookings = data?.activities || []
  const nextBooking = bookings[0]

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Kommande Bokningar</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Kommande Bokningar</h2>
        <span className="text-sm text-gray-500">
          {bookings.length} {bookings.length === 1 ? 'bokning' : 'bokningar'}
        </span>
      </div>

      {nextBooking && (
        <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-600 uppercase mb-1">
                Nästa möte
              </p>
              <h3 className="font-semibold text-lg">{nextBooking.subject}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {nextBooking.contact && 
                  `${nextBooking.contact.firstName} ${nextBooking.contact.lastName}`
                }
                {nextBooking.lead && ` · ${nextBooking.lead.title}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                {format(new Date(nextBooking.activityDate), 'HH:mm')}
              </div>
              <div className="text-xs text-gray-500">
                {formatDistance(new Date(nextBooking.activityDate), new Date(), {
                  addSuffix: true,
                  locale: sv,
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(nextBooking.activityDate), 'EEEE d MMM', { locale: sv })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {nextBooking.durationMinutes} min
            </span>
            {nextBooking.metadata?.meetingUrl && (
              <a 
                href={nextBooking.metadata.meetingUrl}
                className="flex items-center gap-1 text-purple-600 hover:underline font-medium ml-auto"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video className="w-4 h-4" />
                Gå med
              </a>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {bookings.slice(1).map((booking) => {
          const bookingDate = new Date(booking.activityDate)
          const isToday = format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          
          return (
            <div 
              key={booking.id} 
              className="p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              onClick={() => window.location.href = `/leads/${booking.lead?.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{booking.subject}</h4>
                    {booking.metadata?.eventType && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {booking.metadata.eventType === 'workshop' ? 'Workshop' : 'Konsultation'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {booking.contact && 
                      `${booking.contact.firstName} ${booking.contact.lastName}`
                    }
                  </p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">
                    {format(bookingDate, 'HH:mm')}
                  </div>
                  <div className={`text-xs ${isToday ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                    {isToday ? 'Idag' : format(bookingDate, 'd MMM', { locale: sv })}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {booking.durationMinutes} min
                </span>
                {booking.metadata?.meetingUrl && (
                  <a 
                    href={booking.metadata.meetingUrl}
                    className="text-purple-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Mötes-länk
                  </a>
                )}
              </div>
            </div>
          )
        })}

        {bookings.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Inga kommande bokningar</p>
            <p className="text-gray-400 text-xs mt-1">
              Nya bokningar från BookMe dyker upp här automatiskt
            </p>
          </div>
        )}
      </div>

      {bookings.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <a 
            href="/activities?type=MEETING" 
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Se alla bokningar →
          </a>
        </div>
      )}
    </div>
  )
}

// Alternative: Compact version for smaller dashboard widget
export function UpcomingBookingsCompact() {
  const { data } = useQuery({
    queryKey: ['upcoming-bookings-compact'],
    queryFn: async () => {
      const res = await fetch('/api/activities?type=MEETING&upcoming=true&limit=3')
      return res.json() as Promise<{ activities: Booking[] }>
    },
  })

  const bookings = data?.activities || []

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-purple-600" />
        Nästa möten
      </h3>

      <div className="space-y-2">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center gap-3 text-sm">
            <div className="flex-shrink-0 w-12 text-center">
              <div className="font-bold text-purple-600">
                {format(new Date(booking.activityDate), 'HH:mm')}
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(booking.activityDate), 'd MMM', { locale: sv })}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{booking.subject}</p>
              <p className="text-xs text-gray-500 truncate">
                {booking.contact?.firstName} {booking.contact?.lastName}
              </p>
            </div>
            {booking.metadata?.meetingUrl && (
              <a 
                href={booking.metadata.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Video className="w-4 h-4 text-purple-600 hover:text-purple-700" />
              </a>
            )}
          </div>
        ))}

        {bookings.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Inga kommande möten
          </p>
        )}
      </div>
    </div>
  )
}
