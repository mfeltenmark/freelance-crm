'use client'

import { useState } from 'react'
import { Bell, Search, Plus, RefreshCw } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/contacts': 'Kontakter',
  '/tasks': 'Tasks',
  '/calendar': 'Kalender',
  '/reports': 'Rapporter',
  '/settings': 'Inställningar',
}

export function Header() {
  const pathname = usePathname()
  const basePathname = '/' + (pathname.split('/')[1] || '')
  const title = pageTitles[basePathname] || 'Dashboard'
  const queryClient = useQueryClient()
  const [polling, setPolling] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handlePoll() {
    setPolling(true)
    try {
      const res = await fetch('/api/gmail/poll-trigger', { method: 'POST' })
      const data = await res.json()
      await queryClient.invalidateQueries({ queryKey: ['mail-signals-pending'] })
      const created = data.created ?? 0
      setToast(created > 0 ? `Hittade ${created} nytt lead` : 'Inga nya lead')
      setTimeout(() => setToast(null), 3000)
    } finally {
      setPolling(false)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Page title */}
      <div>
        <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Search - hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sök leads, kontakter..."
            className="w-48 lg:w-64 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Search icon - mobile only */}
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <Search className="w-5 h-5" />
        </button>

        {/* Quick add */}
        <button className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ny lead</span>
        </button>

        {/* Poll Gmail */}
        <button
          onClick={handlePoll}
          disabled={polling}
          title="Hämta nya leads från Gmail"
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${polling ? 'animate-spin' : ''}`} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </header>
  )
}
