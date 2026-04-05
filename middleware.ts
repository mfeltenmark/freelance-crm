import { NextRequest, NextResponse } from 'next/server'

const unprotectedPaths = [
  '/login',
  '/api/auth',
  '/api/webhooks',
  '/api/bookings',
  '/api/transcripts',
  '/api/contacts',
  '/api/card',
  '/api/gmail/poll',
]

function isUnprotected(pathname: string): boolean {
  return unprotectedPaths.some(path => pathname.startsWith(path))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isUnprotected(pathname)) {
    return NextResponse.next()
  }

  const sessionToken =
    request.cookies.get('__Secure-authjs.session-token') ??
    request.cookies.get('authjs.session-token')

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
