'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Star, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditContactModalProps {
  contact: any
  onClose: () => void
  onUpdated: () => void
}

export function EditContactModal({ contact, onClose, onUpdated }: EditContactModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    email: contact.email || '',
    phone: contact.phone || '',
    title: contact.title || '',
    linkedinUrl: contact.linkedinUrl || '',
    twitterHandle: contact.twitterHandle || '',
    bio: contact.bio || '',
    companyId: contact.companyId || '',
    isDecisionMaker: contact.isDecisionMaker || false,
    relationshipStrength: contact.relationshipStrength || 3,
    preferredContactMethod: contact.preferredContactMethod || 'email',
    timezone: contact.timezone || '',
    notes: contact.notes || '',
    tags: (contact.tags || []).join(', '),
  })
  const [error, setError] = useState<string | null>(null)
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [creatingCompany, setCreatingCompany] = useState(false)

  const { data: companiesData, refetch: refetchCompanies } = useQuery({
    queryKey: ['companies-dropdown'],
    queryFn: async () => {
      const res = await fetch('/api/companies?limit=100')
      if (!res.ok) return { companies: [] }
      return res.json()
    },
  })

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return
    setCreatingCompany(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create company')
      setFormData({ ...formData, companyId: json.company.id })
      setShowNewCompany(false)
      setNewCompanyName('')
      refetchCompanies()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreatingCompany(false)
    }
  }

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: data.phone || null,
          title: data.title || null,
          linkedinUrl: data.linkedinUrl || null,
          twitterHandle: data.twitterHandle || null,
          bio: data.bio || null,
          companyId: data.companyId || null,
          timezone: data.timezone || null,
          notes: data.notes || null,
          tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update contact')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contact.id] })
      onUpdated()
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    updateMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Redigera kontakt</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Förnamn *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Efternamn *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-post *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>

            {/* Phone & Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+46 70 123 45 67"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="CTO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Företag</label>
              {!showNewCompany ? (
                <div className="flex gap-2">
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  >
                    <option value="">Inget företag</option>
                    {companiesData?.companies?.map((company: any) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCompany(true)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1 text-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Nytt
                  </button>
                </div>
              ) : (
                <div className="space-y-2 p-3 border border-brand-200 rounded-lg bg-brand-50/30">
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Företagsnamn *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setShowNewCompany(false); setNewCompanyName('') }} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Avbryt</button>
                    <button type="button" onClick={handleCreateCompany} disabled={!newCompanyName.trim() || creatingCompany} className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
                      {creatingCompany ? 'Skapar...' : 'Skapa företag'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* LinkedIn & Twitter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                <input
                  type="text"
                  value={formData.twitterHandle}
                  onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                  placeholder="@handle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Contact method & Timezone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Föredragen kontaktmetod</label>
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                >
                  <option value="email">E-post</option>
                  <option value="phone">Telefon</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tidszon</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="Europe/Stockholm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Relationship strength */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationsstyrka: {formData.relationshipStrength}/5
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, relationshipStrength: level })}
                    className={cn(
                      'flex-1 h-3 rounded-full transition-colors',
                      level <= formData.relationshipStrength
                        ? formData.relationshipStrength >= 4 ? 'bg-green-500' :
                          formData.relationshipStrength >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                        : 'bg-gray-200 hover:bg-gray-300'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Decision maker */}
            <div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isDecisionMaker: !formData.isDecisionMaker })}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors w-full justify-center',
                  formData.isDecisionMaker
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <Star className={cn('w-4 h-4', formData.isDecisionMaker && 'fill-yellow-500')} />
                {formData.isDecisionMaker ? 'Beslutsfattare' : 'Markera som beslutsfattare'}
              </button>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Om</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Kort bio..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anteckningar</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anteckningar..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taggar</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="konsult, workshop, vip (kommaseparerade)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0">
            <button type="button" onClick={onClose} className="btn-secondary">Avbryt</button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !formData.firstName || !formData.lastName || !formData.email}
              className="btn-primary disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
