'use client'

import { useState } from 'react'
import { 
  User, 
  Link2, 
  Bell, 
  Key, 
  Palette,
  Building2,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { IntegrationSettings } from '@/components/settings/IntegrationSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { ApiSettings } from '@/components/settings/ApiSettings'

type SettingsTab = 'profile' | 'integrations' | 'notifications' | 'api'

const tabs = [
  { id: 'profile' as const, label: 'Profil', icon: User, description: 'Dina personuppgifter och företag' },
  { id: 'integrations' as const, label: 'Integrationer', icon: Link2, description: 'BookMe och andra kopplingar' },
  { id: 'notifications' as const, label: 'Notifikationer', icon: Bell, description: 'Email och påminnelser' },
  { id: 'api' as const, label: 'API-nycklar', icon: Key, description: 'Utvecklarinställningar' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inställningar</h2>
        <p className="text-gray-500 mt-1">Hantera ditt konto och integrationer</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-brand-50 border border-brand-200'
                    : 'hover:bg-gray-50'
                )}
              >
                <tab.icon className={cn(
                  'w-5 h-5 mt-0.5',
                  activeTab === tab.id ? 'text-brand-600' : 'text-gray-400'
                )} />
                <div>
                  <p className={cn(
                    'font-medium text-sm',
                    activeTab === tab.id ? 'text-brand-700' : 'text-gray-900'
                  )}>
                    {tab.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'api' && <ApiSettings />}
        </div>
      </div>
    </div>
  )
}
