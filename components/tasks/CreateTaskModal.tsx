'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'

interface CreateTaskModalProps {
  onClose: () => void
  onCreated: () => void
  defaultLeadId?: string
}

export function CreateTaskModal({ onClose, onCreated, defaultLeadId }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    leadId: defaultLeadId || '',
  })

  // Fetch leads for dropdown
  const { data: leadsData } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: async () => {
      const res = await fetch('/api/leads?limit=100&status=ACTIVE')
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Combine date and time
      let dueDate = null
      if (data.dueDate) {
        const dateStr = data.dueTime 
          ? `${data.dueDate}T${data.dueTime}:00`
          : `${data.dueDate}T09:00:00`
        dueDate = new Date(dateStr).toISOString()
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          dueDate,
          leadId: data.leadId || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      onCreated()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  // Quick date helpers
  const setQuickDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setFormData({ ...formData, dueDate: date.toISOString().split('T')[0] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Skapa ny task</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="t.ex. Skicka offert till kund"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivning
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Lägg till detaljer..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioritet
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'low', label: 'Låg', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                  { value: 'medium', label: 'Medel', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                  { value: 'high', label: 'Hög', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { value: 'urgent', label: 'Brådskande', color: 'bg-red-100 text-red-700 border-red-200' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: option.value })}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                      formData.priority === option.value
                        ? `${option.color} ring-2 ring-offset-1 ring-brand-600/30`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Förfallodatum
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Idag
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Imorgon
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Om 1 vecka
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
                <input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Lead */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kopplad lead
              </label>
              <select
                value={formData.leadId}
                onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              >
                <option value="">Ingen lead</option>
                {leadsData?.leads?.map((lead: any) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.title} {lead.company ? `(${lead.company.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !formData.title}
              className="btn-primary disabled:opacity-50"
            >
              {createMutation.isPending ? 'Skapar...' : 'Skapa task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
