import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/offres',
  '/offres/(.*)',
  '/api/health',
  '/api/search/(.*)',
  '/api/offers/(.*)',
  '/api/france-travail/test',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// Define admin routes that require specific role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin/(.*)',
  '/api/ingest/(.*)',
  '/api/canonicalize(.*)',
  '/api/enrich/(.*)',
  '/api/embeddings/(.*)',
  '/api/agents/(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Protect admin routes with basic auth (temporarily removing role requirement)
  if (isAdminRoute(request)) {
    await auth.protect()
  }

  // Protect all other routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}