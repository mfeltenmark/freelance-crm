'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isPast, isToday, addDays, differenceInDays } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Video, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string
  title: string
  dueDate: string | null
  priority: string
  status: string
  lead?: { id: string; title: string }
}

interface Booking {
  id: string
  subject: string
  activityDate: string
  durationMinutes: number
  lead?: { id: string; title: string }
  contact?: { id: string; firstName: string; lastName: string; email: string }
  metadata?: { meetingUrl?: string; bookingId?: string; eventType?: string }
}

interface Lead {
  id: string
  title: string
  stage: string
  source: string | null
  estimatedValue: string | null
  expectedCloseDate: string | null
  _count?: { activities: number; tasks: number; proposals: number }
}

interface BookmeLead {
  id: string
  title: string
  source: string | null
  _count?: { activities: number }
}

interface StageEntry {
  stage: string
  count: number
  value: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'Ny' },
  { key: 'CONTACTED', label: 'Kontaktad' },
  { key: 'QUALIFIED', label: 'Kvalificerad' },
  { key: 'PROPOSAL', label: 'Offert' },
  { key: 'NEGOTIATING', label: 'Förhandling' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKr(value: string | number | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  if (!num || isNaN(num)) return '0 kr'
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(num)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const [polling, setPolling] = useState(false)
  const today = new Date()
  const threeDaysFromNow = addDays(today, 3)
  const thirtyDaysFromNow = addDays(today, 30)

  // Nya mäklarlead: source=bookme, stage=NEW, inga aktiviteter ännu
  const { data: bookmeData } = useQuery({
    queryKey: ['bookme-leads'],
    queryFn: async () => {
      const res = await fetch('/api/leads?source=bookme&stage=NEW&status=ACTIVE&limit=20')
      if (!res.ok) throw new Error('Failed to fetch bookme leads')
      return res.json() as Promise<{ leads: BookmeLead[] }>
    },
    refetchInterval: 60000,
  })

  // Dashboard stats (pipeline distribution)
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      return res.json()
    },
    refetchInterval: 30000,
  })

  // All open tasks — filter client-side for urgent ones
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-open'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?status=todo&sortBy=dueDate&sortOrder=asc&limit=100')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json() as Promise<{ tasks: Task[] }>
    },
    refetchInterval: 30000,
  })

  // Next 3 bookings
  const { data: bookingsData } = useQuery({
    queryKey: ['upcoming-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/activities?type=MEETING&upcoming=true&limit=3')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      return res.json() as Promise<{ activities: Booking[] }>
    },
    refetchInterval: 60000,
  })

  // Active leads sorted by expectedCloseDate
  const { data: leadsData } = useQuery({
    queryKey: ['leads-closing-soon'],
    queryFn: async () => {
      const res = await fetch(
        '/api/leads?status=ACTIVE&sortBy=expectedCloseDate&sortOrder=asc&limit=30'
      )
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json() as Promise<{ leads: Lead[] }>
    },
    refetchInterval: 60000,
  })

  // Complete task mutation
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done', completedDate: new Date() }),
      })
      if (!res.ok) throw new Error('Failed to complete task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-open'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  // Derived data
  const bookmeLeads: BookmeLead[] = (bookmeData?.leads || []).filter(
    (l) => (l._count?.activities ?? 0) === 0
  )

  const allTasks: Task[] = tasksData?.tasks || []
  const urgentTasks = allTasks.filter((t) => {
    if (t.priority === 'high') return true
    if (t.dueDate && new Date(t.dueDate) <= threeDaysFromNow) return true
    return false
  })

  const stageDistribution: StageEntry[] = dashboardData?.stageDistribution || []
  const bookings: Booking[] = (bookingsData?.activities || []).slice(0, 3)
  const closingLeads: Lead[] = (leadsData?.leads || []).filter((lead) => {
    if (!lead.expectedCloseDate) return false
    const d = new Date(lead.expectedCloseDate)
    return d >= today && d <= thirtyDaysFromNow
  })

  return (
    <div className="flex flex-col gap-4">
      {/* ── Nya mäklarlead ───────────────────────────────────────────── */}
      {bookmeLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Nya mäklarlead
              <span className="ml-2 badge badge-purple">{bookmeLeads.length}</span>
            </h3>
            <button
              onClick={async () => {
                setPolling(true)
                try {
                  await fetch('/api/gmail/poll-trigger', { method: 'POST' })
                  await queryClient.invalidateQueries({ queryKey: ['bookme-leads'] })
                } finally {
                  setPolling(false)
                }
              }}
              disabled={polling}
              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={polling ? 'animate-spin' : ''} />
              {polling ? 'Hämtar...' : 'Hämta nya leads'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {bookmeLeads.map((lead) => (
              <a
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="card px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors min-h-[48px]"
              >
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex-shrink-0">
                  Ny
                </span>
                <p className="font-medium text-sm text-gray-900 truncate flex-1">{lead.title}</p>
                {lead.source && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{lead.source}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 1: Urgent tasks + Pipeline ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Section 1: Kräver din uppmärksamhet */}
        {urgentTasks.length > 0 && (
          <div className="card flex flex-col">
            <div className="card-header-mobile flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Kräver din uppmärksamhet</h2>
              <span className="badge badge-red text-xs">{urgentTasks.length}</span>
            </div>
            <div className="card-body-mobile overflow-y-auto max-h-[200px] space-y-2">
              {urgentTasks.map((task) => {
                const dueDate = task.dueDate ? new Date(task.dueDate) : null
                const overdue = dueDate && isPast(dueDate) && !isToday(dueDate)
                const nearDue =
                  dueDate && !overdue && differenceInDays(dueDate, today) <= 2

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border min-h-[48px]',
                      overdue
                        ? 'bg-red-50 border-red-200'
                        : nearDue
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-white border-gray-200'
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => completeTask.mutate(task.id)}
                      disabled={completeTask.isPending}
                      title="Markera som klar"
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-brand-600 hover:bg-brand-50 flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      {completeTask.isPending && (
                        <div className="w-3 h-3 border border-brand-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {task.lead && (
                          <a
                            href={`/leads/${task.lead.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            {task.lead.title}
                          </a>
                        )}
                        {dueDate && (
                          <span
                            className={cn(
                              'text-xs',
                              overdue
                                ? 'text-red-600 font-semibold'
                                : nearDue
                                  ? 'text-orange-600 font-semibold'
                                  : 'text-gray-400'
                            )}
                          >
                            {format(dueDate, 'd MMM', { locale: sv })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-4 py-2 border-t border-gray-100">
              <a href="/tasks" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Se alla tasks →
              </a>
            </div>
          </div>
        )}

        {/* Section 2: Pipeline */}
        <div className={cn('card', urgentTasks.length === 0 ? 'md:col-span-2' : '')}>
          <div className="card-header-mobile">
            <h2 className="font-semibold text-gray-900 text-sm">Pipeline</h2>
          </div>
          <div className="card-body-mobile">
            {/* Mobile: horizontal scroll. Desktop: 5-column grid */}
            <div className="flex overflow-x-auto gap-2 pb-1 md:pb-0 md:grid md:grid-cols-5 md:overflow-visible">
              {PIPELINE_STAGES.map(({ key, label }) => {
                const entry = stageDistribution.find((s) => s.stage === key)
                const count = entry?.count ?? 0
                const value = parseFloat(entry?.value || '0')

                return (
                  <a
                    key={key}
                    href={`/leads?stage=${key}`}
                    className="flex-shrink-0 w-32 md:w-auto p-3 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-300 rounded-xl transition-colors text-center group"
                  >
                    <p className="text-xs font-medium text-gray-500 group-hover:text-brand-600 mb-1 whitespace-nowrap">
                      {label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{formatKr(value)}</p>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Bookings + Closing leads ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Bokningar */}
        <div className="card">
          <div className="card-header-mobile flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Kommande bokningar</h2>
            {bookings.length > 0 && (
              <span className="badge badge-purple text-xs">
                {bookings.length} {bookings.length === 1 ? 'bokning' : 'bokningar'}
              </span>
            )}
          </div>
          <div className="card-body-mobile">
            {bookings.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                Inga kommande bokningar
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((booking) => {
                  const bookingDate = new Date(booking.activityDate)
                  const isBookingToday =
                    format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 min-h-[48px]"
                    >
                      <div className="flex-shrink-0 text-center w-12">
                        <p className="text-base font-bold text-brand-600 leading-none">
                          {format(bookingDate, 'HH:mm')}
                        </p>
                        <p
                          className={cn(
                            'text-xs mt-0.5',
                            isBookingToday ? 'text-orange-600 font-medium' : 'text-gray-500'
                          )}
                        >
                          {isBookingToday ? 'Idag' : format(bookingDate, 'd MMM', { locale: sv })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.subject}
                        </p>
                        {booking.contact && (
                          <p className="text-xs text-gray-500 truncate">
                            {booking.contact.firstName} {booking.contact.lastName}
                          </p>
                        )}
                      </div>
                      {booking.metadata?.meetingUrl && (
                        <a
                          href={booking.metadata.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1.5 text-brand-600 hover:text-brand-700 transition-colors"
                          title="Gå med i mötet"
                        >
                          <Video className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-gray-100">
              <a
                href="/activities?type=MEETING"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Se alla bokningar →
              </a>
            </div>
          </div>
        </div>

        {/* Leads som stänger inom 30 dagar */}
        <div className="card">
          <div className="card-header-mobile flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Stänger inom 30 dagar</h2>
            {closingLeads.length > 0 && (
              <span className="badge badge-gray text-xs">{closingLeads.length} leads</span>
            )}
          </div>
          <div className="card-body-mobile">
            {closingLeads.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                Inga leads stänger inom 30 dagar
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[200px] space-y-1">
                {closingLeads.map((lead) => {
                  const closeDate = new Date(lead.expectedCloseDate!)
                  const daysLeft = differenceInDays(closeDate, today)
                  const stageLabel =
                    PIPELINE_STAGES.find((s) => s.key === lead.stage)?.label ?? lead.stage

                  return (
                    <a
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[48px]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.title}</p>
                        <p className="text-xs text-gray-500">{stageLabel}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {lead.estimatedValue && parseFloat(lead.estimatedValue) > 0 && (
                          <p className="text-xs font-medium text-gray-700">
                            {formatKr(lead.estimatedValue)}
                          </p>
                        )}
                        <p
                          className={cn(
                            'text-xs',
                            daysLeft <= 7
                              ? 'text-red-600 font-semibold'
                              : daysLeft <= 14
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-500'
                          )}
                        >
                          {format(closeDate, 'd MMM', { locale: sv })}
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-gray-100">
              <a href="/leads" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Se alla leads →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
