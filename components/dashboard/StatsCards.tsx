'use client'

import { useQuery } from '@tanstack/react-query'
import { Briefcase, Users, CheckCircle, TrendingUp } from 'lucide-react'

interface Stats {
  totalLeads: number
  activeLeads: number
  wonThisMonth: number
  conversionRate: number
}

export function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return {
        totalLeads: 24,
        activeLeads: 8,
        wonThisMonth: 3,
        conversionRate: 32,
      } as Stats
    },
  })

  const cards = [
    {
      label: 'Aktiva leads',
      value: stats?.activeLeads ?? '-',
      icon: Briefcase,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50',
    },
    {
      label: 'Totalt leads',
      value: stats?.totalLeads ?? '-',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Vunna denna månad',
      value: stats?.wonThisMonth ?? '-',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Konverteringsgrad',
      value: stats?.conversionRate ? `${stats.conversionRate}%` : '-',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
