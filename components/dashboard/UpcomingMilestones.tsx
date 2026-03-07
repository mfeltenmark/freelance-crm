'use client'

import { Calendar, ArrowRight, Target } from 'lucide-react'
import { format, formatDistance, isPast, isToday } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  NEW: { label: 'Ny', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CONTACTED: { label: 'Kontaktad', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  QUALIFIED: { label: 'Kvalificerad', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  PROPOSAL: { label: 'Offert', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  NEGOTIATING: { label: 'Förhandling', color: 'text-amber-700', bgColor: 'bg-amber-100' },
}

interface Milestone {
  id: string
  title: string
  nextStep: string | null
  nextStepDate: string | null
  stage: string
  estimatedValue: string | null
  company: { name: string } | null
}

interface UpcomingMilestonesProps {
  milestones: Milestone[] | undefined
}

export function UpcomingMilestones({ milestones }: UpcomingMilestonesProps) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Kommande milstolpar</h3>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Inga milstolpar satta</p>
            <p className="text-gray-400 text-xs mt-1">Sätt &quot;Nästa steg&quot; på dina leads</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Kommande milstolpar</h3>
        <Link href="/leads" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          Alla leads →
        </Link>
      </div>
      <div className="card-body space-y-3">
        {milestones.map((m) => {
          const stage = stageConfig[m.stage] || stageConfig.NEW
          const hasDate = !!m.nextStepDate
          const date = hasDate ? new Date(m.nextStepDate!) : null
          const overdue = date && isPast(date) && !isToday(date)
          const today = date && isToday(date)

          return (
            <Link
              key={m.id}
              href={`/leads/${m.id}`}
              className={cn(
                'block p-3 rounded-lg border transition-all hover:shadow-sm',
                overdue ? 'border-red-200 bg-red-50/50' :
                today ? 'border-orange-200 bg-orange-50/50' :
                'border-gray-200 hover:border-brand-200'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{m.title}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0', stage.bgColor, stage.color)}>
                      {stage.label}
                    </span>
                  </div>
                  {m.company && (
                    <p className="text-xs text-gray-500 mt-0.5">{m.company.name}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <ArrowRight className="w-3 h-3 text-brand-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{m.nextStep}</span>
                  </div>
                </div>
                {date && (
                  <div className={cn(
                    'text-right flex-shrink-0',
                    overdue ? 'text-red-600' : today ? 'text-orange-600' : 'text-gray-500'
                  )}>
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <Calendar className="w-3 h-3" />
                      {format(date, 'd MMM', { locale: sv })}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {overdue ? 'Försenad!' : today ? 'Idag!' : formatDistance(date, new Date(), { addSuffix: true, locale: sv })}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
