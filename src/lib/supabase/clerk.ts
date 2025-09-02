import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Create Supabase client with Clerk authentication
 * This integrates Clerk's JWT with Supabase RLS
 */
export async function createSupabaseClerkClient() {
  const { getToken } = await auth()
  
  const supabaseAccessToken = await getToken({
    template: 'supabase',
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`,
        },
      },
    }
  )

  return supabase
}

/**
 * Get current user info from Clerk for database operations
 */
export async function getCurrentUser() {
  const { userId, sessionClaims } = await auth()
  
  if (!userId) {
    return null
  }

  return {
    id: userId,
    email: sessionClaims?.email as string,
    role: sessionClaims?.metadata?.role as string || 'user',
    fullName: sessionClaims?.full_name as string,
  }
}

/**
 * Check if current user has admin role
 */
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Middleware helper to check admin access
 */
export async function requireAdmin() {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Admin access required')
  }
}