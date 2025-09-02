import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { errorFactory } from "@/lib/errors";

// Validation schema for creating an application
const CreateApplicationSchema = z.object({
  offerId: z.string().uuid(),
  coverLetterUrl: z.string().url().optional(),
  source: z.enum(['direct', 'referred', 'imported']).default('direct'),
});

// Validation schema for updating an application
const UpdateApplicationSchema = z.object({
  status: z.enum(['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']),
  coverLetterUrl: z.string().url().optional(),
});

// GET /api/applications - List user's applications
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createRouteHandlerClient();

    // First, get the user's cv_profile
    const { data: cvProfile, error: cvError } = await supabase
      .from('cv_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cvError || !cvProfile) {
      // User doesn't have a CV profile yet, return empty applications
      return NextResponse.json({
        success: true,
        data: {
          applications: [],
          total: 0,
          hasMore: false
        }
      });
    }

    // Build the query
    let query = supabase
      .from('applications')
      .select(`
        *,
        offers:offer_id (
          id,
          title,
          description,
          companies:company_id (
            id,
            name,
            brand
          ),
          locations:location_id (
            id,
            city,
            postal_code,
            department_code
          )
        )
      `)
      .eq('cv_id', cvProfile.id)
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      throw errorFactory.INTERNAL(`Failed to fetch applications: ${error.message}`);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('cv_id', cvProfile.id);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: {
        applications: applications || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch applications'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const body = await request.json();
    const validatedData = CreateApplicationSchema.parse(body);

    const supabase = createRouteHandlerClient();

    // Get the user's cv_profile
    const { data: cvProfile, error: cvError } = await supabase
      .from('cv_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cvError || !cvProfile) {
      throw errorFactory.BAD_REQUEST("CV profile required. Please analyze your CV first.");
    }

    // Check if application already exists
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('cv_id', cvProfile.id)
      .eq('offer_id', validatedData.offerId)
      .single();

    if (existingApplication) {
      throw errorFactory.BAD_REQUEST("You have already applied to this job");
    }

    // Verify offer exists and is active
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, title, status')
      .eq('id', validatedData.offerId)
      .eq('status', 'active')
      .single();

    if (offerError || !offer) {
      throw errorFactory.BAD_REQUEST("Job offer not found or no longer active");
    }

    // Create the application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        cv_id: cvProfile.id,
        offer_id: validatedData.offerId,
        status: 'applied',
        source: validatedData.source,
        cover_letter_url: validatedData.coverLetterUrl,
        applied_at: new Date().toISOString(),
      })
      .select(`
        *,
        offers:offer_id (
          id,
          title,
          companies:company_id (
            name,
            brand
          ),
          locations:location_id (
            city,
            postal_code
          )
        )
      `)
      .single();

    if (appError) {
      throw errorFactory.INTERNAL(`Failed to create application: ${appError.message}`);
    }

    // Log the application event
    await supabase
      .from('app_events')
      .insert({
        actor_user_id: userId,
        actor_role: 'candidate',
        event: 'application_submitted',
        cv_id: cvProfile.id,
        offer_id: validatedData.offerId,
        metadata: {
          source: validatedData.source,
          has_cover_letter: !!validatedData.coverLetterUrl
        }
      });

    return NextResponse.json({
      success: true,
      data: { application }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create application'
      },
      { status: error.statusCode || 500 }
    );
  }
}