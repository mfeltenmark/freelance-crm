'use client'

import { Bell, Search, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'

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

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
