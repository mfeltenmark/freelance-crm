'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Video } from 'lucide-react'
import { format, formatDistance } from 'date-fns'
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
    refetchInterval: 60000,
  })

  const bookings = data?.activities || []
  const nextBooking = bookings[0]

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Kommande bokningar</h3>
        </div>
        <div className="card-body">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Kommande bokningar</h3>
        <span className="badge badge-purple">
          {bookings.length} {bookings.length === 1 ? 'bokning' : 'bokningar'}
        </span>
      </div>

      <div className="card-body space-y-4">
        {/* Next booking highlight */}
        {nextBooking && (
          <div className="p-4 bg-gradient-to-r from-brand-50 to-brand-100/50 border border-brand-200 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
                  Nästa möte
                </p>
                <h4 className="font-semibold text-gray-900">{nextBooking.subject}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {nextBooking.contact &&
                    `${nextBooking.contact.firstName} ${nextBooking.contact.lastName}`}
                  {nextBooking.lead && ` · ${nextBooking.lead.title}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-brand-600">
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

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-700">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {format(new Date(nextBooking.activityDate), 'EEEE d MMM', { locale: sv })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                {nextBooking.durationMinutes} min
              </span>
              {nextBooking.metadata?.meetingUrl && (
                <a
                  href={nextBooking.metadata.meetingUrl}
                  className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium ml-auto"
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

        {/* Other bookings */}
        <div className="space-y-2">
          {bookings.slice(1).map((booking) => {
            const bookingDate = new Date(booking.activityDate)
            const isToday =
              format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            return (
              <div
                key={booking.id}
                className="p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                onClick={() => (window.location.href = `/leads/${booking.lead?.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{booking.subject}</h4>
                      {booking.metadata?.eventType && (
                        <span className="badge badge-gray text-xs">
                          {booking.metadata.eventType === 'workshop'
                            ? 'Workshop'
                            : 'Konsultation'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {booking.contact &&
                        `${booking.contact.firstName} ${booking.contact.lastName}`}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-gray-900">
                      {format(bookingDate, 'HH:mm')}
                    </div>
                    <div
                      className={`text-xs ${isToday ? 'text-orange-600 font-medium' : 'text-gray-500'}`}
                    >
                      {isToday ? 'Idag' : format(bookingDate, 'd MMM', { locale: sv })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {bookings.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Inga kommande bokningar</p>
              <p className="text-gray-400 text-xs mt-1">
                Nya bokningar från BookMe dyker upp här automatiskt
              </p>
            </div>
          )}
        </div>

        {bookings.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <a
              href="/activities?type=MEETING"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Se alla bokningar →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
