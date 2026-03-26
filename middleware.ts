import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-edge'

const unprotectedPaths = [
  '/login',
  '/api/auth',
  '/api/webhooks',
  '/api/bookings',
  '/api/transcripts',
  '/api/contacts',
  '/api/card',
]

function isUnprotected(pathname: string): boolean {
  return unprotectedPaths.some(path => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isUnprotected(pathname)) {
    return NextResponse.next()
  }

  const session = await auth()
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
