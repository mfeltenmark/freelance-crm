'use client'

import { useState } from 'react'
import { Bell, Mail, Calendar, CheckCircle, AlertCircle, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationSetting {
  id: string
  label: string
  description: string
  email: boolean
  push: boolean
}

export function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'new_booking',
      label: 'Nya bokningar',
      description: 'När någon bokar ett möte via BookMe',
      email: true,
      push: true,
    },
    {
      id: 'booking_reminder',
      label: 'Mötespåminnelser',
      description: '15 minuter innan mötet börjar',
      email: true,
      push: true,
    },
    {
      id: 'task_due',
      label: 'Förfallna tasks',
      description: 'När en task passerar sitt förfallodatum',
      email: true,
      push: false,
    },
    {
      id: 'lead_activity',
      label: 'Lead-aktivitet',
      description: 'När en lead uppdateras eller får ny aktivitet',
      email: false,
      push: true,
    },
    {
      id: 'weekly_summary',
      label: 'Veckosammanfattning',
      description: 'Översikt av veckans aktiviteter varje måndag',
      email: true,
      push: false,
    },
  ])

  const [emailDigest, setEmailDigest] = useState('instant')

  const toggleSetting = (id: string, type: 'email' | 'push') => {
    setSettings(prev => prev.map(s =>
      s.id === id ? { ...s, [type]: !s[type] } : s
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Email preferences */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Email-inställningar</h3>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email-frekvens
            </label>
            <select
              value={emailDigest}
              onChange={(e) => setEmailDigest(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="instant">Direkt (realtid)</option>
              <option value="hourly">Sammanfattning varje timme</option>
              <option value="daily">Daglig sammanfattning</option>
              <option value="none">Inga emails</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Välj hur ofta du vill få email-notifikationer
            </p>
          </div>
        </div>
      </div>

      {/* Notification types */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifikationstyper</h3>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </span>
              <span className="flex items-center gap-1">
                <Bell className="w-4 h-4" />
                Push
              </span>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-gray-100">
            {settings.map((setting) => (
              <div 
                key={setting.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{setting.label}</p>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                </div>
                <div className="flex items-center gap-6">
                  {/* Email toggle */}
                  <button
                    onClick={() => toggleSetting(setting.id, 'email')}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      setting.email ? 'bg-brand-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        setting.email ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                  
                  {/* Push toggle */}
                  <button
                    onClick={() => toggleSetting(setting.id, 'push')}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      setting.push ? 'bg-brand-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        setting.push ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiet hours */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Tysta timmar</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">Aktivera tysta timmar</p>
              <p className="text-sm text-gray-500">Inga notifikationer under dessa timmar</p>
            </div>
            <button
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1'
                )}
              />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 opacity-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Från
              </label>
              <input
                type="time"
                defaultValue="22:00"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Till
              </label>
              <input
                type="time"
                defaultValue="08:00"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sparar...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Sparat!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Spara ändringar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
