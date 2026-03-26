import { auth } from '@/lib/auth-edge'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthApi = pathname.startsWith('/api/auth')
  const isUnprotectedApi =
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/bookings') ||
    pathname.startsWith('/api/transcripts') ||
    pathname.startsWith('/api/contacts') ||
    pathname.startsWith('/api/card')

  if (isPublicRoute || isAuthApi || isUnprotectedApi) {
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
