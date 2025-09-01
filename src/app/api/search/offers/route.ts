import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { errorFactory, withErrorHandler } from '@/lib/errors'
import { buildEmbeddingText } from '@cledger5/utils'
import { z } from 'zod'
import OpenAI from 'openai'

// Initialize OpenAI client for query embedding
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Schema de validation pour les paramètres de recherche
const searchParamsSchema = z.object({
  query: z.string().optional(),
  semantic_search: z.coerce.boolean().default(false), // Enable vector similarity search
  hybrid_search: z.coerce.boolean().default(false), // Enable hybrid (text + vector) search
  similarity_threshold: z.coerce.number().min(0).max(1).default(0.7), // Minimum cosine similarity
  semantic_boost: z.coerce.number().min(0).max(2).default(1.0), // Weight for semantic results
  text_boost: z.coerce.number().min(0).max(2).default(1.0), // Weight for full-text results
  rome_codes: z.string().optional(), // comma-separated
  location: z.string().optional(),
  radius_km: z.coerce.number().min(1).max(500).optional(),
  contract_types: z.string().optional(), // comma-separated
  work_modes: z.string().optional(), // comma-separated
  salary_min: z.coerce.number().optional(),
  alternance: z.coerce.boolean().optional(),
  sort_by: z.enum(['relevance', 'date', 'salary', 'similarity', 'hybrid']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  
  // Parse et valide les paramètres
  const params = searchParamsSchema.safeParse({
    query: searchParams.get('query') || undefined,
    semantic_search: searchParams.get('semantic_search') || 'false',
    hybrid_search: searchParams.get('hybrid_search') || 'false',
    similarity_threshold: searchParams.get('similarity_threshold') || '0.7',
    semantic_boost: searchParams.get('semantic_boost') || '1.0',
    text_boost: searchParams.get('text_boost') || '1.0',
    rome_codes: searchParams.get('rome_codes') || undefined,
    location: searchParams.get('location') || undefined,
    radius_km: searchParams.get('radius_km') || undefined,
    contract_types: searchParams.get('contract_types') || undefined,
    work_modes: searchParams.get('work_modes') || undefined,
    salary_min: searchParams.get('salary_min') || undefined,
    alternance: searchParams.get('alternance') || undefined,
    sort_by: searchParams.get('sort_by') || 'date',
    sort_order: searchParams.get('sort_order') || 'desc',
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20'
  })
  
  if (!params.success) {
    throw errorFactory.VALIDATION_ERROR('Paramètres invalides', params.error.errors)
  }
  
  const { page, limit, sort_by, sort_order, semantic_search, hybrid_search, similarity_threshold, semantic_boost, text_boost, ...filters } = params.data
  const offset = (page - 1) * limit
  
  // Connexion Supabase
  const supabase = await createSupabaseServer()
  
  // Handle semantic and hybrid search if enabled
  let semanticOfferIds: string[] = []
  let semanticResults: Array<{ offer_id: string, similarity: number }> = []
  let textResults: Array<{ offer_id: string, text_score: number }> = []
  let queryEmbedding: number[] = []
  
  if ((semantic_search || hybrid_search) && filters.query) {
    try {
      // Generate embedding for search query
      const queryEmbeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: filters.query,
        encoding_format: 'float'
      })
      
      queryEmbedding = queryEmbeddingResponse.data[0].embedding
      
      // Perform vector similarity search using HNSW index
      const { data: similarOffers, error: vectorError } = await supabase
        .rpc('match_offers_semantic', {
          query_embedding: queryEmbedding,
          match_threshold: similarity_threshold,
          match_count: Math.min(limit * 5, 500) // Get more results for filtering
        })
      
      if (vectorError) {
        console.error('Vector search error:', vectorError)
        // Fall back to regular search if vector search fails
      } else if (similarOffers && similarOffers.length > 0) {
        semanticResults = similarOffers.map((offer: any) => ({
          offer_id: offer.offer_id,
          similarity: 1 - offer.similarity // Convert distance to similarity
        }))
        semanticOfferIds = semanticResults.map(r => r.offer_id)
        console.log(`Found ${semanticOfferIds.length} semantically similar offers`)
      }
    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError)
      // Fall back to regular search if embedding generation fails
    }
  }

  // For hybrid search, also get text search results
  if (hybrid_search && filters.query) {
    try {
      const textSearchQuery = supabase
        .from('offers')
        .select(`
          id,
          ts_rank(search_tsv, plainto_tsquery('french_unaccent', $1)) as text_score
        `)
        .eq('status', 'active')
        .textSearch('search_tsv', filters.query, { config: 'french_unaccent' })
        .order('text_score', { ascending: false })
        .limit(Math.min(limit * 3, 200))

      const { data: textSearchData, error: textError } = await textSearchQuery

      if (!textError && textSearchData && textSearchData.length > 0) {
        textResults = textSearchData.map((offer: any) => ({
          offer_id: offer.id,
          text_score: offer.text_score || 0
        }))
        console.log(`Found ${textResults.length} text search matches`)
      }
    } catch (textError) {
      console.error('Text search error:', textError)
    }
  }
  
  // Construction de la requête
  let query = supabase
    .from('offers')
    .select(`
      id,
      title,
      description,
      status,
      alternance,
      contract_type,
      contract_type_code,
      work_mode,
      work_mode_code,
      salary_min,
      salary_max,
      salary_period,
      salary_period_code,
      rome_codes,
      created_at,
      updated_at,
      expiration_at,
      company_id,
      location_id,
      companies!offers_company_id_fkey (
        id,
        name,
        brand,
        website,
        size_range
      ),
      locations!offers_location_id_fkey (
        id,
        city,
        postal_code,
        department_code,
        region_code
      )
    `, { count: 'exact' })
    .eq('status', 'active')
  
  // Apply search filters based on search type
  if (hybrid_search && filters.query) {
    // For hybrid search, combine semantic and text results
    const hybridOfferIds = Array.from(new Set([
      ...semanticResults.map(r => r.offer_id),
      ...textResults.map(r => r.offer_id)
    ]))
    
    if (hybridOfferIds.length > 0) {
      query = query.in('id', hybridOfferIds)
    }
  } else if (semantic_search && semanticOfferIds.length > 0) {
    // Pure semantic search
    query = query.in('id', semanticOfferIds)
  }
  
  // Filtres
  if (filters.alternance !== undefined) {
    query = query.eq('alternance', filters.alternance)
  }
  
  if (filters.contract_types) {
    const types = filters.contract_types.split(',').map(t => t.trim())
    query = query.in('contract_type_code', types)
  }
  
  if (filters.work_modes) {
    const modes = filters.work_modes.split(',').map(m => m.trim())
    query = query.in('work_mode_code', modes)
  }
  
  if (filters.salary_min) {
    query = query.gte('salary_max', filters.salary_min)
  }
  
  if (filters.rome_codes) {
    const codes = filters.rome_codes.split(',').map(c => c.trim())
    query = query.overlaps('rome_codes', codes)
  }
  
  // Recherche textuelle
  if (filters.query) {
    // Utilisation de la recherche full-text avec le tsvector
    query = query.textSearch('search_tsv', filters.query, {
      config: 'french_unaccent'
    })
  }
  
  // Tri
  switch (sort_by) {
    case 'date':
      query = query.order('created_at', { ascending: sort_order === 'asc' })
      break
    case 'salary':
      query = query.order('salary_max', { ascending: sort_order === 'asc', nullsFirst: false })
      break
    case 'hybrid':
      // Hybrid scoring will be handled after the query
      break
    case 'similarity':
      if (semantic_search && semanticOfferIds.length > 0) {
        // For similarity sorting, we need to maintain the order from the vector search
        // Since PostgreSQL IN doesn't preserve order, we'll handle this after the query
        break
      }
      // Fall back to relevance if no semantic search
    case 'relevance':
      // Par défaut si recherche textuelle, sinon par date
      if (filters.query && !hybrid_search && !semantic_search) {
        // Le score de pertinence est déjà appliqué par textSearch
        break
      }
      query = query.order('created_at', { ascending: false })
      break
  }
  
  // Pagination
  query = query.range(offset, offset + limit - 1)
  
  // Exécution
  const { data, error, count } = await query
  
  if (error) {
    console.error('Database error:', error)
    throw errorFactory.INTERNAL('Erreur lors de la recherche', error.message)
  }
  
  let processedOffers = data || []
  
  // Handle scoring for semantic, hybrid, and text search
  if ((semantic_search || hybrid_search) && (semanticResults.length > 0 || textResults.length > 0)) {
    // Create maps for different score types
    const similarityMap = new Map(
      semanticResults.map(result => [result.offer_id, result.similarity])
    )
    const textScoreMap = new Map(
      textResults.map(result => [result.offer_id, result.text_score])
    )
    
    // Add scores to offers
    processedOffers = processedOffers.map((offer: any) => {
      const semanticScore = similarityMap.get(offer.id) || 0
      const textScore = textScoreMap.get(offer.id) || 0
      
      // Calculate hybrid score if hybrid search is enabled
      let hybridScore = 0
      if (hybrid_search) {
        // Normalize scores to 0-1 range for combining
        const normalizedSemanticScore = Math.min(Math.max(semanticScore, 0), 1)
        const normalizedTextScore = Math.min(Math.max(textScore / 1.0, 0), 1) // Assuming max text score is ~1
        
        hybridScore = (normalizedSemanticScore * semantic_boost + normalizedTextScore * text_boost) / (semantic_boost + text_boost)
      }
      
      return {
        ...offer,
        similarity_score: semanticScore,
        text_score: textScore,
        hybrid_score: hybridScore
      }
    })
    
    // Sort based on the requested sort type
    if (sort_by === 'similarity') {
      processedOffers.sort((a: any, b: any) => {
        const scoreA = a.similarity_score || 0
        const scoreB = b.similarity_score || 0
        return sort_order === 'asc' ? scoreA - scoreB : scoreB - scoreA
      })
    } else if (sort_by === 'hybrid') {
      processedOffers.sort((a: any, b: any) => {
        const scoreA = a.hybrid_score || 0
        const scoreB = b.hybrid_score || 0
        return sort_order === 'asc' ? scoreA - scoreB : scoreB - scoreA
      })
    }
  }
  
  // Calcul pagination
  const totalPages = Math.ceil((count || 0) / limit)
  
  return Response.json({
    success: true,
    data: {
      offers: processedOffers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      search_metadata: {
        semantic_search_enabled: semantic_search,
        hybrid_search_enabled: hybrid_search,
        semantic_results_count: semanticResults.length,
        text_results_count: textResults.length,
        similarity_threshold: (semantic_search || hybrid_search) ? similarity_threshold : null,
        boost_factors: hybrid_search ? { semantic: semantic_boost, text: text_boost } : null
      }
    }
  })
}) 