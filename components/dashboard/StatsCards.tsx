'use client'

import { Briefcase, TrendingUp, CheckCircle, DollarSign, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    activeLeads: number
    totalLeads: number
    wonThisMonth: number
    conversionRate: number
    pipelineValue: string
    overdueTaskCount: number
    todayTaskCount: number
  } | undefined
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M kr`
    if (num >= 1000) return `${Math.round(num / 1000)}k kr`
    return `${Math.round(num)} kr`
  }

  const cards = [
    {
      label: 'Aktiva leads',
      value: stats?.activeLeads ?? '-',
      sub: stats ? `${stats.totalLeads} totalt` : undefined,
      icon: Briefcase,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50',
    },
    {
      label: 'Pipeline-värde',
      value: stats?.pipelineValue ? formatCurrency(stats.pipelineValue) : '-',
      sub: stats ? `${stats.activeLeads} aktiva leads` : undefined,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Vunna denna månad',
      value: stats?.wonThisMonth ?? '-',
      sub: stats ? `${stats.conversionRate}% konvertering` : undefined,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Att göra',
      value: stats ? (stats.overdueTaskCount + stats.todayTaskCount) : '-',
      sub: stats?.overdueTaskCount ? `${stats.overdueTaskCount} försenade` : 'Allt i fas',
      icon: stats?.overdueTaskCount ? AlertCircle : Clock,
      color: stats?.overdueTaskCount ? 'text-red-600' : 'text-orange-600',
      bgColor: stats?.overdueTaskCount ? 'bg-red-50' : 'bg-orange-50',
      alert: !!stats?.overdueTaskCount,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {cards.map((card) => (
        <div key={card.label} className={cn('card p-4 lg:p-5', card.alert && 'border-red-200')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-500">{card.label}</p>
              <p className="mt-1 lg:mt-2 text-2xl lg:text-3xl font-bold text-gray-900">{card.value}</p>
              {card.sub && (
                <p className={cn('text-xs mt-1', card.alert ? 'text-red-600 font-medium' : 'text-gray-400')}>
                  {card.sub}
                </p>
              )}
            </div>
            <div className={`p-2 lg:p-2.5 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
