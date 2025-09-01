import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { Agent, CapabilitiesResponse } from '@cledger5/types';
import { errorFactory } from '@/lib/errors';

/**
 * GET /api/agents/capabilities
 * Lists all available agents and their capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .order('hierarchy_level', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching agents:', error);
      throw errorFactory.DATABASE_ERROR(`Failed to fetch agents: ${error.message}`);
    }

    // Validate and transform data
    const validatedAgents = agents?.map((agent, index) => {
      try {
        return Agent.parse(agent);
      } catch (validationError) {
        console.error(`Agent validation error for agent ${index}:`, agent);
        console.error('Validation error details:', validationError);
        return null;
      }
    }).filter(Boolean) || [];

    console.log(`Found ${agents?.length || 0} raw agents, validated ${validatedAgents.length} agents`);

    const response: CapabilitiesResponse = {
      agents: validatedAgents,
      total_count: validatedAgents.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Agent capabilities error:', error);
    
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status as number }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}