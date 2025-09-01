import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase/route-handler'
import { errorFactory } from '@/lib/errors'

interface OfferDetail {
  id: string
  canonical_fingerprint: string
  title: string
  description: string | null
  status: string
  created_at: string
  expiration_at: string | null
  updated_at: string
  alternance: boolean
  contract_type: string | null
  work_mode: string | null
  contract_type_code: string | null
  work_mode_code: string | null
  work_time_code: string | null
  contract_start_date: string | null
  contract_duration_months: number | null
  opening_count: number | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: string | null
  salary_period_code: string | null
  salary_label: string | null
  target_diploma_label: string | null
  rome_codes: string[] | null
  rncp_codes: string[] | null
  apply_url: string | null
  apply_phone: string | null
  source_primary: string
  partner_label: string | null
  career_level: string | null
  max_years_exp: number | null
  search_tsv: string | null
  company: {
    id: string
    siret: string | null
    name: string
    brand: string | null
    legal_name: string | null
    website: string | null
    size_range: string | null
    naf_code: string | null
  } | null
  location: {
    id: string
    address1: string | null
    address2: string | null
    postal_code: string | null
    city: string | null
    insee_code: string | null
    country_code: string
    department_code: string | null
    region_code: string | null
    geohash: string | null
  } | null
  enrichment: {
    offer_id: string
    parse_status: string
    last_parsed_at: string | null
    error_msg: string | null
    last_raw_id: string | null
    enrichment_status: string
    processed_at: string | null
    confidence_scores: any
    created_at: string
    updated_at: string
    enrichment_version: string
    model_used: string
    skills_required: any
    skills_preferred: any
    seniority_level: string | null
    languages_detected: any
    degree_requirements: any
    rome_codes_suggested: string[] | null
    job_category_detected: string | null
    company_size_indicators: string[] | null
    tokens_used: number | null
    processing_time_ms: number | null
    retry_count: number
  } | null
  sources: Array<{
    source_id: string
    source_offer_id: string
    origin_url: string | null
    is_primary: boolean
    created_at: string
  }>
  raw_data: Array<{
    id: string
    source_id: string
    source_offer_id: string
    fetched_at: string
    last_seen_at: string
    is_active: boolean
    origin_url: string | null
    raw: any
    processed_at: string | null
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id
    
    if (!offerId) {
      throw errorFactory.BAD_REQUEST('Offer ID is required')
    }

    const supabase = createSupabaseServiceRole()

    // Main offer query with all relations
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        company:companies!offers_company_id_fkey (*),
        location:locations!offers_location_id_fkey (*),
        enrichment:offer_enrichment!offer_enrichment_offer_id_fkey (*)
      `)
      .eq('id', offerId)
      .single()

    if (offerError) {
      if (offerError.code === 'PGRST116') {
        throw errorFactory.NOT_FOUND('Offer not found')
      }
      console.error('Offer detail error:', offerError)
      throw errorFactory.INTERNAL('Database error fetching offer')
    }

    // Get offer sources
    const { data: sources, error: sourcesError } = await supabase
      .from('offer_sources')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false })

    if (sourcesError) {
      console.error('Offer sources error:', sourcesError)
    }

    // Get raw data from all partitions
    // First, get the source IDs and offer IDs to search for
    const sourceOfferIds = (sources || []).map(s => s.source_offer_id)
    
    let rawData: any[] = []
    
    if (sourceOfferIds.length > 0) {
      // Query recent partitions (last 3 months)
      const partitions = [
        'offers_raw_2025_09',
        'offers_raw_2025_08', 
        'offers_raw_2025_10'
      ]

      for (const partition of partitions) {
        try {
          const { data: partitionData, error: partitionError } = await supabase
            .from(partition)
            .select('*')
            .in('source_offer_id', sourceOfferIds)
            .order('fetched_at', { ascending: false })

          if (!partitionError && partitionData) {
            rawData.push(...partitionData)
          }
        } catch (partitionError) {
          console.warn(`Failed to query partition ${partition}:`, partitionError)
        }
      }

      // Also try main table
      try {
        const { data: mainData, error: mainError } = await supabase
          .from('offers_raw')
          .select('*')
          .in('source_offer_id', sourceOfferIds)
          .order('fetched_at', { ascending: false })

        if (!mainError && mainData) {
          rawData.push(...mainData)
        }
      } catch (mainError) {
        console.warn('Failed to query main offers_raw table:', mainError)
      }
    }

    // Remove duplicates and sort by fetched_at
    const uniqueRawData = rawData
      .filter((item, index, arr) => 
        arr.findIndex(other => other.id === item.id) === index
      )
      .sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())

    // Transform the data
    const offerDetail: OfferDetail = {
      ...offer,
      company: Array.isArray(offer.company) && offer.company.length > 0 ? offer.company[0] : null,
      location: Array.isArray(offer.location) && offer.location.length > 0 ? offer.location[0] : null,
      enrichment: Array.isArray(offer.enrichment) && offer.enrichment.length > 0 ? offer.enrichment[0] : null,
      sources: sources || [],
      raw_data: uniqueRawData
    }

    return NextResponse.json({
      success: true,
      data: offerDetail
    })

  } catch (error) {
    console.error('Admin offer detail API error:', error)
    
    if (error instanceof Error && error.message === 'Offer not found') {
      return NextResponse.json({
        success: false,
        error: 'Offer not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}