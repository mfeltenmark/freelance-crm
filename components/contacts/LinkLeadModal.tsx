'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Search, Plus, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkLeadModalProps {
  contactId: string
  companyId: string | null
  companyName: string | null
  onClose: () => void
  onCreated: () => void
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

export function LinkLeadModal({ contactId, companyId, companyName, onClose, onCreated }: LinkLeadModalProps) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'create' | 'link'>('create')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: 'NEW',
    estimatedValue: '',
    source: 'manual',
  })

  // Fetch existing leads for linking
  const { data: leadsData } = useQuery({
    queryKey: ['leads-search', search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '20')
      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) return { leads: [] }
      return res.json()
    },
    enabled: mode === 'link',
  })

  // Create new lead
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          companyId: companyId || null,
          estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create lead')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      onCreated()
    },
    onError: (err: Error) => setError(err.message),
  })

  // Link existing lead to same company
  const linkMutation = useMutation({
    mutationFn: async (leadId: string) => {
      if (!companyId) throw new Error('Contact must have a company to link leads')
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to link lead')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      onCreated()
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    createMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Lead</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setMode('create')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              mode === 'create'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Skapa ny lead
          </button>
          <button
            onClick={() => setMode('link')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              mode === 'link'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Briefcase className="w-4 h-4 inline mr-1" />
            Koppla befintlig
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {companyName && (
                <div className="text-sm text-gray-500">
                  Kopplas till <span className="font-medium text-gray-700">{companyName}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Konsultation - Acme AB"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaljer..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  >
                    {Object.entries(stageConfig).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uppskattat värde (SEK)</label>
                  <input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0">
              <button type="button" onClick={onClose} className="btn-secondary">Avbryt</button>
              <button
                type="submit"
                disabled={createMutation.isPending || !formData.title}
                className="btn-primary disabled:opacity-50"
              >
                {createMutation.isPending ? 'Skapar...' : 'Skapa lead'}
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-4">
            {!companyId && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                Kontakten behöver ett företag för att kunna koppla leads. Lägg till ett företag först.
              </div>
            )}
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Sök leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {leadsData?.leads?.length > 0 ? (
                leadsData.leads.map((lead: any) => {
                  const stage = stageConfig[lead.stage] || stageConfig.NEW
                  return (
                    <button
                      key={lead.id}
                      onClick={() => linkMutation.mutate(lead.id)}
                      disabled={!companyId || linkMutation.isPending}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{lead.title}</p>
                        {lead.company && (
                          <p className="text-xs text-gray-500">{lead.company.name}</p>
                        )}
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        stage.bgColor, stage.color
                      )}>
                        {stage.label}
                      </span>
                    </button>
                  )
                })
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm">
                  {search ? 'Inga leads matchade sökningen' : 'Inga leads att visa'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
