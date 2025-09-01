import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { InvokeAgentRequest, AgentResponse, Agent } from '@cledger5/types';
import { errorFactory } from '@/lib/errors';
import { processAgentTask } from '@/lib/agents/agent-processor';
import { headers } from 'next/headers';

/**
 * POST /api/agents/invoke
 * Invokes a specific agent to handle a task
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Admin authentication required
    const headersList = await headers();
    const adminSecret = headersList.get('x-admin-secret');
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw errorFactory.UNAUTHORIZED('Admin authentication required');
    }

    const body = await request.json();
    const requestData = InvokeAgentRequest.parse(body);

    const supabase = await createSupabaseServer();

    // Verify target agent exists and get its details
    const { data: targetAgent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', requestData.target_agent)
      .single();

    if (agentError || !targetAgent) {
      throw errorFactory.NOT_FOUND(`Agent ${requestData.target_agent} not found`);
    }

    const validatedAgent = Agent.parse(targetAgent);

    // Create conversation record
    const { data: conversation, error: conversationError } = await supabase
      .from('agent_conversations')
      .insert({
        from_agent: 'system', // System-initiated request
        to_agent: requestData.target_agent,
        task_type: requestData.task_type,
        task_description: requestData.task_description,
        request_data: requestData.request_data,
        priority: requestData.priority,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (conversationError || !conversation) {
      throw errorFactory.DATABASE_ERROR(`Failed to create conversation: ${conversationError?.message}`);
    }

    try {
      // Process the task with the agent
      const result = await processAgentTask(
        validatedAgent,
        requestData.task_description,
        requestData.request_data,
        conversation.id
      );

      // Update conversation with success
      await supabase
        .from('agent_conversations')
        .update({
          response_data: result,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      const executionTime = Date.now() - startTime;

      const response: AgentResponse = {
        success: true,
        data: result,
        agent_id: requestData.target_agent,
        conversation_id: conversation.id,
        execution_time_ms: executionTime
      };

      return NextResponse.json(response);

    } catch (processingError) {
      // Update conversation with failure
      await supabase
        .from('agent_conversations')
        .update({
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      throw processingError;
    }

  } catch (error) {
    console.error('Agent invocation error:', error);
    
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