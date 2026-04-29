'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Phase = {
  id: string
  name: string
  billingType: string
  status: string
  _count?: { sessions: number }
}

type Project = {
  id: string
  name: string
  status: string
  defaultRate: number
  currency: string
  lead?: {
    id: string
    title: string
    company?: { name: string } | null
  } | null
  phases: Phase[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects || []); setLoading(false) })
  }, [])

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-600'
  }

  if (loading) return <div className="p-8 text-gray-500">Laddar projekt...</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Projekt</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#5e3a8c] text-white rounded-lg text-sm font-medium hover:bg-[#4a2d6f]"
        >
          + Nytt projekt
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Inga projekt ännu. Skapa ditt första projekt.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-[#5e3a8c] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                      {p.status === 'ACTIVE' ? 'Aktivt' : p.status === 'PAUSED' ? 'Pausat' : 'Avslutat'}
                    </span>
                  </div>
                  {p.lead && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      {p.lead.company?.name || p.lead.title}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {p.phases.length} {p.phases.length === 1 ? 'fas' : 'faser'}
                </div>
              </div>
              {p.phases.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {p.phases.map(ph => (
                    <span
                      key={ph.id}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {ph.name} ({ph.billingType === 'HOURLY' ? 'Löpande' : 'Fastpris'})
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setProjects(prev => [p, ...prev])
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}

function CreateProjectModal({
  onClose,
  onCreated
}: {
  onClose: () => void
  onCreated: (p: Project) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contractUrl, setContractUrl] = useState('')
  const [defaultRate, setDefaultRate] = useState('900')
  const [leads, setLeads] = useState<{ id: string; title: string; company?: { name: string } | null }[]>([])
  const [leadId, setLeadId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => setLeads(d.leads || []))
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description || null,
        contractUrl: contractUrl || null,
        leadId: leadId || null,
        defaultRate: parseFloat(defaultRate) || 900
      })
    })
    const data = await res.json()
    setSaving(false)
    if (data.project) onCreated(data.project)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Nytt projekt</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projektnamn *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="ex. Napper.se Fas 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avtal/offert (Google Drive-länk)</label>
            <input
              value={contractUrl}
              onChange={e => setContractUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schablonpris kr/tim</label>
            <input
              value={defaultRate}
              onChange={e => setDefaultRate(e.target.value)}
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kopplat lead (valfritt)</label>
            <select
              value={leadId}
              onChange={e => setLeadId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Inget lead</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.company?.name || l.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 bg-[#5e3a8c] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Skapar...' : 'Skapa projekt'}
          </button>
        </div>
      </div>
    </div>
  )
}
