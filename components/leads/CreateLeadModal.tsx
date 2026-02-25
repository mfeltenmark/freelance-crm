'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'

interface CreateLeadModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateLeadModal({ onClose, onCreated }: CreateLeadModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimatedValue: '',
    closeProbability: '50',
    source: '',
    expectedCloseDate: '',
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create lead')
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
          <h2 className="text-lg font-semibold text-gray-900">Skapa ny lead</h2>
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
                placeholder="t.ex. Konsultuppdrag Q2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
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
                placeholder="Beskriv uppdraget..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
              />
            </div>

            {/* Value & Probability row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uppskattat värde (SEK)
                </label>
                <input
                  type="number"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  placeholder="100000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sannolikhet (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.closeProbability}
                  onChange={(e) => setFormData({ ...formData, closeProbability: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Källa
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              >
                <option value="">Välj källa...</option>
                <option value="bookme">BookMe</option>
                <option value="linkedin">LinkedIn</option>
                <option value="referral">Referens</option>
                <option value="website">Hemsida</option>
                <option value="cold_outreach">Kall kontakt</option>
                <option value="event">Event/Konferens</option>
                <option value="other">Annat</option>
              </select>
            </div>

            {/* Expected close date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Förväntat avslut
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
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
              {createMutation.isPending ? 'Skapar...' : 'Skapa lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
