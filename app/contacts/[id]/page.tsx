'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  MapPin,
  Plus,
  Check,
  X
} from 'lucide-react'
import { format, formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AddActivityModal } from '@/components/contacts/AddActivityModal'
import { LinkLeadModal } from '@/components/contacts/LinkLeadModal'
import { EditContactModal } from '@/components/contacts/EditContactModal'

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
  const queryClient = useQueryClient()
  const router = useRouter()
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskSaving, setTaskSaving] = useState(false)
  const [editingCompany, setEditingCompany] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`)
      if (!res.ok) throw new Error('Failed to fetch contact')
      return res.json()
    },
  })

  // Fetch companies for company selector
  const { data: companiesData } = useQuery({
    queryKey: ['companies-dropdown'],
    queryFn: async () => {
      const res = await fetch('/api/companies?limit=100')
      if (!res.ok) return { companies: [] }
      return res.json()
    },
    enabled: editingCompany,
  })

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (companyId: string | null) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      if (!res.ok) throw new Error('Failed to update company')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', id] })
      setEditingCompany(false)
    },
  })

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete contact')
      return res.json()
    },
    onSuccess: () => {
      router.push('/contacts')
    },
  })

  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ['contact-tasks', id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}/tasks`)
      if (!res.ok) return { tasks: [] }
      return res.json()
    },
  })

  const contact = data?.contact
  const relatedLeads = data?.relatedLeads || []
  const contactTasks = tasksData?.tasks || []

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            {contact.company ? (
              <Link 
                href={`/companies/${contact.company.id}`}
                className="flex items-center gap-1 text-brand-600 hover:text-brand-700 mt-1"
              >
                <Building2 className="w-4 h-4" />
                {contact.company.name}
              </Link>
            ) : !editingCompany ? (
              <button
                onClick={() => { setEditingCompany(true); setSelectedCompanyId('') }}
                className="flex items-center gap-1 text-gray-400 hover:text-brand-600 mt-1 text-sm"
              >
                <Building2 className="w-4 h-4" />
                + Lägg till företag
              </button>
            ) : null}
            {editingCompany && (
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  autoFocus
                >
                  <option value="">Välj företag...</option>
                  {companiesData?.companies?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => updateCompanyMutation.mutate(selectedCompanyId || null)}
                  disabled={!selectedCompanyId}
                  className="p-1 text-green-600 hover:text-green-700 disabled:text-gray-300"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingCompany(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {contact.isDecisionMaker && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                <Star className="w-3 h-3" />
                Beslutsfattare
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {contact.company && !editingCompany && (
            <button 
              onClick={() => { setEditingCompany(true); setSelectedCompanyId(contact.companyId || '') }}
              className="btn-secondary text-xs"
            >
              <Building2 className="w-3 h-3" />
              Byt företag
            </button>
          )}
          <button onClick={() => setShowEditModal(true)} className="btn-secondary">
            <Edit2 className="w-4 h-4" />
            Redigera
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
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
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Relaterade leads</h3>
              <button 
                onClick={() => setShowLeadModal(true)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                + Lägg till
              </button>
            </div>
            <div className="card-body">
              {relatedLeads.length > 0 ? (
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
              ) : (
                <p className="text-gray-500 text-center py-8">Inga leads kopplade till denna kontakt</p>
              )}
            </div>
          </div>

          {/* Activities */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Aktivitetshistorik</h3>
              <button 
                onClick={() => setShowActivityModal(true)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
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

          {/* Tasks */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Tasks</h3>
              <button
                onClick={() => { setTaskTitle(''); setTaskPriority('medium'); setTaskDueDate(''); setShowAddTask(v => !v) }}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                + Lägg till task
              </button>
            </div>
            {showAddTask && (
              <div className="px-4 pb-4 border-b border-gray-100">
                <div className="space-y-2 pt-2">
                  <input
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="Vad ska göras?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <select
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="low">Låg prioritet</option>
                      <option value="medium">Medium prioritet</option>
                      <option value="high">Hög prioritet</option>
                    </select>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAddTask(false)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">Avbryt</button>
                    <button
                      disabled={taskSaving || !taskTitle}
                      onClick={async () => {
                        if (!taskTitle) return
                        setTaskSaving(true)
                        await fetch('/api/tasks', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: taskTitle,
                            priority: taskPriority,
                            dueDate: taskDueDate || null,
                            contactId: id,
                          }),
                        })
                        setTaskSaving(false)
                        setShowAddTask(false)
                        refetchTasks()
                      }}
                      className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {taskSaving ? 'Sparar...' : 'Spara'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="card-body">
              {contactTasks.length > 0 ? (
                <div className="space-y-2">
                  {contactTasks.map((task: any) => {
                    const priorityColor: Record<string, string> = {
                      high: 'text-red-600 bg-red-50',
                      medium: 'text-amber-600 bg-amber-50',
                      low: 'text-gray-500 bg-gray-100',
                    }
                    const priorityLabel: Record<string, string> = {
                      high: 'Hög',
                      medium: 'Medium',
                      low: 'Låg',
                    }
                    return (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', task.status === 'done' ? 'bg-green-500' : task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-400')} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-gray-400')}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', priorityColor[task.priority] || 'text-gray-500 bg-gray-100')}>
                              {priorityLabel[task.priority] || task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(task.dueDate), 'd MMM', { locale: sv })}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.status !== 'done' && (
                          <button
                            onClick={async () => {
                              await fetch(`/api/tasks/${task.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'done' }),
                              })
                              refetchTasks()
                            }}
                            className="text-gray-400 hover:text-green-600 flex-shrink-0"
                            title="Markera som klar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 text-sm">Inga tasks kopplade till denna kontakt</p>
              )}
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
              {contact.email && (
                <a 
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 text-gray-600 hover:text-brand-600"
                >
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{contact.email}</span>
                </a>
              )}
              
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

      {/* Modals */}
      {showActivityModal && (
        <AddActivityModal
          contactId={id}
          onClose={() => setShowActivityModal(false)}
          onCreated={() => {
            setShowActivityModal(false)
            refetch()
          }}
        />
      )}

      {showLeadModal && (
        <LinkLeadModal
          contactId={id}
          companyId={contact.companyId || null}
          companyName={contact.company?.name || null}
          onClose={() => setShowLeadModal(false)}
          onCreated={() => {
            setShowLeadModal(false)
            refetch()
          }}
        />
      )}

      {showEditModal && (
        <EditContactModal
          contact={contact}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false)
            refetch()
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ta bort kontakt?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Är du säker på att du vill ta bort {contact.firstName} {contact.lastName}? Detta kan inte ångras.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Avbryt</button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Tar bort...' : 'Ta bort'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
