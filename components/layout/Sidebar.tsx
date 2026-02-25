'use client'

import { useState, useEffect } from 'react'
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
  Zap,
  X,
  Menu,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut, useSession } from 'next-auth/react'

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

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const userInitials = session?.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col z-50 transition-transform duration-300 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-semibold text-lg">Leads</span>
              <span className="text-brand-400 font-semibold text-lg">.CRM</span>
            </div>
          </div>
          
          {/* Close button - mobile only */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
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
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-medium">
                  {userInitials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || 'Användare'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="nav-item w-full mt-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              Logga ut
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// Mobile header component
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-white/10 flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-semibold">Leads.CRM</span>
      </div>
      
      <button 
        onClick={onMenuClick}
        className="p-2 text-gray-400 hover:text-white rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  )
}
