'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Globe, Phone, Save, Camera, Building2 } from 'lucide-react'

export function ProfileSettings() {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: 'Tech & Change by Feltenmark AB',
    orgNumber: '',
    website: 'https://techchange.io',
    timezone: 'Europe/Stockholm',
  })

  // Load session data + saved preferences
  useEffect(() => {
    if (session?.user && !loaded) {
      const nameParts = (session.user.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Load saved preferences from API
      fetch('/api/profile')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          setProfile(prev => ({
            ...prev,
            firstName,
            lastName,
            email: session.user?.email || '',
            ...(data?.preferences || {}),
          }))
          setLoaded(true)
        })
        .catch(() => {
          setProfile(prev => ({
            ...prev,
            firstName,
            lastName,
            email: session.user?.email || '',
          }))
          setLoaded(true)
        })
    }
  }, [session, loaded])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone,
          company: profile.company,
          orgNumber: profile.orgNumber,
          website: profile.website,
          timezone: profile.timezone,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'MF'

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
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={profile.firstName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-semibold">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{profile.firstName} {profile.lastName}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-1">Inloggad via Google</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Förnamn</label>
              <input
                type="text"
                value={profile.firstName}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Hämtas från Google</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Efternamn</label>
              <input
                type="text"
                value={profile.lastName}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Hämtas från Google</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+46 70 123 45 67"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tidszon</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Företagsnamn</label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisationsnummer</label>
            <input
              type="text"
              value={profile.orgNumber}
              onChange={(e) => setProfile({ ...profile, orgNumber: e.target.value })}
              placeholder="XXXXXX-XXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webbplats</label>
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
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sparar...</>
          ) : saved ? (
            <><Save className="w-4 h-4" />Sparat!</>
          ) : (
            <><Save className="w-4 h-4" />Spara ändringar</>
          )}
        </button>
      </div>
    </div>
  )
}
