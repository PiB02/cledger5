import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { errorFactory } from "@/lib/errors";

// Validation schema for updating an application
const UpdateApplicationSchema = z.object({
  status: z.enum(['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']).optional(),
  coverLetterUrl: z.string().url().optional(),
});

// GET /api/applications/[id] - Get specific application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const applicationId = params.id;

    const supabase = createRouteHandlerClient();

    // Get the user's cv_profile
    const { data: cvProfile, error: cvError } = await supabase
      .from('cv_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cvError || !cvProfile) {
      throw errorFactory.NOT_FOUND("CV profile not found");
    }

    // Get the application with full details
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        offers:offer_id (
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
          apply_url,
          apply_phone,
          companies:company_id (
            id,
            name,
            brand,
            website,
            size_range
          ),
          locations:location_id (
            id,
            address1,
            city,
            postal_code,
            department_code,
            region_code
          )
        )
      `)
      .eq('id', applicationId)
      .eq('cv_id', cvProfile.id)
      .single();

    if (error || !application) {
      throw errorFactory.NOT_FOUND("Application not found");
    }

    return NextResponse.json({
      success: true,
      data: { application }
    });

  } catch (error: any) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch application'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH /api/applications/[id] - Update application
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const applicationId = params.id;
    const body = await request.json();
    const validatedData = UpdateApplicationSchema.parse(body);

    const supabase = createRouteHandlerClient();

    // Get the user's cv_profile
    const { data: cvProfile, error: cvError } = await supabase
      .from('cv_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cvError || !cvProfile) {
      throw errorFactory.NOT_FOUND("CV profile not found");
    }

    // Get the current application
    const { data: currentApplication, error: getCurrentError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('cv_id', cvProfile.id)
      .single();

    if (getCurrentError || !currentApplication) {
      throw errorFactory.NOT_FOUND("Application not found");
    }

    // Update the application
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.coverLetterUrl !== undefined) {
      updateData.cover_letter_url = validatedData.coverLetterUrl;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
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

    if (updateError) {
      throw errorFactory.INTERNAL(`Failed to update application: ${updateError.message}`);
    }

    // Log the status change event if status was updated
    if (validatedData.status && validatedData.status !== currentApplication.status) {
      await supabase
        .from('app_events')
        .insert({
          actor_user_id: userId,
          actor_role: 'candidate',
          event: 'application_status_changed',
          cv_id: cvProfile.id,
          offer_id: currentApplication.offer_id,
          metadata: {
            old_status: currentApplication.status,
            new_status: validatedData.status,
            updated_by: 'candidate'
          }
        });
    }

    return NextResponse.json({
      success: true,
      data: { application: updatedApplication }
    });

  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update application'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE /api/applications/[id] - Withdraw application
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const applicationId = params.id;

    const supabase = createRouteHandlerClient();

    // Get the user's cv_profile
    const { data: cvProfile, error: cvError } = await supabase
      .from('cv_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cvError || !cvProfile) {
      throw errorFactory.NOT_FOUND("CV profile not found");
    }

    // Get the current application
    const { data: application, error: getError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('cv_id', cvProfile.id)
      .single();

    if (getError || !application) {
      throw errorFactory.NOT_FOUND("Application not found");
    }

    // Check if application can be withdrawn
    if (['hired', 'rejected'].includes(application.status)) {
      throw errorFactory.BAD_REQUEST(`Cannot withdraw application with status: ${application.status}`);
    }

    // Update status to withdrawn instead of deleting
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      throw errorFactory.INTERNAL(`Failed to withdraw application: ${updateError.message}`);
    }

    // Log the withdrawal event
    await supabase
      .from('app_events')
      .insert({
        actor_user_id: userId,
        actor_role: 'candidate',
        event: 'application_status_changed',
        cv_id: cvProfile.id,
        offer_id: application.offer_id,
        metadata: {
          old_status: application.status,
          new_status: 'withdrawn',
          updated_by: 'candidate'
        }
      });

    return NextResponse.json({
      success: true,
      data: { message: 'Application withdrawn successfully' }
    });

  } catch (error: any) {
    console.error('Error withdrawing application:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to withdraw application'
      },
      { status: error.statusCode || 500 }
    );
  }
}