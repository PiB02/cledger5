import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { errorFactory, withErrorHandler } from '@/lib/errors'
import { z } from 'zod'

// Schema de validation pour les paramètres de recherche
const searchParamsSchema = z.object({
  query: z.string().optional(),
  rome_codes: z.string().optional(), // comma-separated
  location: z.string().optional(),
  radius_km: z.coerce.number().min(1).max(500).optional(),
  contract_types: z.string().optional(), // comma-separated
  work_modes: z.string().optional(), // comma-separated
  salary_min: z.coerce.number().optional(),
  alternance: z.coerce.boolean().optional(),
  sort_by: z.enum(['relevance', 'date', 'salary']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  
  // Parse et valide les paramètres
  const params = searchParamsSchema.safeParse({
    query: searchParams.get('query') || undefined,
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
  
  const { page, limit, sort_by, sort_order, ...filters } = params.data
  const offset = (page - 1) * limit
  
  // Connexion Supabase
  const supabase = await createSupabaseServer()
  
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
    case 'relevance':
      // Par défaut si recherche textuelle, sinon par date
      if (filters.query) {
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
  
  // Calcul pagination
  const totalPages = Math.ceil((count || 0) / limit)
  
  return Response.json({
    success: true,
    data: {
      offers: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }
  })
}) 