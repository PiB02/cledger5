import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { errorFactory } from "@/lib/errors";

// Validation schema for creating/updating saved searches
const SavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
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
  }),
  alerts_enabled: z.boolean().default(true),
  alert_frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  min_match_score: z.number().min(0).max(1).default(0.75),
});

// GET /api/saved-searches - List user's saved searches
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const { searchParams } = new URL(request.url);
    const includeResults = searchParams.get('include_results') === 'true';

    const supabase = createRouteHandlerClient();

    let query = supabase
      .from('saved_searches')
      .select(`
        *,
        ${includeResults ? `
        saved_search_results:saved_search_results(
          id,
          offer_id,
          match_score,
          found_at,
          offers:offer_id(
            id,
            title,
            companies:company_id(name),
            locations:location_id(city)
          )
        )
        ` : ''}
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    const { data: savedSearches, error } = await query;

    if (error) {
      throw errorFactory.INTERNAL(`Failed to fetch saved searches: ${error.message}`);
    }

    // Get summary statistics
    const { data: statsData } = await supabase
      .from('saved_searches')
      .select(`
        id,
        alerts_enabled,
        last_results_count,
        saved_search_results:saved_search_results(
          id,
          found_at
        )
      `)
      .eq('user_id', userId);

    const stats = {
      total: savedSearches?.length || 0,
      alerts_active: statsData?.filter(s => s.alerts_enabled).length || 0,
      new_results_this_week: statsData?.reduce((acc, search) => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newResults = search.saved_search_results?.filter(
          (result: any) => new Date(result.found_at) > weekAgo
        ).length || 0;
        return acc + newResults;
      }, 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        saved_searches: savedSearches || [],
        stats
      }
    });

  } catch (error: any) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch saved searches'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/saved-searches - Create new saved search
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const body = await request.json();
    const validatedData = SavedSearchSchema.parse(body);

    const supabase = createRouteHandlerClient();

    // Check if user already has a saved search with this name
    const { data: existingSearch } = await supabase
      .from('saved_searches')
      .select('id')
      .eq('user_id', userId)
      .eq('name', validatedData.name)
      .single();

    if (existingSearch) {
      throw errorFactory.BAD_REQUEST("You already have a saved search with this name");
    }

    // Extract quick-access fields from criteria for indexing
    const quickFilters = {
      rome_codes: validatedData.criteria.rome_codes || [],
      location_filters: validatedData.criteria.location || {},
      contract_types: validatedData.criteria.contract_types || [],
      work_modes: validatedData.criteria.work_modes || [],
      salary_min: validatedData.criteria.salary_min,
      salary_max: validatedData.criteria.salary_max,
    };

    // Create the saved search
    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        name: validatedData.name,
        description: validatedData.description,
        criteria: validatedData.criteria,
        ...quickFilters,
        alerts_enabled: validatedData.alerts_enabled,
        alert_frequency: validatedData.alert_frequency,
        min_match_score: validatedData.min_match_score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw errorFactory.INTERNAL(`Failed to create saved search: ${error.message}`);
    }

    // Create default user alert preferences if they don't exist
    if (validatedData.alerts_enabled) {
      await supabase
        .from('user_alerts')
        .upsert({
          user_id: userId,
          alert_type: 'new_matches',
          enabled: true,
          delivery_channels: ['email'],
          frequency: validatedData.alert_frequency,
        }, {
          onConflict: 'user_id,alert_type',
          ignoreDuplicates: false
        });
    }

    return NextResponse.json({
      success: true,
      data: { saved_search: savedSearch }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating saved search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create saved search'
      },
      { status: error.statusCode || 500 }
    );
  }
}