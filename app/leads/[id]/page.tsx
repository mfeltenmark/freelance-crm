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
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format, formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DrivePicker } from '@/components/leads/DrivePicker'

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
  const router = useRouter()
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showLogCV, setShowLogCV] = useState(false)
  const [showDrivePicker, setShowDrivePicker] = useState(false)
  const [cvFile, setCvFile] = useState<{ name: string; url: string } | null>(null)
  const [editTask, setEditTask] = useState<any>(null)
  const [editActivity, setEditActivity] = useState<any>(null)
  const [editingNextStep, setEditingNextStep] = useState(false)
  const [nextStepText, setNextStepText] = useState('')
  const [nextStepDate, setNextStepDate] = useState('')
  const [showFollowupModal, setShowFollowupModal] = useState(false)
  const [followupTo, setFollowupTo] = useState('')
  const [followupSubject, setFollowupSubject] = useState('')
  const [followupMessage, setFollowupMessage] = useState('')
  const [sendingFollowup, setSendingFollowup] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailCoverLetter, setEmailCoverLetter] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)

  const { data, isLoading, refetch } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete lead')
      return res.json()
    },
    onSuccess: () => {
      router.push('/leads')
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

  function handleOpenEmailModal() {
    setEmailTo(lead.contact?.email || '')
    setEmailSubject(`CV: ${lead.title}`)
    setEmailMessage('')
    setEmailCoverLetter(lead.coverLetterText || '')
    setEmailSent(false)
    setEmailSending(false)
    setAttachment(null)
    setShowEmailModal(true)
  }

  async function handleSendEmailFromLead() {
    if (!emailTo) return
    setEmailSending(true)
    try {
      const signature = `--\nMikael Feltenmark\nTech & Change by Feltenmark AB\nmikael@techchange.io | 073-736 85 32\nlinkedin.com/in/mikaelf | techchange.io`
      const fullBody = [emailMessage, emailCoverLetter, signature].filter(Boolean).join('\n\n')
      let attachmentData: { filename: string; content: string } | undefined
      if (attachment) {
        const buffer = await attachment.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        attachmentData = { filename: attachment.name, content: base64 }
      }
      await fetch('/api/leads/send-cv-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          body: fullBody,
          leadId: lead.id,
          attachment: attachmentData,
        })
      })
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EMAIL_SENT',
          subject: emailSubject,
          description: `CV-mail skickat till ${emailTo}.`,
          leadId: lead.id,
          activityDate: new Date().toISOString(),
        })
      })
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'CONTACTED' })
      })
      setEmailSent(true)
      setTimeout(() => {
        setShowEmailModal(false)
        refetch()
      }, 2000)
    } catch (err) {
      console.error('Email send error:', err)
    } finally {
      setEmailSending(false)
    }
  }

  const handleOpenCV = async () => {
    if (!lead.cvJsonData) return
    const res = await fetch('/api/cv/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv: lead.cvJsonData }),
    })
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() => {
              setFollowupTo(lead.contact?.email ?? '')
              setFollowupSubject(`Komplettering: ${lead.title}`)
              setFollowupMessage('')
              setShowFollowupModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            title="Skicka kompletteringsmail"
          >
            <Mail className="w-4 h-4" />
            Kompletteringsmail
          </button>
          <button
            onClick={handleOpenEmailModal}
            style={{ padding: '0.4rem 1rem', background: '#5e3a8c', color: 'white', borderRadius: '6px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
          >
            Skicka CV-mail
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Redigera lead"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Ta bort lead"
          >
            <Trash2 className="w-5 h-5" />
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

      {/* Next Step */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nästa steg</div>
            {editingNextStep ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nextStepText}
                  onChange={(e) => setNextStepText(e.target.value)}
                  placeholder="T.ex. Väntar på besked om interim vs rekrytering"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={nextStepDate}
                    onChange={(e) => setNextStepDate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  />
                  <div className="flex-1" />
                  <button
                    onClick={() => setEditingNextStep(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={() => {
                      fetch(`/api/leads/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          nextStep: nextStepText, 
                          nextStepDate: nextStepDate || null 
                        }),
                      }).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['lead', id] })
                        setEditingNextStep(false)
                      })
                    }}
                    className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Spara
                  </button>
                </div>
              </div>
            ) : lead.nextStep ? (
              <div 
                onClick={() => { 
                  setNextStepText(lead.nextStep || '')
                  setNextStepDate(lead.nextStepDate ? lead.nextStepDate.split('T')[0] : '')
                  setEditingNextStep(true) 
                }}
                className="cursor-pointer group"
              >
                <p className="text-gray-900 font-medium group-hover:text-brand-600 transition-colors">
                  {lead.nextStep}
                </p>
                {lead.nextStepDate && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(lead.nextStepDate), 'd MMMM yyyy', { locale: sv })}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setNextStepText(''); setNextStepDate(''); setEditingNextStep(true) }}
                className="text-sm text-gray-400 hover:text-brand-600 transition-colors"
              >
                + Sätt nästa steg...
              </button>
            )}
          </div>
        </div>
      </div>

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

          {lead.instructions && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Övriga instruktioner</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-600 whitespace-pre-wrap">{lead.instructions}</p>
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Aktiviteter</h3>
              <button
                onClick={() => setShowAddActivity(true)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                + Lägg till
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatDistance(new Date(activity.createdAt), new Date(), {
                                  addSuffix: true,
                                  locale: sv
                                })}
                              </span>
                              <button
                                onClick={() => setEditActivity(activity)}
                                className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                              >
                                Redigera
                              </button>
                            </div>
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
              <button
                onClick={() => setShowAddTask(true)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                + Lägg till
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
                      <input
                        type="checkbox"
                        checked={task.status === 'COMPLETED'}
                        onChange={async () => {
                          await fetch(`/api/tasks/${task.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })
                          })
                          refetch()
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
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
                      <button
                        onClick={() => setEditTask(task)}
                        className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                      >
                        Redigera
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Inga tasks</p>
              )}
            </div>
          </div>

          {/* Transcript */}
          {lead.transcript && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Mötesanteckningar</h3>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700">
                {lead.transcript.rawText}
              </div>
            </div>
          )}
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

          {/* CV-logg */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Skickat CV</h3>
            {lead.coverLetterText && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Motivering</p>
                <p style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem' }}>{lead.coverLetterText}</p>
              </div>
            )}
            {lead.cvJsonData && (
              <button
                onClick={handleOpenCV}
                style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.4rem 1rem', background: '#f5f0fb', color: '#5e3a8c', borderRadius: '6px', fontSize: '0.875rem', border: '1px solid #e5e7eb', cursor: 'pointer' }}
              >
                Öppna CV
              </button>
            )}
            {lead.cvDriveUrl && (
              <a
                href={lead.cvDriveUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginBottom: '1rem', marginLeft: '0.5rem', padding: '0.4rem 1rem', background: '#f5f0fb', color: '#5e3a8c', borderRadius: '6px', fontSize: '0.875rem', textDecoration: 'none', border: '1px solid #e5e7eb' }}
              >
                Öppna CV i Google Drive
              </a>
            )}
            <button
              onClick={() => setShowLogCV(true)}
              className="w-full px-4 py-2 border border-purple-200 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50"
            >
              + Logga skickat CV
            </button>
            {lead.activities?.filter((a: any) => a.type === 'CV_SENT').map((a: any) => (
              <div key={a.id} className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-600">{a.description}</p>
                {a.subject && (
                  <p className="text-xs text-gray-500 mt-1">{a.subject}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDistance(new Date(a.createdAt), new Date(), { addSuffix: true, locale: sv })}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDrivePicker && (
        <DrivePicker
          onPicked={(file) => {
            setCvFile(file)
            setShowDrivePicker(false)
          }}
          onClose={() => setShowDrivePicker(false)}
        />
      )}

      {/* Log CV modal */}
      {showLogCV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogCV(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Logga skickat CV</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'CV_SENT',
                  subject: fd.get('driveLink'),
                  description: fd.get('note'),
                  activityDate: new Date().toISOString(),
                  leadId: lead.id,
                  contactId: lead.contact?.id,
                })
              })
              await fetch(`/api/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: 'CONTACTED' })
              })
              setShowLogCV(false)
              refetch()
            }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drive-länk</label>
                  <button
                    type="button"
                    onClick={() => setShowDrivePicker(true)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-left text-gray-500 hover:bg-gray-50"
                  >
                    {cvFile ? cvFile.name : '📁 Välj PDF från Google Drive...'}
                  </button>
                  {cvFile && (
                    <input type="hidden" name="driveLink" value={cvFile.url} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notering</label>
                  <textarea
                    name="note"
                    placeholder="t.ex. Anpassat CV fokus på DevOps, skickat till Diana"
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowLogCV(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Avbryt</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">Logga</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit task modal */}
      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditTask(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Redigera task</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              await fetch(`/api/tasks/${editTask.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: fd.get('title'),
                  description: fd.get('description'),
                  dueDate: fd.get('dueDate') || null,
                  priority: fd.get('priority'),
                })
              })
              setEditTask(null)
              refetch()
            }}>
              <div className="space-y-3">
                <input name="title" defaultValue={editTask.title} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <textarea name="description" defaultValue={editTask.description || ''} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
                <input name="dueDate" type="date" defaultValue={editTask.dueDate ? editTask.dueDate.slice(0,10) : ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <select name="priority" defaultValue={editTask.priority} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="LOW">Låg</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">Hög</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={async () => {
                  if (confirm('Ta bort task?')) {
                    await fetch(`/api/tasks/${editTask.id}`, { method: 'DELETE' })
                    setEditTask(null)
                    refetch()
                  }
                }} className="px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm">Ta bort</button>
                <button type="button" onClick={() => setEditTask(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Avbryt</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">Spara</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit activity modal */}
      {editActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditActivity(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Redigera aktivitet</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              await fetch(`/api/activities/${editActivity.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subject: fd.get('subject'),
                  description: fd.get('description'),
                  type: fd.get('type'),
                })
              })
              setEditActivity(null)
              refetch()
            }}>
              <div className="space-y-3">
                <select name="type" defaultValue={editActivity.type} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="EMAIL_SENT">Mail (skickat)</option>
                  <option value="EMAIL_RECEIVED">Mail (mottaget)</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="SMS">SMS</option>
                  <option value="CALL">Telefon</option>
                  <option value="NOTE">Anteckning</option>
                  <option value="MEETING">Möte</option>
                </select>
                <input name="subject" defaultValue={editActivity.subject || ''} placeholder="Ämne" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <textarea name="description" defaultValue={editActivity.description || ''} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={async () => {
                  if (confirm('Ta bort aktivitet?')) {
                    await fetch(`/api/activities/${editActivity.id}`, { method: 'DELETE' })
                    setEditActivity(null)
                    refetch()
                  }
                }} className="px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm">Ta bort</button>
                <button type="button" onClick={() => setEditActivity(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Avbryt</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">Spara</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followup mail modal */}
      {showFollowupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFollowupModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skicka kompletteringsmail</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mottagare</label>
                <input
                  value={followupTo}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ämne</label>
                <input
                  value={followupSubject}
                  onChange={e => setFollowupSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meddelande</label>
                <textarea
                  value={followupMessage}
                  onChange={e => setFollowupMessage(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowFollowupModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={sendingFollowup || !followupTo || !followupSubject || !followupMessage}
                onClick={async () => {
                  setSendingFollowup(true)
                  await fetch(`/api/leads/${id}/send-followup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: followupTo, subject: followupSubject, message: followupMessage }),
                  })
                  setSendingFollowup(false)
                  setShowFollowupModal(false)
                  queryClient.invalidateQueries({ queryKey: ['lead', id] })
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {sendingFollowup ? 'Skickar...' : 'Skicka'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Redigera lead</h3>
            <EditLeadForm lead={lead} onClose={() => setShowEditModal(false)} onSaved={() => { setShowEditModal(false); queryClient.invalidateQueries({ queryKey: ['lead', id] }) }} />
          </div>
        </div>
      )}

      {/* Add activity modal */}
      {showAddActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddActivity(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Logga aktivitet</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: fd.get('type'),
                  subject: fd.get('subject'),
                  description: fd.get('description'),
                  activityDate: new Date().toISOString(),
                  leadId: lead.id,
                  contactId: lead.contact?.id,
                })
              })
              if (!res.ok) {
                const err = await res.json()
                alert('Fel: ' + JSON.stringify(err))
                return
              }
              setShowAddActivity(false)
              refetch()
            }}>
              <div className="space-y-3">
                <select name="type" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="EMAIL_SENT">Mail (skickat)</option>
                  <option value="EMAIL_RECEIVED">Mail (mottaget)</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="SMS">SMS</option>
                  <option value="CALL">Telefon</option>
                  <option value="NOTE">Anteckning</option>
                  <option value="MEETING">Möte</option>
                </select>
                <input name="subject" placeholder="Ämne" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <textarea name="description" placeholder="Vad hände? Notera pris, scope, nästa steg..." rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowAddActivity(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Avbryt</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">Spara</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add task modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddTask(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Lägg till task</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: fd.get('title'),
                  description: fd.get('description'),
                  dueDate: fd.get('dueDate'),
                  priority: fd.get('priority'),
                  leadId: lead.id,
                })
              })
              setShowAddTask(false)
              refetch()
            }}>
              <div className="space-y-3">
                <input name="title" placeholder="Vad ska göras?" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <textarea name="description" placeholder="Mer detaljer..." rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
                <input name="dueDate" type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <select name="priority" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="LOW">Låg prioritet</option>
                  <option value="MEDIUM">Medium prioritet</option>
                  <option value="HIGH">Hög prioritet</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowAddTask(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Avbryt</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">Spara</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '90vh' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Skicka CV-mail</h3>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Till</label>
              <input value={emailTo} onChange={e => setEmailTo(e.target.value)} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Ämne</label>
              <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Meddelande</label>
              <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={3} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', resize: 'vertical' }} />
            </div>
            {emailCoverLetter && (
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Motivering</label>
                <textarea value={emailCoverLetter} onChange={e => setEmailCoverLetter(e.target.value)} rows={5} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', resize: 'vertical' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Bifoga fil (PDF)</label>
              <input type="file" accept=".pdf" onChange={e => setAttachment(e.target.files?.[0] || null)} style={{ fontSize: '0.875rem' }} />
              {attachment && <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>✓ {attachment.name}</p>}
            </div>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'pre-line' }}>
              {`--\nMikael Feltenmark\nTech & Change by Feltenmark AB\nmikael@techchange.io | 073-736 85 32\nlinkedin.com/in/mikaelf | techchange.io`}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Bifoga CV manuellt som PDF innan du skickar.</p>
            {emailSent ? (
              <p style={{ color: '#16a34a', fontSize: '0.875rem' }}>✓ Mail skickat. Leadet uppdaterat.</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowEmailModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', background: 'white' }}>Avbryt</button>
                <button onClick={handleSendEmailFromLead} disabled={emailSending || !emailTo} style={{ padding: '0.5rem 1rem', background: '#5e3a8c', color: 'white', borderRadius: '6px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
                  {emailSending ? 'Skickar...' : 'Skicka'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ta bort lead?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Är du säker på att du vill ta bort &quot;{lead.title}&quot;? Alla kopplade aktiviteter och tasks tas också bort. Detta kan inte ångras.
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

function EditLeadForm({ lead, onClose, onSaved }: { lead: any; onClose: () => void; onSaved: () => void }) {
  const router = useRouter()
  const [title, setTitle] = useState(lead.title || '')
  const [description, setDescription] = useState(lead.description || '')
  const [instructions, setInstructions] = useState(lead.instructions || '')
  const [estimatedValue, setEstimatedValue] = useState(lead.estimatedValue?.toString() || '')
  const [closeProbability, setCloseProbability] = useState(lead.closeProbability?.toString() || '50')
  const [expectedCloseDate, setExpectedCloseDate] = useState(lead.expectedCloseDate ? lead.expectedCloseDate.split('T')[0] : '')
  const [source, setSource] = useState(lead.source || '')
  const [saving, setSaving] = useState(false)
  const [showExtra, setShowExtra] = useState(false)

  const patchLead = async () => {
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        instructions,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        closeProbability: closeProbability ? parseInt(closeProbability, 10) : null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
        source,
      }),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    await patchLead()
    setSaving(false)
    onSaved()
  }

  const handleSaveAndGenerate = async () => {
    setSaving(true)
    await patchLead()
    setSaving(false)
    router.push(`/cv-generator?leadId=${lead.id}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
        <input className="input w-full" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning</label>
        <textarea className="input w-full" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Övriga instruktioner</label>
        <textarea className="input w-full" rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} />
      </div>
      <div>
        <button
          type="button"
          onClick={() => setShowExtra(p => !p)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showExtra ? 'Dölj detaljer' : 'Visa detaljer (värde, sannolikhet, datum, källa)'}
        </button>
        {showExtra && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uppskattat värde (SEK)</label>
                <input className="input w-full" type="number" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sannolikhet (%)</label>
                <input className="input w-full" type="number" min="0" max="100" value={closeProbability} onChange={e => setCloseProbability(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Förväntat avslut</label>
              <input className="input w-full" type="date" value={expectedCloseDate} onChange={e => setExpectedCloseDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Källa</label>
              <select className="input w-full" value={source} onChange={e => setSource(e.target.value)}>
                <option value="">Välj källa</option>
                <option value="bookme">BookMe</option>
                <option value="linkedin">LinkedIn</option>
                <option value="referral">Referral</option>
                <option value="recruiter">Konsultmäklare</option>
                <option value="ework">Ework</option>
                <option value="sj_manpower">SJ/Manpower</option>
                <option value="developersbay">DevelopersBay</option>
                <option value="other">Annat</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="btn-secondary">Avbryt</button>
        <button onClick={handleSave} disabled={saving} className="btn-secondary disabled:opacity-50">
          {saving ? 'Sparar...' : 'Spara'}
        </button>
        <button
          onClick={handleSaveAndGenerate}
          disabled={saving || !title || !description}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Sparar...' : 'Spara och generera CV'}
        </button>
      </div>
    </div>
  )
}
