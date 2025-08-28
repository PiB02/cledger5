import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { errorFactory, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

// Schema de validation pour l'ID
const paramsSchema = z.object({
  id: z.string().uuid('ID invalide')
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  // Validation de l'ID
  const params = await context.params
  const validation = paramsSchema.safeParse(params)
  
  if (!validation.success) {
    throw errorFactory.VALIDATION_ERROR('ID invalide', validation.error.errors)
  }
  
  const { id } = validation.data
  
  // Connexion Supabase
  const supabase = await createSupabaseServer()
  
  // Récupération de l'offre avec toutes ses relations
  const { data: offer, error } = await supabase
    .from('offers')
    .select(`
      *,
      companies!offers_company_id_fkey (
        id,
        name,
        brand,
        legal_name,
        website,
        size_range,
        siret,
        naf_code
      ),
      locations!offers_location_id_fkey (
        id,
        address1,
        address2,
        city,
        postal_code,
        department_code,
        region_code,
        insee_code
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      throw errorFactory.NOT_FOUND(`Offre ${id} introuvable`)
    }
    
    console.error('Database error:', error)
    throw errorFactory.INTERNAL('Erreur lors de la récupération de l\'offre', error.message)
  }
  
  // Ajout de métadonnées supplémentaires
  const enrichedOffer = {
    ...offer,
    _metadata: {
      has_company: !!offer.companies,
      has_location: !!offer.locations,
      is_expired: offer.status === 'expired' || 
        (offer.expiration_at && new Date(offer.expiration_at) < new Date())
    }
  }
  
  return Response.json({
    success: true,
    data: enrichedOffer
  })
}) 