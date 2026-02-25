'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Check, 
  Clock, 
  AlertCircle, 
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  CheckCircle,
  Circle,
  ChevronDown
} from 'lucide-react'
import { format, isPast, isToday, isTomorrow, formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedDate: string | null
  lead: {
    id: string
    title: string
    company?: {
      name: string
    }
  } | null
  createdAt: string
}

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Brådskande', color: 'text-red-700', bgColor: 'bg-red-100' },
  high: { label: 'Hög', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  medium: { label: 'Medel', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  low: { label: 'Låg', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: 'Att göra', color: 'text-gray-600' },
  in_progress: { label: 'Pågår', color: 'text-blue-600' },
  done: { label: 'Klar', color: 'text-green-600' },
  cancelled: { label: 'Avbruten', color: 'text-gray-400' },
}

type FilterStatus = 'all' | 'todo' | 'in_progress' | 'done'

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('todo')
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks', statusFilter, priorityFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      
      const res = await fetch(`/api/tasks?${params}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json()
    },
  })

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done'
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const tasks: Task[] = data?.tasks || []
  const stats = data?.stats || []
  const overdueCount = data?.overdueCount || 0

  const todoCount = stats.find((s: any) => s.status === 'todo')?._count || 0
  const inProgressCount = stats.find((s: any) => s.status === 'in_progress')?._count || 0
  const doneCount = stats.find((s: any) => s.status === 'done')?._count || 0

  const filteredTasks = tasks.filter(task => {
    if (!search) return true
    return task.title.toLowerCase().includes(search.toLowerCase()) ||
           task.description?.toLowerCase().includes(search.toLowerCase()) ||
           task.lead?.title.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-500 mt-1">Hantera dina uppgifter och påminnelser</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Ny task
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('todo')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all',
            statusFilter === 'todo' 
              ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Att göra</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{todoCount}</p>
          {overdueCount > 0 && (
            <p className="text-xs text-red-600 mt-1">{overdueCount} försenade</p>
          )}
        </button>

        <button
          onClick={() => setStatusFilter('in_progress')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all',
            statusFilter === 'in_progress' 
              ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Pågår</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{inProgressCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('done')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all',
            statusFilter === 'done' 
              ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Klara</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{doneCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all',
            statusFilter === 'all' 
              ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Alla</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{todoCount + inProgressCount + doneCount}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sök tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>

        <select
          value={priorityFilter || ''}
          onChange={(e) => setPriorityFilter(e.target.value || null)}
          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="">Alla prioriteter</option>
          <option value="urgent">Brådskande</option>
          <option value="high">Hög</option>
          <option value="medium">Medel</option>
          <option value="low">Låg</option>
        </select>
      </div>

      {/* Tasks list */}
      <div className="card">
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="animate-pulse h-12 bg-gray-100 rounded" />
              </div>
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Inga tasks hittades</p>
              <p className="text-gray-400 text-sm mt-1">
                {statusFilter === 'done' ? 'Inga avklarade tasks ännu' : 'Skapa en ny task för att komma igång'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const dueDate = task.dueDate ? new Date(task.dueDate) : null
              const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && task.status !== 'done'
              const isDueToday = dueDate && isToday(dueDate)
              const isDueTomorrow = dueDate && isTomorrow(dueDate)
              const priority = priorityConfig[task.priority]
              const isDone = task.status === 'done'

              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors',
                    isOverdue && 'bg-red-50/50',
                    isDone && 'opacity-60'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaskMutation.mutate({ id: task.id, currentStatus: task.status })}
                    disabled={toggleTaskMutation.isPending}
                    className={cn(
                      'mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                      isDone 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 hover:border-brand-600 hover:bg-brand-50'
                    )}
                  >
                    {isDone && <Check className="w-3 h-3" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={cn(
                          'font-medium text-gray-900',
                          isDone && 'line-through'
                        )}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      <span className={cn(
                        'flex-shrink-0 badge text-xs',
                        priority.bgColor,
                        priority.color
                      )}>
                        {priority.label}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-2">
                      {task.lead && (
                        <a 
                          href={`/leads/${task.lead.id}`}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          {task.lead.title}
                          {task.lead.company && ` · ${task.lead.company.name}`}
                        </a>
                      )}

                      {dueDate && (
                        <div className={cn(
                          'flex items-center gap-1 text-xs',
                          isOverdue ? 'text-red-600 font-medium' :
                          isDueToday ? 'text-orange-600 font-medium' :
                          'text-gray-500'
                        )}>
                          {isOverdue && <AlertCircle className="w-3 h-3" />}
                          {isDueToday && !isOverdue && <Clock className="w-3 h-3" />}
                          {!isOverdue && !isDueToday && <Calendar className="w-3 h-3" />}
                          <span>
                            {isOverdue && 'Försenad: '}
                            {isDueToday && !isOverdue && 'Idag: '}
                            {isDueTomorrow && 'Imorgon: '}
                            {format(dueDate, 'd MMM', { locale: sv })}
                          </span>
                        </div>
                      )}

                      {isDone && task.completedDate && (
                        <span className="text-xs text-gray-400">
                          Klar {formatDistance(new Date(task.completedDate), new Date(), { 
                            addSuffix: true, 
                            locale: sv 
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      if (confirm('Är du säker på att du vill ta bort denna task?')) {
                        deleteTaskMutation.mutate(task.id)
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateTaskModal 
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
