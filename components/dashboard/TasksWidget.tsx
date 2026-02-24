'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Clock, AlertCircle, Calendar } from 'lucide-react'
import { format, isPast, isToday, isTomorrow, formatDistance } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useState } from 'react'

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
  const overdueCount = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate))).length
  const todayCount = tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length

  const handleCompleteTask = (taskId: string) => {
    completeTaskMutation.mutate(taskId)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Action Items</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Action Items</h2>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
              {overdueCount} försenade
            </span>
          )}
          {todayCount > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
              {todayCount} idag
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Alla ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'today'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Idag ({todayCount})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'overdue'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Försenade ({overdueCount})
        </button>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {tasks.map((task) => {
          const dueDate = task.dueDate ? new Date(task.dueDate) : null
          const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate)
          const isDueToday = dueDate && isToday(dueDate)
          const isDueTomorrow = dueDate && isTomorrow(dueDate)

          return (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                isOverdue 
                  ? 'bg-red-50 border-red-200' 
                  : isDueToday 
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={completeTaskMutation.isPending}
                  className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    completeTaskMutation.isPending
                      ? 'bg-gray-100 border-gray-300'
                      : 'border-gray-300 hover:border-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {completeTaskMutation.isPending && (
                    <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    
                    {/* Priority badge */}
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority === 'high' ? 'Hög' : 
                       task.priority === 'medium' ? 'Medel' : 'Låg'}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Lead link */}
                  {task.lead && (
                    <a 
                      href={`/leads/${task.lead.id}`}
                      className="text-xs text-purple-600 hover:underline mt-1 inline-block"
                    >
                      {task.lead.title}
                    </a>
                  )}

                  {/* Due date */}
                  {dueDate && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      isOverdue ? 'text-red-600 font-medium' :
                      isDueToday ? 'text-orange-600 font-medium' :
                      'text-gray-500'
                    }`}>
                      {isOverdue && <AlertCircle className="w-3 h-3" />}
                      {isDueToday && <Clock className="w-3 h-3" />}
                      {!isOverdue && !isDueToday && <Calendar className="w-3 h-3" />}
                      
                      <span>
                        {isOverdue && 'Försenad: '}
                        {isDueToday && 'Idag: '}
                        {isDueTomorrow && 'Imorgon: '}
                        {format(dueDate, 'd MMM HH:mm', { locale: sv })}
                        {!isDueToday && !isDueTomorrow && !isOverdue && (
                          <span className="ml-1 text-gray-400">
                            ({formatDistance(dueDate, new Date(), { addSuffix: true, locale: sv })})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {tasks.length === 0 && (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              {filter === 'all' && 'Inga öppna tasks!'}
              {filter === 'today' && 'Inga tasks idag'}
              {filter === 'overdue' && 'Inga försenade tasks'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Du är i fas! 🎉
            </p>
          </div>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <a 
            href="/tasks" 
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Se alla tasks →
          </a>
          <button
            onClick={() => window.location.href = '/tasks/new'}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            + Ny task
          </button>
        </div>
      )}
    </div>
  )
}

// Compact version for smaller widget
export function TasksWidgetCompact() {
  const { data } = useQuery({
    queryKey: ['tasks-compact'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?status=todo&limit=5&sortBy=dueDate')
      return res.json() as Promise<{ tasks: Task[] }>
    },
  })

  const tasks = data?.tasks || []

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-600" />
        Att göra
      </h3>

      <div className="space-y-2">
        {tasks.slice(0, 3).map((task) => {
          const dueDate = task.dueDate ? new Date(task.dueDate) : null
          const isOverdue = dueDate && isPast(dueDate)

          return (
            <div key={task.id} className="flex items-start gap-2 text-sm">
              <input 
                type="checkbox" 
                className="mt-0.5"
                onChange={() => {/* handle complete */}}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                {dueDate && (
                  <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                    {format(dueDate, 'd MMM HH:mm', { locale: sv })}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {tasks.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Inga öppna tasks
          </p>
        )}
      </div>
    </div>
  )
}
