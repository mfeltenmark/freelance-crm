'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

// Pages that don't need the app shell (login, public pages)
const publicPages = ['/login']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  // Check if current page is public
  const isPublicPage = publicPages.includes(pathname)

  // Show loading state while checking auth
  if (status === 'loading' && !isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Laddar...</p>
        </div>
      </div>
    )
  }

  // For public pages (login), render without shell
  if (isPublicPage) {
    return <>{children}</>
  }

  // If not authenticated and not on public page, middleware handles redirect
  // This is a fallback UI
  if (!session && status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Omdirigerar till inloggning...</p>
        </div>
      </div>
    )
  }

  // Render authenticated layout
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile header */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Desktop header */}
        <div className="hidden lg:block">
          <Header />
        </div>
        
        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pt-[72px] lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
