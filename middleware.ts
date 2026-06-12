import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-token'

const PUBLIC_ROUTES = ['/', '/login', '/signup']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname)
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl
  const isPublic = isPublicRoute(pathname)

  // No token: allow public pages, redirect protected pages to login
  if (!token) {
    if (isPublic) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = verifyToken(token)

  // Invalid or expired token: clear cookie and treat as logged out
  if (!payload) {
    if (isPublic) {
      return clearAuthCookie(NextResponse.next())
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    return clearAuthCookie(response)
  }

  // Valid token on auth pages: send to dashboard
  if (pathname === '/login' || pathname === '/signup') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
