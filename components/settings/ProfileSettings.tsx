'use client'

import { useState } from 'react'
import { User, Building2, Globe, Mail, Phone, Save, Camera } from 'lucide-react'

export function ProfileSettings() {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [profile, setProfile] = useState({
    firstName: 'Micky',
    lastName: 'Feltenmark',
    email: 'micky@techchange.io',
    phone: '',
    company: 'Tech & Change by Feltenmark AB',
    orgNumber: '',
    website: 'https://techchange.io',
    timezone: 'Europe/Stockholm',
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Profile picture */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Profilbild</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-semibold">
                MF
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Ladda upp en profilbild. PNG eller JPG, max 2MB.
              </p>
              <button className="mt-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                Ladda upp bild
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Personuppgifter</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Förnamn
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Efternamn
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-post
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+46 70 123 45 67"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tidszon
            </label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="Europe/Stockholm">Stockholm (CET/CEST)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="America/New_York">New York (EST/EDT)</option>
              <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Företagsuppgifter</h3>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Företagsnamn
            </label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisationsnummer
            </label>
            <input
              type="text"
              value={profile.orgNumber}
              onChange={(e) => setProfile({ ...profile, orgNumber: e.target.value })}
              placeholder="XXXXXX-XXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webbplats
            </label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
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
              <Save className="w-4 h-4" />
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
