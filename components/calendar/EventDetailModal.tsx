'use client'

import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  User, 
  Briefcase,
  Mail,
  ExternalLink
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'

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
    bookingId?: string
    eventType?: string
  }
}

interface EventDetailModalProps {
  event: Activity
  onClose: () => void
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const eventDate = parseISO(event.activityDate)
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MEETING': return 'Möte'
      case 'CALL': return 'Samtal'
      case 'EMAIL_SENT': return 'Email skickat'
      case 'EMAIL_RECEIVED': return 'Email mottaget'
      case 'NOTE': return 'Anteckning'
      case 'TASK': return 'Task'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MEETING': return 'bg-brand-100 text-brand-700'
      case 'CALL': return 'bg-green-100 text-green-700'
      case 'EMAIL_SENT': 
      case 'EMAIL_RECEIVED': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2 ${getTypeColor(event.type)}`}>
              {getTypeLabel(event.type)}
            </span>
            <h2 className="text-xl font-semibold text-gray-900">
              {event.subject || getTypeLabel(event.type)}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {format(eventDate, 'EEEE d MMMM yyyy', { locale: sv })}
              </p>
              <p className="text-sm text-gray-500">
                {format(eventDate, 'HH:mm')}
                {event.durationMinutes && ` – ${event.durationMinutes} minuter`}
              </p>
            </div>
          </div>

          {/* Meeting URL */}
          {event.metadata?.meetingUrl && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Video className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Videomöte</p>
                <a 
                  href={event.metadata.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  Gå med i möte
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Location */}
          {event.metadata?.location && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Plats</p>
                <p className="font-medium text-gray-900">{event.metadata.location}</p>
              </div>
            </div>
          )}

          {/* Contact */}
          {event.contact && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Deltagare</p>
                <Link 
                  href={`/contacts/${event.contact.id}`}
                  className="font-medium text-gray-900 hover:text-brand-600"
                >
                  {event.contact.firstName} {event.contact.lastName}
                </Link>
                <p className="text-sm text-gray-500">{event.contact.email}</p>
              </div>
            </div>
          )}

          {/* Lead */}
          {event.lead && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Lead</p>
                <Link 
                  href={`/leads/${event.lead.id}`}
                  className="font-medium text-gray-900 hover:text-brand-600"
                >
                  {event.lead.title}
                </Link>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Beskrivning</p>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {event.contact?.email && (
            <a
              href={`mailto:${event.contact.email}`}
              className="btn-secondary"
            >
              <Mail className="w-4 h-4" />
              Skicka email
            </a>
          )}
          {event.metadata?.meetingUrl && (
            <a
              href={event.metadata.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Video className="w-4 h-4" />
              Gå med
            </a>
          )}
          {!event.metadata?.meetingUrl && (
            <button onClick={onClose} className="btn-primary">
              Stäng
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
