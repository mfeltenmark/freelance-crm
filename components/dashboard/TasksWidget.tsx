'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Clock, AlertCircle, Calendar, Plus } from 'lucide-react'
import { format, isPast, isToday, isTomorrow, formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  priority: string
  status: string
  lead?: {
    id: string
    title: string
  }
}

export function TasksWidget() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      let url = '/api/tasks?status=todo&sortBy=dueDate'

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        url += `&dueDate=${today}`
      } else if (filter === 'overdue') {
        url += `&overdue=true`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json() as Promise<{ tasks: Task[] }>
    },
  })

  const completeTaskMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const tasks = data?.tasks || []
  const overdueCount = tasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate))).length
  const todayCount = tasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate))).length

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Action Items</h3>
        </div>
        <div className="card-body">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Action Items</h3>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && <span className="badge badge-red">{overdueCount} försenade</span>}
          {todayCount > 0 && <span className="badge badge-yellow">{todayCount} idag</span>}
        </div>
      </div>

      <div className="card-body">
        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
          {[
            { key: 'all', label: `Alla (${tasks.length})` },
            { key: 'today', label: `Idag (${todayCount})` },
            { key: 'overdue', label: `Försenade (${overdueCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {tasks.map((task) => {
            const dueDate = task.dueDate ? new Date(task.dueDate) : null
            const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate)
            const isDueToday = dueDate && isToday(dueDate)
            const isDueTomorrow = dueDate && isTomorrow(dueDate)

            return (
              <div
                key={task.id}
                className={cn(
                  'p-3 rounded-lg border transition-all',
                  isOverdue
                    ? 'bg-red-50 border-red-200'
                    : isDueToday
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => completeTaskMutation.mutate(task.id)}
                    disabled={completeTaskMutation.isPending}
                    className={cn(
                      'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                      completeTaskMutation.isPending
                        ? 'bg-gray-100 border-gray-300'
                        : 'border-gray-300 hover:border-brand-600 hover:bg-brand-50'
                    )}
                  >
                    {completeTaskMutation.isPending && (
                      <div className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>

                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                      <span
                        className={cn(
                          'badge text-xs flex-shrink-0',
                          task.priority === 'high'
                            ? 'badge-red'
                            : task.priority === 'medium'
                              ? 'badge-yellow'
                              : 'badge-gray'
                        )}
                      >
                        {task.priority === 'high'
                          ? 'Hög'
                          : task.priority === 'medium'
                            ? 'Medel'
                            : 'Låg'}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      {task.lead && (
                        <a
                          href={`/leads/${task.lead.id}`}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          {task.lead.title}
                        </a>
                      )}

                      {dueDate && (
                        <div
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            isOverdue
                              ? 'text-red-600 font-medium'
                              : isDueToday
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-500'
                          )}
                        >
                          {isOverdue && <AlertCircle className="w-3 h-3" />}
                          {isDueToday && <Clock className="w-3 h-3" />}
                          {!isOverdue && !isDueToday && <Calendar className="w-3 h-3" />}
                          <span>
                            {isOverdue && 'Försenad: '}
                            {isDueToday && 'Idag: '}
                            {isDueTomorrow && 'Imorgon: '}
                            {format(dueDate, 'd MMM', { locale: sv })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {tasks.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {filter === 'all' && 'Inga öppna tasks!'}
                {filter === 'today' && 'Inga tasks idag'}
                {filter === 'overdue' && 'Inga försenade tasks'}
              </p>
              <p className="text-gray-400 text-xs mt-1">Du är i fas! 🎉</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <a href="/tasks" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Se alla tasks →
          </a>
          <button
            onClick={() => (window.location.href = '/tasks/new')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ny task
          </button>
        </div>
      </div>
    </div>
  )
}
