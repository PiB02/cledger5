import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // For now, just pass all requests through to test route registration
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Temporarily disable middleware for all API routes to test
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 