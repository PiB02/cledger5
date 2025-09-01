import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { DelegateTaskRequest, AgentResponse, Agent, TaskType, getAgentsByTaskType } from '@cledger5/types';
import { errorFactory } from '@/lib/errors';
import { processAgentTask } from '@/lib/agents/agent-processor';
import { classifyTaskType } from '@/lib/agents/task-classifier';
import { headers } from 'next/headers';

/**
 * POST /api/agents/delegate
 * Intelligently delegates a task to the best available agent
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
    const requestData = DelegateTaskRequest.parse(body);

    const supabase = await createSupabaseServer();

    // Get all available agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .order('hierarchy_level', { ascending: false });

    if (agentsError || !agents) {
      throw errorFactory.DATABASE_ERROR(`Failed to fetch agents: ${agentsError?.message}`);
    }

    const validatedAgents = agents.map(agent => Agent.parse(agent));

    // Classify the task type based on description and context
    const taskType = await classifyTaskType(requestData.task_description, requestData.context);
    
    // Find the best agent for this task
    let selectedAgent: Agent;
    
    if (requestData.preferred_agent) {
      // Use preferred agent if specified
      const preferredAgent = validatedAgents.find(agent => agent.id === requestData.preferred_agent);
      if (!preferredAgent) {
        throw errorFactory.NOT_FOUND(`Preferred agent ${requestData.preferred_agent} not found`);
      }
      selectedAgent = preferredAgent;
    } else {
      // Auto-select best agent based on capabilities
      const candidateAgents = getAgentsByTaskType(validatedAgents, taskType);
      
      if (candidateAgents.length === 0) {
        // Fallback to project manager for unknown tasks
        selectedAgent = validatedAgents.find(agent => agent.id === 'cledger-project-manager')!;
      } else {
        selectedAgent = candidateAgents[0]; // Best match (highest hierarchy + capabilities)
      }
    }

    // Create conversation record
    const { data: conversation, error: conversationError } = await supabase
      .from('agent_conversations')
      .insert({
        from_agent: 'cledger-project-manager', // Project manager delegates
        to_agent: selectedAgent.id,
        task_type: taskType,
        task_description: requestData.task_description,
        request_data: {
          context: requestData.context,
          auto_delegated: !requestData.preferred_agent,
          classification_confidence: 0.8 // TODO: implement confidence scoring
        },
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
      // Process the task with the selected agent
      const result = await processAgentTask(
        selectedAgent,
        requestData.task_description,
        { 
          ...requestData.context,
          delegated_task_type: taskType,
          auto_selected: !requestData.preferred_agent
        },
        conversation.id
      );

      // Update conversation with success
      await supabase
        .from('agent_conversations')
        .update({
          response_data: {
            ...result,
            selected_agent: selectedAgent.id,
            task_classification: taskType
          },
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      const executionTime = Date.now() - startTime;

      const response: AgentResponse = {
        success: true,
        data: {
          ...result,
          selected_agent: selectedAgent.id,
          selected_agent_name: selectedAgent.name,
          task_classification: taskType,
          delegation_reason: `Auto-selected based on ${taskType} classification`
        },
        agent_id: selectedAgent.id,
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
    console.error('Task delegation error:', error);
    
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