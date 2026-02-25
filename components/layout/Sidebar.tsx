'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  BarChart3,
  Settings,
  LogOut,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Briefcase },
  { name: 'Kontakter', href: '/contacts', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Kalender', href: '/calendar', icon: Calendar },
  { name: 'Rapporter', href: '/reports', icon: BarChart3 },
]

const bottomNav = [
  { name: 'Inställningar', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-semibold text-lg">Leads</span>
          <span className="text-brand-400 font-semibold text-lg">.CRM</span>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'nav-item',
                isActive && 'nav-item-active'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'nav-item',
                isActive && 'nav-item-active'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}

        {/* User section */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-medium">
              MF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Micky Feltenmark</p>
              <p className="text-xs text-gray-400 truncate">Tech & Change</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
