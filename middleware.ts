import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  
  // Public routes that don't require auth
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // API routes that should be public
  const isAuthApi = pathname.startsWith('/api/auth')
  const isWebhookApi = pathname.startsWith('/api/webhooks')
  
  // Allow public routes and auth API
  if (isPublicRoute || isAuthApi || isWebhookApi) {
    // Redirect logged-in users away from login page
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }
  
  // Protect all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
