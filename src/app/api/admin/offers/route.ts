import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'

interface OfferListItem {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  contract_type_code: string | null
  work_mode_code: string | null
  career_level: string | null
  max_years_exp: number | null
  source_primary: string
  company: {
    id: string
    name: string
    brand: string | null
  } | null
  location: {
    id: string
    city: string | null
    department_code: string | null
    region_code: string | null
  } | null
  enrichment: {
    enrichment_status: string
    confidence_scores: any
    processed_at: string | null
    seniority_level: string | null
    skills_required: any
    skills_preferred: any
  } | null
}

interface OfferFilters {
  search?: string
  enrichment_status?: 'all' | 'pending' | 'completed' | 'failed' | 'low_confidence'
  source?: string
  contract_type?: string
  work_mode?: string
  career_level?: string
  location_department?: string
  location_region?: string
  confidence_threshold?: number
  created_after?: string
  created_before?: string
  page?: number
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters from query params
    const filters: OfferFilters = {
      search: searchParams.get('search') || undefined,
      enrichment_status: (searchParams.get('enrichment_status') as any) || 'all',
      source: searchParams.get('source') || undefined,
      contract_type: searchParams.get('contract_type') || undefined,
      work_mode: searchParams.get('work_mode') || undefined,
      career_level: searchParams.get('career_level') || undefined,
      location_department: searchParams.get('location_department') || undefined,
      location_region: searchParams.get('location_region') || undefined,
      confidence_threshold: searchParams.get('confidence_threshold') ? 
        parseFloat(searchParams.get('confidence_threshold')!) : undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    const supabase = createSupabaseServiceRole()

    // Build query with joins
    let query = supabase
      .from('offers')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        contract_type_code,
        work_mode_code,
        career_level,
        max_years_exp,
        source_primary,
        company:companies!offers_company_id_fkey (
          id,
          name,
          brand
        ),
        location:locations!offers_location_id_fkey (
          id,
          city,
          department_code,
          region_code
        ),
        enrichment:offer_enrichment!offer_enrichment_offer_id_fkey (
          enrichment_status,
          confidence_scores,
          processed_at,
          seniority_level,
          skills_required,
          skills_preferred
        )
      `)

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.enrichment_status && filters.enrichment_status !== 'all') {
      // Need to join with offer_enrichment for status filter
      query = query.not('enrichment', 'is', null)
    }

    if (filters.source) {
      query = query.eq('source_primary', filters.source)
    }

    if (filters.contract_type) {
      query = query.eq('contract_type_code', filters.contract_type)
    }

    if (filters.work_mode) {
      query = query.eq('work_mode_code', filters.work_mode)
    }

    if (filters.career_level) {
      query = query.eq('career_level', filters.career_level)
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }

    // Pagination
    const offset = ((filters.page || 1) - 1) * (filters.limit || 50)
    query = query
      .range(offset, offset + (filters.limit || 50) - 1)
      .order('created_at', { ascending: false })

    const { data: offers, error, count } = await query

    if (error) {
      console.error('Offers list error:', error)
      throw errorFactory.INTERNAL('Database error fetching offers')
    }

    // Post-filter by enrichment status if needed (since we can't filter directly on joined table)
    let filteredOffers = offers || []
    
    if (filters.enrichment_status && filters.enrichment_status !== 'all') {
      filteredOffers = filteredOffers.filter(offer => {
        if (!offer.enrichment || !Array.isArray(offer.enrichment) || offer.enrichment.length === 0) {
          return filters.enrichment_status === 'pending'
        }
        return offer.enrichment[0].enrichment_status === filters.enrichment_status
      })
    }

    // Post-filter by confidence threshold if needed
    if (filters.confidence_threshold !== undefined) {
      filteredOffers = filteredOffers.filter(offer => {
        if (!offer.enrichment || !Array.isArray(offer.enrichment) || offer.enrichment.length === 0) {
          return false
        }
        const confidenceScores = offer.enrichment[0].confidence_scores
        if (!confidenceScores) return false
        
        // Calculate average confidence
        let avgConfidence = 0
        if (typeof confidenceScores === 'number') {
          avgConfidence = confidenceScores
        } else if (typeof confidenceScores === 'object') {
          const values = Object.values(confidenceScores).filter(v => typeof v === 'number') as number[]
          avgConfidence = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
        }
        
        return avgConfidence >= filters.confidence_threshold!
      })
    }

    // Transform data for frontend
    const transformedOffers: OfferListItem[] = filteredOffers.map(offer => ({
      id: offer.id,
      title: offer.title,
      status: offer.status,
      created_at: offer.created_at,
      updated_at: offer.updated_at,
      contract_type_code: offer.contract_type_code,
      work_mode_code: offer.work_mode_code,
      career_level: offer.career_level,
      max_years_exp: offer.max_years_exp,
      source_primary: offer.source_primary,
      company: Array.isArray(offer.company) && offer.company.length > 0 ? offer.company[0] : null,
      location: Array.isArray(offer.location) && offer.location.length > 0 ? offer.location[0] : null,
      enrichment: Array.isArray(offer.enrichment) && offer.enrichment.length > 0 ? offer.enrichment[0] : null
    }))

    // Get total count for pagination (approximate for performance)
    let totalCount = count || 0
    if (filters.enrichment_status && filters.enrichment_status !== 'all') {
      // For filtered queries, we need to estimate
      totalCount = filteredOffers.length
    }

    // Get filter options for frontend
    const { data: sources } = await supabase
      .from('sources')
      .select('id, label')
      .order('label')

    const { data: contractTypes } = await supabase
      .from('contract_types_ref')
      .select('code, label')
      .order('label')

    const { data: workModes } = await supabase
      .from('work_modes_ref')
      .select('code, label')
      .order('label')

    const response = {
      success: true,
      data: {
        offers: transformedOffers,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total: totalCount,
          pages: Math.ceil(totalCount / (filters.limit || 50))
        },
        filters: {
          sources: sources || [],
          contract_types: contractTypes || [],
          work_modes: workModes || [],
          career_levels: [
            { code: 'intern', label: 'Stage' },
            { code: 'junior', label: 'Junior' },
            { code: 'mid', label: 'Confirmé' },
            { code: 'senior', label: 'Senior' },
            { code: 'lead', label: 'Lead' },
            { code: 'manager', label: 'Manager' }
          ],
          enrichment_statuses: [
            { code: 'all', label: 'Tous' },
            { code: 'pending', label: 'En attente' },
            { code: 'completed', label: 'Enrichi' },
            { code: 'failed', label: 'Échec' },
            { code: 'low_confidence', label: 'Confiance faible' }
          ]
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin offers API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}