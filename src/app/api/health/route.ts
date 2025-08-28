import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    // Test de connexion avec le client server
    const supabase = await createSupabaseServer()
    
    // Test simple : vérifier que la connexion fonctionne
    const { error } = await supabase.from('app_users').select('count').limit(1).single()
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table vide, ce qui est OK pour un test
      throw error
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      supabase: {
        connected: true,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https?:\/\/([^.]+).*/, '$1...'),
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 