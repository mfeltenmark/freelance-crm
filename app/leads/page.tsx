'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Plus, 
  Filter, 
  Building2, 
  Calendar,
  TrendingUp,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CreateLeadModal } from '@/components/leads/CreateLeadModal'

interface Lead {
  id: string
  title: string
  description: string | null
  stage: string
  status: string
  estimatedValue: string | null
  closeProbability: number | null
  source: string | null
  expectedCloseDate: string | null
  lastActivityDate: string | null
  company: {
    id: string
    name: string
    logoUrl: string | null
  } | null
  _count: {
    activities: number
    tasks: number
    proposals: number
  }
  createdAt: string
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

const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', search, stageFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (stageFilter) params.set('stage', stageFilter)
      
      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json()
    },
  })

  const leads: Lead[] = data?.leads || []
  const pipelineStats = data?.pipelineStats || []

  const formatCurrency = (value: string | null) => {
    if (!value) return '-'
    const num = parseFloat(value)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M kr`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k kr`
    return `${num.toFixed(0)} kr`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
          <p className="text-gray-500 mt-1">Hantera din försäljningspipeline</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Ny lead
        </button>
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-7 gap-2">
        {stages.slice(0, -2).map((stage) => {
          const stats = pipelineStats.find((s: any) => s.stage === stage)
          const config = stageConfig[stage]
          const isActive = stageFilter === stage
          
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(isActive ? null : stage)}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                isActive 
                  ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className={cn('text-xs font-medium', config.color)}>
                {config.label}
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {stats?._count || 0}
              </div>
              <div className="text-xs text-gray-500">
                {formatCurrency(stats?._sum?.estimatedValue)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sök leads, företag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
        
        {stageFilter && (
          <button
            onClick={() => setStageFilter(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Rensa filter ✕
          </button>
        )}
      </div>

      {/* Leads table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Lead
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Steg
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Värde
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Sannolikhet
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Förväntat avslut
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Senaste aktivitet
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4" colSpan={7}>
                    <div className="animate-pulse h-12 bg-gray-100 rounded" />
                  </td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <Building2 className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500 font-medium">Inga leads hittades</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {search || stageFilter ? 'Prova att ändra dina filter' : 'Skapa din första lead för att komma igång'}
                  </p>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const stage = stageConfig[lead.stage]
                
                return (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/leads/${lead.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {lead.company?.logoUrl ? (
                          <img 
                            src={lead.company.logoUrl} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{lead.title}</div>
                          {lead.company && (
                            <div className="text-sm text-gray-500">{lead.company.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        stage.bgColor,
                        stage.color
                      )}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(lead.estimatedValue)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${lead.closeProbability || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {lead.closeProbability || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.expectedCloseDate 
                        ? format(new Date(lead.expectedCloseDate), 'd MMM yyyy', { locale: sv })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {lead.lastActivityDate 
                        ? format(new Date(lead.lastActivityDate), 'd MMM', { locale: sv })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateLeadModal 
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
