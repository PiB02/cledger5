'use server'

export async function triggerEnrichmentQueueAction() {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      throw new Error('Admin secret not configured')
    }

    // Appel vers notre API queue worker
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/enrich/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret,
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Queue enrichment failed')
    }

    return {
      success: true,
      data: result.data
    }

  } catch (error) {
    console.error('Trigger enrichment queue action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}