'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Plus, 
  User,
  Building2, 
  Mail,
  Phone,
  Linkedin,
  Star,
  ChevronRight,
  UserCheck
} from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CreateContactModal } from '@/components/contacts/CreateContactModal'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  title: string | null
  linkedinUrl: string | null
  isDecisionMaker: boolean
  relationshipStrength: number | null
  company: {
    id: string
    name: string
    logoUrl: string | null
  } | null
  _count: {
    activities: number
  }
  createdAt: string
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [decisionMakerFilter, setDecisionMakerFilter] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contacts', search, decisionMakerFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (decisionMakerFilter) params.set('isDecisionMaker', 'true')
      
      const res = await fetch(`/api/contacts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch contacts')
      return res.json()
    },
  })

  const contacts: Contact[] = data?.contacts || []
  const total = data?.total || 0

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRelationshipColor = (strength: number | null) => {
    if (!strength) return 'bg-gray-200'
    if (strength >= 4) return 'bg-green-500'
    if (strength >= 3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kontakter</h2>
          <p className="text-gray-500 mt-1">{total} kontakter totalt</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Ny kontakt
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sök namn, email, företag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setDecisionMakerFilter(!decisionMakerFilter)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
            decisionMakerFilter 
              ? 'bg-brand-50 border-brand-600 text-brand-700' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          <UserCheck className="w-4 h-4" />
          Beslutsfattare
        </button>
      </div>

      {/* Contacts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : contacts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Inga kontakter hittades</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Prova att ändra din sökning' : 'Lägg till din första kontakt'}
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => window.location.href = `/contacts/${contact.id}`}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold">
                    {getInitials(contact.firstName, contact.lastName)}
                  </div>
                  {contact.isDecisionMaker && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </h3>
                  </div>
                  
                  {contact.title && (
                    <p className="text-sm text-gray-500 truncate">{contact.title}</p>
                  )}
                  
                  {contact.company && (
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 truncate">{contact.company.name}</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </div>

              {/* Contact methods */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <a 
                  href={`mailto:${contact.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{contact.email}</span>
                </a>
                
                {contact.phone && (
                  <a 
                    href={`tel:${contact.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{contact.phone}</span>
                  </a>
                )}

                {contact.linkedinUrl && (
                  <a 
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-blue-600 ml-auto"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Relationship strength indicator */}
              {contact.relationshipStrength && (
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        level <= contact.relationshipStrength!
                          ? getRelationshipColor(contact.relationshipStrength)
                          : 'bg-gray-200'
                      )}
                    />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">Relation</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateContactModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
