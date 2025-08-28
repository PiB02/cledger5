import { createClient } from '@supabase/supabase-js'

// ATTENTION: Ce client utilise la clé SERVICE_ROLE_KEY qui bypass RLS
// À utiliser uniquement côté serveur pour les opérations admin
export function createSupabaseService() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )
} 