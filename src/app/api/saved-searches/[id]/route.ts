import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { errorFactory } from "@/lib/errors";

// Validation schema for updating saved searches
const UpdateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  criteria: z.object({
    query: z.string().optional(),
    rome_codes: z.array(z.string()).optional(),
    contract_types: z.array(z.string()).optional(),
    work_modes: z.array(z.string()).optional(),
    location: z.object({
      city: z.string().optional(),
      department_code: z.string().optional(),
      region_code: z.string().optional(),
      radius_km: z.number().min(0).max(200).optional(),
    }).optional(),
    salary_min: z.number().min(0).optional(),
    salary_max: z.number().min(0).optional(),
    alternance: z.boolean().optional(),
    career_level: z.array(z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager'])).optional(),
  }).optional(),
  alerts_enabled: z.boolean().optional(),
  alert_frequency: z.enum(['instant', 'daily', 'weekly']).optional(),
  min_match_score: z.number().min(0).max(1).optional(),
});

// GET /api/saved-searches/[id] - Get specific saved search with results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const savedSearchId = params.id;
    const { searchParams } = new URL(request.url);
    const includeOffers = searchParams.get('include_offers') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createRouteHandlerClient();

    // Get the saved search
    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .select(`
        *,
        saved_search_results:saved_search_results(
          id,
          offer_id,
          match_score,
          found_at
          ${includeOffers ? `,
          offers:offer_id(
            id,
            title,
            description,
            salary_min,
            salary_max,
            salary_currency,
            contract_type,
            work_mode,
            alternance,
            rome_codes,
            companies:company_id(
              name,
              brand
            ),
            locations:location_id(
              city,
              postal_code,
              department_code
            )
          )
          ` : ''}
        )
      `)
      .eq('id', savedSearchId)
      .eq('user_id', userId)
      .single();

    if (error || !savedSearch) {
      throw errorFactory.NOT_FOUND("Saved search not found");
    }

    // Limit and sort results
    if (savedSearch.saved_search_results) {
      savedSearch.saved_search_results = savedSearch.saved_search_results
        .sort((a: any, b: any) => new Date(b.found_at).getTime() - new Date(a.found_at).getTime())
        .slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: { saved_search: savedSearch }
    });

  } catch (error: any) {
    console.error('Error fetching saved search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch saved search'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH /api/saved-searches/[id] - Update saved search
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const savedSearchId = params.id;
    const body = await request.json();
    const validatedData = UpdateSavedSearchSchema.parse(body);

    const supabase = createRouteHandlerClient();

    // Verify ownership
    const { data: existingSearch, error: getError } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('id', savedSearchId)
      .eq('user_id', userId)
      .single();

    if (getError || !existingSearch) {
      throw errorFactory.NOT_FOUND("Saved search not found");
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name && validatedData.name !== existingSearch.name) {
      const { data: nameConflict } = await supabase
        .from('saved_searches')
        .select('id')
        .eq('user_id', userId)
        .eq('name', validatedData.name)
        .single();

      if (nameConflict) {
        throw errorFactory.BAD_REQUEST("You already have a saved search with this name");
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    if (validatedData.criteria !== undefined) {
      // Merge with existing criteria
      const mergedCriteria = { ...existingSearch.criteria, ...validatedData.criteria };
      updateData.criteria = mergedCriteria;

      // Update quick-access fields for indexing
      updateData.rome_codes = mergedCriteria.rome_codes || [];
      updateData.location_filters = mergedCriteria.location || {};
      updateData.contract_types = mergedCriteria.contract_types || [];
      updateData.work_modes = mergedCriteria.work_modes || [];
      updateData.salary_min = mergedCriteria.salary_min;
      updateData.salary_max = mergedCriteria.salary_max;
    }

    if (validatedData.alerts_enabled !== undefined) {
      updateData.alerts_enabled = validatedData.alerts_enabled;
    }

    if (validatedData.alert_frequency !== undefined) {
      updateData.alert_frequency = validatedData.alert_frequency;
    }

    if (validatedData.min_match_score !== undefined) {
      updateData.min_match_score = validatedData.min_match_score;
    }

    // Update the saved search
    const { data: updatedSearch, error: updateError } = await supabase
      .from('saved_searches')
      .update(updateData)
      .eq('id', savedSearchId)
      .select()
      .single();

    if (updateError) {
      throw errorFactory.INTERNAL(`Failed to update saved search: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { saved_search: updatedSearch }
    });

  } catch (error: any) {
    console.error('Error updating saved search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update saved search'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE /api/saved-searches/[id] - Delete saved search
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const savedSearchId = params.id;

    const supabase = createRouteHandlerClient();

    // Verify ownership
    const { data: existingSearch, error: getError } = await supabase
      .from('saved_searches')
      .select('id')
      .eq('id', savedSearchId)
      .eq('user_id', userId)
      .single();

    if (getError || !existingSearch) {
      throw errorFactory.NOT_FOUND("Saved search not found");
    }

    // Delete the saved search (cascade will delete results)
    const { error: deleteError } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', savedSearchId);

    if (deleteError) {
      throw errorFactory.INTERNAL(`Failed to delete saved search: ${deleteError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Saved search deleted successfully' }
    });

  } catch (error: any) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete saved search'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/saved-searches/[id]/execute - Execute saved search and get current results
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const savedSearchId = params.id;

    const supabase = createRouteHandlerClient();

    // Get the saved search
    const { data: savedSearch, error: getError } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('id', savedSearchId)
      .eq('user_id', userId)
      .single();

    if (getError || !savedSearch) {
      throw errorFactory.NOT_FOUND("Saved search not found");
    }

    // Build search query based on criteria
    let searchQuery = supabase
      .from('offers')
      .select(`
        *,
        companies:company_id(name, brand),
        locations:location_id(city, postal_code, department_code),
        offer_embeddings:offer_embeddings(embedding)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const criteria = savedSearch.criteria;

    // Apply filters based on criteria
    if (criteria.rome_codes?.length > 0) {
      searchQuery = searchQuery.overlaps('rome_codes', criteria.rome_codes);
    }

    if (criteria.contract_types?.length > 0) {
      searchQuery = searchQuery.in('contract_type', criteria.contract_types);
    }

    if (criteria.work_modes?.length > 0) {
      searchQuery = searchQuery.in('work_mode', criteria.work_modes);
    }

    if (criteria.salary_min) {
      searchQuery = searchQuery.gte('salary_min', criteria.salary_min);
    }

    if (criteria.salary_max) {
      searchQuery = searchQuery.lte('salary_max', criteria.salary_max);
    }

    if (criteria.alternance !== undefined) {
      searchQuery = searchQuery.eq('alternance', criteria.alternance);
    }

    if (criteria.career_level?.length > 0) {
      searchQuery = searchQuery.in('career_level', criteria.career_level);
    }

    // Execute search
    const { data: offers, error: searchError } = await searchQuery.limit(100);

    if (searchError) {
      throw errorFactory.INTERNAL(`Failed to execute search: ${searchError.message}`);
    }

    // Update last checked timestamp and result count
    await supabase
      .from('saved_searches')
      .update({
        last_checked_at: new Date().toISOString(),
        last_results_count: offers?.length || 0,
      })
      .eq('id', savedSearchId);

    return NextResponse.json({
      success: true,
      data: {
        offers: offers || [],
        total: offers?.length || 0,
        criteria: savedSearch.criteria,
        executed_at: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('Error executing saved search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to execute saved search'
      },
      { status: error.statusCode || 500 }
    );
  }
}