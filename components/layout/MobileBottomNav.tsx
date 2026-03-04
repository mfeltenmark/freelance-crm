'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  CheckSquare, 
  Calendar,
  Plus,
  X,
  UserPlus,
  ClipboardPlus,
  FileBarChart
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Hem', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Briefcase },
  { name: 'add', href: '#', icon: Plus }, // FAB placeholder
  { name: 'Kontakter', href: '/contacts', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
]

const quickActions = [
  { name: 'Ny lead', href: '/leads?new=1', icon: FileBarChart, color: 'bg-purple-500' },
  { name: 'Ny kontakt', href: '/contacts?new=1', icon: UserPlus, color: 'bg-blue-500' },
  { name: 'Ny task', href: '/tasks?new=1', icon: ClipboardPlus, color: 'bg-green-500' },
  { name: 'Kalender', href: '/calendar', icon: Calendar, color: 'bg-orange-500' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [showQuickActions, setShowQuickActions] = useState(false)

  return (
    <>
      {/* Quick actions overlay */}
      {showQuickActions && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowQuickActions(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-20 left-0 right-0 flex justify-center">
            <div className="grid grid-cols-2 gap-3 px-6 w-full max-w-xs">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  onClick={() => setShowQuickActions(false)}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white', action.color)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            if (tab.name === 'add') {
              return (
                <button
                  key="add"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className={cn(
                    'flex items-center justify-center w-12 h-12 -mt-4 rounded-full shadow-lg transition-all active:scale-95',
                    showQuickActions 
                      ? 'bg-gray-700 rotate-45' 
                      : 'bg-brand-600'
                  )}
                >
                  {showQuickActions ? (
                    <X className="w-6 h-6 text-white" />
                  ) : (
                    <Plus className="w-6 h-6 text-white" />
                  )}
                </button>
              )
            }

            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px]',
                  isActive ? 'text-brand-600' : 'text-gray-400'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
