import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { errorFactory } from "@/lib/errors";

// Validation schema for user alerts
const UserAlertSchema = z.object({
  alert_type: z.enum(['new_matches', 'application_update', 'weekly_summary']),
  enabled: z.boolean().default(true),
  delivery_channels: z.array(z.enum(['email', 'in_app', 'sms'])).default(['email']),
  frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  preferred_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).default('09:00:00'),
  preferred_days: z.array(z.number().min(1).max(7)).default([1, 2, 3, 4, 5]), // 1=Mon, 7=Sun
});

const UpdateUserAlertSchema = UserAlertSchema.partial().omit({ alert_type: true });

// GET /api/alerts - Get user's alert preferences
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('include_history') === 'true';

    const supabase = createRouteHandlerClient();

    // Get user alert preferences
    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('alert_type');

    if (error) {
      throw errorFactory.INTERNAL(`Failed to fetch alerts: ${error.message}`);
    }

    // Create default alerts if none exist
    let userAlerts = alerts || [];
    
    if (userAlerts.length === 0) {
      const defaultAlerts = [
        {
          user_id: userId,
          alert_type: 'new_matches',
          enabled: true,
          delivery_channels: ['email'],
          frequency: 'daily',
          preferred_time: '09:00:00',
          preferred_days: [1, 2, 3, 4, 5],
        },
        {
          user_id: userId,
          alert_type: 'application_update',
          enabled: true,
          delivery_channels: ['email', 'in_app'],
          frequency: 'instant',
          preferred_time: '09:00:00',
          preferred_days: [1, 2, 3, 4, 5, 6, 7],
        },
        {
          user_id: userId,
          alert_type: 'weekly_summary',
          enabled: false,
          delivery_channels: ['email'],
          frequency: 'weekly',
          preferred_time: '09:00:00',
          preferred_days: [1], // Monday
        },
      ];

      const { data: createdAlerts, error: createError } = await supabase
        .from('user_alerts')
        .insert(defaultAlerts)
        .select();

      if (createError) {
        throw errorFactory.INTERNAL(`Failed to create default alerts: ${createError.message}`);
      }

      userAlerts = createdAlerts || [];
    }

    let responseData: any = { alerts: userAlerts };

    // Include delivery history if requested
    if (includeHistory) {
      const { data: history, error: historyError } = await supabase
        .from('alert_deliveries')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (historyError) {
        console.error('Error fetching alert history:', historyError);
      } else {
        responseData.delivery_history = history || [];
      }
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('alert_deliveries')
      .select('status, channel, sent_at')
      .eq('user_id', userId)
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const summaryStats = {
      alerts_this_week: stats?.length || 0,
      delivered_this_week: stats?.filter(s => s.status === 'delivered').length || 0,
      opened_this_week: stats?.filter(s => s.status === 'opened').length || 0,
      active_alerts: userAlerts.filter((a: any) => a.enabled).length,
    };

    responseData.stats = summaryStats;

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch alerts'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/alerts - Create or update user alert preferences
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const body = await request.json();
    const validatedData = UserAlertSchema.parse(body);

    const supabase = createRouteHandlerClient();

    // Upsert the alert preference
    const { data: alert, error } = await supabase
      .from('user_alerts')
      .upsert({
        user_id: userId,
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,alert_type',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw errorFactory.INTERNAL(`Failed to save alert preference: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { alert }
    });

  } catch (error: any) {
    console.error('Error saving alert preference:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save alert preference'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH /api/alerts - Bulk update alert preferences
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw errorFactory.UNAUTHORIZED("Authentication required");
    }

    const body = await request.json();
    const updates = z.array(z.object({
      alert_type: z.enum(['new_matches', 'application_update', 'weekly_summary']),
      ...UpdateUserAlertSchema.shape
    })).parse(body);

    const supabase = createRouteHandlerClient();

    // Update each alert preference
    const updatedAlerts = [];
    
    for (const update of updates) {
      const { alert_type, ...updateData } = update;
      
      const { data: alert, error } = await supabase
        .from('user_alerts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('alert_type', alert_type)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${alert_type} alert:`, error);
      } else if (alert) {
        updatedAlerts.push(alert);
      }
    }

    return NextResponse.json({
      success: true,
      data: { 
        alerts: updatedAlerts,
        updated_count: updatedAlerts.length
      }
    });

  } catch (error: any) {
    console.error('Error updating alert preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update alert preferences'
      },
      { status: error.statusCode || 500 }
    );
  }
}