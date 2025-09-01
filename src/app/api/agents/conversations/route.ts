import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { AgentConversation } from '@cledger5/types';
import { errorFactory } from '@/lib/errors';
import { headers } from 'next/headers';

/**
 * GET /api/agents/conversations
 * Lists agent conversation history with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    const headersList = await headers();
    const adminSecret = headersList.get('x-admin-secret');
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Admin authentication required');
    }

    const { searchParams } = new URL(request.url);
    
    // Query parameters for filtering
    const fromAgent = searchParams.get('from_agent');
    const toAgent = searchParams.get('to_agent'); 
    const status = searchParams.get('status');
    const taskType = searchParams.get('task_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createSupabaseServer();

    let query = supabase
      .from('agent_conversations')
      .select(`
        *,
        from_agent_data:agents!agent_conversations_from_agent_fkey(id, name, role),
        to_agent_data:agents!agent_conversations_to_agent_fkey(id, name, role)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (fromAgent) {
      query = query.eq('from_agent', fromAgent);
    }
    
    if (toAgent) {
      query = query.eq('to_agent', toAgent);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (taskType) {
      query = query.eq('task_type', taskType);
    }

    const { data: conversations, error, count } = await supabase
      .from('agent_conversations')
      .select('*', { count: 'exact' })
      .eq('from_agent', fromAgent || undefined)
      .eq('to_agent', toAgent || undefined)
      .eq('status', status || undefined)
      .eq('task_type', taskType || undefined)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching conversations:', error);
      throw errorFactory.DATABASE_ERROR(`Failed to fetch conversations: ${error.message}`);
    }

    // Validate conversations
    const validatedConversations = conversations?.map(conv => {
      try {
        return AgentConversation.parse(conv);
      } catch (validationError) {
        console.error('Conversation validation error:', validationError);
        return null;
      }
    }).filter(Boolean) || [];

    return NextResponse.json({
      conversations: validatedConversations,
      total_count: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit
    });

  } catch (error) {
    console.error('Conversations fetch error:', error);
    
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

/**
 * GET /api/agents/conversations/[id]
 * Get specific conversation details
 */
export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Admin authentication required
    const headersList = await headers();
    const adminSecret = headersList.get('x-admin-secret');
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Admin authentication required');
    }

    const supabase = await createSupabaseServer();

    const { data: conversation, error } = await supabase
      .from('agent_conversations')
      .select(`
        *,
        from_agent_data:agents!agent_conversations_from_agent_fkey(id, name, role),
        to_agent_data:agents!agent_conversations_to_agent_fkey(id, name, role)
      `)
      .eq('id', params.id)
      .single();

    if (error || !conversation) {
      throw errorFactory.NOT_FOUND(`Conversation ${params.id} not found`);
    }

    const validatedConversation = AgentConversation.parse(conversation);

    return NextResponse.json({
      conversation: validatedConversation
    });

  } catch (error) {
    console.error('Conversation fetch error:', error);
    
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