'use client'

import { useState, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft,
  Building2, 
  Calendar,
  Clock,
  Mail,
  Phone,
  Globe,
  Linkedin,
  MoreHorizontal,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  MessageSquare,
  Video,
  Plus
} from 'lucide-react'
import { format, formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LeadDetailProps {
  params: Promise<{ id: string }>
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

const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATING']

const activityIcons: Record<string, typeof Mail> = {
  EMAIL_SENT: Mail,
  EMAIL_RECEIVED: Mail,
  CALL: Phone,
  MEETING: Video,
  NOTE: MessageSquare,
  TASK: CheckCircle,
}

export default function LeadDetailPage({ params }: LeadDetailProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const [showStageDropdown, setShowStageDropdown] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${id}`)
      if (!res.ok) throw new Error('Failed to fetch lead')
      return res.json()
    },
  })

  const updateStageMutation = useMutation({
    mutationFn: async (newStage: string) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok) throw new Error('Failed to update stage')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      setShowStageDropdown(false)
    },
  })

  const markAsWonMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'CLOSED_WON', status: 'WON' }),
      })
      if (!res.ok) throw new Error('Failed to update lead')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
    },
  })

  const lead = data?.lead

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

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead kunde inte hittas</p>
        <Link href="/leads" className="text-brand-600 hover:text-brand-700 mt-2 inline-block">
          ← Tillbaka till leads
        </Link>
      </div>
    )
  }

  const stage = stageConfig[lead.stage]
  const currentStageIndex = stages.indexOf(lead.stage)

  const formatCurrency = (value: string | null) => {
    if (!value) return '-'
    const num = parseFloat(value)
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link 
        href="/leads" 
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {lead.company?.logoUrl ? (
            <img 
              src={lead.company.logoUrl} 
              alt="" 
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.title}</h1>
            {lead.company && (
              <p className="text-gray-500 mt-1">{lead.company.name}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                stage.bgColor,
                stage.color
              )}>
                {stage.label}
              </span>
              {lead.source && (
                <span className="text-sm text-gray-500">
                  Källa: {lead.source}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lead.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => markAsWonMutation.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Markera som vunnen
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <XCircle className="w-4 h-4" />
                Förlorad
              </button>
            </>
          )}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pipeline progress */}
      {lead.status === 'ACTIVE' && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            {stages.map((s, index) => {
              const isCompleted = index < currentStageIndex
              const isCurrent = index === currentStageIndex
              const config = stageConfig[s]

              return (
                <div key={s} className="flex-1 flex items-center">
                  <button
                    onClick={() => updateStageMutation.mutate(s)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                      isCurrent && 'bg-brand-600 text-white',
                      isCompleted && 'bg-brand-100 text-brand-700',
                      !isCurrent && !isCompleted && 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      isCurrent && 'bg-white/20',
                      isCompleted && 'bg-brand-600 text-white',
                      !isCurrent && !isCompleted && 'bg-gray-200'
                    )}>
                      {isCompleted ? '✓' : index + 1}
                    </span>
                    <span className="text-sm font-medium hidden lg:inline">{config.label}</span>
                  </button>
                  {index < stages.length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 mx-2',
                      index < currentStageIndex ? 'bg-brand-600' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {lead.description && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Beskrivning</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-600 whitespace-pre-wrap">{lead.description}</p>
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Aktiviteter</h3>
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Lägg till
              </button>
            </div>
            <div className="card-body">
              {lead.activities?.length > 0 ? (
                <div className="space-y-4">
                  {lead.activities.map((activity: any) => {
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
                <p className="text-gray-500 text-center py-8">Inga aktiviteter ännu</p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Tasks</h3>
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Lägg till
              </button>
            </div>
            <div className="card-body">
              {lead.tasks?.length > 0 ? (
                <div className="space-y-2">
                  {lead.tasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500">
                            {format(new Date(task.dueDate), 'd MMM', { locale: sv })}
                          </p>
                        )}
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {task.priority === 'high' ? 'Hög' : task.priority === 'medium' ? 'Medel' : 'Låg'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Inga tasks</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Nyckeltal</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-gray-500">Uppskattat värde</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(lead.estimatedValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sannolikhet</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${lead.closeProbability || 0}%` }}
                    />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {lead.closeProbability || 0}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Viktat värde</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(
                    lead.estimatedValue 
                      ? String(parseFloat(lead.estimatedValue) * (lead.closeProbability || 0) / 100)
                      : null
                  )}
                </p>
              </div>
            </div>
              <div>
                <p className="text-sm text-gray-500">Betalning</p>
                <button
                  onClick={() => {
                    fetch(`/api/leads/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isPaid: !lead.isPaid }),
                    }).then(() => queryClient.invalidateQueries({ queryKey: ['lead', id] }))
                  }}
                  className={`mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    lead.isPaid
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lead.isPaid ? '✓ Betald' : '○ Gratis'}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Tidslinje</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Förväntat avslut</p>
                  <p className="font-medium text-gray-900">
                    {lead.expectedCloseDate 
                      ? format(new Date(lead.expectedCloseDate), 'd MMMM yyyy', { locale: sv })
                      : 'Ej satt'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Skapad</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(lead.createdAt), 'd MMMM yyyy', { locale: sv })}
                  </p>
                </div>
              </div>
              {lead.lastActivityDate && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Senaste aktivitet</p>
                    <p className="font-medium text-gray-900">
                      {formatDistance(new Date(lead.lastActivityDate), new Date(), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company info */}
          {lead.company && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Företag</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{lead.company.name}</span>
                </div>
                {lead.company.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a 
                      href={lead.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      {lead.company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {lead.company.linkedinUrl && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 text-gray-400" />
                    <a 
                      href={lead.company.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proposals */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Offerter</h3>
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                + Ny offert
              </button>
            </div>
            <div className="card-body">
              {lead.proposals?.length > 0 ? (
                <div className="space-y-2">
                  {lead.proposals.map((proposal: any) => (
                    <div key={proposal.id} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{proposal.title}</span>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(proposal.totalValue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Inga offerter ännu</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
