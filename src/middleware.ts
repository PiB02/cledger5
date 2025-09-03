import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)'
])

export default clerkMiddleware((auth, req) => {
  // Skip Clerk protection for API endpoints with their own authentication
  const pathname = req.nextUrl.pathname;
  const apiEndpointsWithOwnAuth = [
    '/api/ingest',           // Ingestion endpoints use x-admin-secret
    '/api/admin/ingest',     // Admin ingestion endpoints use development bypass
    '/api/health',           // Health check is public
    '/api/search',           // Search endpoints are public
    '/api/offers',           // Offer detail endpoints are public
  ];
  
  // Check if this is an API endpoint with its own auth
  if (apiEndpointsWithOwnAuth.some(endpoint => pathname.startsWith(endpoint))) {
    console.log('🔓 Skipping Clerk middleware for API endpoint:', pathname);
    return;
  }
  
  // DEVELOPMENT BYPASS: Skip Clerk protection in dev mode with bypass enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devAdminBypass = process.env.DEV_ADMIN_BYPASS === 'true';
  
  if (isDevelopment && devAdminBypass && req.url.includes('/admin')) {
    console.log('🔓 DEV MODE: Bypassing Clerk middleware for admin route');
    return;
  }
  
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 