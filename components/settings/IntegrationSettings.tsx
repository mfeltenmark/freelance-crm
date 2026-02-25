'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Check, 
  ExternalLink, 
  RefreshCw,
  Zap,
  Mail,
  Video
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  description: string
  icon: typeof Calendar
  connected: boolean
  status?: 'active' | 'error' | 'syncing'
  lastSync?: string
  url?: string
}

export function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'bookme',
      name: 'BookMe',
      description: 'Synka bokningar automatiskt till CRM',
      icon: Calendar,
      connected: true,
      status: 'active',
      lastSync: '2 minuter sedan',
      url: 'https://book.techchange.io',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Visa dina kalenderevents i CRM',
      icon: Calendar,
      connected: true,
      status: 'active',
      lastSync: '5 minuter sedan',
    },
    {
      id: 'google-meet',
      name: 'Google Meet',
      description: 'Skapa automatiskt möteslänkar',
      icon: Video,
      connected: true,
      status: 'active',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Spåra emails i aktivitetshistorik',
      icon: Mail,
      connected: false,
    },
  ])

  const [syncing, setSyncing] = useState<string | null>(null)

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000))
    setSyncing(null)
    
    setIntegrations(prev => prev.map(i => 
      i.id === integrationId 
        ? { ...i, lastSync: 'Just nu' }
        : i
    ))
  }

  const handleToggle = (integrationId: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === integrationId
        ? { ...i, connected: !i.connected }
        : i
    ))
  }

  return (
    <div className="space-y-6">
      {/* BookMe integration - highlighted */}
      <div className="card border-brand-200 bg-brand-50/30">
        <div className="card-header border-brand-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">BookMe Integration</h3>
              <p className="text-sm text-gray-500">Din bokningssida är kopplad till CRM:et</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Boknings-URL</p>
              <a 
                href="https://book.techchange.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                book.techchange.io
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Webhook-status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-900">Aktiv</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Synkade bokningar</p>
              <p className="font-semibold text-gray-900">24 bokningar</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Senaste bokning</p>
              <p className="text-sm text-gray-900">Idag 09:15</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-brand-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Nya bokningar skapar automatiskt leads och aktiviteter
            </div>
            <a 
              href="https://book.techchange.io/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Öppna BookMe →
            </a>
          </div>
        </div>
      </div>

      {/* Other integrations */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Andra integrationer</h3>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-gray-100">
            {integrations.filter(i => i.id !== 'bookme').map((integration) => (
              <div 
                key={integration.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    integration.connected ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    <integration.icon className={cn(
                      'w-5 h-5',
                      integration.connected ? 'text-green-600' : 'text-gray-400'
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{integration.name}</p>
                      {integration.connected && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Check className="w-3 h-3" />
                          Ansluten
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                    {integration.lastSync && integration.connected && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Senast synkad: {integration.lastSync}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {integration.connected && (
                    <button
                      onClick={() => handleSync(integration.id)}
                      disabled={syncing === integration.id}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <RefreshCw className={cn(
                        'w-4 h-4',
                        syncing === integration.id && 'animate-spin'
                      )} />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(integration.id)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      integration.connected ? 'bg-brand-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        integration.connected ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Webhook info */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Webhook-inställningar</h3>
        </div>
        <div className="card-body">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              Webhook-URL för externa integrationer:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono text-gray-700">
                https://leads.techchange.io/api/webhooks/incoming
              </code>
              <button 
                onClick={() => navigator.clipboard.writeText('https://leads.techchange.io/api/webhooks/incoming')}
                className="px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg"
              >
                Kopiera
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
