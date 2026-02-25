'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft,
  Building2, 
  Mail,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  Star,
  Edit2,
  Trash2,
  MessageSquare,
  Calendar,
  Briefcase,
  Clock,
  MapPin
} from 'lucide-react'
import { format, formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ContactDetailProps {
  params: Promise<{ id: string }>
}

const activityIcons: Record<string, typeof Mail> = {
  EMAIL_SENT: Mail,
  EMAIL_RECEIVED: Mail,
  CALL: Phone,
  MEETING: Calendar,
  NOTE: MessageSquare,
}

const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  NEW: { label: 'Ny', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CONTACTED: { label: 'Kontaktad', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  QUALIFIED: { label: 'Kvalificerad', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  PROPOSAL: { label: 'Offert', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  NEGOTIATING: { label: 'Förhandling', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  CLOSED_WON: { label: 'Vunnen', color: 'text-green-700', bgColor: 'bg-green-100' },
  CLOSED_LOST: { label: 'Förlorad', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export default function ContactDetailPage({ params }: ContactDetailProps) {
  const { id } = use(params)

  const { data, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`)
      if (!res.ok) throw new Error('Failed to fetch contact')
      return res.json()
    },
  })

  const contact = data?.contact
  const relatedLeads = data?.relatedLeads || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kontakt kunde inte hittas</p>
        <Link href="/contacts" className="text-brand-600 hover:text-brand-700 mt-2 inline-block">
          ← Tillbaka till kontakter
        </Link>
      </div>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRelationshipLabel = (strength: number | null) => {
    if (!strength) return 'Okänd'
    if (strength >= 5) return 'Utmärkt'
    if (strength >= 4) return 'Stark'
    if (strength >= 3) return 'God'
    if (strength >= 2) return 'Svag'
    return 'Ny'
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link 
        href="/contacts" 
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till kontakter
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            {contact.profilePictureUrl ? (
              <img 
                src={contact.profilePictureUrl} 
                alt="" 
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-semibold">
                {getInitials(contact.firstName, contact.lastName)}
              </div>
            )}
            {contact.isDecisionMaker && (
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.title && (
              <p className="text-gray-500 mt-1">{contact.title}</p>
            )}
            {contact.company && (
              <Link 
                href={`/companies/${contact.company.id}`}
                className="flex items-center gap-1 text-brand-600 hover:text-brand-700 mt-1"
              >
                <Building2 className="w-4 h-4" />
                {contact.company.name}
              </Link>
            )}
            {contact.isDecisionMaker && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                <Star className="w-3 h-3" />
                Beslutsfattare
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Edit2 className="w-4 h-4" />
            Redigera
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {contact.bio && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Om</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-600 whitespace-pre-wrap">{contact.bio}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Anteckningar</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            </div>
          )}

          {/* Related leads */}
          {relatedLeads.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Relaterade leads</h3>
              </div>
              <div className="card-body">
                <div className="space-y-2">
                  {relatedLeads.map((lead: any) => {
                    const stage = stageConfig[lead.stage]
                    return (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{lead.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {lead.estimatedValue && (
                            <span className="text-sm text-gray-500">
                              {new Intl.NumberFormat('sv-SE', { 
                                style: 'currency', 
                                currency: 'SEK',
                                maximumFractionDigits: 0 
                              }).format(parseFloat(lead.estimatedValue))}
                            </span>
                          )}
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            stage.bgColor,
                            stage.color
                          )}>
                            {stage.label}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Aktivitetshistorik</h3>
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                + Lägg till
              </button>
            </div>
            <div className="card-body">
              {contact.activities?.length > 0 ? (
                <div className="space-y-4">
                  {contact.activities.map((activity: any) => {
                    const Icon = activityIcons[activity.type] || MessageSquare
                    return (
                      <div key={activity.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{activity.subject || activity.type}</p>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDistance(new Date(activity.activityDate), new Date(), { 
                                addSuffix: true, 
                                locale: sv 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Ingen aktivitetshistorik ännu</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Contact info */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Kontaktuppgifter</h3>
            </div>
            <div className="card-body space-y-4">
              <a 
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 text-gray-600 hover:text-brand-600"
              >
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{contact.email}</span>
              </a>
              
              {contact.phone && (
                <a 
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 text-gray-600 hover:text-brand-600"
                >
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{contact.phone}</span>
                </a>
              )}

              {contact.linkedinUrl && (
                <a 
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 hover:text-brand-600"
                >
                  <Linkedin className="w-5 h-5 text-gray-400" />
                  <span>LinkedIn-profil</span>
                </a>
              )}

              {contact.twitterHandle && (
                <a 
                  href={`https://twitter.com/${contact.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-600 hover:text-brand-600"
                >
                  <Twitter className="w-5 h-5 text-gray-400" />
                  <span>@{contact.twitterHandle}</span>
                </a>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Preferenser</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-gray-500">Föredragen kontaktmetod</p>
                <p className="font-medium text-gray-900 capitalize">
                  {contact.preferredContactMethod === 'email' ? 'E-post' :
                   contact.preferredContactMethod === 'phone' ? 'Telefon' :
                   contact.preferredContactMethod || 'Ej angiven'}
                </p>
              </div>
              
              {contact.timezone && (
                <div>
                  <p className="text-sm text-gray-500">Tidszon</p>
                  <p className="font-medium text-gray-900">{contact.timezone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Relationship */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Relation</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Styrka</span>
                <span className="font-medium text-gray-900">
                  {getRelationshipLabel(contact.relationshipStrength)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'flex-1 h-2 rounded-full',
                      level <= (contact.relationshipStrength || 0)
                        ? contact.relationshipStrength >= 4 ? 'bg-green-500' :
                          contact.relationshipStrength >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Taggar</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag: string, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="card">
            <div className="card-body text-sm text-gray-500 space-y-1">
              <p>
                Skapad: {format(new Date(contact.createdAt), 'd MMM yyyy', { locale: sv })}
              </p>
              <p>
                Uppdaterad: {format(new Date(contact.updatedAt), 'd MMM yyyy', { locale: sv })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
