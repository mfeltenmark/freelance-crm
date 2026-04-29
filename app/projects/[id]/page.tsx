'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Session = {
  id: string
  startTime: string
  endTime: string | null
  note: string | null
}

type Phase = {
  id: string
  name: string
  billingType: 'FIXED_PRICE' | 'HOURLY'
  fixedAmount: number | null
  hourlyRate: number | null
  status: string
  sessions: Session[]
}

type Project = {
  id: string
  name: string
  description: string | null
  contractUrl: string | null
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

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddPhase, setShowAddPhase] = useState(false)

  const fetchProject = () => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(d => { setProject(d.project); setLoading(false) })
  }

  useEffect(() => { fetchProject() }, [id])

  const handleDelete = async () => {
    if (!confirm('Radera projektet och all loggad tid?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/projects')
  }

  const totalHoursForPhase = (phase: Phase) => {
    return phase.sessions
      .filter(s => s.endTime)
      .reduce((sum, s) => {
        const diff = (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 3600000
        return sum + Math.round(diff * 2) / 2
      }, 0)
  }

  if (loading || !project) return <div className="p-8 text-gray-500">Laddar...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.push('/projects')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Projekt
        </button>
      </div>

      <div className="flex items-start justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          {project.lead && (
            <p className="text-gray-500 text-sm mt-1">
              {project.lead.company?.name || project.lead.title}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {project.status === 'ACTIVE' ? 'Aktivt' : project.status === 'PAUSED' ? 'Pausat' : 'Avslutat'}
          </span>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
          >
            Radera
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4">{project.description}</p>
      )}

      {project.contractUrl && (
        <a
          href={project.contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#5e3a8c] hover:underline mb-6"
        >
          📄 Avtal/offert
        </a>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Faser</h2>
          <button
            onClick={() => setShowAddPhase(true)}
            className="text-sm px-3 py-1.5 bg-[#5e3a8c] text-white rounded-lg hover:bg-[#4a2d6f]"
          >
            + Lägg till fas
          </button>
        </div>

        {project.phases.length === 0 ? (
          <p className="text-gray-400 text-sm">Inga faser än. Lägg till en fas för att börja logga tid.</p>
        ) : (
          <div className="space-y-3">
            {project.phases.map(phase => {
              const hours = totalHoursForPhase(phase)
              const rate = phase.billingType === 'HOURLY'
                ? (phase.hourlyRate || project.defaultRate)
                : project.defaultRate
              const value = hours * rate

              return (
                <div key={phase.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{phase.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {phase.billingType === 'HOURLY' ? 'Löpande' : 'Fastpris'}
                        </span>
                      </div>
                      {phase.billingType === 'FIXED_PRICE' && phase.fixedAmount && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          Fakturerat: {phase.fixedAmount.toLocaleString('sv-SE')} {project.currency}
                        </p>
                      )}
                      {phase.billingType === 'HOURLY' && phase.hourlyRate && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {phase.hourlyRate.toLocaleString('sv-SE')} {project.currency}/tim
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{hours} tim</div>
                      <div className="text-sm text-gray-500">
                        {value.toLocaleString('sv-SE')} {project.currency}
                        {phase.billingType === 'FIXED_PRICE' && (
                          <span className="text-xs text-gray-400 ml-1">(schablon)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddPhase && (
        <AddPhaseModal
          projectId={project.id}
          onClose={() => setShowAddPhase(false)}
          onAdded={() => { fetchProject(); setShowAddPhase(false) }}
        />
      )}
    </div>
  )
}

function AddPhaseModal({
  projectId,
  onClose,
  onAdded
}: {
  projectId: string
  onClose: () => void
  onAdded: () => void
}) {
  const [name, setName] = useState('')
  const [billingType, setBillingType] = useState<'FIXED_PRICE' | 'HOURLY'>('HOURLY')
  const [fixedAmount, setFixedAmount] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`/api/projects/${projectId}/phases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        billingType,
        fixedAmount: fixedAmount ? parseFloat(fixedAmount) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null
      })
    })
    setSaving(false)
    onAdded()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Lägg till fas</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fasnamn *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="ex. Fas 1 - Workshop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faktureringsmodell</label>
            <div className="flex gap-3">
              {(['HOURLY', 'FIXED_PRICE'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setBillingType(type)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    billingType === type
                      ? 'bg-[#5e3a8c] text-white border-[#5e3a8c]'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  {type === 'HOURLY' ? 'Löpande' : 'Fastpris'}
                </button>
              ))}
            </div>
          </div>

          {billingType === 'FIXED_PRICE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fakturerat belopp (SEK)</label>
              <input
                value={fixedAmount}
                onChange={e => setFixedAmount(e.target.value)}
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="ex. 25000"
              />
            </div>
          )}

          {billingType === 'HOURLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avtalat timpris (SEK)</label>
              <input
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="ex. 1200"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 bg-[#5e3a8c] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Sparar...' : 'Lägg till'}
          </button>
        </div>
      </div>
    </div>
  )
}
