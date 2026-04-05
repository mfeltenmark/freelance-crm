'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface InitialData {
  title?: string
  description?: string
  from?: string
}

interface CreateLeadModalProps {
  onClose: () => void
  onCreated: () => void
  initialData?: InitialData
  mailSignalId?: string
}

type Contact = { id: string; firstName: string; lastName: string; email?: string }

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/)
  return match ? match[1].toLowerCase() : from.toLowerCase().trim()
}

export function CreateLeadModal({ onClose, onCreated, initialData, mailSignalId }: CreateLeadModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    estimatedValue: initialData ? '1200000' : '',
    closeProbability: initialData ? '25' : '50',
    contactId: '',
    requirementText: '',
    instructions: '',
    source: 'recruiter',
    expectedCloseDate: '',
  })

  const [contacts, setContacts] = useState<Contact[]>([])
  const [showExtra, setShowExtra] = useState(false)

  useEffect(() => {
    fetch('/api/contacts?limit=100')
      .then(r => r.json())
      .then(d => {
        const loaded: Contact[] = d.contacts ?? []
        setContacts(loaded)

        if (initialData?.from) {
          const senderEmail = extractEmail(initialData.from)
          const match = loaded.find(c => c.email?.toLowerCase() === senderEmail)
          if (match) {
            setFormData(p => ({ ...p, contactId: match.id }))
          }
        }
      })
  }, [])

  const [navigateAfterSave, setNavigateAfterSave] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          description: data.requirementText || data.description,
          contactId: data.contactId || undefined,
          instructions: data.instructions || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to create lead')
      return res.json()
    },
    onSuccess: async (newLead) => {
      if (mailSignalId) {
        await fetch(`/api/mail-signals/${mailSignalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processed' }),
        })
      }
      if (navigateAfterSave) {
        router.push(`/cv-generator?leadId=${newLead.lead.id}`)
      } else {
        onCreated()
      }
    },
  })

  const handleDraft = (e: React.FormEvent) => {
    e.preventDefault()
    setNavigateAfterSave(false)
    createMutation.mutate(formData)
  }

  const handleSaveAndGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setNavigateAfterSave(true)
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
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Skapa ny lead</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Row 1: Titel + Kontakt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="t.ex. Konsultuppdrag Q2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt / Mäklare</label>
                <select
                  value={formData.contactId}
                  onChange={e => setFormData(p => ({ ...p, contactId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                >
                  <option value="">Välj kontakt...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Beskrivning + Instruktioner side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning / Kravprofil</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Klistra in kravprofil från mail eller LinkedIn, eller beskriv uppdraget..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Övriga instruktioner</label>
                <textarea
                  value={formData.instructions}
                  onChange={e => setFormData(p => ({ ...p, instructions: e.target.value }))}
                  rows={10}
                  placeholder="t.ex. fokusera på DevOps, max 2 sidor, svenska..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Källa (dold i extra-blocket) */}
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
                      <input
                        type="number"
                        value={formData.estimatedValue}
                        onChange={e => setFormData({ ...formData, estimatedValue: e.target.value })}
                        placeholder="100000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sannolikhet (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.closeProbability}
                        onChange={e => setFormData({ ...formData, closeProbability: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Källa</label>
                      <select
                        value={formData.source}
                        onChange={e => setFormData({ ...formData, source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                      >
                        <option value="">Välj källa...</option>
                        <option value="bookme">BookMe</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="referral">Referens</option>
                        <option value="website">Hemsida</option>
                        <option value="cold_outreach">Kall kontakt</option>
                        <option value="event">Event/Konferens</option>
                        <option value="recruiter">Konsultmäklare</option>
                        <option value="other">Annat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Förväntat avslut</label>
                      <input
                        type="date"
                        value={formData.expectedCloseDate}
                        onChange={e => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleDraft}
              disabled={createMutation.isPending || !formData.title}
              className="btn-secondary disabled:opacity-50"
            >
              {createMutation.isPending && !navigateAfterSave ? 'Sparar...' : 'Spara som draft'}
            </button>
            <button
              type="button"
              onClick={handleSaveAndGenerate}
              disabled={createMutation.isPending || !formData.title || !formData.description}
              className="btn-primary disabled:opacity-50"
            >
              {createMutation.isPending && navigateAfterSave ? 'Sparar...' : 'Spara och generera CV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
