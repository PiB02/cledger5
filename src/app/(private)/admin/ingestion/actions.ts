'use server'

import { errorFactory } from '@/lib/errors'

export interface IngestionParams {
  from?: string
  to?: string
  limit?: number
  departments?: string[]
  romeCodes?: string[]
  test?: boolean
}

export async function startLbaIngestion(params: IngestionParams) {
  try {
    // Vérifier que la variable d'environnement ADMIN_SECRET existe
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      throw new Error('Configuration error: ADMIN_SECRET not configured')
    }

    // Faire l'appel API côté serveur avec le secret
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/ingest/lba`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error starting ingestion:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 