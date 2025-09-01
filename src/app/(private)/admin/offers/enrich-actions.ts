'use server'

import { errorFactory } from '@/lib/errors'

export async function enrichOfferAction(offerId: string) {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      throw errorFactory.INTERNAL('Admin secret not configured')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/offers/${offerId}/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret
      }
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`
      }
    }

    return {
      success: true,
      data: result.data
    }

  } catch (error) {
    console.error('Enrich offer action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }
  }
}